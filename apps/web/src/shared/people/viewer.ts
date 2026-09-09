/**
 * §5.4 -- the viewer's identity is a property of the viewer, not of the data.
 *
 * No user is ever named "You". Data carries real names; "You" is rendered at the
 * edge by comparing an id against the current viewer. Until the Phase 3 seam
 * supplies a real session, the viewer is the seeded mock user.
 */
export const VIEWER_ID = 1;

export interface Person {
  id: number | string;
  name: string;
}

/** Renders "You" for the viewer, the person's real name for anyone else. */
export const displayName = (
  person: Pick<Person, 'id' | 'name'> | null | undefined,
  viewerId: number | string,
): string => {
  if (!person) return 'Unknown';
  return person.id === viewerId ? 'You' : person.name;
};

/** Possessive form: "your share" vs "Priya's share". */
export const possessiveName = (
  person: Pick<Person, 'id' | 'name'> | null | undefined,
  viewerId: number | string,
): string => {
  if (!person) return "Unknown's";
  return person.id === viewerId ? 'your' : `${person.name}'s`;
};

export const isViewer = (
  person: Pick<Person, 'id'> | null | undefined,
  viewerId: number | string,
): boolean => Boolean(person) && person!.id === viewerId;

/**
 * Balance phrasing is derived from viewer + direction, never stored as text.
 * A positive balance means the person is owed money.
 */
export const balancePhrase = (
  person: Pick<Person, 'id' | 'name'> | null | undefined,
  balanceMinorOrAmount: number,
  viewerId: number | string,
): string => {
  const them = displayName(person, viewerId);
  const isYou = isViewer(person, viewerId);
  if (balanceMinorOrAmount === 0) return isYou ? 'you are settled up' : `${them} is settled up`;
  if (balanceMinorOrAmount > 0) return isYou ? 'you are owed' : `${them} is owed`;
  return isYou ? 'you owe' : `${them} owes`;
};
