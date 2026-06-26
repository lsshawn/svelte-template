<script lang="ts">
	import { enhance } from '$app/forms';
	import Icon from '@iconify/svelte';
	import { config } from '$lib/config';

	let { form, data } = $props();

	const step = $derived(form?.step === 'verify' ? 'verify' : 'request');
	// Prefill the demo email in dev so it's one click to sign in.
	const email = $derived(form?.email ?? data.devLogin?.email ?? '');

	// Focus the field as soon as it mounts (reliable across step re-renders).
	function autofocus(node: HTMLInputElement) {
		node.focus();
	}
</script>

<svelte:head>
	<title>Sign in · {config.name}</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-base-200/40 px-4">
	<div class="w-full max-w-sm">
		<div class="mb-6 text-center">
			<h1 class="text-2xl font-bold tracking-tight">{config.name}</h1>
			<p class="mt-1 text-sm text-base-content/60">Sign in to continue</p>
		</div>

		<div class="card border border-base-300 bg-base-100">
			<div class="card-body">
				{#if step === 'request'}
					<form method="POST" action="?/request" use:enhance>
						<label class="form-control w-full">
							<span class="label-text text-xs font-semibold uppercase tracking-widest opacity-60"
								>Email</span
							>
							<input
								use:autofocus
								type="email"
								name="email"
								required
								placeholder="you@example.com"
								class="input input-bordered mt-1 w-full"
								value={email}
							/>
						</label>
						{#if form?.error}
							<p class="mt-2 text-xs text-error">{form.error}</p>
						{/if}
						<button type="submit" class="btn btn-primary mt-4 w-full">Send code</button>
					</form>
				{:else}
					<form method="POST" action="?/verify" use:enhance>
						<input type="hidden" name="email" value={email} />
						<p class="text-sm text-base-content/70">
							We sent a 6-digit code to <span class="font-medium">{email}</span>.
						</p>
						<label class="form-control mt-3 w-full">
							<span class="label-text text-xs font-semibold uppercase tracking-widest opacity-60"
								>Code</span
							>
							<input
								use:autofocus
								type="text"
								name="code"
								inputmode="numeric"
								maxlength="6"
								required
								placeholder="000000"
								class="input input-bordered mt-1 w-full text-center text-lg tracking-[0.5em]"
								value={data.devLogin?.otp ?? ''}
							/>
						</label>
						{#if form?.error}
							<p class="mt-2 text-xs text-error">{form.error}</p>
						{/if}
						<button type="submit" class="btn btn-primary mt-4 w-full">Verify & sign in</button>
					</form>
				{/if}

				{#if data.hasGoogle || data.hasGithub}
					<div class="divider my-4 text-xs opacity-50">or</div>
					<div class="flex flex-col gap-2">
						{#if data.hasGoogle}
							<a href="/login/google" class="btn btn-outline btn-sm w-full">
								<Icon icon="logos:google-icon" class="h-4 w-4" />
								Continue with Google
							</a>
						{/if}
						{#if data.hasGithub}
							<a href="/login/github" class="btn btn-outline btn-sm w-full">
								<Icon icon="mdi:github" class="h-4 w-4" />
								Continue with GitHub
							</a>
						{/if}
					</div>
				{/if}
			</div>
		</div>

		{#if data.devLogin}
			<div class="mt-4 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-center text-xs">
				<span class="font-semibold">Dev mode</span> · sign in as
				<span class="font-mono">{data.devLogin.email}</span> with code
				<span class="font-mono">{data.devLogin.otp}</span>
			</div>
		{:else}
			<p class="mt-4 text-center text-xs text-base-content/50">
				Codes are printed to the server console in dev.
			</p>
		{/if}
	</div>
</div>
