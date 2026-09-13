// src/components/sop/utils/sopMarkdownAnchors.ts
// Pure parsing helpers for public/docs/sop/*.md raw files. Headings in those
// files carry explicit kramdown-style anchors, e.g.
//   ## 1. The General {#np-07-1-1-the-general}
// so anchor resolution is a straight regex match — no fuzzy heading-text
// search against sopIndex.json's anchors[] is needed.

const ANCHOR_TAG_PATTERN = /\s*\{#([a-z0-9-]+)\}\s*$/i;

export interface SopMarkdownLine {
  text: string;
  anchorId: string | null;
}

export function parseMarkdownLines(markdown: string): SopMarkdownLine[] {
  return markdown.split('\n').map((rawLine) => {
    const match = rawLine.match(ANCHOR_TAG_PATTERN);
    if (!match) {
      return { text: rawLine, anchorId: null };
    }
    return { text: rawLine.replace(ANCHOR_TAG_PATTERN, ''), anchorId: match[1] };
  });
}

export function findAnchorLineIndex(lines: SopMarkdownLine[], anchorId: string | null | undefined): number {
  if (!anchorId) return -1;
  return lines.findIndex((line) => line.anchorId === anchorId);
}
