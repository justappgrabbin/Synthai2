import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FolderTree, Code2, Globe, Play, Save, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export function DeveloperPanel() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState(`// Welcome to the YOU–N–I–VERSE IDE
// Your creative coding environment

function hello() {
  console.log("Hello from the Indyverse!");
  return "✨ Start creating ✨";
}

hello();`);

  const handleRunCode = () => {
    console.log('Running code:', code);
    alert('Code execution simulated! Check console.');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            data-testid="button-back-to-dashboard"
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Code2 className="h-5 w-5 text-lavender" />
          <h2 className="text-lg font-semibold">IDE</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-testid="button-save-code"
            variant="outline"
            size="sm"
            onClick={() => console.log('Saving code...')}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            data-testid="button-run-code"
            size="sm"
            className="bg-lavender hover:bg-lavender-hover"
            onClick={handleRunCode}
          >
            <Play className="h-4 w-4 mr-2" />
            Run
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r p-4 space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <FolderTree className="h-4 w-4 text-lavender" />
            <h3 className="font-medium text-sm">Files</h3>
          </div>
          <FileTreeItem name="src" isFolder />
          <FileTreeItem name="main.js" indent />
          <FileTreeItem name="App.jsx" indent />
          <FileTreeItem name="components" isFolder indent />
          <FileTreeItem name="package.json" />
          <FileTreeItem name="README.md" />
        </aside>

        <div className="flex-1 flex flex-col">
          <div className="border-b p-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Code2 className="h-3 w-3" />
            <span>main.js</span>
          </div>
          <Textarea
            data-testid="textarea-code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 font-mono text-sm resize-none border-0 focus-visible:ring-0 rounded-none"
            placeholder="Start coding..."
          />
        </div>

        <aside className="w-96 border-l flex flex-col">
          <div className="border-b p-2 flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-lavender" />
            <span className="font-medium">Preview</span>
          </div>
          <div className="flex-1 bg-muted/20 flex items-center justify-center p-8 text-center">
            <div className="text-muted-foreground">
              <Globe className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-sm">Preview will appear here</p>
              <p className="text-xs mt-2">Click "Run" to execute code</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function FileTreeItem({ name, isFolder, indent }: { name: string; isFolder?: boolean; indent?: boolean }) {
  return (
    <div
      className={`text-sm py-1 px-2 rounded hover:bg-accent cursor-pointer ${indent ? 'ml-4' : ''}`}
      onClick={() => console.log('Opening file:', name)}
    >
      <span className="font-mono">{isFolder ? '📁' : '📄'} {name}</span>
    </div>
  );
}
