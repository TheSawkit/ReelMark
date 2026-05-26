import { describe, it, expect } from "vitest"
import {
    validateEmail,
    validatePassword,
    validateUsername,
    validateUUID,
    validateRegion,
    validateLanguage,
    validateAvatarFile,
    sanitizeRedirectPath,
    validateReviewContent,
} from "@/lib/validators"
import { MAX_REVIEW_LENGTH } from "@/types/profile"

describe("validateEmail", () => {
    it("accepts valid email addresses", () => {
        expect(validateEmail("user@example.com")).toBe("user@example.com")
        expect(validateEmail("user.name+tag@domain.co.uk")).toBe("user.name+tag@domain.co.uk")
    })

    it("trims whitespace", () => {
        expect(validateEmail("  user@example.com  ")).toBe("user@example.com")
    })

    it("rejects invalid formats", () => {
        expect(validateEmail("not-an-email")).toBeNull()
        expect(validateEmail("@domain.com")).toBeNull()
        expect(validateEmail("user@")).toBeNull()
    })

    it("rejects non-string input", () => {
        expect(validateEmail(null)).toBeNull()
        expect(validateEmail(undefined)).toBeNull()
        expect(validateEmail(123)).toBeNull()
    })

    it("rejects emails over 254 characters", () => {
        const longEmail = "a".repeat(250) + "@b.com"
        expect(validateEmail(longEmail)).toBeNull()
    })
})

describe("validatePassword", () => {
    it("accepts passwords between 8 and 128 characters", () => {
        expect(validatePassword("password1")).toBe("password1")
        expect(validatePassword("a".repeat(128))).toBe("a".repeat(128))
    })

    it("rejects passwords shorter than 8 characters", () => {
        expect(validatePassword("short")).toBeNull()
        expect(validatePassword("1234567")).toBeNull()
    })

    it("rejects passwords longer than 128 characters", () => {
        expect(validatePassword("a".repeat(129))).toBeNull()
    })

    it("rejects non-string input", () => {
        expect(validatePassword(null)).toBeNull()
        expect(validatePassword(undefined)).toBeNull()
    })
})

describe("validateUsername", () => {
    it("accepts valid usernames", () => {
        expect(validateUsername("john_doe")).toBe("john_doe")
        expect(validateUsername("User123")).toBe("User123")
        expect(validateUsername("the_saw_kit")).toBe("the_saw_kit")
    })

    it("trims whitespace", () => {
        expect(validateUsername("  john  ")).toBe("john")
    })

    it("rejects empty or non-string input", () => {
        expect(validateUsername("")).toBeNull()
        expect(validateUsername(null)).toBeNull()
        expect(validateUsername(undefined)).toBeNull()
    })

    it("rejects usernames with invalid characters", () => {
        expect(validateUsername("user@name")).toBeNull()
        expect(validateUsername("user!name")).toBeNull()
        expect(validateUsername("user name")).toBeNull()
        expect(validateUsername("user-name")).toBeNull()
    })
})

describe("validateRegion", () => {
    it("accepts valid regions", () => {
        expect(validateRegion("BE")).toBe("BE")
        expect(validateRegion("fr")).toBe("FR")
        expect(validateRegion("us")).toBe("US")
    })

    it("rejects unknown regions", () => {
        expect(validateRegion("XX")).toBeNull()
        expect(validateRegion("INVALID")).toBeNull()
    })

    it("rejects non-string input", () => {
        expect(validateRegion(null)).toBeNull()
        expect(validateRegion(123)).toBeNull()
    })
})

describe("validateLanguage", () => {
    it("accepts valid languages", () => {
        expect(validateLanguage("fr")).toBe("fr")
        expect(validateLanguage("en")).toBe("en")
    })

    it("defaults to en for unknown languages", () => {
        expect(validateLanguage("de")).toBe("en")
        expect(validateLanguage("es")).toBe("en")
    })

    it("defaults to en for non-string input", () => {
        expect(validateLanguage(null)).toBe("en")
        expect(validateLanguage(undefined)).toBe("en")
    })
})

describe("validateAvatarFile", () => {
    const makeFile = (name: string, type: string, size: number): File => {
        return new File(["x".repeat(size)], name, { type })
    }

    it("accepts valid image files", () => {
        const file = makeFile("avatar.jpg", "image/jpeg", 1024)
        expect(validateAvatarFile(file)).toEqual({ valid: true, ext: 'jpg' })
    })

    it("rejects files over 5MB", () => {
        const file = makeFile("big.jpg", "image/jpeg", 6 * 1024 * 1024)
        expect(validateAvatarFile(file).valid).toBe(false)
    })

    it("rejects unsupported extensions", () => {
        const file = makeFile("avatar.gif", "image/gif", 1024)
        expect(validateAvatarFile(file).valid).toBe(false)
    })

    it("rejects unsupported MIME types", () => {
        const file = makeFile("avatar.jpg", "image/tiff", 1024)
        expect(validateAvatarFile(file).valid).toBe(false)
    })
})

describe("validateReviewContent", () => {
    it("returns null for null, undefined, and non-string", () => {
        expect(validateReviewContent(null)).toBeNull()
        expect(validateReviewContent(undefined)).toBeNull()
        expect(validateReviewContent(123)).toBeNull()
        expect(validateReviewContent([])).toBeNull()
    })

    it("returns null for empty or whitespace-only strings", () => {
        expect(validateReviewContent("")).toBeNull()
        expect(validateReviewContent("   ")).toBeNull()
        expect(validateReviewContent("\t\n")).toBeNull()
    })

    it("trims surrounding whitespace", () => {
        expect(validateReviewContent("  Hello  ")).toBe("Hello")
    })

    it("passes normal text through unchanged", () => {
        expect(validateReviewContent("Hello world")).toBe("Hello world")
    })

    it("preserves newlines and tabs", () => {
        expect(validateReviewContent("Hello\nworld")).toBe("Hello\nworld")
        expect(validateReviewContent("col1\tcol2")).toBe("col1\tcol2")
    })

    it("strips control characters", () => {
        expect(validateReviewContent("Hello\x00world")).toBe("Helloworld")
        expect(validateReviewContent("A\x01B\x1FC")).toBe("ABC")
        expect(validateReviewContent("test\x7Fend")).toBe("testend")
    })

    it("returns null when content exceeds MAX_REVIEW_LENGTH after cleaning", () => {
        expect(validateReviewContent("x".repeat(MAX_REVIEW_LENGTH + 1))).toBeNull()
    })

    it("accepts content exactly at MAX_REVIEW_LENGTH", () => {
        const content = "x".repeat(MAX_REVIEW_LENGTH)
        expect(validateReviewContent(content)).toBe(content)
    })
})

describe("sanitizeRedirectPath", () => {
    it("returns valid relative paths", () => {
        expect(sanitizeRedirectPath("/dashboard", "/")).toBe("/dashboard")
        expect(sanitizeRedirectPath("/library?type=tv", "/")).toBe("/library?type=tv")
    })

    it("returns fallback for null", () => {
        expect(sanitizeRedirectPath(null, "/")).toBe("/")
    })

    it("rejects absolute URLs", () => {
        expect(sanitizeRedirectPath("https://evil.com", "/")).toBe("/")
        expect(sanitizeRedirectPath("//evil.com", "/")).toBe("/")
    })

    it("rejects paths that do not start with /", () => {
        expect(sanitizeRedirectPath("evil.com", "/")).toBe("/")
    })
})

describe("validateUUID", () => {
    it("accepts valid UUIDs (lower and upper case)", () => {
        expect(validateUUID("550e8400-e29b-41d4-a716-446655440000")).toBe("550e8400-e29b-41d4-a716-446655440000")
        expect(validateUUID("550E8400-E29B-41D4-A716-446655440000")).toBe("550E8400-E29B-41D4-A716-446655440000")
    })

    it("rejects malformed strings", () => {
        expect(validateUUID("")).toBeNull()
        expect(validateUUID("not-a-uuid")).toBeNull()
        expect(validateUUID("550e8400-e29b-41d4-a716")).toBeNull()
        expect(validateUUID("550e8400-e29b-41d4-a716-44665544000g")).toBeNull()
        expect(validateUUID("550e8400e29b41d4a716446655440000")).toBeNull()
    })

    it("rejects non-string input", () => {
        expect(validateUUID(null)).toBeNull()
        expect(validateUUID(undefined)).toBeNull()
        expect(validateUUID(123)).toBeNull()
        expect(validateUUID({})).toBeNull()
    })
})
