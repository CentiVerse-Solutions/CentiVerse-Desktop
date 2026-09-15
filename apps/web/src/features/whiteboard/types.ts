import type { Person } from '../../data/port';

/**
 * The whiteboard's note shape, as the seed fixture and handlers produce it.
 *
 * Local to the feature: §6.2 defines `whiteboard_notes` and friends, and §8.2
 * puts them behind the port. When that lands this moves to data/port.ts.
 */
export interface NoteAttachment {
  id: number;
  name: string;
  type: string;
  size: string;
  url: string;
}

export interface NoteComment {
  id: number;
  text: string;
  createdAt: string;
  author: Pick<Person, 'id' | 'name' | 'avatar'>;
  replyTo?: number | null;
}

export interface WhiteboardNoteModel {
  id: number;
  text: string;
  createdAt: string;
  author: Pick<Person, 'id' | 'name' | 'avatar'>;
  attachments: NoteAttachment[];
  tags: string[];
  mentions: number[];
  comments: NoteComment[];
  reactions: { likes: number[]; seen: number[] };
}
