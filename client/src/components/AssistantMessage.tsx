import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { Copy, Check, FileCode, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { FileSystem } from "@/lib/fileSystem";
import { useToast } from "@/hooks/use-toast";

interface AssistantMessageProps {
  content: string;
  thinking?: string;
  messageIndex: number;
}

export function AssistantMessage({ content, thinking, messageIndex }: AssistantMessageProps) {
  const [copiedBlock, setCopiedBlock] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, []);

  const copyToClipboard = (text: string, blockId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBlock(blockId);
    setTimeout(() => setCopiedBlock(null), 2000);
  };

  const sendToIDE = (code: string, language: string) => {
    const fileName = `guard-dog-${Date.now()}.${getFileExtension(language)}`;
    FileSystem.createFile(fileName, code);
    toast({
      title: "Code Sent to IDE",
      description: `Created ${fileName}`
    });
  };

  const getFileExtension = (lang: string): string => {
    const extMap: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      html: "html",
      css: "css",
      json: "json",
      jsx: "jsx",
      tsx: "tsx",
      bash: "sh",
      shell: "sh",
      sql: "sql",
      yaml: "yaml",
      markdown: "md"
    };
    return extMap[lang] || "txt";
  };

  return (
    <div className="space-y-2">
      {thinking && (
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs gap-1 px-2 mb-1"
              data-testid={`button-toggle-thinking-${messageIndex}`}
            >
              <Brain className="h-3 w-3" />
              <span className="text-muted-foreground">View thinking</span>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="bg-muted/50 border border-border rounded-md px-3 py-2 text-xs text-muted-foreground mb-2">
            {thinking}
          </CollapsibleContent>
        </Collapsible>
      )}
      
      <div className="bg-muted rounded-lg px-4 py-3 text-sm prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, className, children, ...props }: any) {
              const inline = props.inline || !className;
              const match = /language-(\w+)/.exec(className || "");
              const language = match ? match[1] : "";
              const code = String(children).replace(/\n$/, "");
              const blockId = `code-${messageIndex}-${language}-${code.slice(0, 20)}`;

              return !inline && match ? (
                <div className="relative group my-2">
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 bg-background/80 backdrop-blur-sm"
                      onClick={() => copyToClipboard(code, blockId)}
                      data-testid={`button-copy-code-${blockId}`}
                    >
                      {copiedBlock === blockId ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 bg-background/80 backdrop-blur-sm"
                      onClick={() => sendToIDE(code, language)}
                      data-testid={`button-send-to-ide-${blockId}`}
                    >
                      <FileCode className="h-3 w-3" />
                    </Button>
                  </div>
                  <SyntaxHighlighter
                    language={language}
                    style={isDark ? oneDark : oneLight}
                    customStyle={{
                      margin: 0,
                      borderRadius: "0.375rem",
                      fontSize: "0.813rem",
                      padding: "0.75rem"
                    }}
                    {...props}
                  >
                    {code}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className="bg-muted-foreground/10 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                  {children}
                </code>
              );
            },
            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
            ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
            li: ({ children }) => <li className="text-sm">{children}</li>,
            h1: ({ children }) => <h1 className="text-lg font-bold mb-2 mt-3">{children}</h1>,
            h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-3">{children}</h2>,
            h3: ({ children }) => <h3 className="text-sm font-bold mb-1 mt-2">{children}</h3>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-primary pl-3 italic my-2 text-muted-foreground">
                {children}
              </blockquote>
            ),
            a: ({ href, children }) => (
              <a href={href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
