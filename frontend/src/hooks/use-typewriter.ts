import { useState, useEffect } from "react";

interface UseTypewriterProps {
  text: string;
  speed?: number; // milliseconds between characters
  delay?: number; // initial delay before starting
  enabled?: boolean; // whether to enable typing animation
}

export function useTypewriter({
  text,
  speed = 30,
  delay = 0,
  enabled = true,
}: UseTypewriterProps) {
  const [displayedText, setDisplayedText] = useState(enabled ? "" : text);
  const [isComplete, setIsComplete] = useState(!enabled);

  useEffect(() => {
    if (!text || !enabled) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    setDisplayedText("");
    setIsComplete(false);
    let timeoutId: NodeJS.Timeout;
    let charIndex = 0;

    const startTyping = () => {
      const type = () => {
        if (charIndex < text.length) {
          setDisplayedText(text.slice(0, charIndex + 1));
          charIndex++;
          timeoutId = setTimeout(type, speed);
        } else {
          setIsComplete(true);
        }
      };
      type();
    };

    if (delay > 0) {
      timeoutId = setTimeout(startTyping, delay);
    } else {
      startTyping();
    }

    return () => clearTimeout(timeoutId);
  }, [text, speed, delay, enabled]);

  return { displayedText, isComplete };
}
