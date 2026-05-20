import { ReactNode, useEffect, useRef, useState } from "react";
import { ResponsiveContainer } from "recharts";

type StableResponsiveContainerProps = {
  children: ReactNode;
  className?: string;
  minHeight?: number;
  // legacy props from various pages
  width?: number | string;
  height?: number | string;
};

export default function StableResponsiveContainer({
  children,
  className,
  minHeight = 200,
  width,
  height,
}: StableResponsiveContainerProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const update = () => {
      const rect = host.getBoundingClientRect();
      // Use measured width; if 0 (not yet laid out) fallback to clientWidth or min defaults
      const measuredWidth = rect.width || host.clientWidth || 400;
      const measuredHeight = rect.height || host.clientHeight || minHeight;
      setDimensions({
        width: Math.max(1, Math.floor(measuredWidth)),
        height: Math.max(minHeight, Math.floor(measuredHeight)),
      });
    };

    // initial measurement on next frame to let layout settle
    let raf = 0;
    const schedule = () => {
      raf = window.requestAnimationFrame(update);
    };

    schedule();

    const observer = new ResizeObserver(() => {
      schedule();
    });
    observer.observe(host);

    const onWindowResize = () => schedule();
    window.addEventListener("resize", onWindowResize);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", onWindowResize);
    };
  }, [minHeight]);

  const hasValidSize = dimensions.width > 0 && dimensions.height > 0;

  const effectiveWidth = typeof width === 'number' ? width : dimensions.width;
  const effectiveHeight = typeof height === 'number' ? height : dimensions.height;

  const style: React.CSSProperties = {
    minHeight,
    minWidth: 0,
    width: typeof width !== 'undefined' ? width : '100%',
    height: typeof height !== 'undefined' ? height : minHeight,
  };

  return (
    <div ref={hostRef} className={className} style={style}>
      {hasValidSize ? (
        <ResponsiveContainer width={effectiveWidth} height={effectiveHeight}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
