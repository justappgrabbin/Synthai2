# Cynthia Part 3 — Open WebUI Connector Kit

This kit helps you connect the Cynthia Engine (pt1 + pt2) to **Open WebUI** and a local model backend (Ollama or llama.cpp).

## Steps
1. Run Open WebUI (desktop app or hosted). Connect it to your Ollama server in **Admin → Connections → Ollama**.
2. In **Admin → Models**, import or download a model (e.g., TinyLlama, Llama-3 8B Q4). You can import `.gguf` models here.
3. In **Admin → Prompts**, paste `prompt_templates/cynthia_system.txt` as your System Prompt.
4. In **Admin → Knowledge**, upload files from `knowledge_templates/` to seed Human Design knowledge.
5. In Cynthia Engine UI (pt1), set Base URL to your backend's OpenAI-style endpoint:
   - Ollama default: http://localhost:11434
   - llama.cpp server: http://localhost:8080
6. Enable LLM in pt1, then ask Cynthia questions.

Use `api_test.html` here to verify your model responds correctly to the OpenAI-style `/v1/chat/completions` API.
