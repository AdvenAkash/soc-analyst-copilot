/**
 * useChat — manages conversation state for "Chat with Incident".
 *
 * @param {object|null} incident — the currently selected incident
 */
import { useState, useCallback, useRef } from "react";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.BASE_URL ||
  "/"
).replace(/\/$/, "");

export function useChat(incident) {
  const [messages, setMessages]     = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamController             = useRef(null);

  const sendMessage = useCallback(async (userText) => {
    if (!incident || !userText.trim() || isStreaming) return;

    const userMsg      = { id: Date.now(),     role: "user",      content: userText };
    const assistantMsg = { id: Date.now() + 1, role: "assistant", content: "" };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);

    const history = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
    }));

    streamController.current = new AbortController();

    try {
      const response = await fetch(`${API_BASE}/api/chat/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incident, messages: history }),
        signal: streamController.current.signal,
      });

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const chunk of lines) {
          if (!chunk.startsWith("data:")) continue;
          try {
            const event = JSON.parse(chunk.slice(5).trim());
            if (event.type === "token") {
              setMessages(prev => {
                const updated = [...prev];
                const last    = updated[updated.length - 1];
                if (last.role === "assistant") {
                  updated[updated.length - 1] = { ...last, content: last.content + event.content };
                }
                return updated;
              });
            }
            if (event.type === "done" || event.type === "error") {
              setIsStreaming(false);
            }
          } catch { /* ignore parse errors */ }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: "Sorry, I couldn't get a response. Check that the backend is running.",
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
    }
  }, [incident, messages, isStreaming]);

  const clearChat = useCallback(() => {
    streamController.current?.abort();
    setMessages([]);
    setIsStreaming(false);
  }, []);

  return { messages, isStreaming, sendMessage, clearChat };
}
