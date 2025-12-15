
const PROMPT = "You are a networking specialist, please give the correct answer to the following question. If it is in German, then answer in German. If there are options provided for the question, just return the index of the correct answer:";
const MODEL = "gpt-5-nano"

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const {type, data} = request.question;
  const body = type == 'T' ? JSON.stringify({
      model:MODEL,
      input: PROMPT + data
    }) : JSON.stringify ({
      model: MODEL,
      input: [
        {
           role: "user",
           content: [
             { type: "input_text", text: PROMPT + "Answer the question in this image." },
             {
                type: "input_image",
                image_url: data,
              },
           ],
      }]
    })

  fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${request.apiKey}`
    },
    body: body,
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
