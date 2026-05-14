import { useState, useEffect } from 'react';
import api from './api';
import DEFAULTS from './content-defaults';

/** Fetches editable content for a page, merging DB values over defaults. */
export default function useContent(page: string): Record<string, string> {
  const [content, setContent] = useState<Record<string, string>>(DEFAULTS[page] || {});

  useEffect(() => {
    api
      .get(`/content/${page}`)
      .then((res) => {
        const dbContent: Record<string, string> = res.data || {};
        setContent((prev) => ({ ...prev, ...dbContent }));
      })
      .catch(() => {
        // Keep defaults on error
      });
  }, [page]);

  return content;
}
