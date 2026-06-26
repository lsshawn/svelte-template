<script lang="ts">
	import Icon from '@iconify/svelte';

	// Sample data — replace with a load function hitting your DB.
	const items = [
		{ id: '1', name: 'Acme onboarding', status: 'active', updated: '2h ago' },
		{ id: '2', name: 'Q3 report', status: 'draft', updated: '1d ago' },
		{ id: '3', name: 'Marketing site', status: 'archived', updated: '5d ago' }
	];

	const statusColor: Record<string, string> = {
		active: 'badge-success',
		draft: 'badge-warning',
		archived: 'badge-ghost'
	};
</script>

<svelte:head>
	<title>Items</title>
</svelte:head>

<div class="mx-auto max-w-7xl p-6 lg:p-8">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Items</h1>
			<p class="mt-1 text-sm text-base-content/60">A sample table. Swap in your records.</p>
		</div>
		<button class="btn btn-primary btn-sm">
			<Icon icon="material-symbols:add" class="h-4 w-4" />
			New item
		</button>
	</div>

	<div class="card mt-6 border border-base-300 bg-base-100">
		<div class="card-body p-0">
			<div class="scroll-thin overflow-x-auto">
				<table class="table-sm table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Status</th>
							<th>Updated</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{#each items as item}
							<tr class="hover">
								<td class="font-medium">{item.name}</td>
								<td><span class="badge {statusColor[item.status]} badge-sm">{item.status}</span></td>
								<td class="opacity-60">{item.updated}</td>
								<td class="text-right">
									<button class="btn btn-square btn-ghost btn-xs" aria-label="More">
										<Icon icon="material-symbols:more-horiz" class="h-4 w-4" />
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>
</div>
