import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Upload, ArrowLeft, FileArchive, File, Folder } from "lucide-react";
import { useLocation } from "wouter";
import JSZip from "jszip";
import { useToast } from "@/hooks/use-toast";

interface ZipEntry {
  name: string;
  isFolder: boolean;
  content?: string;
}

export function PlayerPanel() {
  const [, setLocation] = useLocation();
  const [zipContents, setZipContents] = useState<ZipEntry[]>([]);
  const [selectedFile, setSelectedFile] = useState<ZipEntry | null>(null);
  const [zipName, setZipName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.zip')) {
      toast({
        title: "Invalid file",
        description: "Please upload a .zip file",
        variant: "destructive"
      });
      return;
    }

    try {
      const zip = new JSZip();
      const contents = await zip.loadAsync(file);
      const entries: ZipEntry[] = [];

      for (const [path, zipEntry] of Object.entries(contents.files)) {
        if (zipEntry.dir) {
          entries.push({ name: path, isFolder: true });
        } else {
          const content = await zipEntry.async('text');
          entries.push({ name: path, isFolder: false, content });
        }
      }

      setZipContents(entries);
      setZipName(file.name);
      toast({
        title: "Success!",
        description: `Loaded ${entries.length} items from ${file.name}`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to read zip file",
        variant: "destructive"
      });
      console.error('Zip reading error:', error);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileClick = (entry: ZipEntry) => {
    if (!entry.isFolder) {
      setSelectedFile(entry);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b p-4 flex items-center gap-2">
        <Button
          data-testid="button-back-to-dashboard"
          variant="ghost"
          size="icon"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Play className="h-5 w-5 text-lavender" />
        <h2 className="text-lg font-semibold">YOU–N–I–Versal Player</h2>
      </header>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-lavender mb-2">Creative Bundle Player</h1>
          <p className="text-muted-foreground">
            Upload and explore zipped creative universes
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".zip"
          onChange={handleFileUpload}
          className="hidden"
          data-testid="input-zip-file"
        />

        {zipContents.length === 0 ? (
          <div className="border-2 border-dashed border-lavender/30 rounded-lg p-12 text-center bg-card">
            <FileArchive className="h-16 w-16 mx-auto mb-4 text-lavender/40" />
            <h3 className="text-lg font-semibold mb-2">Drop a .zip file to play</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Or click below to browse your files
            </p>
            <Button
              data-testid="button-upload-zip"
              className="bg-lavender hover:bg-lavender-hover"
              onClick={handleUploadClick}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Zip Bundle
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="border rounded-lg bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileArchive className="h-4 w-4 text-lavender" />
                  {zipName}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUploadClick}
                >
                  Load New
                </Button>
              </div>
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {zipContents.map((entry, idx) => (
                  <div
                    key={idx}
                    data-testid={`zip-entry-${idx}`}
                    onClick={() => handleFileClick(entry)}
                    className={`flex items-center gap-2 p-2 rounded hover:bg-accent cursor-pointer text-sm ${
                      selectedFile?.name === entry.name ? 'bg-lavender/10 border border-lavender/30' : ''
                    }`}
                  >
                    {entry.isFolder ? (
                      <Folder className="h-4 w-4 text-lavender/60" />
                    ) : (
                      <File className="h-4 w-4 text-lavender" />
                    )}
                    <span className="font-mono text-xs truncate">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border rounded-lg bg-card p-4">
              <h3 className="font-semibold mb-4">Preview</h3>
              {selectedFile ? (
                <div>
                  <div className="mb-2 text-sm text-muted-foreground font-mono">
                    {selectedFile.name}
                  </div>
                  <pre className="bg-muted p-4 rounded text-xs overflow-x-auto max-h-[500px] overflow-y-auto">
                    {selectedFile.content || 'No content'}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <File className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">Select a file to preview</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 p-6 border rounded-lg bg-lavender/5 border-lavender/20">
          <h3 className="font-semibold mb-2 text-lavender">What is a Creative Bundle?</h3>
          <p className="text-sm text-muted-foreground">
            Creative bundles are .zip files containing complete projects, games, or interactive experiences.
            The YOU–N–I–Versal Player extracts and displays their contents in a safe environment.
          </p>
        </div>
      </div>
    </div>
  );
}
