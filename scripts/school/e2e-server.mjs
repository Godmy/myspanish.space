import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
process.env.SCHOOL_DATA_DIR=resolve('.test-data','e2e-'+Date.now());
process.env.SCHOOL_KIT_DIR='.svelte-kit-e2e';
process.env.ARCHIVE_SOURCE_ROOT='';
process.env.WRANGLER_LOG_PATH=resolve('.test-data','wrangler-logs');
process.argv=[process.execPath,fileURLToPath(new URL('../../node_modules/vite/bin/vite.js',import.meta.url)),'dev','--host','127.0.0.1','--port','5187'];
await import('../../node_modules/vite/bin/vite.js');
