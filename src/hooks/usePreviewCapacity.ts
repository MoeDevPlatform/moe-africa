import { useEffect, useLayoutEffect, useState } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

/** Column count from the grid's computed tracks, so the preview follows the live width. */
export function useGridColumns() {
  const [node, setNode] = useState<HTMLElement | null>(null);
  const [columns, setColumns] = useState(0);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (!node) return;
    const measure = () => {
      const tracks = getComputedStyle(node).gridTemplateColumns;
      const count = tracks
        .split(" ")
        .map((part) => part.trim())
        .filter((part) => part.length > 0 && part !== "none" && part !== "0px").length;
      setColumns(Math.max(1, count));
      setReady(true);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return { ref: setNode, columns, ready };
}

/** How many carousel slides are fully inside the viewport. */
export function useFullyVisibleSlides(api: CarouselApi | undefined) {
  const [state, setState] = useState({ ready: false, visible: 0 });

  useEffect(() => {
    if (!api) return;
    const measure = () => {
      const root = api.rootNode();
      const view = root.getBoundingClientRect();
      if (view.width <= 0) {
        setState({ ready: false, visible: 0 });
        return;
      }
      let visible = 0;
      for (const slide of api.slideNodes()) {
        const rect = slide.getBoundingClientRect();
        if (rect.width <= 0) continue;
        // Carousel rows use a negative margin and slide padding as the gutter.
        // Count the card, not that gutter, so a full card is not treated as overflow.
        const pad = Number.parseFloat(getComputedStyle(slide).paddingLeft) || 0;
        const contentLeft = rect.left + pad;
        const contentWidth = Math.max(0, rect.width - pad);
        const shown = Math.min(rect.right, view.right) - Math.max(contentLeft, view.left);
        if (contentWidth > 0 && shown >= contentWidth - 2) visible += 1;
      }
      setState({ ready: true, visible });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(api.rootNode());
    api.on("reInit", measure);
    api.on("resize", measure);
    api.on("select", measure);
    return () => {
      observer.disconnect();
      api.off("reInit", measure);
      api.off("resize", measure);
      api.off("select", measure);
    };
  }, [api]);

  return state;
}
