const OPENAI_KEY = "OPENAI_KEY";
let inProgress = false;
const answerElement = document.createElement("ul");
answerElement.id = "answer";
answerElement.style.width = "50%";
answerElement.style.visibility = "hidden";
answerElement.style.zIndex = "999999";
answerElement.style.position = "fixed";
answerElement.style.bottom = "100px";
answerElement.style.right = "20%";
answerElement.style.opacity = "0.7";
answerElement.style.color = "#0000001F";

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

      answerQuestion(storeKey);
      break;
    case "l":
      window.answer.style.visibility = "visible";
      break;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "l") {
    window.answer.style.visibility = "hidden";
  }
});

function fetchAnswers(apiKey, question) {
  return new Promise((resolve, reject) => {
    browser.runtime.sendMessage({ apiKey: apiKey, question: question }).then(
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

async function answerQuestion(key) {
  const questionText = await readClipboard();
  if (!questionText || inProgress) {
    return;
  }

  inProgress = true;
  window.answer.innerText = "loading...";
  const correctAnswers = await fetchAnswers(key, questionText);
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
