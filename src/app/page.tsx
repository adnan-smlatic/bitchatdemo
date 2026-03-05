import { User, PenLine, MessageSquare, ExternalLink } from 'lucide-react';

export default function Home() {
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-b from-neutral-50 to-white px-4 sm:px-6 dark:from-neutral-950 dark:to-neutral-900">
			<div className="w-full max-w-sm">
				<div className="text-center">
					<div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/25">
						<MessageSquare className="h-5.5 w-5.5 text-white" />
					</div>

					<h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
						BitChatDemo
					</h1>
					<p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
						Real-time customer support chat
					</p>
				</div>

				<div className="mt-10 flex flex-col gap-3">
					<a
						href="/visitor"
						target="_blank"
						rel="noopener noreferrer"
						className="group flex items-center justify-between rounded-2xl border border-neutral-200/80 bg-white px-5 py-4 text-left shadow-sm transition-all duration-200 hover:border-blue-200 hover:shadow-md hover:shadow-blue-600/5 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
					>
						<div className="flex items-center gap-3.5">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-400 dark:group-hover:bg-blue-900">
								<User className="h-[18px] w-[18px]" />
							</div>
							<div>
								<div className="text-[14px] font-semibold text-neutral-900 dark:text-white">Visitor</div>
								<div className="text-[12px] text-neutral-500 dark:text-neutral-400">Mock website with chat widget</div>
							</div>
						</div>
						<ExternalLink className="h-3.5 w-3.5 text-neutral-300 transition-colors group-hover:text-blue-400 dark:text-neutral-600" />
					</a>

					<a
						href="/agent"
						target="_blank"
						rel="noopener noreferrer"
						className="group flex items-center justify-between rounded-2xl border border-neutral-200/80 bg-white px-5 py-4 text-left shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-600/5 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
					>
						<div className="flex items-center gap-3.5">
							<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-colors group-hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-400 dark:group-hover:bg-emerald-900">
								<PenLine className="h-[18px] w-[18px]" />
							</div>
							<div>
								<div className="text-[14px] font-semibold text-neutral-900 dark:text-white">Agent</div>
								<div className="text-[12px] text-neutral-500 dark:text-neutral-400">Inbox, conversations, management</div>
							</div>
						</div>
						<ExternalLink className="h-3.5 w-3.5 text-neutral-300 transition-colors group-hover:text-emerald-400 dark:text-neutral-600" />
					</a>
				</div>

				<p className="mt-8 text-center text-[11px] text-neutral-400 dark:text-neutral-600">
					Open both views in separate tabs for the full experience
				</p>
			</div>

			<div className="absolute bottom-6 text-[11px] text-neutral-400 dark:text-neutral-600">
				Adnan Smlatić
			</div>
		</div>
	);
}
