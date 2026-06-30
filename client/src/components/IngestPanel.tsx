import { useCallback, useRef, useState, type DragEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Database, FileText, Image, Loader2, Package, Upload, XCircle } from "lucide-react";
import { publishMeshEvent } from "@/lib/meshEvents";
import { synthiaApi } from "@/lib/synthiaApi";

type ParsedFile = {
  name: string;
  size: number;
  type: string;
  language: string;
  domains: string[];
  summary: string;
  status: "pending" | "parsing" | "done" | "error";
  error?: string;
};

const STORAGE_KEY = "synthia.ingestedFiles";

const EXT_TYPE: Record<string, string> = {
  py: "code",
  js: "code",
  ts: "code",
  tsx: "code",
  jsx: "code",
  json: "data",
  yaml: "data",
  yml: "data",
  csv: "data",
  sql: "data",
  html: "markup",
  md: "doc",
  txt: "doc",
  pdf: "doc",
  png: "image",
  jpg: "image",
  jpeg: "image",
  webp: "image",
  zip: "archive",
};

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  astrology: ["natal", "transit", "planet", "zodiac", "sidereal", "draconic", "tropical", "ephemeris"],
  human_design: ["gate", "channel", "bodygraph", "authority", "strategy", "generator", "projector"],
  infrastructure: ["docker", "supabase", "server", "api", "deploy", "compose"],
  ui_component: ["react", "component", "tsx", "jsx", "tailwind"],
  agent_logic: ["agent", "llm", "morph", "orchestrat", "mesh", "mcp"],
  game: ["godot", "scene", "sprite", "player", "physics", "game"],
};

const TYPE_ICONS = {
  code: Code2,
  data: Database,
  image: Image,
  archive: Package,
  doc: FileText,
  markup: FileText,
  unknown: FileText,
};

function classifyDomain(name: string, content: string) {
  const text = `${name} ${content.slice(0, 4000)}`.toLowerCase();
  const domains = Object.entries(DOMAIN_KEYWORDS)
    .filter(([, keywords]) => keywords.some((keyword) => text.includes(keyword)))
    .map(([domain]) => domain);

  return domains.length ? domains : ["general"];
}

function summarize(name: string, content: string, language: string) {
  if (!content) return `${language} file queued for backend analysis`;

  const parts = [`${content.split("\n").length} lines`, language];
  if (/^(import|from|require)/m.test(content)) parts.push("imports");
  if (/(function|def |const \w+ =|class\s+\w+)/i.test(content)) parts.push("code structures");
  if (/<[a-z][\s\S]*>/i.test(content)) parts.push("markup");
  if (/"[^"]+"\s*:/i.test(content)) parts.push("keyed data");
  return parts.join(" - ");
}

async function parseFile(file: File): Promise<Omit<ParsedFile, "status">> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const type = EXT_TYPE[ext] || "unknown";
  const canReadText = !["image", "archive"].includes(type);
  const content = canReadText ? await file.text().catch(() => "") : "";
  const language =
    type === "code" ? (ext === "py" ? "python" : ["ts", "tsx"].includes(ext) ? "typescript" : "javascript") : type;

  return {
    name: file.name,
    size: file.size,
    type,
    language,
    domains: classifyDomain(file.name, content),
    summary: summarize(file.name, content, language),
  };
}

function persist(files: ParsedFile[]) {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const done = files
    .filter((file) => file.status === "done")
    .map((file) => ({ ...file, ingestedAt: new Date().toISOString() }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...existing, ...done].slice(-200)));
}

export function IngestPanel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<ParsedFile[]>([]);

  const process = useCallback(async (rawFiles: File[]) => {
    const offset = files.length;
    setFiles((current) => [
      ...current,
      ...rawFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: "",
        language: "",
        domains: [],
        summary: "",
        status: "pending" as const,
      })),
    ]);

    for (let index = 0; index < rawFiles.length; index += 1) {
      const listIndex = offset + index;
      const rawFile = rawFiles[index];

      setFiles((current) => current.map((file, currentIndex) => (currentIndex === listIndex ? { ...file, status: "parsing" } : file)));

      try {
        const parsed = await parseFile(rawFile);
        setFiles((current) => {
          const updated = current.map((file, currentIndex) =>
            currentIndex === listIndex ? { ...parsed, status: "done" as const } : file,
          );
          persist(updated);
          return updated;
        });

        publishMeshEvent({
          source: "ingest-panel",
          type: "file.ingested",
          topic: parsed.name,
          payload: { domains: parsed.domains, type: parsed.type, size: parsed.size },
        });

        try {
          await synthiaApi.uploadMorph([rawFile], { forceWrapper: true });
        } catch {
          try {
            await synthiaApi.upload([rawFile]);
          } catch {
            // Backend upload routes may still be under construction.
          }
        }
      } catch (error) {
        setFiles((current) =>
          current.map((file, currentIndex) =>
            currentIndex === listIndex ? { ...file, status: "error", error: error instanceof Error ? error.message : String(error) } : file,
          ),
        );
      }
    }
  }, [files.length]);

  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    setDragging(false);
    process(Array.from(event.dataTransfer.files));
  };

  const done = files.filter((file) => file.status === "done").length;
  const pending = files.filter((file) => file.status === "pending" || file.status === "parsing").length;
  const errors = files.filter((file) => file.status === "error").length;

  return (
    <main className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ingest & Mount</h1>
          <p className="mt-2 text-muted-foreground">
            Drop files here to classify them, publish their metadata to the mesh, and hand them to the Synthia backend when it is online.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Universal Intake</CardTitle>
            <CardDescription>Code, docs, data, images, and ZIPs are accepted. Browser analysis runs first; server regeneration follows when routes are ready.</CardDescription>
          </CardHeader>
          <CardContent>
            <button
              className={`flex min-h-56 w-full flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition ${
                dragging ? "border-primary bg-primary/10" : "border-border bg-muted/20"
              }`}
              onClick={() => inputRef.current?.click()}
              onDragLeave={() => setDragging(false)}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDrop={onDrop}
              type="button"
            >
              <input
                ref={inputRef}
                className="hidden"
                multiple
                onChange={(event) => event.target.files && process(Array.from(event.target.files))}
                type="file"
              />
              <Upload className="h-10 w-10 text-primary" />
              <div>
                <p className="font-semibold">{dragging ? "Drop to ingest" : "Drop files or tap to select"}</p>
                <p className="mt-1 text-sm text-muted-foreground">Originals stay preserved; generated versions can mount into the app tray.</p>
              </div>
            </button>
          </CardContent>
        </Card>

        {files.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{done} ingested</Badge>
            <Badge variant="outline">{pending} pending</Badge>
            {errors > 0 && <Badge variant="destructive">{errors} errors</Badge>}
            <Button className="ml-auto" onClick={() => setFiles([])} size="sm" variant="ghost">
              Clear
            </Button>
          </div>
        )}

        <div className="grid gap-3">
          {files.map((file) => {
            const Icon = TYPE_ICONS[(file.type || "unknown") as keyof typeof TYPE_ICONS] || FileText;
            return (
              <Card key={`${file.name}-${file.size}`}>
                <CardContent className="flex gap-3 p-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {file.status === "parsing" ? <Loader2 className="h-5 w-5 animate-spin" /> : file.status === "error" ? <XCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{file.name}</p>
                      <Badge variant="outline">{file.status}</Badge>
                      {file.domains.map((domain) => (
                        <Badge key={domain} variant="secondary">{domain}</Badge>
                      ))}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{file.error || file.summary || "Waiting to parse"}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
