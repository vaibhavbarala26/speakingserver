const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = "AIzaSyDd3hT9qjGnR1hnIpm7dONASJV0a0lGflY";
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

async function run(prompt, User_History) {

  const chatSession = model.startChat({
    generationConfig,
    history: User_History // Pass the history from apiInput
  });

  const result = await chatSession.sendMessage(prompt);
  console.log(result.response.text());
  return result.response.text();
}

module.exports = run;