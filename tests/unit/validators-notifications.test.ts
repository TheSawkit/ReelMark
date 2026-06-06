import { describe, it, expect } from 'vitest';
import { isValidNotificationType } from '@/lib/validators';

describe('isValidNotificationType', () => {
	it('accepte les types connus', () => {
		expect(isValidNotificationType('friend_request')).toBe(true);
		expect(isValidNotificationType('new_episode')).toBe(true);
	});
	it('rejette les inconnus', () => {
		expect(isValidNotificationType('spam')).toBe(false);
		expect(isValidNotificationType(42)).toBe(false);
	});
});
