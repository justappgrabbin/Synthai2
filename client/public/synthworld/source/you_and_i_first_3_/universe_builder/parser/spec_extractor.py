import os
import re
import json

def extract_specs(file_path, file_type):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception:
        return {"type": "error", "module_name": "unknown", "raw": "Could not read file"}

    module_name = os.path.basename(file_path).split(".")[0]

    if file_type == "text":
        return extract_text_specs(content, module_name)
    elif file_type == "python":
        return extract_python_specs(content, module_name)
    elif file_type == "html":
        return extract_html_specs(content, module_name)
    elif file_type == "javascript":
        return extract_js_specs(content, module_name)
    elif file_type == "json":
        return extract_json_specs(content, module_name)
    else:
        return {
            "type": file_type,
            "module_name": module_name,
            "raw": content[:500],
            "intents": []
        }

def extract_text_specs(text, module_name):
    lines = text.lower().splitlines()
    modules = []
    pairs = []
    intents = []

    for line in lines:
        if any(keyword in line for keyword in ["module", "system", "component", "bot", "engine"]):
            modules.append(line.strip())

        if any(keyword in line for keyword in ["build", "create", "implement", "add", "feature"]):
            intents.append(line.strip())
        
        if "-" in line and "at" in line:
            match = re.match(r"(.+?) at ([0-9.]+)", line.strip())
            if match:
                label = match.group(1).strip()
                value = float(match.group(2).strip())
                pairs.append((label, value))
        elif "assigns" in line and "credits" in line:
            match = re.match(r"(\w+) assigns (\w+) with ([0-9]+) credits", line.strip())
            if match:
                user, bot, credits = match.groups()
                intents.append({"user": user, "bot": bot, "credits": int(credits)})

    code_blocks = re.findall(r'```[\s\S]*?```', text)

    return {
        "type": "text",
        "module_name": module_name,
        "modules": modules[:5],
        "pairs": pairs,
        "intents": intents[:5],
        "code_blocks": len(code_blocks),
        "raw": text[:500]
    }

def extract_python_specs(content, module_name):
    """Extract specs from Python files"""
    functions = re.findall(r'def\s+(\w+)', content)
    classes = re.findall(r'class\s+(\w+)', content)
    imports = re.findall(r'(?:from\s+\w+\s+)?import\s+(\w+)', content)
    
    return {
        "type": "python",
        "module_name": module_name,
        "functions": functions,
        "classes": classes,
        "imports": imports[:10],  # Limit imports
        "raw": content[:500]
    }

def extract_html_specs(content, module_name):
    """Extract specs from HTML files"""
    has_forms = bool(re.search(r'<form', content, re.IGNORECASE))
    has_canvas = bool(re.search(r'<canvas', content, re.IGNORECASE))
    has_js = bool(re.search(r'<script', content, re.IGNORECASE))
    
    return {
        "type": "html",
        "module_name": module_name,
        "has_forms": has_forms,
        "has_canvas": has_canvas,
        "has_js": has_js,
        "contains_ui": True,
        "raw": content[:500]
    }

def extract_js_specs(content, module_name):
    """Extract specs from JavaScript files"""
    functions = re.findall(r'function\s+(\w+)', content)
    arrow_functions = re.findall(r'const\s+(\w+)\s*=\s*\(', content)
    
    return {
        "type": "javascript",
        "module_name": module_name,
        "functions": functions + arrow_functions,
        "raw": content[:500]
    }

def extract_json_specs(content, module_name):
    """Extract specs from JSON files"""
    try:
        data = json.loads(content)
        keys = list(data.keys()) if isinstance(data, dict) else []
        
        return {
            "type": "json",
            "module_name": module_name,
            "keys": keys,
            "is_config": any(key in keys for key in ["config", "settings", "options"]),
            "raw": content[:500]
        }
    except:
        return {
            "type": "json",
            "module_name": module_name,
            "keys": [],
            "raw": content[:500]
        }