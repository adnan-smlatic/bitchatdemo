import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { nanoid } from 'nanoid';
import { subHours, subMinutes } from 'date-fns';
import { threads, messages, participants } from './schema';

const connectionString = process.env.DATABASE_URL ?? 'postgresql://postgres@127.0.0.1/chatdemo';
const client = postgres(connectionString);
const db = drizzle(client);

const AGENT_ID = 'agent-001';

interface SeedThread {
	id: string;
	visitorId: string;
	visitorName: string;
	status: 'open' | 'resolved' | 'closed';
	resolution?: {
		rating: number | null;
		resolvedBy: string | null;
		resolvedAt: string | null;
		agentNotes: string | null;
		visitorComment: string | null;
	};
	messagesData: Array<{
		senderType: 'visitor' | 'agent' | 'system';
		content: string;
		minutesAgo: number;
		read: boolean;
	}>;
}

function generateBulkConversation(): SeedThread['messagesData'] {
	const msgs: SeedThread['messagesData'] = [];
	const topics = [
		{ v: "Hi, I'm having trouble with the billing on my account.", a: "I'd be happy to help you with that. Can you tell me your account email?" },
		{ v: "Sure, it's sarah.chen@example.com", a: "Thanks, I can see your account. What specific billing issue are you experiencing?" },
		{ v: "I was charged twice for last month's subscription", a: "I can see the duplicate charge. Let me look into this for you." },
		{ v: "It was $49.99 twice on December 15th", a: "Yes, I can confirm I see both charges. This appears to be a processing error on our end." },
		{ v: "Will I get a refund?", a: "Absolutely. I'm initiating a refund for the duplicate charge right now." },
		{ v: "How long will it take?", a: "Typically 3-5 business days depending on your bank." },
		{ v: "Ok thanks. While I'm here, I also wanted to ask about upgrading my plan", a: "Of course! What plan are you currently on and what are you looking to upgrade to?" },
		{ v: "I'm on the Starter plan but I need more API calls", a: "The Pro plan would give you 10x the API calls. It's $99/month." },
		{ v: "That sounds good. What are the other differences?", a: "Pro includes priority support, custom webhooks, and team collaboration features." },
		{ v: "Can I try it for a month and downgrade if needed?", a: "Yes, you can switch plans at any time. No long-term commitment required." },
		{ v: "What about data migration if I upgrade?", a: "All your existing data stays intact. The upgrade is seamless." },
		{ v: "And the API keys stay the same?", a: "Yes, your API keys remain unchanged. The rate limits just increase automatically." },
		{ v: "Perfect. Let me think about it", a: "Take your time! I'm here if you have any other questions." },
		{ v: "Actually, one more thing - do you support webhooks for payment events?", a: "Yes! On Pro you get webhook support for all events including payment confirmations." },
		{ v: "Can I configure multiple webhook endpoints?", a: "Up to 10 endpoints per workspace on Pro, with individual event filtering." },
		{ v: "That's exactly what I need for our integration", a: "Great! Our webhook docs are quite comprehensive if you want to review them beforehand." },
		{ v: "I'll check those out. Is there a sandbox for testing?", a: "Yes, every account gets a sandbox environment. You can test webhooks there without affecting production." },
		{ v: "How do I access the sandbox?", a: "Go to Settings > Environments > Sandbox. You'll see a separate set of API keys." },
		{ v: "Got it. And what's your uptime SLA on Pro?", a: "99.9% uptime SLA with credits if we fall below that." },
		{ v: "What kind of credits?", a: "10% service credit for each 0.1% below the SLA threshold." },
		{ v: "That's reasonable. Do you have any case studies from similar companies?", a: "I can send you a few. What industry are you in?" },
		{ v: "We're a fintech startup, about 50 employees", a: "Perfect, we have several fintech customers. I'll email you some relevant case studies." },
		{ v: "Thanks! Also wondering about SSO support", a: "SSO is available on our Enterprise plan, but we can add it to Pro for an additional $30/month." },
		{ v: "We might need that eventually. Can it be added later?", a: "Absolutely, you can add SSO at any time without changing plans." },
		{ v: "What SSO providers do you support?", a: "Okta, Auth0, Azure AD, Google Workspace, and any SAML 2.0 compliant provider." },
		{ v: "We use Okta so that works perfectly", a: "Great choice! Our Okta integration is very straightforward to set up." },
		{ v: "How long does setup typically take?", a: "Most teams have it running in under 30 minutes with our setup guide." },
		{ v: "Nice. What about audit logs?", a: "Full audit logs are included on Pro. You can see all user actions and API calls." },
		{ v: "Can we export the audit logs?", a: "Yes, CSV and JSON export, or you can stream them to your SIEM via our API." },
		{ v: "That'll keep our compliance team happy", a: "We're SOC 2 Type II certified as well, if that helps with compliance." },
		{ v: "It absolutely does. Can you send the cert?", a: "I'll include it with the case studies email. Anything else?" },
		{ v: "I think that covers it for now. You've been super helpful!", a: "Thank you! Don't hesitate to reach out anytime. I'll send that email within the hour." },
		{ v: "One last thing - what's the best way to reach you directly?", a: "You can always use this chat. For urgent issues, Pro gets a dedicated support email." },
		{ v: "Sounds great. I'll discuss the upgrade with my team this week", a: "Wonderful! Feel free to loop in your team members to this chat if they have questions too." },
		{ v: "Can I share this conversation with them?", a: "Yes! There's a share button at the top of the chat widget. Generates a read-only link." },
		{ v: "Perfect. Thanks again for all the help!", a: "My pleasure! Have a great rest of your day, Sarah." },
		{ v: "You too! 👋", a: "👋 Talk soon!" },
	];

	let minutesAgo = topics.length * 8;

	for (const topic of topics) {
		msgs.push({
			senderType: 'visitor',
			content: topic.v,
			minutesAgo,
			read: true,
		});
		minutesAgo -= 3;
		msgs.push({
			senderType: 'agent',
			content: topic.a,
			minutesAgo,
			read: true,
		});
		minutesAgo -= 5;
	}

	// Add some additional filler to hit 200+
	const extras = [
		{ v: "Hey, me again. Quick follow-up on the refund", a: "Of course! What's up?" },
		{ v: "My bank says they haven't received it yet", a: "Let me check the status on our end..." },
		{ v: "It's been 3 business days", a: "I see it was processed on our side. Sometimes banks take a bit longer. Give it until Friday." },
		{ v: "OK I'll wait. Also, I showed the team the Pro plan", a: "Great! What did they think?" },
		{ v: "Everyone's on board. We want to upgrade!", a: "Fantastic! I can process the upgrade right now if you'd like." },
		{ v: "Yes please! Can you prorate the current billing cycle?", a: "Absolutely, you'll only pay the difference for the remaining days." },
		{ v: "That's fair. Let's do it", a: "Done! Your account has been upgraded to Pro. The new limits are active immediately." },
		{ v: "Wow that was fast. I can already see the new features", a: "That's what we like to hear! Remember to check out the webhook setup docs." },
		{ v: "Will do. The sandbox access is working too", a: "Perfect. The case studies and SOC 2 cert are in your inbox too." },
		{ v: "Got them, thanks! My CTO was impressed with the SOC 2", a: "Glad to hear it! We take security very seriously." },
		{ v: "One thing - can we get a custom subdomain?", a: "That's actually available on Pro! Go to Settings > Custom Domain." },
		{ v: "Amazing. You've thought of everything", a: "We try! 😄 Anything else you need help with?" },
		{ v: "I think we're all set for now. This has been the best support experience I've had", a: "That really means a lot! We're always here when you need us." },
		{ v: "Definitely will be back. Have a great week!", a: "You too, Sarah! Enjoy the Pro features! 🚀" },
		{ v: "Quick question - do you have a status page?", a: "Yes! status.minicom.dev - you can subscribe to email or Slack notifications." },
		{ v: "Subscribed! Thanks 👍", a: "You're welcome! That's a smart move for staying informed." },
		{ v: "Last one I promise - dark mode? 😅", a: "Coming in the next release! It's actually in beta right now if you want early access." },
		{ v: "YES PLEASE", a: "Enabled! Refresh your dashboard and you'll see the toggle in the top right." },
		{ v: "This is beautiful. OK I'm done for real now 😂", a: "Haha, glad you like it! Have a great one, Sarah!" },
	];

	minutesAgo = 60;
	for (const topic of extras) {
		msgs.push({
			senderType: 'visitor',
			content: topic.v,
			minutesAgo,
			read: true,
		});
		minutesAgo -= 2;
		msgs.push({
			senderType: 'agent',
			content: topic.a,
			minutesAgo,
			read: true,
		});
		minutesAgo -= 3;
	}

	return msgs;
}

const seedThreads: SeedThread[] = [
	{
		id: nanoid(),
		visitorId: 'visitor-sarah',
		visitorName: 'Sarah Chen',
		status: 'open',
		messagesData: generateBulkConversation(),
	},
	{
		id: nanoid(),
		visitorId: 'visitor-marcus',
		visitorName: 'Marcus Johnson',
		status: 'open',
		messagesData: [
			{ senderType: 'visitor', content: "Hello! I can't seem to log into my account.", minutesAgo: 120, read: true },
			{ senderType: 'agent', content: "Hi Marcus, sorry to hear that. What error are you seeing?", minutesAgo: 118, read: true },
			{ senderType: 'visitor', content: "It says 'Invalid credentials' but I'm sure my password is correct", minutesAgo: 115, read: true },
			{ senderType: 'agent', content: "Have you tried resetting your password?", minutesAgo: 113, read: true },
			{ senderType: 'visitor', content: "Yes, I did the reset but the new password doesn't work either", minutesAgo: 110, read: true },
			{ senderType: 'agent', content: "Let me check your account status. One moment...", minutesAgo: 108, read: true },
			{ senderType: 'agent', content: "I see the issue - your account email was changed. Was this intentional?", minutesAgo: 105, read: true },
			{ senderType: 'visitor', content: "No! I didn't change my email. What's going on?", minutesAgo: 102, read: true },
			{ senderType: 'agent', content: "I'm escalating this to our security team immediately. We'll lock the account as a precaution.", minutesAgo: 100, read: true },
			{ senderType: 'visitor', content: "Please do. Should I change my passwords on other services?", minutesAgo: 97, read: true },
			{ senderType: 'agent', content: "Yes, especially if you used the same password elsewhere. I'll keep you updated on our investigation.", minutesAgo: 95, read: false },
			{ senderType: 'visitor', content: "Thank you for taking this seriously", minutesAgo: 90, read: false },
			{ senderType: 'agent', content: "Absolutely. We've restored your original email and enabled 2FA. You should receive a setup email shortly.", minutesAgo: 85, read: false },
			{ senderType: 'visitor', content: "Got the email. Setting up 2FA now.", minutesAgo: 80, read: false },
			{ senderType: 'visitor', content: "All done. I can log in again. Thanks!", minutesAgo: 75, read: false },
		],
	},
	{
		id: nanoid(),
		visitorId: 'visitor-elena',
		visitorName: 'Elena Popov',
		status: 'resolved',
		resolution: {
			rating: 5,
			resolvedBy: AGENT_ID,
			resolvedAt: subHours(new Date(), 2).toISOString(),
			agentNotes: 'Customer needed help with CSV export formatting. Resolved by pointing to docs.',
			visitorComment: 'Super helpful, thanks!',
		},
		messagesData: [
			{ senderType: 'visitor', content: "Hi, how do I export my data as CSV?", minutesAgo: 300, read: true },
			{ senderType: 'agent', content: "Go to Dashboard > Reports > Export. You'll see a CSV option there.", minutesAgo: 298, read: true },
			{ senderType: 'visitor', content: "I see it but the exported file has weird formatting", minutesAgo: 295, read: true },
			{ senderType: 'agent', content: "That sometimes happens with Excel. Try opening it with Google Sheets or setting the encoding to UTF-8.", minutesAgo: 293, read: true },
			{ senderType: 'visitor', content: "Google Sheets worked perfectly! Thank you", minutesAgo: 290, read: true },
			{ senderType: 'agent', content: "Glad that worked! We're improving the Excel compatibility in our next update.", minutesAgo: 288, read: true },
			{ senderType: 'visitor', content: "Good to know. Thanks for the quick help!", minutesAgo: 285, read: true },
			{ senderType: 'system', content: "Conversation resolved by Support Agent", minutesAgo: 283, read: true },
		],
	},
	{
		id: nanoid(),
		visitorId: 'visitor-alex',
		visitorName: 'Alex Kim',
		status: 'open',
		messagesData: [
			{ senderType: 'visitor', content: "Hey, is anyone there?", minutesAgo: 5, read: false },
			{ senderType: 'visitor', content: "I need help with the API integration. Getting 403 errors.", minutesAgo: 4, read: false },
			{ senderType: 'visitor', content: "My API key is definitely valid, I just created it", minutesAgo: 3, read: false },
		],
	},
	{
		id: nanoid(),
		visitorId: 'visitor-jordan',
		visitorName: 'Jordan Taylor',
		status: 'open',
		messagesData: [
			{ senderType: 'visitor', content: "Hi! I'm evaluating your platform for our company", minutesAgo: 180, read: true },
			{ senderType: 'agent', content: "Welcome, Jordan! Happy to help with any questions about the platform.", minutesAgo: 178, read: true },
			{ senderType: 'visitor', content: "We need to handle about 10k requests per second. Can your infrastructure handle that?", minutesAgo: 175, read: true },
			{ senderType: 'agent', content: "Absolutely. Our Enterprise plan supports up to 50k req/s with auto-scaling.", minutesAgo: 173, read: true },
			{ senderType: 'visitor', content: "What about geographic distribution? We have users worldwide.", minutesAgo: 170, read: true },
			{ senderType: 'agent', content: "We have edge nodes in 40+ regions. Average latency is under 50ms globally.", minutesAgo: 168, read: true },
			{ senderType: 'visitor', content: "Impressive. What about data residency requirements? We have EU customers.", minutesAgo: 165, read: true },
			{ senderType: 'agent', content: "We offer EU-only data residency on Enterprise. All data stays in Frankfurt and Dublin.", minutesAgo: 163, read: true },
			{ senderType: 'visitor', content: "That checks a big box for us. How about custom SLAs?", minutesAgo: 160, read: true },
			{ senderType: 'agent', content: "Enterprise SLAs are fully customizable. We can do 99.99% with guaranteed response times.", minutesAgo: 158, read: true },
			{ senderType: 'visitor', content: "What's the typical onboarding timeline?", minutesAgo: 155, read: true },
			{ senderType: 'agent', content: "For Enterprise, we assign a dedicated solutions engineer. Usually 2-4 weeks to full production.", minutesAgo: 153, read: true },
			{ senderType: 'visitor', content: "Can we do a proof of concept first?", minutesAgo: 150, read: true },
			{ senderType: 'agent', content: "Yes! We offer a 30-day Enterprise trial with full features.", minutesAgo: 148, read: true },
			{ senderType: 'visitor', content: "Perfect. Can you set that up for us?", minutesAgo: 145, read: true },
			{ senderType: 'agent', content: "I'll connect you with our Enterprise team. Expect an email within the hour.", minutesAgo: 143, read: true },
			{ senderType: 'visitor', content: "Awesome. One more question - do you support GraphQL?", minutesAgo: 140, read: true },
			{ senderType: 'agent', content: "Yes, we have a full GraphQL API alongside REST. Both are first-class citizens.", minutesAgo: 138, read: true },
			{ senderType: 'visitor', content: "That's great to hear. We're a GraphQL-first team", minutesAgo: 135, read: true },
			{ senderType: 'agent', content: "You'll feel right at home then! Our GraphQL playground is at api.minicom.dev/graphql", minutesAgo: 133, read: true },
			{ senderType: 'visitor', content: "Already playing with it. The schema is well designed!", minutesAgo: 130, read: true },
			{ senderType: 'agent', content: "Thanks! We put a lot of thought into the developer experience. Any other questions?", minutesAgo: 128, read: true },
			{ senderType: 'visitor', content: "Not right now. I'll share this with my CTO and get back to you.", minutesAgo: 125, read: true },
			{ senderType: 'agent', content: "Sounds like a plan! Looking forward to hearing from you.", minutesAgo: 123, read: true },
			{ senderType: 'visitor', content: "CTO is excited. When can we start the POC?", minutesAgo: 30, read: false },
			{ senderType: 'visitor', content: "Also, is there a Slack community we can join?", minutesAgo: 28, read: false },
			{ senderType: 'visitor', content: "We'd love to connect with other Enterprise users", minutesAgo: 25, read: false },
		],
	},
];

async function seed() {
	console.log('Seeding database...');

	// Clear existing data
	await db.delete(messages);
	await db.delete(threads);
	await db.delete(participants);

	// Seed participants
	await db.insert(participants).values([
		{ id: AGENT_ID, type: 'agent' as const, name: 'Support Agent', isOnline: true },
		{ id: 'visitor-sarah', type: 'visitor' as const, name: 'Sarah Chen', isOnline: true },
		{ id: 'visitor-marcus', type: 'visitor' as const, name: 'Marcus Johnson', isOnline: false },
		{ id: 'visitor-elena', type: 'visitor' as const, name: 'Elena Popov', isOnline: false },
		{ id: 'visitor-alex', type: 'visitor' as const, name: 'Alex Kim', isOnline: true },
		{ id: 'visitor-jordan', type: 'visitor' as const, name: 'Jordan Taylor', isOnline: true },
	]);

	const now = new Date();

	for (const seedThread of seedThreads) {
		// Find the earliest and latest message times for thread timestamps
		const maxMinutesAgo = Math.max(...seedThread.messagesData.map((m) => m.minutesAgo));
		const minMinutesAgo = Math.min(...seedThread.messagesData.map((m) => m.minutesAgo));

		await db.insert(threads).values({
			id: seedThread.id,
			visitorId: seedThread.visitorId,
			visitorName: seedThread.visitorName,
			status: seedThread.status,
			resolution: seedThread.resolution,
			createdAt: subMinutes(now, maxMinutesAgo),
			updatedAt: subMinutes(now, minMinutesAgo),
		});

		const messageValues = seedThread.messagesData.map((msg) => ({
			id: nanoid(),
			threadId: seedThread.id,
			senderType: msg.senderType as 'visitor' | 'agent' | 'system',
			senderId: msg.senderType === 'visitor' ? seedThread.visitorId : AGENT_ID,
			content: msg.content,
			messageType: 'text' as const,
			status: 'sent' as const,
			createdAt: subMinutes(now, msg.minutesAgo),
			readAt: msg.read ? subMinutes(now, msg.minutesAgo - 1) : null,
		}));

		if (messageValues.length > 0) {
			await db.insert(messages).values(messageValues);
		}
	}

	const totalMsgs = seedThreads.reduce((sum, t) => sum + t.messagesData.length, 0);
	console.log(`Seeded ${seedThreads.length} threads with ${totalMsgs} total messages`);
	console.log('Done!');
	process.exit(0);
}

seed().catch((err) => {
	console.error('Seed failed:', err);
	process.exit(1);
});
