/**
 * AI Service Router
 * Handles API calls to different AI backends based on user selection
 * DO NOT MODIFY STRUCTURE - Only add new backends or update endpoints
 */

interface AIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface AIResponse {
  content: string;
  error?: string;
}

export class AIService {
  private static getSelectedBackend(): string {
    return localStorage.getItem("ai_backend") || "claude";
  }

  private static getApiKey(backend: string): string | null {
    return localStorage.getItem(`ai_key_${backend}`);
  }

  /**
   * Send a message to the selected AI backend
   */
  static async sendMessage(messages: AIMessage[]): Promise<AIResponse> {
    const backend = this.getSelectedBackend();
    
    try {
      switch (backend) {
        case "claude":
          return await this.callClaude(messages);
        case "gpt":
          return await this.callGPT(messages);
        case "codellama":
          return await this.callCodeLlama(messages);
        case "deepseek":
          return await this.callDeepSeek(messages);
        case "grok":
          return await this.callGrok(messages);
        default:
          return { content: "", error: `Unknown backend: ${backend}` };
      }
    } catch (error) {
      console.error("AI Service Error:", error);
      return {
        content: "",
        error: error instanceof Error ? error.message : "Unknown error occurred"
      };
    }
  }

  /**
   * Claude (Anthropic) API
   */
  private static async callClaude(messages: AIMessage[]): Promise<AIResponse> {
    const apiKey = this.getApiKey("claude");
    if (!apiKey) {
      return { content: "", error: "Claude API key not configured" };
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: messages.map(m => ({
          role: m.role === "system" ? "user" : m.role,
          content: m.content
        }))
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { content: data.content[0].text };
  }

  /**
   * GPT (OpenAI) API
   */
  private static async callGPT(messages: AIMessage[]): Promise<AIResponse> {
    const apiKey = this.getApiKey("gpt");
    if (!apiKey) {
      return { content: "", error: "OpenAI API key not configured" };
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { content: data.choices[0].message.content };
  }

  /**
   * CodeLlama (Ollama Local) API
   */
  private static async callCodeLlama(messages: AIMessage[]): Promise<AIResponse> {
    const ollamaUrl = localStorage.getItem("ollama_url") || "http://localhost:11434";
    const prompt = messages.map(m => `${m.role}: ${m.content}`).join("\n\n");

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "codellama",
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama not available at ${ollamaUrl}. Is Ollama running?`);
    }

    const data = await response.json();
    return { content: data.response };
  }

  /**
   * DeepSeek API
   */
  private static async callDeepSeek(messages: AIMessage[]): Promise<AIResponse> {
    const apiKey = this.getApiKey("deepseek");
    if (!apiKey) {
      return { content: "", error: "DeepSeek API key not configured" };
    }

    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { content: data.choices[0].message.content };
  }

  /**
   * Grok (xAI) API
   */
  private static async callGrok(messages: AIMessage[]): Promise<AIResponse> {
    const apiKey = this.getApiKey("grok");
    if (!apiKey) {
      return { content: "", error: "Grok API key not configured" };
    }

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: messages,
        max_tokens: 1024
      })
    });

    if (!response.ok) {
      throw new Error(`Grok API error: ${response.statusText}`);
    }

    const data = await response.json();
    return { content: data.choices[0].message.content };
  }
}
