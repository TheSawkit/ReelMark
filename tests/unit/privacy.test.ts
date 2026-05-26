import { describe, it, expect } from 'vitest'
import { isVisibility, parseVisibility, canViewWithVisibility } from '@/lib/privacy'

describe('isVisibility', () => {
    it('accepts valid values', () => {
        expect(isVisibility('public')).toBe(true)
        expect(isVisibility('friends')).toBe(true)
        expect(isVisibility('private')).toBe(true)
    })

    it('rejects invalid strings', () => {
        expect(isVisibility('everyone')).toBe(false)
        expect(isVisibility('')).toBe(false)
        expect(isVisibility('PUBLIC')).toBe(false)
    })

    it('rejects non-string types', () => {
        expect(isVisibility(null)).toBe(false)
        expect(isVisibility(undefined)).toBe(false)
        expect(isVisibility(0)).toBe(false)
        expect(isVisibility({})).toBe(false)
    })
})

describe('parseVisibility', () => {
    it('returns the value when valid', () => {
        expect(parseVisibility('public')).toBe('public')
        expect(parseVisibility('friends')).toBe('friends')
        expect(parseVisibility('private')).toBe('private')
    })

    it('returns the fallback for invalid values', () => {
        expect(parseVisibility('everyone')).toBe('private')
        expect(parseVisibility(null)).toBe('private')
        expect(parseVisibility(undefined)).toBe('private')
    })

    it('uses custom fallback when provided', () => {
        expect(parseVisibility('bad', 'public')).toBe('public')
        expect(parseVisibility(null, 'friends')).toBe('friends')
    })
})

describe('canViewWithVisibility', () => {
    it('owner can always view', () => {
        expect(canViewWithVisibility('private', { isOwn: true, isFriend: false })).toBe(true)
        expect(canViewWithVisibility('friends', { isOwn: true, isFriend: false })).toBe(true)
        expect(canViewWithVisibility('public', { isOwn: true, isFriend: false })).toBe(true)
    })

    it('public is visible to everyone', () => {
        expect(canViewWithVisibility('public', { isOwn: false, isFriend: false })).toBe(true)
        expect(canViewWithVisibility('public', { isOwn: false, isFriend: true })).toBe(true)
    })

    it('friends-only is visible to friends, not strangers', () => {
        expect(canViewWithVisibility('friends', { isOwn: false, isFriend: true })).toBe(true)
        expect(canViewWithVisibility('friends', { isOwn: false, isFriend: false })).toBe(false)
    })

    it('private is never visible to non-owners', () => {
        expect(canViewWithVisibility('private', { isOwn: false, isFriend: false })).toBe(false)
        expect(canViewWithVisibility('private', { isOwn: false, isFriend: true })).toBe(false)
    })
})
