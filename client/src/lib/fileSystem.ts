/**
 * File System Management for IDE
 * Uses localStorage for persistence
 */

export interface FileNode {
  name: string;
  type: 'file' | 'folder';
  path: string;
  content?: string;
  children?: FileNode[];
}

const STORAGE_KEY = 'youniverse_files';

export class FileSystem {
  private static getFiles(): FileNode[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return FileSystem.getDefaultFiles();
    }
    return JSON.parse(stored);
  }

  private static saveFiles(files: FileNode[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
  }

  private static getDefaultFiles(): FileNode[] {
    return [
      {
        name: 'src',
        type: 'folder',
        path: 'src',
        children: [
          {
            name: 'main.js',
            type: 'file',
            path: 'src/main.js',
            content: `// Welcome to YOU–N–I–VERSE Studio
console.log("Hello from the Indyverse!");

function createUniverse() {
  return {
    name: "My Universe",
    stars: 1000,
    planets: 42
  };
}

const myUniverse = createUniverse();
console.log("Created:", myUniverse);`
          },
          {
            name: 'styles.css',
            type: 'file',
            path: 'src/styles.css',
            content: `body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background: linear-gradient(to bottom right, #9b87f5, #7c3aed);
  color: white;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}`
          }
        ]
      },
      {
        name: 'index.html',
        type: 'file',
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Universe</title>
  <link rel="stylesheet" href="src/styles.css">
</head>
<body>
  <div id="app">
    <h1>✨ Welcome to the Indyverse ✨</h1>
  </div>
  <script src="src/main.js"></script>
</body>
</html>`
      },
      {
        name: 'README.md',
        type: 'file',
        path: 'README.md',
        content: `# My YOU–N–I–VERSE Project

Created with YOU–N–I–VERSE Studio - The Indyverse

## Getting Started

Edit files in the src/ folder and see your changes in the preview pane!`
      }
    ];
  }

  static getAllFiles(): FileNode[] {
    return this.getFiles();
  }

  static findFile(path: string): FileNode | undefined {
    const files = this.getFiles();
    
    function search(nodes: FileNode[]): FileNode | undefined {
      for (const node of nodes) {
        if (node.path === path) return node;
        if (node.children) {
          const found = search(node.children);
          if (found) return found;
        }
      }
      return undefined;
    }
    
    return search(files);
  }

  static saveFile(path: string, content: string): void {
    const files = this.getFiles();
    
    function update(nodes: FileNode[]): boolean {
      for (const node of nodes) {
        if (node.path === path && node.type === 'file') {
          node.content = content;
          return true;
        }
        if (node.children && update(node.children)) {
          return true;
        }
      }
      return false;
    }
    
    if (update(files)) {
      this.saveFiles(files);
    }
  }

  static createFile(parentPath: string, name: string): void {
    const files = this.getFiles();
    const path = parentPath ? `${parentPath}/${name}` : name;
    
    function add(nodes: FileNode[]): boolean {
      for (const node of nodes) {
        if (node.path === parentPath && node.type === 'folder' && node.children) {
          node.children.push({
            name,
            type: 'file',
            path,
            content: ''
          });
          return true;
        }
        if (node.children && add(node.children)) {
          return true;
        }
      }
      return false;
    }
    
    if (parentPath === '') {
      files.push({
        name,
        type: 'file',
        path,
        content: ''
      });
      this.saveFiles(files);
    } else if (add(files)) {
      this.saveFiles(files);
    }
  }

  static createFolder(parentPath: string, name: string): void {
    const files = this.getFiles();
    const path = parentPath ? `${parentPath}/${name}` : name;
    
    function add(nodes: FileNode[]): boolean {
      for (const node of nodes) {
        if (node.path === parentPath && node.type === 'folder' && node.children) {
          node.children.push({
            name,
            type: 'folder',
            path,
            children: []
          });
          return true;
        }
        if (node.children && add(node.children)) {
          return true;
        }
      }
      return false;
    }
    
    if (parentPath === '') {
      files.push({
        name,
        type: 'folder',
        path,
        children: []
      });
      this.saveFiles(files);
    } else if (add(files)) {
      this.saveFiles(files);
    }
  }

  static deleteFile(path: string): void {
    const files = this.getFiles();
    
    function remove(nodes: FileNode[]): boolean {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].path === path) {
          nodes.splice(i, 1);
          return true;
        }
        if (nodes[i].children && remove(nodes[i].children!)) {
          return true;
        }
      }
      return false;
    }
    
    if (remove(files)) {
      this.saveFiles(files);
    }
  }

  static resetToDefaults(): void {
    this.saveFiles(this.getDefaultFiles());
  }

  static loadFileTree(files: FileNode[]): void {
    this.saveFiles(files);
  }

  static loadFromZipEntries(zipEntries: Array<{name: string, isFolder: boolean, content?: string}>): void {
    const files: FileNode[] = [];
    const folderMap = new Map<string, FileNode>();

    // Helper function to ensure all parent folders exist
    const ensureFolderExists = (folderPath: string): FileNode => {
      // Remove trailing slash for consistency
      const cleanPath = folderPath.replace(/\/$/, '');
      
      // Check if folder already exists
      if (folderMap.has(cleanPath)) {
        return folderMap.get(cleanPath)!;
      }

      const pathParts = cleanPath.split('/').filter(p => p);
      const folderName = pathParts[pathParts.length - 1];
      
      const folderNode: FileNode = {
        name: folderName,
        type: 'folder',
        path: cleanPath,
        children: []
      };
      
      folderMap.set(cleanPath, folderNode);

      // Add to parent or root
      if (pathParts.length === 1) {
        files.push(folderNode);
      } else {
        const parentPath = pathParts.slice(0, -1).join('/');
        const parent = ensureFolderExists(parentPath);
        if (parent.children) {
          parent.children.push(folderNode);
        }
      }

      return folderNode;
    };

    // Process all entries
    for (const entry of zipEntries) {
      const pathParts = entry.name.split('/').filter(p => p);
      if (pathParts.length === 0) continue;

      if (entry.isFolder) {
        // Explicit folder entry - ensure it exists
        ensureFolderExists(entry.name);
      } else {
        // File entry - ensure all parent folders exist first
        if (pathParts.length > 1) {
          const parentPath = pathParts.slice(0, -1).join('/');
          const parent = ensureFolderExists(parentPath);
          
          const fileNode: FileNode = {
            name: pathParts[pathParts.length - 1],
            type: 'file',
            path: entry.name,
            content: entry.content || ''
          };
          
          if (parent.children) {
            parent.children.push(fileNode);
          }
        } else {
          // Root-level file
          const fileNode: FileNode = {
            name: pathParts[0],
            type: 'file',
            path: entry.name,
            content: entry.content || ''
          };
          files.push(fileNode);
        }
      }
    }

    this.saveFiles(files);
  }
}
