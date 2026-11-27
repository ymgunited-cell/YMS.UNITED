import OpenAI from "openai";

let clientInstance: OpenAI | null = null;

function getClient(): OpenAI {
  if (!clientInstance) {
    const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
    const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
    if (!baseURL || !apiKey) {
      throw new Error(
        "AI_INTEGRATIONS_OPENAI_BASE_URL and AI_INTEGRATIONS_OPENAI_API_KEY must be set before calling OpenAI.",
      );
    }
    clientInstance = new OpenAI({ apiKey, baseURL });
  }
  return clientInstance;
}

export const openai = new Proxy({} as OpenAI, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
