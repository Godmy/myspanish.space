<script lang="ts">
	import View from '$stylist/spanish/component/page/school-view/index.svelte';
	let { data, form } = $props();
</script>

<View data={data.school} {form} />
