import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { FolderTree, Code2, Globe, Play, Save, Plus, Trash2 } from "lucide-react";
import { FileSystem, type FileNode } from "@/lib/fileSystem";
import { useToast } from "@/hooks/use-toast";
import { TopNav } from "@/components/TopNav";

export function DeveloperPanel() {
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentFile, setCurrentFile] = useState<FileNode | null>(null);
  const [code, setCode] = useState("");
  const [previewContent, setPreviewContent] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const [showNewFileInput, setShowNewFileInput] = useState(false);
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

  return (
    <div className="h-screen flex flex-col bg-background">
      <TopNav />
      <header className="border-b p-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Code2 className="h-5 w-5 text-lavender" />
          <h2 className="text-lg font-semibold">Code Editor</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-testid="button-save-code"
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={!currentFile}
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            data-testid="button-run-code"
            size="sm"
            className="bg-lavender hover:bg-lavender-hover"
            onClick={handleRun}
          >
            <Play className="h-4 w-4 mr-2" />
            Run
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r p-4 space-y-2 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-lavender" />
              <h3 className="font-medium text-sm">Files</h3>
            </div>
            <Button
              data-testid="button-new-file"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setShowNewFileInput(!showNewFileInput)}
            >
              <Plus className="h-3 w-3" />
            </Button>
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

        <div className="flex-1 flex flex-col">
          <div className="border-b p-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Code2 className="h-3 w-3" />
            <span>{currentFile?.name || 'No file selected'}</span>
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

        <aside className="w-96 border-l flex flex-col">
          <div className="border-b p-2 flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4 text-lavender" />
            <span className="font-medium">Preview</span>
          </div>
          <div className="flex-1 bg-white overflow-auto">
            {previewContent ? (
              <iframe
                srcDoc={previewContent}
                className="w-full h-full border-0"
                sandbox="allow-scripts"
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
