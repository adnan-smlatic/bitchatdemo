'use client';

import { Code, Zap, Lock } from 'lucide-react';
import { ThemeToggle } from '@/shared/components/theme-toggle';
import { ChatWidget } from '@/features/visitor/components/chat-widget';

export default function VisitorPage() {
	return (
		<div className="min-h-dvh bg-white dark:bg-neutral-950">
			{/* Header */}
			<header className="sticky top-0 z-40 border-b border-neutral-100 bg-white/90 backdrop-blur-md dark:border-neutral-800/50 dark:bg-neutral-950/90">
				<div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
					<div className="flex items-center gap-4 sm:gap-6">
						<div className="flex items-center gap-2">
							<div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 shadow-sm shadow-blue-600/20">
								<svg className="h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
									<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
								</svg>
							</div>
							<span className="text-sm font-semibold text-neutral-900 dark:text-white">Acme Inc.</span>
						</div>
						<nav className="hidden items-center gap-5 sm:flex">
							<span className="cursor-default text-[13px] text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200">Product</span>
							<span className="cursor-default text-[13px] text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200">Solutions</span>
							<span className="cursor-default text-[13px] text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200">Pricing</span>
							<span className="hidden cursor-default text-[13px] text-neutral-500 transition-colors hover:text-neutral-900 md:inline dark:text-neutral-400 dark:hover:text-neutral-200">Docs</span>
						</nav>
					</div>
					<div className="flex items-center gap-2">
						<ThemeToggle />
						<button className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
							Sign in
						</button>
					</div>
				</div>
			</header>

			{/* Hero */}
			<main className="mx-auto max-w-5xl px-4 sm:px-6">
				<section className="pb-12 pt-16 text-center sm:pb-16 sm:pt-28">
					<h1 className="mx-auto max-w-xl text-2xl font-semibold leading-[1.2] tracking-tight text-neutral-900 sm:text-3xl md:text-[40px] dark:text-white">
						The modern platform for&nbsp;building&nbsp;at&nbsp;scale
					</h1>
					<p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-neutral-500 sm:text-[15px] dark:text-neutral-400">
						Ship faster with integrated tools for development, deployment, and monitoring. Trusted by teams worldwide.
					</p>
					<div className="mt-6 flex flex-col justify-center gap-2.5 sm:mt-8 sm:flex-row sm:gap-3">
						<button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700">
							Start building
						</button>
						<button className="rounded-lg border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800">
							View docs
						</button>
					</div>
				</section>

				{/* Feature grid */}
				<section className="grid grid-cols-1 gap-3 pb-20 sm:grid-cols-3 sm:pb-24">
					{[
						{
							icon: <Code className="h-5 w-5" />,
							title: 'Developer first',
							desc: 'APIs, SDKs, and CLI tools designed for engineers. Deploy with a single command.',
						},
						{
							icon: <Zap className="h-5 w-5" />,
							title: 'Fast by default',
							desc: 'Edge-deployed globally with automatic caching and intelligent routing.',
						},
						{
							icon: <Lock className="h-5 w-5" />,
							title: 'Enterprise secure',
							desc: 'SOC 2 Type II certified. SSO, audit logs, and role-based access out of the box.',
						},
					].map((f) => (
						<div
							key={f.title}
							className="rounded-xl border border-neutral-100 bg-neutral-50/50 p-5 transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900/50 dark:hover:bg-neutral-900"
						>
							<div className="mb-3 text-neutral-400 dark:text-neutral-500">
								{f.icon}
							</div>
							<h3 className="text-sm font-medium text-neutral-900 dark:text-white">
								{f.title}
							</h3>
							<p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500 dark:text-neutral-400">
								{f.desc}
							</p>
						</div>
					))}
				</section>
			</main>

			<ChatWidget />
		</div>
	);
}
