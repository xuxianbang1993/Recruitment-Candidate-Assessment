<script lang="ts">
	import { page } from '$app/state';
</script>

<div class="min-h-screen bg-bg-primary flex items-center justify-center">
	<div class="bg-bg-card rounded-[10px] shadow-md p-8 max-w-md text-center">
		<h1 class="text-4xl font-bold text-accent mb-4">{page.status}</h1>
		<p class="text-text-secondary text-base">{page.error?.message ?? '页面未找到'}</p>
		<a
			href="/"
			class="inline-block mt-6 px-5 py-2.5 bg-accent text-white rounded-[10px] text-sm font-medium hover:bg-accent-light transition-all duration-300"
		>
			返回首页
		</a>
	</div>
</div>
