import axios from "axios";

const DEFAULT_BASE_URL = "/api/v1";

function buildHeaders(apiKey?: string) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey) {
    headers["X-API-Key"] = apiKey;
  }
  return headers;
}

const aiCore = {
  analyze: async (query: string, apiKey?: string) => {
    const response = await axios.post(
      `${DEFAULT_BASE_URL}/core/ai/analyze`,
      { query },
      { headers: buildHeaders(apiKey) }
    );
    return response.data;
  },
  fix: async (query: string, apiKey?: string) => {
    const response = await axios.post(
      `${DEFAULT_BASE_URL}/core/ai/fix`,
      { query },
      { headers: buildHeaders(apiKey) }
    );
    return response.data;
  },
  monitor: async (apiKey?: string) => {
    const response = await axios.get(`${DEFAULT_BASE_URL}/core/ai/monitor`, {
      headers: buildHeaders(apiKey),
    });
    return response.data;
  },
};

export default aiCore;
