import serviceConfig from './serviceConfig';
import geminiModel from '../lib/gemini';
import azureOpenAIModel from '../lib/azureopenai';

let API_TYPE = import.meta.env.REACT_APP_API_TYPE || 'azure';
let MODEL_NAME = import.meta.env.REACT_APP_MODEL_NAME || 'gpt-4o';

const geminiService = {
  sendMessage: async (text, chatHistory, img) => {
    const config = serviceConfig.gemini[MODEL_NAME];
    console.log("Gemini API call with text:", text, "using config:", config);
    // Construct the chat history and send message to Gemini model
    const result = await geminiModel.sendMessage(text, chatHistory);
    return result; // Handle and return response accordingly
  },
};

const azureService = {
  sendMessage: async (text, chatHistory, img) => {
    const config = serviceConfig.azure[MODEL_NAME];
    const chatHistoryPrepared = prepareChatHistory(chatHistory, text);
    const result = await azureOpenAIModel.chat.completions.create({
      messages: chatHistoryPrepared,
      stream: true,
      apiUrl: config.apiUrl,
    });

    let accumulatedText = '';
    for await (const chunk of result) {
      const chunkText = chunk.choices[0]?.delta?.content || '';
      accumulatedText += chunkText;
    }

    return accumulatedText;
  },
};

const prepareChatHistory = (history, lastUserMessage) => {
  const systemMessage = { role: "system", content: "You are a helpful assistant." };
  const mappedHistory = history.map(({ role, parts }) => ({
    role: role === "model" ? "assistant" : role,
    content: parts[0].text,
  }));
  const userMessage = lastUserMessage ? { role: "user", content: lastUserMessage } : null;
  return [systemMessage, ...mappedHistory, userMessage].filter(Boolean);
};

const apiService = {
  setApiType: (type) => {
    API_TYPE = type;
  },
  setModelName: (name) => {
    MODEL_NAME = name;
  },
  getService: () => {
    return API_TYPE === 'gemini' ? geminiService : azureService;
  }
};

export default apiService;
