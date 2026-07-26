/**
 * Error codes thrown by Server Actions and matched by their client callers.
 * Kept dependency-free so a client component can import a code without pulling
 * the server module that throws it into the browser bundle.
 */
export const RATE_LIMITED = 'RATE_LIMITED';
