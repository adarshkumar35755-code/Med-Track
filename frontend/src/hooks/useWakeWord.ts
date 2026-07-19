import { useCallback, useEffect, useRef, useState } from "react";

interface UseWakeWordOptions {
  wakeWord?: string;
  onCommand: (command: string) => void;
  enabled: boolean; // user must explicitly opt in — mic can't self-start
}

export function useWakeWord({ wakeWord = "prime", onCommand, enabled }: UseWakeWordOptions) {
  const [listening, setListening] = useState(false);
  const [armed, setArmed] = useState(false); // true right after wake word heard, waiting for command
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldRunRef = useRef(false);
  const armedRef = useRef(false);
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    armedRef.current = armed;
  }, [armed]);

  const handleResult = useCallback(
    (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript.toLowerCase().trim();
      if (!result.isFinal) return;

      const wake = wakeWord.toLowerCase();

      if (armedRef.current) {
        // already woken — whatever comes next is the command
        setArmed(false);
        armedRef.current = false;
        if (transcript) onCommand(transcript);
        return;
      }

      const idx = transcript.indexOf(wake);
      if (idx === -1) return;

      const now = Date.now();
      if (now - lastTriggerRef.current < 2000) return; // debounce accidental re-triggers
      lastTriggerRef.current = now;

      const after = transcript.slice(idx + wake.length).trim();
      if (after) {
        // "prime, take amoxicillin" said in one breath
        onCommand(after);
      } else {
        // just "prime" — arm and wait for the follow-up sentence
        setArmed(true);
        armedRef.current = true;
      }
    },
    [wakeWord, onCommand]
  );

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = handleResult;
    recognition.onend = () => {
      setListening(false);
      if (shouldRunRef.current) {
        // browsers auto-stop continuous recognition periodically — restart it
        try {
          recognition.start();
          setListening(true);
        } catch {
          /* already starting, ignore */
        }
      }
    };
    recognition.onerror = (e: any) => {
      if (e.error === "no-speech" || e.error === "aborted") return; // expected, not fatal
      setError(e.error);
      shouldRunRef.current = false;
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRunRef.current = false;
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
    };
  }, [handleResult]);

  useEffect(() => {
    if (!recognitionRef.current) return;
    shouldRunRef.current = enabled;
    if (enabled) {
      try {
        recognitionRef.current.start();
        setListening(true);
        setError(null);
      } catch {
        /* already running */
      }
    } else {
      recognitionRef.current.stop();
      setListening(false);
      setArmed(false);
    }
  }, [enabled]);

  return { listening, armed, supported, error };
}