import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  onTranscript: (text: string) => void;
}

export function useSpeechRecognition({ onTranscript }: UseSpeechRecognitionOptions) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const shouldRunRef = useRef(false);
  const finalTextRef = useRef("");
  const onTranscriptRef = useRef(onTranscript);

  // keep the ref pointing at the latest callback WITHOUT retriggering the setup effect
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTextRef.current += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      onTranscriptRef.current((finalTextRef.current + interim).trim());
    };

    recognition.onend = () => {
      if (shouldRunRef.current) {
        try {
          recognition.start();
        } catch {
          /* already starting */
        }
      } else {
        setListening(false);
      }
    };

    recognition.onerror = (e: any) => {
      console.error("SpeechRecognition error:", e.error);
      if (e.error === "no-speech" || e.error === "aborted") return;
      shouldRunRef.current = false;
      setListening(false);
      setLastError(e.error);
    };

    recognitionRef.current = recognition;

    return () => {
      shouldRunRef.current = false;
      recognition.onresult = null;
      recognition.onend = null;
      recognition.onerror = null;
      recognition.stop();
    };
  }, []); // <-- empty deps: set up ONCE, never torn down by callback identity changes

  const startListening = useCallback(() => {
    if (!recognitionRef.current || listening) return;
    finalTextRef.current = "";
    shouldRunRef.current = true;
    setLastError(null);
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {
      /* already running */
    }
  }, [listening]);

  const stopListening = useCallback(() => {
    shouldRunRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { listening, supported, startListening, stopListening, lastError };
}