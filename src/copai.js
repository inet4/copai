const OPENAI_KEY = "OPENAI_KEY";
const PROMPT_KEY = "PROMPT_KEY"
const DEFAULT_PROMPT = "You are a networking specialist, please give the correct answer to the following question. If it is in German, then answer in German. If there are options provided for the question, just return the index of the correct answer:";
let inProgress = false;
const answerElement = document.createElement("ul");
answerElement.id = "answer";
answerElement.style.width = "50%";
answerElement.style.visibility = "hidden";
answerElement.style.zIndex = "999999";
answerElement.style.position = "fixed";

// top-left placement
answerElement.style.top = "60px";
answerElement.style.left = "20px";

// make sure previous bottom/right placement doesn't apply
answerElement.style.bottom = "";
answerElement.style.right = "";

answerElement.style.opacity = "0.8";
answerElement.style.color = "#000000";

document.body.appendChild(answerElement);
window.answer = answerElement;

function updateAnswers(newAnswers) {
  // clear current answers
  window.answer.innerHTML = "";


  // update answers
  for (let a of newAnswers) {
    const li = document.createElement("li");
    li.textContent = a;
    window.answer.appendChild(li);
  }
}

window.addEventListener("keydown", async (event) => {
  switch (event.key) {
    case "p":
      const storedKey = localStorage.getItem(OPENAI_KEY);
      const newAIKey = prompt("Please input the OPENAPI key", storedKey ?? "");
      if (!newAIKey) {
        return;
      }
      localStorage.setItem(OPENAI_KEY, newAIKey);
      break;
    case "a":
      // fetch using stored URL
      const storeKey = localStorage.getItem(OPENAI_KEY);
      if (!storeKey) {
        window.answer.innerText = "No key selected. Use `p` to add your key.";
        return;
      }

      const promptValue = localStorage.getItem(PROMPT_KEY) ?? DEFAULT_PROMPT;

      answerQuestion(promptValue, storeKey);
      break;
    case "l":
      window.answer.style.visibility = "visible";
      if (window.answer.innerText === "") {
          window.answer.innerText = "Hellooo!"
      }
      break;
    case "m":
        const currentPrompt = localStorage.getItem(PROMPT_KEY) ?? DEFAULT_PROMPT;
        const newPrompt = prompt("Input GPT Prompt", currentPrompt);
        if (!newPrompt) return;
        localStorage.setItem(PROMPT_KEY, newPrompt);
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "l") {
    window.answer.style.visibility = "hidden";
  }
});

function fetchAnswers(prompt, apiKey, question) {
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage({ prompt: prompt, apiKey: apiKey, question: question }).then(
      (response) => {
        if (response.error) {
          reject(response.error);
        } else {
          const data = JSON.parse(response.html);
          console.log("data: ", data)
          const answerData = [];
          for (const obj of data.output) {
            if (obj.type === "message") {
              for (const output of obj.content) {
                answerData.push(output.text);
              }
            }
          }
          resolve(answerData);
        }
      },
      (error) => {
        reject(error);
      },
    );
  });
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
  if (!questionText || inProgress) {
    return;
  }

    console.log("Sending Request to openai!")
    console.log(`Key: ${key}`)
    console.log(`Prompt ${prompt}`)
    console.log(`Question: ${questionText}`)

  inProgress = true;
  window.answer.innerText = "loading...";
  const correctAnswers = await fetchAnswers(prompt, key, questionText);
  if (
    correctAnswers === null ||
    correctAnswers === undefined ||
    correctAnswers.length === 0
  ) {
    window.answer.innerText = "no answers found";
    return;
  }
  inProgress = false;
  updateAnswers(correctAnswers);
}
