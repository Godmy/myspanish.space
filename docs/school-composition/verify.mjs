import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, relative } from 'node:path';
import plan from './composition.mjs';

const workspace = fileURLToPath(new URL('../../../../', import.meta.url));
const library = resolve(workspace, 'stylist-svelte');
const { moduleSources } = await import(new URL('../../../../stylist-svelte/scripts/prepare-module-sources.mjs', import.meta.url));
const sources = moduleSources(library, { modules: 'all', exclude: '' });
const manifest = JSON.parse(readFileSync(resolve(library, 'modules/sandbox/domain/data/json/domain-component-manifest/index.full.json'), 'utf8')).tree;
const ids = new Set();
const counts = {};
let implemented = 0;
for (const [id, address, decision, reason] of plan.components) {
  assert(!ids.has(id), `Duplicate component id: ${id}`);
  ids.add(id);
  assert(reason && ['new', 'reuse', 'adapt', 'extract', 'exclude'].includes(decision), `Invalid decision: ${id}`);
  const [domain, cluster, joint, family, extra] = address.split('/');
  assert(cluster === 'component' && family && !extra, `Invalid address: ${address}`);
  assert(sources[domain], `Unregistered domain: ${domain}`);
  const component = resolve(sources[domain], cluster, joint, family, 'index.svelte');
  assert(!relative(library, component).startsWith('..'), `Escaping address: ${address}`);
  if (decision === 'new') {
    assert(['prototype-school', 'spanish'].includes(domain), `Wrong owner for new component: ${address}`);
    if(existsSync(component)){
      implemented++;
      assert(existsSync(resolve(sources[domain], 'interface/recipe', family, 'index.ts')), `Recipe missing: ${address}`);
      assert(existsSync(resolve(sources[domain], cluster, joint, family, 'index.story.ts')), `Story missing: ${address}`);
    }
  } else {
    assert(manifest[domain]?.component?.[joint]?.includes(family), `Not in manifest: ${address}`);
    assert(existsSync(component), `Source missing: ${component}`);
    assert(existsSync(resolve(sources[domain], 'interface/recipe', family, 'index.ts')), `Recipe missing: ${address}`);
  }
  counts[decision] = (counts[decision] ?? 0) + 1;
}
const routes = new Set();
const pageIds = new Set();
for (const [id, route, roles, layout, blocks] of plan.pages) {
  assert(!routes.has(route) && !pageIds.has(id), `Duplicate page: ${id} ${route}`);
  routes.add(route); pageIds.add(id);
  assert(route.startsWith('/') && blocks.length, `Invalid page: ${id}`);
  assert(['public', 'school-shell', 'legacy'].includes(layout), `Invalid layout: ${id}`);
  assert(roles.every(role => ['student', 'parent', 'teacher', 'admin'].includes(role)), `Invalid role: ${id}`);
  if (route.startsWith('/account') || route.startsWith('/staff') || route === '/admin') assert(roles.length, `Unprotected page: ${route}`);
  for (const block of blocks) assert(ids.has(block), `Unknown block: ${route} ${block}`);
}
for (const [assembly, parts] of Object.entries(plan.assemblies)) {
  assert(assembly === 'public' || ids.has(assembly), `Unknown assembly: ${assembly}`);
  for (const part of parts) {
    assert(ids.has(part), `Unknown assembly part: ${assembly} ${part}`);
    assert(plan.components.find(row => row[0] === part)[2] !== 'exclude', `Excluded component used: ${part}`);
  }
}
const visit = (id, ancestors = []) => {
  assert(!ancestors.includes(id), `Composition cycle: ${[...ancestors, id].join(' → ')}`);
  for (const part of plan.assemblies[id] ?? []) visit(part, [...ancestors, id]);
};
for (const id of Object.keys(plan.assemblies)) visit(id);
assert.equal(new Set(plan.criticalTests.map(row => row[0])).size, plan.criticalTests.length);
console.log(JSON.stringify({ result: 'passed', components: ids.size, decisions: counts, implementedFromOriginalPlan: implemented, pages: routes.size, assemblies: Object.keys(plan.assemblies).length, plannedCriticalTests: plan.criticalTests.length }, null, 2));
console.log('Only blueprint consistency and existing source addresses were checked. Application scenarios were NOT executed.');
