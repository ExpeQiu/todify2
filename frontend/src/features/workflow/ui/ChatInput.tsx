import React from 'react';
import { Mic, Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  isProcessing: boolean;
  onChange: (value: string) => void;
  onSend: () => void;
  onKeyPress?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  isProcessing,
  onChange,
  onSend,
  onKeyPress,
}) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="chat-input-area">
      <div className="input-container">
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyPress={onKeyPress}
          placeholder="输入您的问题或需求..."
          className="chat-input"
          disabled={isProcessing}
        />
        <div className="input-actions">
          <button className="voice-btn" disabled={isProcessing}>
            <Mic size={20} />
          </button>
          <button
            className="send-btn"
            onClick={onSend}
            disabled={!value.trim() || isProcessing}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
