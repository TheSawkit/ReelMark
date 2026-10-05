import { createHash, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

const LINEAR_API = 'https://api.linear.app/graphql';
const LINEAR_TIMEOUT_MS = 10_000;

export const bugsinkAlertSchema = z.object({
	title: z.string().min(1),
	project_name: z.string(),
	url: z.url(),
	alert_reason: z.enum(['NEW', 'REGRESSED', 'UNMUTED', 'TEST']),
	transaction: z.string().nullish(),
	digested_event_count: z.number().optional(),
});

export type BugsinkAlert = z.infer<typeof bugsinkAlertSchema>;

const digest = (value: string) => createHash('sha256').update(value).digest();

/** Whether the alert URL carries BUGSINK_ALERT_SECRET; false while the relay is not configured, so missing env vars never open it. */
export function isAlertRelayAuthorized(secret: string): boolean {
	const expected = process.env.BUGSINK_ALERT_SECRET;
	if (!expected || !process.env.LINEAR_API_KEY || !process.env.LINEAR_TEAM_ID)
		return false;
	return timingSafeEqual(digest(secret), digest(expected));
}

function alertSummary(alert: BugsinkAlert): string {
	return [
		`**${alert.alert_reason}** sur ${alert.project_name}`,
		alert.transaction ? `Transaction : \`${alert.transaction}\`` : null,
		alert.digested_event_count !== undefined
			? `Événements : ${alert.digested_event_count}`
			: null,
		`Bugsink : ${alert.url}`,
	]
		.filter(Boolean)
		.join('\n\n');
}

async function linear<T>(
	query: string,
	variables: Record<string, unknown>
): Promise<T> {
	const response = await fetch(LINEAR_API, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: process.env.LINEAR_API_KEY ?? '',
		},
		body: JSON.stringify({ query, variables }),
		signal: AbortSignal.timeout(LINEAR_TIMEOUT_MS),
	});
	const body = (await response.json()) as {
		data?: T;
		errors?: { message: string }[];
	};
	if (!response.ok || body.errors?.length || !body.data)
		throw new Error(
			`Linear API: ${body.errors?.[0]?.message ?? response.status}`
		);
	return body.data;
}

/** Opens one Linear ticket per Bugsink issue, found again by its Bugsink URL: a regression or an unmute comments on that ticket instead of duplicating it. */
export async function forwardAlertToLinear(alert: BugsinkAlert): Promise<void> {
	const { attachmentsForURL } = await linear<{
		attachmentsForURL: { nodes: { issue: { id: string } }[] };
	}>(
		'query($url: String!) { attachmentsForURL(url: $url) { nodes { issue { id } } } }',
		{ url: alert.url }
	);

	const existing = attachmentsForURL.nodes[0]?.issue.id;
	if (existing) {
		await linear(
			'mutation($input: CommentCreateInput!) { commentCreate(input: $input) { success } }',
			{ input: { issueId: existing, body: alertSummary(alert) } }
		);
		return;
	}

	const { issueCreate } = await linear<{
		issueCreate: { issue: { id: string } };
	}>(
		'mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id } } }',
		{
			input: {
				teamId: process.env.LINEAR_TEAM_ID,
				title: `[${alert.project_name}] ${alert.title}`.slice(0, 250),
				description: alertSummary(alert),
			},
		}
	);
	await linear(
		'mutation($issueId: String!, $url: String!) { attachmentLinkURL(issueId: $issueId, url: $url, title: "Bugsink") { success } }',
		{ issueId: issueCreate.issue.id, url: alert.url }
	);
}
