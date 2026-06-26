<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Settings</title>
</svelte:head>

<div class="mx-auto max-w-3xl p-6 lg:p-8">
	<h1 class="text-2xl font-bold tracking-tight">Settings</h1>

	<div class="card mt-6 border border-base-300 bg-base-100">
		<div class="card-body">
			<h2 class="card-title text-base">Profile</h2>
			<label class="form-control mt-2 w-full">
				<span class="label-text text-xs font-semibold uppercase tracking-widest opacity-60"
					>Email</span
				>
				<input
					type="email"
					class="input input-bordered input-sm mt-1"
					value={data?.user?.email ?? ''}
					disabled
				/>
			</label>
			<label class="form-control mt-3 w-full">
				<span class="label-text text-xs font-semibold uppercase tracking-widest opacity-60"
					>Name</span
				>
				<input
					type="text"
					class="input input-bordered input-sm mt-1"
					value={data?.user?.name ?? ''}
					placeholder="Your name"
				/>
			</label>
			<div class="mt-4">
				<button class="btn btn-primary btn-sm">Save changes</button>
			</div>
		</div>
	</div>
</div>
