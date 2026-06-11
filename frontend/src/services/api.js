const BASE = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Start the SSE analysis stream.
 * @param {import("../constants/alerts.js").Alert[]} alerts
 * @returns {{ eventSource: EventSource, abort: () => void }}
 */
export function createAnalysisStream(alerts) {
  // POST via fetch first to kick off the stream, then consume as EventSource
  // Since EventSource only supports GET, we use fetch + ReadableStream for SSE
  const controller = new AbortController();

  const start = async (onEvent, onError, onDone) => {
    try {
      const response = await fetch(`${BASE}/api/analysis/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alerts),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "pipeline_done") {
                onDone(event);
              } else {
                onEvent(event);
              }
            } catch {
              // skip malformed lines
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== "AbortError") onError(err);
    }
  };

  return {
    start,
    abort: () => controller.abort(),
  };
}
