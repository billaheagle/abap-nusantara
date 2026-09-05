import type { CommentNode } from "@/components/comments/comment-thread";

interface FlatComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: Date;
  parentCommentId: string | null;
}

/** Turns a flat, approved-only comment list into a nested tree for display. */
export function buildCommentTree(flat: FlatComment[]): CommentNode[] {
  const byId = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  flat.forEach((c) => {
    byId.set(c.id, { id: c.id, authorName: c.authorName, body: c.body, createdAt: c.createdAt, replies: [] });
  });

  flat.forEach((c) => {
    const node = byId.get(c.id)!;
    if (c.parentCommentId && byId.has(c.parentCommentId)) {
      byId.get(c.parentCommentId)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}
