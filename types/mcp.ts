/** The user's AI link as Settings sees it — never the secret, only its lifecycle. */
export interface McpLinkStatus {
	createdAt: string;
	lastUsedAt: string | null;
}
