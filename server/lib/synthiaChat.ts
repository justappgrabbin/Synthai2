import type { Express } from 'express';

const providers: Record<string, string> = {
  claude: 'https://api.anthropic.com/v1/messages',
  gpt: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  grok: 'https://api.x.ai/v1/chat/completions',
  huggingface: 'https://api.minimax.io/v1/chat/completions',
};

export function registerSynthiaChat(app: Express) {
  // Fixed destinations, using only the caller's key. Keys are neither persisted
  // nor logged here. Local Ollama remains a separate existing backend.
  app.post('/api/synthia/chat', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const { backend, apiKey, payload } = req.body || {};
    if (typeof backend !== 'string' || !Object.prototype.hasOwnProperty.call(providers, backend)
      || typeof apiKey !== 'string' || !apiKey || apiKey.length > 4096
      || !payload || !Array.isArray(payload.messages) || payload.messages.length > 200
      || payload.messages.some((m: { role?: unknown; content?: unknown }) => !m || !['user', 'assistant', 'system'].includes(String(m.role)) || typeof m.content !== 'string')
      || typeof payload.model !== 'string' || JSON.stringify(payload).length > 500_000) {
      return res.status(400).json({ error: { message: 'Choose an AI provider and configure its API key in Settings.' } });
    }
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (backend === 'claude') { headers['x-api-key'] = apiKey; headers['anthropic-version'] = '2023-06-01'; }
    else headers.Authorization = `Bearer ${apiKey}`;
    try {
      const upstream = await fetch(providers[backend], {
        method: 'POST', headers,
        body: JSON.stringify({ model: payload.model, messages: payload.messages, max_tokens: Math.min(Math.max(Number(payload.max_tokens) || 1024, 1), 4096) }),
        signal: AbortSignal.timeout(60000),
      });
      if (!upstream.ok) return res.status(upstream.status).json({ error: { message: `AI provider returned ${upstream.status}. Test your connection and key in Settings.` } });
      res.json(await upstream.json());
    } catch {
      res.status(502).json({ error: { message: 'AI provider could not be reached. Try again or test another provider in Settings.' } });
    }
  });
}
