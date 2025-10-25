import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Upload, ArrowLeft, FileArchive } from "lucide-react";
import { useLocation } from "wouter";

export function PlayerPanel() {
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileUpload = () => {
    console.log('File upload clicked');
    alert('Zip file upload will be connected to the YOU–N–I–Versal Player backend');
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

      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-lavender mb-2">Creative Bundle Player</h1>
          <p className="text-muted-foreground">
            Upload and play zipped creative universes
          </p>
        </div>

        <div className="border-2 border-dashed border-lavender/30 rounded-lg p-12 text-center bg-card">
          <FileArchive className="h-16 w-16 mx-auto mb-4 text-lavender/40" />
          <h3 className="text-lg font-semibold mb-2">Drop a .zip file to play</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Or click below to browse your files
          </p>
          <Button
            data-testid="button-upload-zip"
            className="bg-lavender hover:bg-lavender-hover"
            onClick={handleFileUpload}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Zip Bundle
          </Button>
        </div>

        {selectedFile && (
          <div className="mt-8 p-6 border rounded-lg bg-card">
            <h3 className="font-semibold mb-2">Now Playing</h3>
            <p className="text-sm text-muted-foreground">{selectedFile}</p>
          </div>
        )}

        <div className="mt-8 p-6 border rounded-lg bg-lavender/5 border-lavender/20">
          <h3 className="font-semibold mb-2 text-lavender">What is a Creative Bundle?</h3>
          <p className="text-sm text-muted-foreground">
            Creative bundles are .zip files containing complete projects, games, or interactive experiences.
            The YOU–N–I–Versal Player extracts and renders them in a safe, sandboxed environment.
          </p>
        </div>
      </div>
    </div>
  );
}
