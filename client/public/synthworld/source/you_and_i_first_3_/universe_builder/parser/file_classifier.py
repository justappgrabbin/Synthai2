
import os

def classify_file(path):
    """Classify file based on extension and content"""
    filename = os.path.basename(path)
    
    # Check extension first
    if path.endswith(".py"):
        return "python"
    elif path.endswith(".html"):
        return "html"
    elif path.endswith(".js"):
        return "javascript"
    elif path.endswith(".css"):
        return "css"
    elif path.endswith((".txt", ".md")):
        return "text"
    elif path.endswith(".json"):
        return "json"
    else:
        # Check content if extension is unclear
        try:
            with open(path, "r", encoding="utf-8") as f:
                head = f.read(500).lower()
                if "<html" in head or "<!doctype html" in head:
                    return "html"
                elif "def " in head or "import " in head or "from " in head:
                    return "python"
                elif "function" in head or "const " in head or "let " in head:
                    return "javascript"
                elif "{" in head and "}" in head:
                    return "json"
                return "text"
        except Exception:
            return "text"
