<script lang="ts">
	import Icon from '@iconify/svelte';

	const kpis = [
		{ label: 'Total users', value: '1,284', delta: '+12%', icon: 'material-symbols:group-outline' },
		{ label: 'Active today', value: '342', delta: '+4%', icon: 'material-symbols:bolt' },
		{ label: 'Revenue', value: '$8.2k', delta: '+18%', icon: 'material-symbols:payments-outline' },
		{ label: 'Churn', value: '1.4%', delta: '-0.3%', icon: 'material-symbols:trending-down' }
	];
</script>

<svelte:head>
	<title>Dashboard</title>
</svelte:head>

<div class="mx-auto max-w-7xl p-6 lg:p-8">
	<h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
	<p class="mt-1 text-sm text-base-content/60">A quick overview. Replace with your real metrics.</p>

	<!-- KPI strip -->
	<div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each kpis as k}
			<div class="card border border-base-300 bg-base-100">
				<div class="card-body p-5">
					<div class="flex items-center justify-between">
						<span class="text-[10px] font-semibold uppercase tracking-widest opacity-50"
							>{k.label}</span
						>
						<Icon icon={k.icon} class="h-4 w-4 opacity-40" />
					</div>
					<div class="mt-1 flex items-baseline gap-2">
						<span class="text-2xl font-bold tabular-nums">{k.value}</span>
						<span class="text-xs font-medium text-success">{k.delta}</span>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Placeholder panel -->
	<div class="card mt-6 border border-base-300 bg-base-100">
		<div class="card-body">
			<h2 class="card-title text-base">Recent activity</h2>
			<div class="flex flex-col items-center justify-center gap-2 py-12 text-center">
				<Icon icon="material-symbols:inbox-outline" class="h-10 w-10 opacity-30" />
				<p class="text-sm opacity-60">Nothing here yet. Wire this up to your data.</p>
			</div>
		</div>
	</div>
</div>
