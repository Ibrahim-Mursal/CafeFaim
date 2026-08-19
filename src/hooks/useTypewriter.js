import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion.js';

const TYPE_MS = 80;
const DELETE_MS = 50;
const HOLD_MS = 1500;
const GAP_MS = 300;

/*
 * Cycles through `words`, typing and deleting one character at a time.
 * The list is read from a ref at the top of each cycle rather than captured in
 * the effect, so switching language mid-word is picked up on the very next
 * word instead of restarting the animation (which would look like a glitch).
 */
export function useTypewriter(words) {
  const reduce = usePrefersReducedMotion();
  const [text, setText] = useState('');
  const wordsRef = useRef(words);
  wordsRef.current = words;

  useEffect(() => {
    if (reduce) {
      setText(wordsRef.current[0] ?? '');
      return;
    }

    let timer = null;
    let cancelled = false;
    let index = 0;
    const wait = (ms, fn) => {
      timer = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const typeChar = (word, pos, done) => {
      setText(word.slice(0, pos));
      if (pos < word.length) wait(TYPE_MS, () => typeChar(word, pos + 1, done));
      else wait(HOLD_MS, done);
    };

    const deleteChar = (word, pos, done) => {
      setText(word.slice(0, pos));
      if (pos > 0) wait(DELETE_MS, () => deleteChar(word, pos - 1, done));
      else wait(GAP_MS, done);
    };

    const cycle = () => {
      const list = wordsRef.current;
      if (!list.length) return;
      const word = list[index % list.length];
      index += 1;
      typeChar(word, 0, () => deleteChar(word, word.length, cycle));
    };

    cycle();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [reduce]);

  return text;
}
