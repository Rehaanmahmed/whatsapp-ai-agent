require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const tools = require("../tools");

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",

  tools: [
    {
      functionDeclarations: [
        {
          name: "getWeather",
          description: "Get weather for a city",
          parameters: {
            type: "OBJECT",
            properties: {
              city: {
                type: "STRING",
              },
            },
            required: ["city"],
          },
        },

        {
          name: "calculate",
          description: "Calculate a math expression",
          parameters: {
            type: "OBJECT",
            properties: {
              expression: {
                type: "STRING",
              },
            },
            required: ["expression"],
          },
        },

        {
          name: "setReminder",
          description: "Set a reminder",
          parameters: {
            type: "OBJECT",
            properties: {
              task: {
                type: "STRING",
              },

              time: {
                type: "STRING",
              },
            },
            required: ["task", "time"],
          },
        },
      ],
    },
  ],
});

async function runAgent(message) {
  const result = await model.generateContent(message);

  const part =
    result.response.candidates[0].content.parts[0];

  if (!part.functionCall) {
    return result.response.text();
  }

  const { name, args } = part.functionCall;

  let toolResult;

switch (name) {
  case "getWeather":
    toolResult = tools.getWeather(args.city);
    break;

  case "calculate":
    toolResult = tools.calculate(args.expression);
    break;

  case "setReminder":
    toolResult = tools.setReminder(
      args.task,
      args.time
    );
    break;
}
await new Promise(resolve =>
  setTimeout(resolve, 2000)
);

// Ask Gemini to explain the tool result naturally
const finalResponse = await model.generateContent(`
You are a friendly WhatsApp assistant.

User question:
${message}

Tool used:
${name}

Tool result:
${JSON.stringify(toolResult)}

Write a natural response for WhatsApp.
Keep it under 50 words.
Do not mention tools, APIs, or JSON.
Use emojis when appropriate.
`);

return finalResponse.response.text();
}

module.exports = runAgent;