import { useRef, useEffect } from "react";

/**
 * Auto-scrolls containerRef to bottom whenever deps change.
 * @param {any[]} deps
 */
export function useScrollFeed(deps) {
  const containerRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, deps);

  return { containerRef, endRef };
}
