import { useCallback, useState } from "react";

export function useSpeechSynthesis() {
  const [enabled, setEnabled] = useState(false);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback(
    (text: string) => {
      if (!enabled || !supported || !text) return;
      window.speechSynthesis.cancel(); // stop any prior utterance first
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    },
    [enabled, supported]
  );

  const stop = useCallback(() => {
    if (supported) window.speechSynthesis.cancel();
  }, [supported]);

  return { enabled, setEnabled, speak, stop, supported };
}