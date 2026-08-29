<script lang="ts">
	import type { LayoutData } from './$types';
	import '../app.css';
	import ThemeProvider from '$stylist/theme/component/atom/theme-provider/index.svelte';

	let { data, children } = $props();
</script>

<ThemeProvider>
	{@render children()}
</ThemeProvider>
