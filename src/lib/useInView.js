import { useState, useEffect, useRef } from 'react';

/**
 * useInView — one-shot IntersectionObserver hook.
 *
 * Returns [ref, inView] where `inView` flips to `true` once the element
 * scrolls within `rootMargin` of the viewport and never goes back to false.
 * Use this to defer heavy component initialisation (e.g. Leaflet maps) until
 * they are actually about to become visible rather than at page load time.
 *
 * Falls back to `true` immediately when IntersectionObserver is unavailable
 * (old browsers / jsdom in tests).
 *
 * @param {string} rootMargin  CSS margin around the viewport, e.g. "300px 0px"
 *                             (load 300 px before the element enters the view).
 * @returns {[React.RefObject, boolean]}
 */
export function useInView(rootMargin = '300px 0px') {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    // Immediate fallback when IntersectionObserver is not supported
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const el = ref.current;
    if (!el) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect(); // one-shot — stay mounted once triggered
        }
      },
      { rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally run only once on mount

  return [ref, inView];
}
