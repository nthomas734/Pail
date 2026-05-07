'use client';

import { useEffect, useState } from 'react';

interface FlapTextProps {
  text: string;
  delay?: number;
  cyclesPerChar?: number;
  cycleSpeed?: number;
  staggerPerChar?: number;
  style?: React.CSSProperties;
  className?: string;
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 .-';

/**
 * Split-flap board animation — each character cycles through
 * random characters before settling on its final value, with
 * staggered start delays per character for the cascading reveal.
 */
export function FlapText({
  text,
  delay = 0,
  cyclesPerChar = 7,
  cycleSpeed = 55,
  staggerPerChar = 35,
  style,
  className
}: FlapTextProps) {
  const target = text.toUpperCase();
  const [display, setDisplay] = useState<string>(' '.repeat(target.length));

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const chars: string[] = Array(target.length).fill(' ');

    for (let i = 0; i < target.length; i++) {
      const startDelay = delay + i * staggerPerChar;
      const finalChar = target[i];

      // If it's a space or punctuation we don't cycle, just set it
      if (finalChar === ' ') {
        chars[i] = ' ';
        continue;
      }

      let cycles = cyclesPerChar;
      const tick = () => {
        if (cycles > 0) {
          chars[i] = CHARS[Math.floor(Math.random() * CHARS.length)];
          setDisplay(chars.join(''));
          cycles--;
          timeouts.push(setTimeout(tick, cycleSpeed));
        } else {
          chars[i] = finalChar;
          setDisplay(chars.join(''));
        }
      };
      timeouts.push(setTimeout(tick, startDelay));
    }

    return () => timeouts.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <span style={style} className={className} aria-label={text}>
      {display}
    </span>
  );
}
