<script lang="ts">
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Icon from '@iconify/svelte';
	import { config } from '$lib/config';

	let { children, data } = $props();

	// Edit this nav to match your app.
	const navItems = [
		{ label: 'Dashboard', href: '/dashboard', icon: 'material-symbols:dashboard-outline' },
		{ label: 'Items', href: '/dashboard/items', icon: 'material-symbols:list-alt-outline' },
		{ section: true, label: 'Account' },
		{ label: 'Settings', href: '/dashboard/settings', icon: 'material-symbols:settings-outline' }
	] as const;

	// Theme toggle with localStorage persistence.
	let isDarkMode = $state(false);
	onMount(() => {
		const saved = localStorage.getItem('theme');
		isDarkMode = saved === 'dim' || saved === 'night' || saved === 'dark';
		if (saved) document.documentElement.setAttribute('data-theme', saved);
	});
	$effect(() => {
		if (!browser) return;
		const theme = isDarkMode ? 'dim' : 'light';
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	});

	let breadcrumbs = $derived.by(() => {
		const segs = page.url.pathname.split('/').filter(Boolean);
		return segs.map((s) => s.charAt(0).toUpperCase() + s.slice(1));
	});

	function isActive(href: string): boolean {
		if (href === '/dashboard') return page.url.pathname === '/dashboard';
		return page.url.pathname === href || page.url.pathname.startsWith(href + '/');
	}

	const userLabel = $derived(data?.user?.name || data?.user?.email || 'Account');
</script>

<div class="flex min-h-screen bg-base-200/30">
	<!-- Sidebar (desktop) -->
	<aside
		class="fixed inset-y-0 left-0 z-40 hidden w-60 shrink-0 flex-col border-r border-base-300 bg-base-100 md:flex"
	>
		<div class="flex flex-col items-start gap-1.5 border-b border-base-300 px-5 py-4">
			<span class="text-base font-bold tracking-tight">{config.name}</span>
		</div>

		<nav class="scroll-thin flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
			{#each navItems as item}
				{#if 'section' in item && item.section}
					<div class="px-3 pb-1.5 pt-4 text-[10px] font-bold uppercase tracking-widest opacity-50">
						{item.label}
					</div>
				{:else if 'href' in item}
					<a
						href={item.href}
						class={[
							'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
							isActive(item.href)
								? 'bg-base-200 font-semibold text-base-content'
								: 'text-base-content/70 hover:bg-base-200/60 hover:text-base-content'
						]}
					>
						<Icon icon={item.icon} class="h-[18px] w-[18px] shrink-0" />
						<span>{item.label}</span>
					</a>
				{/if}
			{/each}
		</nav>

		<div class="border-t border-base-300 p-3">
			<form method="POST" action="/logout">
				<button
					type="submit"
					class="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-base-content/70 transition-colors hover:bg-base-200/60 hover:text-base-content"
				>
					<Icon icon="material-symbols:logout" class="h-[18px] w-[18px] shrink-0" />
					Sign out
				</button>
			</form>
		</div>
	</aside>

	<!-- Main -->
	<div class="flex min-w-0 flex-1 flex-col md:ml-60">
		<header
			class="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-base-300 bg-base-100/95 px-4 backdrop-blur lg:px-6"
		>
			<!-- Mobile menu -->
			<div class="dropdown md:hidden">
				<button tabindex="0" class="btn btn-square btn-ghost btn-sm" aria-label="Menu">
					<Icon icon="material-symbols:menu" class="h-5 w-5" />
				</button>
				<ul
					tabindex="-1"
					class="menu dropdown-content z-50 mt-1 w-56 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
				>
					{#each navItems as item}
						{#if 'section' in item && item.section}
							<li class="menu-title text-[10px]">{item.label}</li>
						{:else if 'href' in item}
							<li>
								<a href={item.href} class={isActive(item.href) ? 'active' : ''}>
									<Icon icon={item.icon} class="h-4 w-4" />
									{item.label}
								</a>
							</li>
						{/if}
					{/each}
				</ul>
			</div>

			<!-- Breadcrumbs -->
			<div class="flex items-center gap-1.5 text-xs">
				{#each breadcrumbs as crumb, i}
					{#if i > 0}
						<Icon icon="material-symbols:chevron-right" class="h-3 w-3 opacity-40" />
					{/if}
					<span class={i === breadcrumbs.length - 1 ? 'font-semibold' : 'opacity-60'}>{crumb}</span>
				{/each}
			</div>

			<div class="ml-auto flex items-center gap-2">
				<button
					class="btn btn-square btn-ghost btn-sm"
					aria-label="Toggle theme"
					onclick={() => (isDarkMode = !isDarkMode)}
				>
					<Icon
						icon={isDarkMode ? 'material-symbols:light-mode' : 'material-symbols:dark-mode'}
						class="h-4 w-4"
					/>
				</button>
				<div class="dropdown dropdown-end">
					<button tabindex="0" class="btn btn-ghost btn-sm gap-2">
						<div class="avatar avatar-placeholder">
							<div class="w-7 rounded-full border border-base-300 bg-base-200 text-base-content/70">
								<Icon icon="material-symbols:person" class="h-4 w-4" />
							</div>
						</div>
						<span class="hidden max-w-[12ch] truncate text-sm sm:inline">{userLabel}</span>
					</button>
					<ul
						tabindex="-1"
						class="menu dropdown-content z-50 mt-1 w-48 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
					>
						<li><a href="/dashboard/settings">Settings</a></li>
						<li>
							<form method="POST" action="/logout">
								<button type="submit" class="w-full text-left">Sign out</button>
							</form>
						</li>
					</ul>
				</div>
			</div>
		</header>

		<main class="scroll-thin flex-1 overflow-y-auto">
			{@render children()}
		</main>
	</div>
</div>
