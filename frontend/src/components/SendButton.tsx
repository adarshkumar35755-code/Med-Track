import "./SendButton.css";

interface SendButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export default function SendButton({ onClick, disabled = false, children }: SendButtonProps) {
  return (
    <button
      type="button"
      className="chat-send-btn"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}