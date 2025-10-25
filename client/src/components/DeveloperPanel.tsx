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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
      { name: "PWA Manifest", code: `<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#9b87f5">
<link rel="apple-touch-icon" href="icon-192.png">` },
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
}` },
      { name: "Mobile First", code: `/* Mobile styles (default) */
.container {
  padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: 2rem;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .container {
    padding: 3rem;
  }
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
      { name: "Local Storage", code: `// Save data
localStorage.setItem('key', JSON.stringify({ data: 'value' }));

// Load data
const data = JSON.parse(localStorage.getItem('key'));

// Remove data
localStorage.removeItem('key');` },
      { name: "Canvas Setup", code: `const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Your drawing code here
  requestAnimationFrame(draw);
}

draw();` }
    ],
    pwa: [
      { name: "PWA Manifest.json", code: `{
  "name": "My App",
  "short_name": "App",
  "description": "My awesome app",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#9b87f5",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}` },
      { name: "Service Worker", code: `// Register service worker for offline support
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(reg => console.log('Service Worker registered:', reg))
    .catch(err => console.error('Service Worker error:', err));
}` },
      { name: "APK Export Setup", code: `// Instructions to convert your web app to APK:
// 1. Add manifest.json (use PWA Manifest snippet)
// 2. Add service worker for offline support
// 3. Use tools like:
//    - PWABuilder.com (easiest - just paste your URL)
//    - Apache Cordova
//    - Capacitor by Ionic
// 4. Test as PWA first: chrome://flags enable "Desktop PWAs"

// Add to home screen prompt:
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Show your install button
  document.getElementById('installBtn').style.display = 'block';
});

document.getElementById('installBtn').addEventListener('click', async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log('Install outcome:', outcome);
    deferredPrompt = null;
  }
});` },
      { name: "Install Button HTML", code: `<button id="installBtn" style="display: none;">
  Install App
</button>` }
    ],
    utilities: [
      { name: "Debounce Function", code: `// Delay function execution until user stops typing
function debounce(func, delay = 300) {
  let timeoutId;
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Usage:
const searchInput = document.querySelector('#search');
searchInput.addEventListener('input', debounce((e) => {
  console.log('Searching for:', e.target.value);
}, 300));` },
      { name: "Throttle Function", code: `// Limit function execution rate
function throttle(func, limit = 100) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Usage: Limit scroll events
window.addEventListener('scroll', throttle(() => {
  console.log('Scrolled!');
}, 100));` },
      { name: "Copy to Clipboard", code: `async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log('Copied to clipboard!');
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

// Usage:
document.querySelector('.copy-btn').addEventListener('click', () => {
  copyToClipboard('Text to copy');
});` },
      { name: "Dark Mode Toggle", code: `// Dark mode with localStorage persistence
function toggleDarkMode() {
  document.documentElement.classList.toggle('dark');
  const isDark = document.documentElement.classList.contains('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

// Load saved theme on page load
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
}

// Usage:
document.querySelector('#theme-toggle').addEventListener('click', toggleDarkMode);` },
      { name: "UUID Generator", code: `// Generate unique IDs
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Usage:
const uniqueId = generateUUID();
console.log(uniqueId); // e.g., "a1b2c3d4-e5f6-4g7h-8i9j-0k1l2m3n4o5p"` }
    ],
    forms: [
      { name: "Email Validation", code: `function isValidEmail(email) {
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email);
}

// Usage:
const emailInput = document.querySelector('#email');
emailInput.addEventListener('blur', (e) => {
  if (!isValidEmail(e.target.value)) {
    alert('Please enter a valid email');
  }
});` },
      { name: "Password Strength", code: `function getPasswordStrength(password) {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\\d/.test(password)) strength++;
  if (/[^a-zA-Z\\d]/.test(password)) strength++;
  
  const levels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  return { score: strength, level: levels[strength] || 'Weak' };
}

// Usage:
const result = getPasswordStrength('MyP@ssw0rd!');
console.log(result); // { score: 5, level: 'Very Strong' }` },
      { name: "File Upload Preview", code: `function previewImage(input, previewElement) {
  const file = input.files[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      previewElement.src = e.target.result;
      previewElement.style.display = 'block';
    };
    reader.readAsDataURL(file);
  }
}

// Usage:
document.querySelector('#file-input').addEventListener('change', (e) => {
  const preview = document.querySelector('#preview-img');
  previewImage(e.target, preview);
});` },
      { name: "Form Data to JSON", code: `function formToJSON(formElement) {
  const formData = new FormData(formElement);
  const json = {};
  for (let [key, value] of formData.entries()) {
    json[key] = value;
  }
  return json;
}

// Usage:
document.querySelector('form').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = formToJSON(e.target);
  console.log(data);
});` }
    ],
    api: [
      { name: "Async Error Handler", code: `async function apiRequest(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Usage:
apiRequest('https://api.example.com/data')
  .then(data => console.log(data))
  .catch(err => alert('Failed to load data'));` },
      { name: "Retry Logic", code: `async function fetchWithRetry(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

// Usage:
fetchWithRetry('https://api.example.com/data', {}, 3)
  .then(data => console.log(data))
  .catch(err => console.error('Failed after 3 retries'));` },
      { name: "WebSocket Setup", code: `class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.reconnectInterval = 5000;
  }

  connect() {
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => console.log('WebSocket connected');
    this.ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      setTimeout(() => this.connect(), this.reconnectInterval);
    };
    this.ws.onmessage = (event) => this.handleMessage(JSON.parse(event.data));
    this.ws.onerror = (error) => console.error('WebSocket error:', error);
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleMessage(data) {
    console.log('Received:', data);
  }
}

// Usage:
const client = new WebSocketClient('wss://example.com/socket');
client.connect();` },
      { name: "POST with JSON", code: `async function postJSON(url, data) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  return await response.json();
}

// Usage:
postJSON('https://api.example.com/users', {
  name: 'John Doe',
  email: 'john@example.com'
})
.then(result => console.log('Created:', result))
.catch(error => console.error('Error:', error));` }
    ],
    ui: [
      { name: "Toast Notification", code: `function showToast(message, duration = 3000, type = 'info') {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.cssText = \`
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 1rem 1.5rem;
    background: \${type === 'error' ? '#ef4444' : '#9b87f5'};
    color: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 9999;
    animation: slideIn 0.3s ease;
  \`;
  
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Usage:
showToast('Success!', 3000, 'success');
showToast('Error occurred', 3000, 'error');` },
      { name: "Modal Dialog", code: `function createModal(content, onClose) {
  const overlay = document.createElement('div');
  overlay.style.cssText = \`
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  \`;
  
  const modal = document.createElement('div');
  modal.style.cssText = \`
    background: white;
    padding: 2rem;
    border-radius: 0.5rem;
    max-width: 500px;
    width: 90%;
  \`;
  modal.innerHTML = content;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.onclick = () => {
    overlay.remove();
    if (onClose) onClose();
  };
  
  modal.appendChild(closeBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  
  overlay.onclick = (e) => {
    if (e.target === overlay) overlay.remove();
  };
}

// Usage:
createModal('<h2>Welcome!</h2><p>This is a modal.</p>');` },
      { name: "Smooth Scroll", code: `function smoothScrollTo(elementId, offset = 0) {
  const element = document.getElementById(elementId);
  if (element) {
    const targetPosition = element.offsetTop - offset;
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }
}

// Usage:
document.querySelector('.scroll-btn').addEventListener('click', () => {
  smoothScrollTo('section-2', 80);
});` },
      { name: "Lazy Load Images", code: `// Lazy load images when they enter viewport
function lazyLoadImages() {
  const images = document.querySelectorAll('img[data-src]');
  
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });
  
  images.forEach(img => imageObserver.observe(img));
}

// Usage:
// HTML: <img data-src="image.jpg" alt="Lazy loaded">
lazyLoadImages();` },
      { name: "Infinite Scroll", code: `function setupInfiniteScroll(loadMoreCallback) {
  let loading = false;
  
  window.addEventListener('scroll', () => {
    if (loading) return;
    
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollTop + windowHeight >= documentHeight - 100) {
      loading = true;
      loadMoreCallback().then(() => {
        loading = false;
      });
    }
  });
}

// Usage:
setupInfiniteScroll(async () => {
  console.log('Loading more items...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  // Add your items here
});` }
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
              <DropdownMenuLabel>Code Snippets</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>HTML</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="max-h-[400px] overflow-y-auto">
                  {codeSnippets.html.map((snippet, idx) => (
                    <DropdownMenuItem
                      key={`html-${idx}`}
                      onClick={() => insertSnippet(snippet.code)}
                      data-testid={`snippet-html-${idx}`}
                    >
                      {snippet.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>CSS</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {codeSnippets.css.map((snippet, idx) => (
                    <DropdownMenuItem
                      key={`css-${idx}`}
                      onClick={() => insertSnippet(snippet.code)}
                      data-testid={`snippet-css-${idx}`}
                    >
                      {snippet.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>JavaScript</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {codeSnippets.javascript.map((snippet, idx) => (
                    <DropdownMenuItem
                      key={`js-${idx}`}
                      onClick={() => insertSnippet(snippet.code)}
                      data-testid={`snippet-js-${idx}`}
                    >
                      {snippet.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-lavender">
                  PWA / APK Builder
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {codeSnippets.pwa.map((snippet, idx) => (
                    <DropdownMenuItem
                      key={`pwa-${idx}`}
                      onClick={() => insertSnippet(snippet.code)}
                      data-testid={`snippet-pwa-${idx}`}
                    >
                      {snippet.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Utilities</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {codeSnippets.utilities.map((snippet, idx) => (
                    <DropdownMenuItem
                      key={`util-${idx}`}
                      onClick={() => insertSnippet(snippet.code)}
                      data-testid={`snippet-util-${idx}`}
                    >
                      {snippet.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Forms</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {codeSnippets.forms.map((snippet, idx) => (
                    <DropdownMenuItem
                      key={`form-${idx}`}
                      onClick={() => insertSnippet(snippet.code)}
                      data-testid={`snippet-form-${idx}`}
                    >
                      {snippet.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>API / Network</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {codeSnippets.api.map((snippet, idx) => (
                    <DropdownMenuItem
                      key={`api-${idx}`}
                      onClick={() => insertSnippet(snippet.code)}
                      data-testid={`snippet-api-${idx}`}
                    >
                      {snippet.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>UI Components</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {codeSnippets.ui.map((snippet, idx) => (
                    <DropdownMenuItem
                      key={`ui-${idx}`}
                      onClick={() => insertSnippet(snippet.code)}
                      data-testid={`snippet-ui-${idx}`}
                    >
                      {snippet.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
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
