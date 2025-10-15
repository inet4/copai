const OPENAI_KEY = "OPENAI_KEY";
const PROMPT_KEY = "PROMPT_KEY";
const DEFAULT_PROMPT =
    "You are a networking specialist, please give the correct answer to the following question. If it is in German, then answer in German. If there are options provided for the question, just return the index of the correct answer:";

let inProgress = false;

// Floating UI
const answerElement = document.createElement("ul");
answerElement.id = "answer";
answerElement.style.width = "50%";
answerElement.style.visibility = "hidden";
answerElement.style.zIndex = "999999";
answerElement.style.position = "fixed";
answerElement.style.top = "60px";
answerElement.style.left = "20px";
answerElement.style.bottom = "";
answerElement.style.right = "";
answerElement.style.opacity = "0.8";
answerElement.style.color = "#000000";
answerElement.style.background = "rgba(255,255,255,0.9)";
answerElement.style.padding = "12px";
answerElement.style.border = "1px solid #ddd";
answerElement.style.borderRadius = "8px";
answerElement.style.listStyle = "disc inside";
document.body.appendChild(answerElement);
window.answer = answerElement;

function updateAnswers(newAnswers) {
    window.answer.innerHTML = "";
    for (let a of newAnswers) {
        const li = document.createElement("li");
        li.textContent = a;
        window.answer.appendChild(li);
    }
}

// --- STREAMING SUPPORT ---
let port = null;
let currentLI = null;
let streamingBuffer = "";

// open (or reuse) a streaming port
function getPort() {
    if (port) return port;
    port = browser.runtime.connect({ name: "openai-stream" });
    port.onMessage.addListener((msg) => {
        if (msg.delta) {
            // Lazy-create the first <li> to stream into
            if (!currentLI) {
                currentLI = document.createElement("li");
                currentLI.textContent = "";
                window.answer.appendChild(currentLI);
            }
            streamingBuffer += msg.delta;

            // Render small chunks to the DOM (keeps things snappy)
            currentLI.textContent = streamingBuffer;
        }
        if (msg.error) {
            const li = document.createElement("li");
            li.textContent = `[error] ${msg.error}`;
            window.answer.appendChild(li);
        }
        if (msg.done) {
            inProgress = false;
            // Split into multiple bullet points if model returned newlines
            finalizeBulletsFrom(streamingBuffer);
            streamingBuffer = "";
            currentLI = null;
            safeDisconnect();
        }
    });
    return port;
}

function safeDisconnect() {
    try { port && port.disconnect(); } catch {}
    port = null;
    let li = document.createElement("li");
    li.innerText = "Stopped successfully"
    answerElement.appendChild(li)
}

// turn a multi-line streamed string into <li> items
function finalizeBulletsFrom(text) {
    const lines = text.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (lines.length <= 1) return; // already in currentLI
    // Replace the single in-progress <li> with multiple
    window.answer.innerHTML = "";
    for (const l of lines) {
        const li = document.createElement("li");
        li.textContent = l;
        window.answer.appendChild(li);
    }
}

async function readClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        return text;
    } catch (err) {
        console.error("Failed to read clipboard: ", err);
    }
    return null;
}

async function answerQuestion(prompt, key) {
    const questionText = await readClipboard();
    if (!questionText || inProgress) return;

    console.log("Sending Request to OpenAI (streaming)!");
    inProgress = true;

    window.answer.style.visibility = "visible";
    window.answer.innerHTML = "";
    const li = document.createElement("li");
    li.textContent = "loading…";
    window.answer.appendChild(li);

    const p = getPort();
    p.postMessage({
        apiKey: key,
        prompt,
        question: questionText,
    });
}

// Hotkeys
window.addEventListener("keydown", async (event) => {
    switch (event.key) {
        case "p": {
            const storedKey = localStorage.getItem(OPENAI_KEY);
            const newAIKey = prompt("Please input the OPENAI key", storedKey ?? "");
            if (!newAIKey) return;
            localStorage.setItem(OPENAI_KEY, newAIKey);
            break;
        }
        case "a": {
            const storeKey = localStorage.getItem(OPENAI_KEY);
            if (!storeKey) {
                window.answer.style.visibility = "visible";
                window.answer.innerText = "No key selected. Press `p` to add your key.";
                return;
            }
            const promptValue = localStorage.getItem(PROMPT_KEY) ?? DEFAULT_PROMPT;
            answerQuestion(promptValue, storeKey);
            break;
        }
        case "l": {
            window.answer.style.visibility = "visible";
            if (window.answer.innerText === "") {
                window.answer.innerText = "Hellooo!";
            }
            break;
        }
        case "m": {
            const currentPrompt = localStorage.getItem(PROMPT_KEY) ?? DEFAULT_PROMPT;
            const newPrompt = prompt("Input GPT Prompt", currentPrompt);
            if (!newPrompt) return;
            localStorage.setItem(PROMPT_KEY, newPrompt);
            break;
        }
        case "Escape": {
            // quick cancel
            safeDisconnect();
            inProgress = false;
            setTimeout(() => {
                window.answer.innerHTML = "";
            }, 3000)
            break;
        }
    }
});

window.addEventListener("keyup", (event) => {
    if (event.key === "l") {
        window.answer.style.visibility = "hidden";
    }
});
