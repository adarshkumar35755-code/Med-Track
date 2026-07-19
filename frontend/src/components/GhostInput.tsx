import { useRef, useState } from "react";
import "./GhostInput.css";
import SendButton from "./SendButton";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";

interface GhostInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function GhostInput({ onSend, disabled = false }: GhostInputProps) {
  const [value, setValue] = useState("");
  const [mouthOpen, setMouthOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const chatterRef = useRef<number | null>(null);
  

  const { listening, supported: micSupported, startListening, stopListening, lastError } =
  useSpeechRecognition({ onTranscript: (text) => setValue(text) });
  
  function chatter() {
    let i = 0;
    if (chatterRef.current) window.clearInterval(chatterRef.current);
    chatterRef.current = window.setInterval(() => {
      setMouthOpen((prev) => !prev);
      i++;
      if (i === 6) {
        if (chatterRef.current) window.clearInterval(chatterRef.current);
        setMouthOpen(false);
      }
    }, 200);
  }

  function fire() {
  if (!value.trim() || disabled) return;
  if (listening) stopListening();
  onSend(value);
  setValue("");
  chatter();
}

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  console.log("keydown fired:", e.key, "disabled:", disabled, "value:", value);
  if (e.key !== "Enter") return;
  if (e.nativeEvent.isComposing) return; // ignore Enter during IME composition (e.g. autocomplete confirm)
  e.preventDefault();
  fire();
}

  function toggleMic() {
    if (listening) {
      stopListening();
    } else {
      setValue(""); // start fresh each time you tap the mic
      startListening();
    }
  }

  return (
    <div className={`ghost-input-wrap ${focused ? "ghost-input-wrap--focused" : ""}`}>
      <div className="ghost-figure">
        <div className="ghost-body">
          <div className="ghost-eyes">
            <span></span>
            <span></span>
          </div>
          <div className={`ghost-mouth ${mouthOpen ? "ghost-mouth--open" : ""}`}></div>
        </div>
      </div>

      <input
        type="text"
        placeholder={listening ? "Listening…" : "Type your answer…"}
        value={value}
        disabled={disabled}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />

      {micSupported && (
        <button
          type="button"
          className={`mic-btn ${listening ? "mic-btn--listening" : ""}`}
          onClick={toggleMic}
          disabled={disabled}
          aria-label={listening ? "Stop listening" : "Speak your answer"}
          title={listening ? "Tap to stop" : "Tap to speak"}
        >
          🎤
        </button>
        
      )}
      {lastError && <span className="mic-error">{lastError}</span>}

      <SendButton onClick={fire} disabled={disabled || !value.trim()}>
        Send
      </SendButton>
    </div>
  );
}