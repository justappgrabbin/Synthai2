import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Terminal as TerminalIcon, Zap } from "lucide-react";

interface TerminalLine {
  type: "input" | "output" | "error";
  content: string;
  timestamp: Date;
}

interface TerminalProps {
  onClose?: () => void;
}

const QUICK_COMMANDS = [
  { label: "Help", cmd: "help", icon: "❓" },
  { label: "Clear", cmd: "clear", icon: "🧹" },
  { label: "Date", cmd: "date", icon: "📅" },
  { label: "PWD", cmd: "pwd", icon: "📂" },
  { label: "List Files", cmd: "ls", icon: "📋" },
];

export function Terminal({ onClose }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      type: "output",
      content: "YOU–N–I–VERSE Terminal v1.0.0",
      timestamp: new Date()
    },
    {
      type: "output",
      content: "Type commands below. Try: help, clear, echo <message>",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const executeCommand = async (cmd: string) => {
    const trimmedCmd = cmd.trim();
    if (!trimmedCmd) return;

    // Add input to history
    setLines(prev => [...prev, {
      type: "input",
      content: `$ ${trimmedCmd}`,
      timestamp: new Date()
    }]);

    setCommandHistory(prev => [...prev, trimmedCmd]);
    setHistoryIndex(-1);

    // Handle built-in commands
    const parts = trimmedCmd.split(" ");
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (command) {
      case "help":
        setLines(prev => [...prev, {
          type: "output",
          content: [
            "Available commands:",
            "  help          - Show this help message",
            "  clear         - Clear terminal",
            "  echo <text>   - Print text to terminal",
            "  date          - Show current date/time",
            "  pwd           - Print working directory",
            "  ls            - List files (coming soon)",
            "",
            "More commands coming soon!"
          ].join("\n"),
          timestamp: new Date()
        }]);
        break;

      case "clear":
        setLines([]);
        break;

      case "echo":
        setLines(prev => [...prev, {
          type: "output",
          content: args.join(" "),
          timestamp: new Date()
        }]);
        break;

      case "date":
        setLines(prev => [...prev, {
          type: "output",
          content: new Date().toString(),
          timestamp: new Date()
        }]);
        break;

      case "pwd":
        setLines(prev => [...prev, {
          type: "output",
          content: "/workspace",
          timestamp: new Date()
        }]);
        break;

      case "ls":
        setLines(prev => [...prev, {
          type: "output",
          content: "File listing coming soon! Use the file explorer for now.",
          timestamp: new Date()
        }]);
        break;

      default:
        setLines(prev => [...prev, {
          type: "error",
          content: `Command not found: ${command}\nType 'help' for available commands`,
          timestamp: new Date()
        }]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      executeCommand(input);
      setInput("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 
          ? commandHistory.length - 1 
          : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex !== -1) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setInput("");
        } else {
          setHistoryIndex(newIndex);
          setInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const runQuickCommand = (cmd: string) => {
    setInput(cmd);
    executeCommand(cmd);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full bg-black/95 text-green-400 rounded-lg overflow-hidden border border-green-500/20">
      <div className="flex items-center justify-between px-3 py-2 bg-green-500/10 border-b border-green-500/20">
        <div className="flex items-center gap-2">
          <TerminalIcon className="h-4 w-4" />
          <span className="text-sm font-mono font-semibold">Terminal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-green-400/60" />
            <span className="text-xs text-green-400/60">Quick Commands</span>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-6 w-6 hover:bg-green-500/20"
              data-testid="button-close-terminal"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      <div className="px-3 py-2 bg-green-500/5 border-b border-green-500/20 flex gap-2 flex-wrap">
        {QUICK_COMMANDS.map((quick) => (
          <Badge
            key={quick.cmd}
            variant="outline"
            className="cursor-pointer hover:bg-green-500/20 border-green-500/30 text-green-400 touch-manipulation text-xs"
            onClick={() => runQuickCommand(quick.cmd)}
            data-testid={`button-quick-${quick.cmd}`}
          >
            <span className="mr-1">{quick.icon}</span>
            {quick.label}
          </Badge>
        ))}
      </div>

      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        <div className="font-mono text-sm space-y-1">
          {lines.map((line, idx) => (
            <div
              key={idx}
              className={`whitespace-pre-wrap ${
                line.type === "input"
                  ? "text-green-400 font-semibold"
                  : line.type === "error"
                  ? "text-red-400"
                  : "text-green-300/80"
              }`}
            >
              {line.content}
            </div>
          ))}
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-3 border-t border-green-500/20">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono text-sm font-semibold">$</span>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            className="flex-1 bg-transparent border-none text-green-400 font-mono text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-green-500/40"
            autoFocus
            data-testid="input-terminal-command"
          />
        </div>
      </form>
    </div>
  );
}
