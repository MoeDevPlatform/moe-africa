import { useEffect } from "react";

type SEOMetaProps = {
  title: string;
  description?: string;
  keywords?: string;
};

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/**
 * Client-side document head updates (not SSR). Safe no-op on SSR environments.
 */
const SEOMeta = ({ title, description, keywords }: SEOMetaProps) => {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.title;
    document.title = title;
    if (description) {
      upsertMeta("name", "description", description);
      upsertMeta("property", "og:description", description);
    }
    if (keywords) upsertMeta("name", "keywords", keywords);
    upsertMeta("property", "og:title", title);
    return () => {
      document.title = prev;
    };
  }, [title, description, keywords]);

  return null;
};

export default SEOMeta;
