import { App } from "@modelcontextprotocol/ext-apps";

type Kind = "system" | "mesh" | "apps";
type Envelope = { kind?: Kind; data?: unknown };
type ToolResult = { structuredContent?: unknown; content?: Array<{ type: string; text?: string }>; isError?: boolean };

const client = new App({ name: "SynthAi2 MCP Control Center", version: "1.0.0" });
const results = document.getElementById("results") as HTMLElement;
const notice = document.getElementById("notice") as HTMLElement;
const connection = document.getElementById("connection") as HTMLElement;
const limitInput = document.getElementById("limit") as HTMLInputElement;
const limitControl = document.getElementById("limit-control") as HTMLElement;
const buttons = [...document.querySelectorAll<HTMLButtonElement>("[data-kind]")];
let selected: Kind = "system";
let hasResult = false;

const toolName: Record<Kind, string> = {
  system: "synthia_system_overview",
  mesh: "synthia_mesh_events",
  apps: "synthia_mounted_apps",
};

function setKind(kind: Kind): void {
  selected = kind;
  for (const button of buttons) {
    button.setAttribute("aria-pressed", String(button.dataset.kind === kind));
  }
  limitControl.hidden = kind !== "mesh";
}

function card(title: string, description: string): HTMLElement {
  const article = document.createElement("article");
  const heading = document.createElement("h2");
  const body = document.createElement("p");
  heading.textContent = title;
  body.textContent = description;
  article.append(heading, body);
  return article;
}

function renderCards(kind: Kind, value: unknown): void {
  results.replaceChildren();
  if (!value || typeof value !== "object") {
    results.append(card("No data", "The server returned no structured data."));
    return;
  }
  const data = value as Record<string, unknown>;
  if (kind === "system") {
    for (const [name, info] of Object.entries(data)) {
      results.append(card(name, typeof info === "object"
        ? JSON.stringify(info, null, 2) : String(info)));
    }
  } else {
    const records = data[kind === "mesh" ? "events" : "apps"];
    if (!Array.isArray(records) || records.length === 0) {
      results.append(card("Nothing recorded", kind === "mesh"
        ? "No recent events found." : "No locally mounted apps found."));
      return;
    }
    for (const record of records) {
      const item = record as Record<string, unknown>;
      if (kind === "mesh") {
        results.append(card(
          String(item.type || "Event"),
          [item.at, item.topic, item.source].filter(Boolean).join(" · "),
        ));
      } else {
        results.append(card(
          String(item.name || item.id || "App"),
          [item.status, item.createdAt].filter(Boolean).join(" · "),
        ));
      }
    }
  }
}

function render(result: ToolResult): void {
  if (result.isError) {
    notice.textContent = "Server returned an error.";
    return;
  }
  const structured = result.structuredContent as Envelope | undefined;
  let envelope: Envelope | undefined = structured && structured.kind ? structured : undefined;
  if (!envelope) {
    const text = result.content?.find((entry) => entry.type === "text")?.text;
    try {
      envelope = text ? { kind: selected, data: JSON.parse(text) } : undefined;
    } catch {
      notice.textContent = "The server returned text that was not JSON.";
      return;
    }
  }
  if (!envelope?.kind) return;
  hasResult = true;
  setKind(envelope.kind);
  renderCards(envelope.kind, envelope.data);
  notice.textContent = "Read-only view · data from SynthAi2";
}

async function refresh(kind: Kind): Promise<void> {
  setKind(kind);
  notice.textContent = "Loading " + kind + "…";
  try {
    const argumentsValue = kind === "mesh"
      ? { limit: Math.max(1, Math.min(100, Number(limitInput.value) || 30)) }
      : {};
    const reply = await client.callServerTool({
      name: toolName[kind],
      arguments: argumentsValue,
    });
    render(reply);
  } catch (error) {
    notice.textContent = error instanceof Error ? error.message : "MCP call failed";
  }
}

client.ontoolresult = render;
for (const button of buttons) {
  button.addEventListener("click", () => void refresh(button.dataset.kind as Kind));
}
document.getElementById("refresh")?.addEventListener("click", () => void refresh(selected));

void client.connect().then(() => {
  connection.textContent = "MCP connected";
  if (!hasResult) void refresh(selected);
}).catch((error) => {
  connection.textContent = "Not connected";
  notice.textContent = error instanceof Error ? error.message : "Could not connect to the MCP host";
});
