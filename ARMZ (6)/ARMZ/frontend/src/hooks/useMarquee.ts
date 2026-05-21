import { useEffect, useRef } from "react";

type Options = {
  speed?: number; // pixels per second
  pauseOnHover?: boolean;
};

export default function useMarquee(
  containerRef: React.RefObject<HTMLElement>,
  options: Options = {},
  deps: React.DependencyList = []
) {
  const { speed = 30, pauseOnHover = true } = options;
  const rafRef = useRef<number | null>(null);
  const lastTs = useRef<number | null>(null);
  const offset = useRef(0);
  const paused = useRef(false);
  const totalWidth = useRef(0);
  const speedRef = useRef<number>(speed);

  // keep speedRef current so animation doesn't need full restart when speed changes
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const marquee = container.querySelector<HTMLElement>(".marquee-content");
    if (!marquee) return;

    const originalChildren = Array.from(marquee.children) as HTMLElement[];
    const originalCount = originalChildren.length;
    const originalWidth = marquee.scrollWidth;
    totalWidth.current = originalWidth || marquee.offsetWidth;

    // Programmatically clone children until the marquee content is at least twice the container width
    const appendedClones: HTMLElement[] = [];
    function ensureClones() {
      const containerWidth = container.clientWidth || window.innerWidth;
      let safety = 0;
      while (marquee.scrollWidth < containerWidth * 2 && safety < 20) {
        for (let i = 0; i < originalCount; i++) {
          const clone = originalChildren[i].cloneNode(true) as HTMLElement;
          marquee.appendChild(clone);
          appendedClones.push(clone);
        }
        safety += 1;
      }
    }

    ensureClones();

    function onResize() {
      // recalc widths and ensure enough clones
      totalWidth.current = originalWidth || marquee.offsetWidth;
      ensureClones();
    }

    let isActive = true;

    function step(ts: number) {
      if (!isActive) return;
      if (lastTs.current == null) lastTs.current = ts;
      const delta = (ts - lastTs.current) / 1000; // seconds
      lastTs.current = ts;
      if (!paused.current) {
        offset.current += speedRef.current * delta;
        if (offset.current >= totalWidth.current) offset.current -= totalWidth.current;
        marquee.style.transform = `translate3d(${-offset.current}px, 0, 0)`;
      }
      rafRef.current = requestAnimationFrame(step);
    }

    function setPaused(v: boolean) {
      paused.current = v;
    }

    function pause() { setPaused(true); }
    function play() { setPaused(false); }
    function toggle() { setPaused(!paused.current); }

    const enter = () => setPaused(true);
    const leave = () => setPaused(false);
    const focusin = () => setPaused(true);
    const focusout = () => setPaused(false);

    if (pauseOnHover) {
      container.addEventListener("mouseenter", enter);
      container.addEventListener("mouseleave", leave);
      container.addEventListener("focusin", focusin);
      container.addEventListener("focusout", focusout);
    }

    window.addEventListener("resize", onResize);
    rafRef.current = requestAnimationFrame(step);

    return () => {
      isActive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      if (pauseOnHover) {
        container.removeEventListener("mouseenter", enter);
        container.removeEventListener("mouseleave", leave);
        container.removeEventListener("focusin", focusin);
        container.removeEventListener("focusout", focusout);
      }
      // remove appended clones
      appendedClones.forEach((n) => n.remove());
    };
  }, [containerRef, pauseOnHover, ...deps]);

  return { pause: () => { paused.current = true; }, play: () => { paused.current = false; }, toggle: () => { paused.current = !paused.current; } };
}
