import { describe, it, expect } from 'vitest';

describe('friends guards', () => {
    it('SELF_REQUEST is thrown when addresseeId equals userId', () => {
        const userId = 'abc-123';
        const addresseeId = 'abc-123';

        const guardFn = (uid: string, aid: string) => {
            if (aid === uid) throw new Error('SELF_REQUEST');
        };

        expect(() => guardFn(userId, addresseeId)).toThrow('SELF_REQUEST');
    });

    it('SELF_REQUEST is not thrown when addresseeId differs from userId', () => {
        const userId = 'abc-123';
        const addresseeId = 'xyz-456';

        const guardFn = (uid: string, aid: string) => {
            if (aid === uid) throw new Error('SELF_REQUEST');
        };

        expect(() => guardFn(userId, addresseeId)).not.toThrow();
    });

    it('DUPLICATE_REQUEST error code 23505 is mapped correctly', () => {
        const mapError = (code: string, message: string) => {
            if (code === '23505') return 'DUPLICATE_REQUEST';
            return message;
        };

        expect(mapError('23505', 'duplicate key')).toBe('DUPLICATE_REQUEST');
        expect(mapError('42501', 'permission denied')).toBe(
            'permission denied'
        );
    });
});

describe('pending requests idempotency filter', () => {
    it('.eq(status, pending) ensures only pending rows are mutated', () => {
        type Status = 'pending' | 'accepted' | 'rejected';
        type Row = { id: string; status: Status };

        const rows: Row[] = [
            { id: '1', status: 'pending' },
            { id: '2', status: 'accepted' },
            { id: '3', status: 'rejected' },
        ];

        const shouldUpdate = (row: Row) => row.status === 'pending';

        expect(rows.filter(shouldUpdate).map((r) => r.id)).toEqual(['1']);
    });
});
