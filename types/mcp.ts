import type { Language } from '@/lib/i18n/translations';

/** The user's AI link as Settings sees it — never the secret, only its lifecycle. */
export interface McpLinkStatus {
	createdAt: string;
	lastUsedAt: string | null;
}

/** Language and region the AI assistant answers in, read from the account. */
export interface McpUserContext {
	lang: Language;
	region?: string;
}
