// Streams OpenAI Responses API over a long-lived Port
browser.runtime.onConnect.addListener((port) => {
    if (port.name !== "openai-stream") return;

    port.onMessage.addListener(async (msg) => {
        const { apiKey, prompt, question } = msg;
        const controller = new AbortController();

        const send = (payload) => {
            try { port.postMessage(payload); } catch { /* port might be gone */ }
        };

        // Abort if the port closes (popup hidden, tab navigated, etc.)
        port.onDisconnect.addListener(() => controller.abort());

        try {
            const resp = await fetch("https://api.openai.com/v1/responses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: "gpt-5-nano",
                    input: prompt + question,
                    stream: true, // <<<<<<<<<<<<<< KEY FOR STREAMING
                }),
                signal: controller.signal,
            });

            if (!resp.ok || !resp.body) {
                const text = await resp.text().catch(() => "");
                send({ error: text || `HTTP ${resp.status}` });
                send({ done: true });
                return;
            }

            // Minimal SSE reader
            const reader = resp.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process full SSE events separated by blank line
                let idx;
                while ((idx = buffer.indexOf("\n\n")) !== -1) {
                    const rawEvent = buffer.slice(0, idx).trim();
                    buffer = buffer.slice(idx + 2);

                    for (const line of rawEvent.split("\n")) {
                        if (!line.startsWith("data:")) continue;
                        const data = line.slice(5).trim();
                        if (!data) continue;
                        if (data === "[DONE]") {
                            send({ done: true });
                            return;
                        }
                        try {
                            const evt = JSON.parse(data);

                            // Token deltas come through as response.output_text.delta
                            if (evt.type === "response.output_text.delta" && typeof evt.delta === "string") {
                                send({ delta: evt.delta });
                            }

                            // Sometimes you’ll also see response.error or response.completed
                            if (evt.type === "response.error") {
                                send({ error: evt.error?.message || "Unknown error" });
                            }
                            if (evt.type === "response.completed") {
                                send({ done: true });
                            }
                        } catch {
                            // keep-alives or non-JSON — ignore
                        }
                    }
                }
            }

            // If we exit the read loop without [DONE], mark done
            send({ done: true });
        } catch (err) {
            if (controller.signal.aborted) return;
            send({ error: String(err) });
            send({ done: true });
        }
    });
});
