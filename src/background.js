
const PROMPT = "You are a networking specialist, please give the correct answer to the following question. If it is in German, then answer in German. If there are options provided for the question, just return the index of the correct answer:";

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${request.apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-5-nano",
      input: PROMPT + request.question
    })
  })
    .then((response) => response.text())
    .then((text) => {
      sendResponse({ html: text });
    })
    .catch((error) => {
      sendResponse({ error: error.toString() });
    });
  return true; // Required to use async sendResponse
});
