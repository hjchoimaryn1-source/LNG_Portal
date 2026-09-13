// src/components/sop/hooks/useSopRawMarkdown.ts
// Fetches a raw .md file (public/docs/sop/*.md) referenced by
// SOPDocument.markdownFilePath and parses it into anchor-tagged lines.

import { useEffect, useState } from 'react';
import { parseMarkdownLines, SopMarkdownLine } from '../utils/sopMarkdownAnchors';

interface UseSopRawMarkdownResult {
  lines: SopMarkdownLine[];
  isLoading: boolean;
  error: string | null;
}

export function useSopRawMarkdown(markdownFilePath: string | null): UseSopRawMarkdownResult {
  const [lines, setLines] = useState<SopMarkdownLine[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!markdownFilePath) {
      setLines([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(markdownFilePath)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        if (cancelled) return;
        setLines(parseMarkdownLines(text));
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message);
        setLines([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [markdownFilePath]);

  return { lines, isLoading, error };
}
