import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FolderTree, Code2, Globe, Play, Save, Plus, Trash2, X, Menu, Sparkles } from "lucide-react";
import { FileSystem, type FileNode } from "@/lib/fileSystem";
import { useToast } from "@/hooks/use-toast";
import { TopNav } from "@/components/TopNav";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DeveloperPanel() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentFile, setCurrentFile] = useState<FileNode | null>(null);
  const [code, setCode] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [showNewFileInput, setShowNewFileInput] = useState(false);
  const [showFilePanel, setShowFilePanel] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = () => {
    const allFiles = FileSystem.getAllFiles();
    setFiles(allFiles);
    
    if (!currentFile && allFiles.length > 0) {
      const firstFile = findFirstFile(allFiles);
      if (firstFile) {
        openFile(firstFile);
      }
    }
  };

  const findFirstFile = (nodes: FileNode[]): FileNode | null => {
    for (const node of nodes) {
      if (node.type === 'file') return node;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  };

  const openFile = (file: FileNode) => {
    if (file.type === 'file') {
      setCurrentFile(file);
      setCode(file.content || '');
      setShowFilePanel(false);
    }
  };

  const handleSave = () => {
    if (currentFile) {
      FileSystem.saveFile(currentFile.path, code);
      toast({
        title: "Saved",
        description: `${currentFile.name} saved successfully`
      });
      loadFiles();
    }
  };

  const handleRun = () => {
    const htmlFile = FileSystem.findFile('index.html');
    if (!htmlFile || !htmlFile.content) {
      toast({
        title: "No HTML file",
        description: "Create an index.html file to preview",
        variant: "destructive"
      });
      return;
    }

    let html = htmlFile.content;
    
    html = html.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)">/g, (match, href) => {
      const cssFile = FileSystem.findFile(href);
      if (cssFile && cssFile.content) {
        return `<style>${cssFile.content}</style>`;
      }
      return match;
    });
    
    html = html.replace(/<script\s+src="([^"]+)"><\/script>/g, (match, src) => {
      const jsFile = FileSystem.findFile(src);
      if (jsFile && jsFile.content) {
        return `<script>${jsFile.content}</script>`;
      }
      return match;
    });
    
    setPreviewContent(html);
    toast({
      title: "Running",
      description: "Code executed in preview pane"
    });
  };

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    
    FileSystem.createFile('', newFileName);
    setNewFileName('');
    setShowNewFileInput(false);
    loadFiles();
    toast({
      title: "Created",
      description: `${newFileName} created`
    });
  };

  const handleDeleteFile = (file: FileNode) => {
    if (confirm(`Delete ${file.name}?`)) {
      FileSystem.deleteFile(file.path);
      if (currentFile?.path === file.path) {
        setCurrentFile(null);
        setCode('');
      }
      loadFiles();
      toast({
        title: "Deleted",
        description: `${file.name} deleted`
      });
    }
  };

  const insertSnippet = (snippet: string) => {
    if (!currentFile) {
      toast({
        title: "No file selected",
        description: "Open a file first to insert code",
        variant: "destructive"
      });
      return;
    }
    
    setCode((prevCode) => prevCode + '\n' + snippet);
    toast({
      title: "Snippet inserted!",
      description: "Code snippet added to file"
    });
  };

  const codeSnippets = {
    html: [
      { name: "HTML5 Boilerplate", code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  
</body>
</html>` },
      { name: "Button", code: `<button class="btn">Click Me</button>` },
      { name: "Form", code: `<form>
  <input type="text" placeholder="Enter text">
  <button type="submit">Submit</button>
</form>` },
      { name: "Card", code: `<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here.</p>
</div>` }
    ],
    css: [
      { name: "Flexbox Center", code: `.container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}` },
      { name: "Button Styles", code: `.btn {
  padding: 0.75rem 1.5rem;
  background: #9b87f5;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: #8b77e5;
}` },
      { name: "Card Styles", code: `.card {
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}` }
    ],
    javascript: [
      { name: "Event Listener", code: `document.querySelector('.btn').addEventListener('click', function() {
  console.log('Button clicked!');
});` },
      { name: "Fetch API", code: `fetch('https://api.example.com/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));` },
      { name: "Arrow Function", code: `const myFunction = (param) => {
  return param * 2;
};` },
      { name: "Canvas Setup", code: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Your drawing code here
  requestAnimationFrame(draw);
}

draw();` }
    ]
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav />
      <header className="border-b p-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            data-testid="button-toggle-files"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setShowFilePanel(!showFilePanel)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Code2 className="h-5 w-5 text-lavender" />
          <h2 className="text-lg font-semibold hidden sm:block">Code Editor</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-testid="button-save-code"
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!currentFile}
          >
            <Save className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Save</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-testid="button-snippets"
                variant="outline"
                size="sm"
              >
                <Sparkles className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Snippets</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>HTML</DropdownMenuLabel>
              {codeSnippets.html.map((snippet, idx) => (
                <DropdownMenuItem
                  key={`html-${idx}`}
                  onClick={() => insertSnippet(snippet.code)}
                  data-testid={`snippet-html-${idx}`}
                >
                  {snippet.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>CSS</DropdownMenuLabel>
              {codeSnippets.css.map((snippet, idx) => (
                <DropdownMenuItem
                  key={`css-${idx}`}
                  onClick={() => insertSnippet(snippet.code)}
                  data-testid={`snippet-css-${idx}`}
                >
                  {snippet.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel>JavaScript</DropdownMenuLabel>
              {codeSnippets.javascript.map((snippet, idx) => (
                <DropdownMenuItem
                  key={`js-${idx}`}
                  onClick={() => insertSnippet(snippet.code)}
                  data-testid={`snippet-js-${idx}`}
                >
                  {snippet.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            data-testid="button-run-code"
            size="sm"
            className="bg-lavender hover:bg-lavender-hover"
            onClick={handleRun}
          >
            <Play className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Run</span>
          </Button>
          <Button
            data-testid="button-toggle-preview"
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Globe className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Preview</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {showFilePanel && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowFilePanel(false)}
          />
        )}
        
        <aside className={`
          fixed lg:relative lg:block
          w-64 h-full border-r bg-background
          p-4 space-y-2 overflow-y-auto
          z-50 lg:z-auto
          transition-transform duration-300
          ${showFilePanel ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-lavender" />
              <h3 className="font-medium text-sm">Files</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                data-testid="button-new-file"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowNewFileInput(!showNewFileInput)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                data-testid="button-close-files"
                variant="ghost"
                size="icon"
                className="h-6 w-6 lg:hidden"
                onClick={() => setShowFilePanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {showNewFileInput && (
            <div className="flex gap-1 mb-2">
              <Input
                data-testid="input-new-filename"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                placeholder="filename.js"
                className="h-7 text-xs"
                onKeyDown={(e) => e.key === 'Enter' && handleCreateFile()}
              />
              <Button
                data-testid="button-create-file"
                size="sm"
                className="h-7"
                onClick={handleCreateFile}
              >
                Add
              </Button>
            </div>
          )}
          
          {files.map((file, idx) => (
            <FileTreeNode
              key={idx}
              file={file}
              currentPath={currentFile?.path}
              onOpen={openFile}
              onDelete={handleDeleteFile}
            />
          ))}
        </aside>

        <div className={`flex-1 flex flex-col ${showPreview && 'hidden sm:flex'}`}>
          <div className="border-b p-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Code2 className="h-3 w-3" />
            <span className="truncate">{currentFile?.name || 'No file selected'}</span>
          </div>
          <Textarea
            data-testid="textarea-code-editor"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="flex-1 font-mono text-sm resize-none border-0 focus-visible:ring-0 rounded-none"
            placeholder="Start coding..."
            disabled={!currentFile}
          />
        </div>

        <aside className={`
          w-full sm:w-96 border-l flex flex-col
          ${showPreview ? 'block sm:block' : 'hidden lg:flex'}
        `}>
          <div className="border-b p-2 flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-lavender" />
            <span className="font-medium">Preview</span>
          </div>
          <div className="flex-1 bg-white overflow-auto">
            {previewContent ? (
              <iframe
                data-testid="iframe-preview"
                srcDoc={previewContent}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms"
                title="Preview"
              />
            ) : (
              <div className="flex items-center justify-center h-full p-8 text-center bg-muted/20">
                <div className="text-muted-foreground">
                  <Globe className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p className="text-sm">Preview will appear here</p>
                  <p className="text-xs mt-2">Click "Run" to execute code</p>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function FileTreeNode({
  file,
  currentPath,
  onOpen,
  onDelete,
  indent = 0
}: {
  file: FileNode;
  currentPath?: string;
  onOpen: (file: FileNode) => void;
  onDelete: (file: FileNode) => void;
  indent?: number;
}) {
  const [isOpen, setIsOpen] = useState(true);
  const isActive = currentPath === file.path;

  return (
    <div>
      <div
        className={`text-sm py-1 px-2 rounded hover:bg-accent cursor-pointer flex items-center justify-between group ${
          isActive ? 'bg-lavender/10 border border-lavender/30' : ''
        }`}
        style={{ marginLeft: `${indent * 12}px` }}
      >
        <div
          className="flex items-center gap-1 flex-1"
          onClick={() => {
            if (file.type === 'folder') {
              setIsOpen(!isOpen);
            } else {
              onOpen(file);
            }
          }}
        >
          <span className="font-mono text-xs">
            {file.type === 'folder' ? (isOpen ? '📂' : '📁') : '📄'} {file.name}
          </span>
        </div>
        {file.type === 'file' && (
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(file);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {file.type === 'folder' && isOpen && file.children && (
        <div>
          {file.children.map((child, idx) => (
            <FileTreeNode
              key={idx}
              file={child}
              currentPath={currentPath}
              onOpen={onOpen}
              onDelete={onDelete}
              indent={indent + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
