/**
 * IncidentChat — conversational panel for analyst Q&A about a selected incident.
 */
import { useState, useRef, useEffect } from "react";
import { useChat } from "../../hooks/useChat.js";
import { COLOR, TYPE, RADIUS, SPACE } from "../../constants/tokens.js";
import Button from "../ui/Button.jsx";
import SectionLabel from "../ui/SectionLabel.jsx";

const SUGGESTED = [
  "Why is this CRITICAL and not HIGH?",
  "Explain T1548 in plain English",
  "What data was stolen exactly?",
  "Draft a customer notification email",
  "What could have prevented this attack?",
  "How long did the attacker have access?",
];

export default function IncidentChat({ incident }) {
  const { messages, isStreaming, sendMessage, clearChat } = useChat(incident);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{
      borderTop: `1px solid ${COLOR.hairline}`,
      marginTop: SPACE.xl,
      paddingTop: SPACE.lg,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: SPACE.md }}>
        <SectionLabel>Chat with This Incident</SectionLabel>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            style={{
              ...TYPE.scale.finePrint,
              color: COLOR.inkMuted48,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Suggested questions — shown before first message */}
      {messages.length === 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: SPACE.xs, marginBottom: SPACE.md }}>
          {SUGGESTED.map(q => (
            <button
              key={q}
              onClick={() => { if (!isStreaming) sendMessage(q); }}
              disabled={!incident}
              style={{
                ...TYPE.scale.caption,
                color: COLOR.primary,
                background: "rgba(0,102,204,0.06)",
                border: `1px solid rgba(0,102,204,0.20)`,
                borderRadius: RADIUS.pill,
                padding: "6px 12px",
                cursor: incident ? "pointer" : "default",
                textAlign: "left",
                opacity: incident ? 1 : 0.4,
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Message thread */}
      {messages.length > 0 && (
        <div style={{
          maxHeight: 320,
          overflowY: "auto",
          marginBottom: SPACE.md,
          display: "flex",
          flexDirection: "column",
          gap: SPACE.sm,
        }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div style={{
                maxWidth: "85%",
                background: msg.role === "user" ? COLOR.primary : COLOR.canvasParchment,
                color: msg.role === "user" ? "#ffffff" : COLOR.ink,
                borderRadius: msg.role === "user"
                  ? `${RADIUS.lg}px ${RADIUS.lg}px ${RADIUS.xs}px ${RADIUS.lg}px`
                  : `${RADIUS.lg}px ${RADIUS.lg}px ${RADIUS.lg}px ${RADIUS.xs}px`,
                padding: `${SPACE.sm}px ${SPACE.md}px`,
                ...TYPE.scale.body,
                lineHeight: 1.5,
                ...(msg.role === "assistant" && isStreaming && msg.content
                  ? { borderRight: `2px solid ${COLOR.ink}` }
                  : {}),
              }}>
                {msg.content || (
                  <span style={{ color: COLOR.inkMuted48 }}>Thinking…</span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input row */}
      <div style={{ display: "flex", gap: SPACE.xs }}>
        <input
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={incident ? "Ask anything about this incident…" : "Select an incident to start chatting"}
          disabled={isStreaming || !incident}
          style={{
            flex: 1,
            ...TYPE.scale.body,
            color: COLOR.ink,
            background: COLOR.canvas,
            border: `1px solid ${COLOR.hairline}`,
            borderRadius: RADIUS.pill,
            padding: "10px 18px",
            outline: "none",
            opacity: (!incident || isStreaming) ? 0.5 : 1,
          }}
        />
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={!inputValue.trim() || isStreaming || !incident}
        >
          {isStreaming ? "…" : "Ask"}
        </Button>
      </div>
    </div>
  );
}
