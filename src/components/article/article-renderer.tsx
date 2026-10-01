"use client";

import React, { Fragment, useCallback, useState } from "react";
import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { CodeBlock } from "./code-block";
import { ScrollTable } from "./scroll-table";
import { ImageLightbox } from "./image-lightbox";
import type { HighlightedCode } from "@/lib/editor/highlight";

/**
 * Renders Tiptap's JSON document tree directly to React elements.
 *
 * We deliberately never convert this to an HTML string and use
 * dangerouslySetInnerHTML — walking the JSON and emitting React elements
 * means there is no HTML parsing step for stored content to exploit, which
 * is a stronger guarantee than sanitizing HTML after the fact.
 */

interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  text?: string;
  marks?: TiptapMark[];
}

// Where a long identifier may wrap: after _ - . / :, before <, and at a
// camelCase hump (IF_ERP2BTP_ | HelloWorld_ | Sync, TKNRetail | Online…).
const IDENTIFIER_BREAKS = /(?<=[_\-./:])|(?=<)|(?<=[a-z])(?=[A-Z])/;

/**
 * Inline code with <wbr> break opportunities, so identifiers wrap at sensible
 * points in narrow spots (table cells, phones) instead of mid-word. <wbr>
 * contributes no characters, so copying the text still yields the exact
 * identifier — unlike a zero-width space, which would be pasted along.
 */
function withBreakOpportunities(text: string): React.ReactNode {
  const parts = text.split(IDENTIFIER_BREAKS).filter(Boolean);
  if (parts.length < 2) return text;
  return parts.map((part, i) => (
    <Fragment key={i}>
      {i > 0 && <wbr />}
      {part}
    </Fragment>
  ));
}

function renderMarks(text: string, marks: TiptapMark[] | undefined, key: number): React.ReactNode {
  if (!marks || marks.length === 0) return text;
  const base = marks.some((m) => m.type === "code") ? withBreakOpportunities(text) : text;
  return marks.reduce<React.ReactNode>((acc, mark, i) => {
    const k = `${key}-${i}`;
    switch (mark.type) {
      case "bold":
        return <strong key={k}>{acc}</strong>;
      case "italic":
        return <em key={k}>{acc}</em>;
      case "strike":
        return <s key={k}>{acc}</s>;
      case "code":
        return <code key={k}>{acc}</code>;
      case "link": {
        const href = typeof mark.attrs?.href === "string" ? mark.attrs.href : "#";
        const safeHref = /^(https?:)?\/\//.test(href) || href.startsWith("/") ? href : "#";
        return (
          <a key={k} href={safeHref} target="_blank" rel="noopener noreferrer nofollow">
            {acc}
          </a>
        );
      }
      default:
        return acc;
    }
  }, base);
}

function RenderNode({ node, index, onImageClick }: { node: TiptapNode; index: number; onImageClick: (src: string, alt: string) => void }) {
  const children = node.content?.map((child, i) => (
    <RenderNode key={i} node={child} index={i} onImageClick={onImageClick} />
  ));

  switch (node.type) {
    case "doc":
      return <Fragment>{children}</Fragment>;
    case "paragraph":
      return <p>{children ?? null}</p>;
    case "heading": {
      const level = Math.min(4, Math.max(2, Number(node.attrs?.level) || 2));
      const Tag = (`h${level}` as unknown) as "h2" | "h3" | "h4";
      return <Tag>{children}</Tag>;
    }
    case "bulletList":
      return <ul>{children}</ul>;
    case "orderedList":
      return <ol>{children}</ol>;
    case "listItem":
      return <li>{children}</li>;
    case "blockquote":
      return <blockquote>{children}</blockquote>;
    case "codeBlock":
      return (
        <CodeBlock
          code={node.content?.map((c) => c.text).join("") ?? ""}
          language={typeof node.attrs?.language === "string" ? node.attrs.language : null}
          highlighted={node.attrs?.highlighted as HighlightedCode | undefined}
        />
      );
    case "horizontalRule":
      return <hr />;
    case "hardBreak":
      return <br />;
    case "table":
      return (
        <ScrollTable>
          <table>
            <tbody>{children}</tbody>
          </table>
        </ScrollTable>
      );
    case "tableRow":
      return <tr>{children}</tr>;
    case "tableHeader":
      return <th>{children}</th>;
    case "tableCell":
      return <td>{children}</td>;
    case "image": {
      const src = typeof node.attrs?.src === "string" ? node.attrs.src : "";
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";
      if (!src) return null;
      // Intrinsic size is attached server-side (lib/editor/image-dimensions);
      // render at the real aspect ratio, never wider than the original file.
      const width = Number(node.attrs?.width) || 0;
      const height = Number(node.attrs?.height) || 0;
      const known = width > 0 && height > 0;
      const isSmall = known && width < 160;
      return (
        <button
          type="button"
          onClick={() => onImageClick(src, alt)}
          className="group relative mx-auto my-6 block max-w-full cursor-zoom-in"
          style={known ? { width } : { width: "100%" }}
          aria-label={`View larger image: ${alt || "article image"}`}
        >
          <Image
            src={src}
            alt={alt}
            width={known ? width : 0}
            height={known ? height : 0}
            sizes={known ? `(max-width: 768px) 100vw, ${Math.min(width, 700)}px` : "(max-width: 768px) 100vw, 700px"}
            className="block h-auto w-full rounded-md border border-border"
          />
          {!isSmall && (
            <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </span>
          )}
        </button>
      );
    }
    case "text":
      return <Fragment key={index}>{renderMarks(node.text ?? "", node.marks, index)}</Fragment>;
    default:
      return <Fragment>{children}</Fragment>;
  }
}

export function ArticleRenderer({ content }: { content: unknown }) {
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const doc = content as TiptapNode;
  const closeLightbox = useCallback(() => setLightbox(null), []);

  return (
    <div className="prose-article">
      <RenderNode node={doc} index={0} onImageClick={(src, alt) => setLightbox({ src, alt })} />

      {lightbox && <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={closeLightbox} />}
    </div>
  );
}
