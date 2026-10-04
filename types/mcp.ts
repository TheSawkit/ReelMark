import type { Language } from '@/lib/i18n/translations';

/** What an AI link lets the assistant do: read the library, or read it and change title statuses. */
export type McpAccess = 'read' | 'write';

/** The user's AI link as Settings sees it — never the secret, only its lifecycle and access. */
export interface McpLinkStatus {
	createdAt: string;
	lastUsedAt: string | null;
	access: McpAccess;
}

/** Language and region the AI assistant answers in, read from the account. */
export interface McpUserContext {
	lang: Language;
	region?: string;
}
