<script lang="ts">
	import Icon from '@iconify/svelte';
	import { config } from '$lib/config';

	const features = [
		{
			icon: 'material-symbols:bolt',
			title: 'Fast by default',
			body: 'SvelteKit 5 + Vite. Ships small, loads instantly, scales on Vercel.'
		},
		{
			icon: 'material-symbols:lock-outline',
			title: 'Auth included',
			body: 'Session-based auth with email one-time codes. No third-party lock-in.'
		},
		{
			icon: 'material-symbols:database-outline',
			title: 'Your database',
			body: 'Drizzle ORM wired for Turso, Neon, or local SQLite. Swap with one flag.'
		}
	];
</script>

<svelte:head>
	<title>{config.name}</title>
	<meta name="description" content={config.description} />
</svelte:head>

<div class="min-h-screen bg-base-100">
	<!-- Nav -->
	<header class="navbar mx-auto max-w-6xl px-6 py-4">
		<div class="flex-1">
			<a href="/" class="text-lg font-bold tracking-tight">{config.name}</a>
		</div>
		<nav class="flex items-center gap-2">
			<a href="/login" class="btn btn-ghost btn-sm">Sign in</a>
			<a href="/login" class="btn btn-primary btn-sm">Get started</a>
		</nav>
	</header>

	<!-- Hero -->
	<section class="mx-auto max-w-3xl px-6 py-24 text-center">
		<div
			class="badge badge-soft badge-primary mb-6 gap-1.5 py-3"
		>
			<Icon icon="material-symbols:auto-awesome" class="h-3.5 w-3.5" />
			Built with SvelteKit 5
		</div>
		<h1 class="text-5xl font-bold tracking-tight md:text-6xl">
			{config.description}
		</h1>
		<p class="mx-auto mt-6 max-w-xl text-lg text-base-content/70">
			A clean starting point. Replace this copy with your story, drop in your screenshots, and
			ship.
		</p>
		<div class="mt-10 flex justify-center gap-3">
			<a href="/login" class="btn btn-primary">
				Start building
				<Icon icon="material-symbols:arrow-forward" class="h-4 w-4" />
			</a>
			<a
				href="https://svelte.dev/docs/kit"
				class="btn btn-ghost"
				target="_blank"
				rel="noreferrer"
			>
				Docs
			</a>
		</div>
	</section>

	<!-- Features -->
	<section class="mx-auto max-w-5xl px-6 pb-24">
		<div class="grid gap-6 md:grid-cols-3">
			{#each features as f}
				<div class="card border border-base-300 bg-base-100">
					<div class="card-body">
						<div
							class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"
						>
							<Icon icon={f.icon} class="h-5 w-5" />
						</div>
						<h3 class="card-title mt-2 text-base">{f.title}</h3>
						<p class="text-sm text-base-content/70">{f.body}</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- Footer -->
	<footer class="border-t border-base-300">
		<div
			class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-8 text-sm text-base-content/60 md:flex-row"
		>
			<span>© {new Date().getFullYear()} {config.name}</span>
			<span>Made with SvelteKit</span>
		</div>
	</footer>
</div>
