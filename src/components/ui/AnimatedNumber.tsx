import { useEffect, useRef, useState } from 'react';

export function AnimatedNumber({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const [bump, setBump] = useState(0);
  const displayRef = useRef(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const from = displayRef.current;
    const delta = value - from;
    if (delta === 0) return;
    setBump((current) => current + 1);
    const start = performance.now();
    const duration = 520;

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from + delta * eased);
      displayRef.current = next;
      setDisplay(next);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      }
    };

    frame.current = requestAnimationFrame(tick);

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      displayRef.current = value;
      setDisplay(value);
    };
  }, [value]);

  return (
    <span key={bump} className={`${className} animate-coin-pop tabular-nums`}>
      {display.toLocaleString('en-US')}
    </span>
  );
}
