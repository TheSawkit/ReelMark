import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.stubEnv('BUGSINK_ALERT_SECRET', 'alert-secret');
vi.stubEnv('LINEAR_API_KEY', 'lin_api_test');
vi.stubEnv('LINEAR_TEAM_ID', 'team-1');

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { POST } = await import('@/app/api/bugsink-alert/[secret]/route');

const ISSUE_URL = 'https://sentry.silexio.be/issues/issue/abc/';

function alert(reason: string) {
	return {
		id: 'abc',
		title: 'TypeError: x is undefined',
		project_name: 'ReelMark',
		url: ISSUE_URL,
		alert_reason: reason,
		transaction: 'GET /fr/movie/<id>',
		digested_event_count: 3,
	};
}

function call(secret: string, body: unknown) {
	return POST(
		new Request('https://reelmark.test/api/bugsink-alert/x', {
			method: 'POST',
			body: JSON.stringify(body),
		}),
		{ params: Promise.resolve({ secret }) }
	);
}

function linearReplies(...data: unknown[]) {
	for (const reply of data)
		fetchMock.mockResolvedValueOnce(Response.json({ data: reply }));
}

const sentQueries = () =>
	fetchMock.mock.calls.map(
		([, init]) => JSON.parse(init.body).query as string
	);

describe('Bugsink → Linear relay', () => {
	beforeEach(() => fetchMock.mockReset());

	it('hides behind a wrong secret, without calling Linear', async () => {
		expect((await call('wrong', alert('NEW'))).status).toBe(404);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('rejects a payload that is not a Bugsink alert', async () => {
		expect((await call('alert-secret', { hello: 1 })).status).toBe(400);
	});

	it('answers a test message without opening a ticket', async () => {
		expect((await call('alert-secret', alert('TEST'))).status).toBe(204);
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('opens one Linear ticket for a new issue, linked to Bugsink', async () => {
		linearReplies(
			{ attachmentsForURL: { nodes: [] } },
			{ issueCreate: { success: true, issue: { id: 'lin-1' } } },
			{ attachmentLinkURL: { success: true } }
		);
		expect((await call('alert-secret', alert('NEW'))).status).toBe(204);
		const [lookup, create, link] = sentQueries();
		expect(lookup).toContain('attachmentsForURL');
		expect(create).toContain('issueCreate');
		expect(link).toContain('attachmentLinkURL');
		expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe(
			'lin_api_test'
		);
	});

	it('comments on the existing ticket when the issue regresses, instead of a duplicate', async () => {
		linearReplies(
			{ attachmentsForURL: { nodes: [{ issue: { id: 'lin-1' } }] } },
			{ commentCreate: { success: true } }
		);
		expect((await call('alert-secret', alert('REGRESSED'))).status).toBe(
			204
		);
		expect(sentQueries()[1]).toContain('commentCreate');
		expect(sentQueries().some((q) => q.includes('issueCreate'))).toBe(
			false
		);
	});

	it('reports a Linear failure to Bugsink as a failed delivery', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		fetchMock.mockResolvedValueOnce(
			Response.json({ errors: [{ message: 'Authentication required' }] })
		);
		expect((await call('alert-secret', alert('NEW'))).status).toBe(502);
	});
});
