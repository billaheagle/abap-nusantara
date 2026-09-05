"use client";

import React, { Fragment, useState } from "react";
import Image from "next/image";

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

function renderMarks(text: string, marks: TiptapMark[] | undefined, key: number): React.ReactNode {
  if (!marks || marks.length === 0) return text;
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
  }, text);
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
        <pre>
          <code>{node.content?.map((c) => c.text).join("") ?? ""}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr />;
    case "hardBreak":
      return <br />;
    case "table":
      return (
        <table>
          <tbody>{children}</tbody>
        </table>
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
      return (
        <button
          type="button"
          onClick={() => onImageClick(src, alt)}
          className="block w-full text-left"
          aria-label={`View larger image: ${alt || "article image"}`}
        >
          <span className="relative block w-full aspect-video">
            <Image src={src} alt={alt} fill sizes="(max-width: 768px) 100vw, 700px" className="object-contain rounded-md border border-border" />
          </span>
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

  return (
    <div className="prose-article">
      <RenderNode node={doc} index={0} onImageClick={(src, alt) => setLightbox({ src, alt })} />

      {lightbox && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            aria-label="Close image preview"
            className="absolute top-4 right-4 text-white/80 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
          <div className="relative max-h-[85vh] max-w-4xl w-full h-full" onClick={(e) => e.stopPropagation()}>
            <Image src={lightbox.src} alt={lightbox.alt} fill sizes="100vw" className="object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
