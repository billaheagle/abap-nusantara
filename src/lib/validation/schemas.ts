import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

export const commentSchema = z.object({
  articleId: z.string().cuid(),
  parentCommentId: z.string().cuid().nullable().optional(),
  authorName: z.string().trim().min(1, "Name is required").max(60),
  authorEmail: z.string().trim().email("Enter a valid email").max(255),
  body: z.string().trim().min(2, "Comment is too short").max(2000, "Comment is too long (max 2000 characters)"),
  csrfToken: z.string().min(1),
  // Honeypot field — real users never fill this in; bots often do.
  website: z.string().max(0, "").optional(),
});

export const likeSchema = z.object({
  articleId: z.string().cuid(),
});

const REPO_URL_PATTERN = /^https:\/\/(github\.com|gitlab\.com|bitbucket\.org)\/[\w.-]+\/[\w.-]+\/?$/i;

// A cover image is either an uploaded image path ("/uploads/…"), an absolute
// http(s) URL, or empty. `z.string().url()` alone rejects the root-relative
// paths the upload endpoint actually returns, so validate both shapes here.
const coverImageSchema = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || v.startsWith("/") || /^https?:\/\/\S+$/.test(v),
    "Enter an uploaded image path (/uploads/…) or a full http(s) URL",
  )
  .optional()
  .nullable();

export const articleInputSchema = z.object({
  title: z.string().trim().min(3).max(180),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(180)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase, alphanumeric, and hyphen-separated"),
  excerpt: z.string().trim().max(300).optional().nullable(),
  contentJson: z.any(), // validated structurally by the Tiptap schema at render time
  coverImage: coverImageSchema,
  repoUrl: z
    .string()
    .trim()
    .regex(REPO_URL_PATTERN, "Must be a valid GitHub/GitLab/Bitbucket repository URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  seriesId: z.string().cuid().optional().nullable().or(z.literal("")),
  seriesOrder: z.coerce.number().int().min(1).optional().nullable(),
  categoryId: z.string().cuid().optional().nullable().or(z.literal("")),
  tagIds: z.array(z.string().cuid()).default([]),
});

export const seriesInputSchema = z.object({
  title: z.string().trim().min(2).max(150),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(500).optional().nullable(),
  coverImage: coverImageSchema,
  order: z.coerce.number().int().default(0),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(300).optional().nullable(),
});

export const tagInputSchema = z.object({
  name: z.string().trim().min(1).max(60),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export const commentModerationSchema = z.object({
  id: z.string().cuid(),
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "SPAM"]),
});
