import { customAlphabet } from 'nanoid';

// Unambiguous alphabet (no 0/O, 1/I/L) so anonymous IDs are safe to read/type aloud
// if ever surfaced to a teacher moderating a doubt thread.
const alphabet = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const generate = customAlphabet(alphabet, 12);

/** Generates a stable, unguessable anonymous identifier assigned once at user creation. */
export function generateAnonymousId(): string {
  return `anon_${generate()}`;
}
