from jinja2 import Environment, FileSystemLoader
import os
import json
from datetime import datetime

env = Environment(loader=FileSystemLoader("universe_builder/templates"))

def generate_layout(specs):
    layout = {
        "folders": [],
        "files": {}
    }

    for spec in specs:
        if spec["type"] == "text":
            module = spec.get("module", "UnknownModule")
            if spec.get("pairs"):
                layout["folders"].append("charts")
                chart_template = env.get_template("chart.html.j2")
                chart_html = chart_template.render(title=module + " Chart", pairs=spec["pairs"])
                layout["files"][f"charts/{module}_chart.html"] = chart_html

                chart_spec = f"{module} chart data:\n" + "\n".join([f"{p[0]}: {p[1]}" for p in spec["pairs"]])
                layout["files"][f"charts/{module}_spec.txt"] = chart_spec

            elif spec.get("intents"):
                layout["folders"].append("store")
                store_template = env.get_template("store.html.j2")
                logic_template = env.get_template("store_logic.py.j2")

                store_html = store_template.render(store_name=module, assignments=spec["intents"])
                logic_py = logic_template.render(store_name=module, assignments=spec["intents"])

                layout["files"][f"store/{module}_store.html"] = store_html
                layout["files"][f"store/{module}_logic.py"] = logic_py

                store_spec = f"{module} bot assignments:\n" + "\n".join(
                    [f"{a['user']} → {a['bot']}: {a['credits']} credits" for a in spec["intents"]]
                )
                layout["files"][f"store/{module}_spec.txt"] = store_spec

        elif spec["type"] == "template":
            layout["folders"].append("custom_html")
            layout["files"][f"custom_html/manual_upload.html"] = spec["content"]

        elif spec["type"] == "code":
            layout["folders"].append("scripts")
            layout["files"][f"scripts/manual_upload.py"] = spec["content"]

    return layout

def generate_main_app(specs_list):
    """Generate main Flask application"""
    has_frontend = any(spec["type"] in ["html", "javascript"] for spec in specs_list)
    
    app_code = '''from flask import Flask, render_template, jsonify
import os

app = Flask(__name__)

@app.route("/")
def home():
    return "🌌 Generated Universe Application"

@app.route("/health")
def health():
    return jsonify({"status": "healthy", "message": "Universe is running"})
'''
    
    if has_frontend:
        app_code += '''
@app.route("/ui")
def ui():
    return render_template("index.html")
'''
    
    app_code += '''
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
'''
    
    return app_code

def generate_python_module(spec):
    """Generate Python module from spec"""
    module_name = spec.get("module_name", "module")
    functions = spec.get("functions", [])
    classes = spec.get("classes", [])
    
    code = f'"""Generated module: {module_name}"""\n\n'
    
    if classes:
        for cls in classes[:3]:  # Limit to 3 classes
            code += f'''class {cls}:
    """Generated class {cls}"""
    
    def __init__(self):
        self.name = "{cls}"
    
    def process(self):
        return f"Processing in {{self.name}}"

'''
    
    if functions:
        for func in functions[:5]:  # Limit to 5 functions
            code += f'''def {func}():
    """Generated function {func}"""
    return "Result from {func}"

'''
    
    if not classes and not functions:
        code += f'''def {module_name}_main():
    """Main function for {module_name}"""
    return "Module {module_name} is ready"
'''
    
    return code

def generate_html_component(spec):
    """Generate HTML component from spec"""
    module_name = spec.get("module_name", "component")
    has_forms = spec.get("has_forms", False)
    has_canvas = spec.get("has_canvas", False)
    
    html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{module_name}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; }}
        .container {{ max-width: 800px; margin: 0 auto; }}
        .universe-component {{ padding: 20px; border: 1px solid #ddd; border-radius: 8px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="universe-component">
            <h1>🌌 {module_name.title()} Component</h1>
            <p>Generated component from your universe builder.</p>
'''
    
    if has_forms:
        html += '''
            <form id="universeForm">
                <input type="text" placeholder="Enter data" name="data">
                <button type="submit">Process</button>
            </form>
'''
    
    if has_canvas:
        html += '''
            <canvas id="universeCanvas" width="400" height="300" style="border: 1px solid #ccc;"></canvas>
'''
    
    html += '''
        </div>
    </div>
</body>
</html>
'''
    
    return html

def generate_js_module(spec):
    """Generate JavaScript module from spec"""
    module_name = spec.get("module_name", "module")
    functions = spec.get("functions", [])
    
    js = f'// Generated JavaScript module: {module_name}\n\n'
    
    if functions:
        for func in functions[:5]:
            js += f'''function {func}() {{
    console.log("Function {func} called");
    return "Result from {func}";
}}

'''
    else:
        js += f'''function {module_name}Init() {{
    console.log("Initializing {module_name}");
    return "{module_name} initialized";
}}

'''
    
    js += '''// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Universe module loaded');
});
'''
    
    return js

def generate_spec_doc(spec):
    """Generate documentation from text specs"""
    module_name = spec.get("module_name", "module")
    intents = spec.get("intents", [])
    modules = spec.get("modules", [])
    
    doc = f'''# {module_name.title()} Specifications

## Overview
Generated from conversation/text analysis.

## Identified Intents
'''
    
    for intent in intents[:5]:
        doc += f"- {intent}\n"
    
    doc += "\n## Module References\n"
    for module in modules[:5]:
        doc += f"- {module}\n"
    
    doc += f'''
## Raw Content (first 500 chars)
```
{spec.get("raw", "No content")}
```
'''
    
    return doc

def generate_readme(specs_list):
    """Generate README for the generated app"""
    readme = '''# 🌌 Generated Universe Application

This application was automatically generated by the YOU-N-I-VERSE Builder.

## Structure

- `backend/` - Python modules and logic
- `frontend/` - HTML templates and JavaScript
- `docs/` - Documentation and specifications
- `config/` - Configuration files

## Generated Components

'''
    
    for spec in specs_list:
        module_name = spec.get("module_name", "unknown")
        file_type = spec.get("type", "unknown")
        readme += f"- **{module_name}** ({file_type})\n"
    
    readme += '''
## Running the Application

```bash
python app.py
```

Visit http://localhost:5000 to see your generated universe in action!

---
*Generated by YOU-N-I-VERSE Builder*
'''
    
    return readme

def organize_layout(classified_files):
    """
    Organize classified files into a structured layout for universe generation
    """
    layout = {
        "backend": [],
        "frontend": [],
        "config": [],
        "docs": []
    }

    for file_data in classified_files:
        file_type = file_data.get("type", "text")
        specs = file_data.get("specs", {})
        filename = file_data.get("filename", "unknown")

        if file_type == "python":
            # Generate backend modules
            modules = specs.get("modules", ["main"])
            for module in modules:
                layout["backend"].append({
                    "name": f"{module}.py",
                    "content": generate_python_module_new(module, specs),
                    "source_file": filename
                })

        elif file_type == "html":
            # Generate frontend templates
            layout["frontend"].append({
                "name": f"templates/{filename}",
                "content": specs.get("content", "<html><body>Generated HTML</body></html>"),
                "source_file": filename
            })

        elif file_type == "javascript":
            # Generate JS modules
            layout["frontend"].append({
                "name": f"static/js/{filename}",
                "content": specs.get("content", "// Generated JavaScript"),
                "source_file": filename
            })

        elif file_type == "text":
            # Convert conversations to documentation
            intents = specs.get("intents", [])
            if intents:
                layout["docs"].append({
                    "name": f"{filename.replace('.txt', '.md')}",
                    "content": generate_documentation_new(intents, specs),
                    "source_file": filename
                })

        elif file_type == "json":
            # Generate config files
            layout["config"].append({
                "name": f"{filename}",
                "content": specs.get("content", "{}"),
                "source_file": filename
            })

    # Ensure we have at least a main app file
    if not any(item["name"] == "app.py" for item in layout["backend"]):
        layout["backend"].append({
            "name": "app.py",
            "content": generate_main_app_new(),
            "source_file": "generated"
        })

    return layout

def generate_python_module_new(module_name, specs):
    """Generate Python module content based on specs"""
    functions = specs.get("functions", [])
    classes = specs.get("classes", [])
    imports = specs.get("imports", [])

    content = f"# Generated {module_name} module\n"

    # Add imports
    if imports:
        for imp in imports:
            content += f"import {imp}\n"
        content += "\n"

    # Add classes
    for cls in classes:
        content += f"class {cls}:\n    pass\n\n"

    # Add functions
    for func in functions:
        content += f"def {func}():\n    # Generated function\n    pass\n\n"

    if not functions and not classes:
        content += f"def main():\n    print('Generated {module_name} module')\n\nif __name__ == '__main__':\n    main()\n"

    return content

def generate_documentation_new(intents, specs):
    """Generate markdown documentation from intents"""
    content = f"# Generated Documentation\n\n"
    content += f"Generated on: {datetime.now().isoformat()}\n\n"

    if intents:
        content += "## Extracted Intents\n\n"
        for intent in intents:
            content += f"- {intent}\n"
        content += "\n"

    if specs.get("entities"):
        content += "## Entities Found\n\n"
        for entity in specs["entities"]:
            content += f"- {entity}\n"
        content += "\n"

    return content

def generate_main_app_new():
    """Generate a basic Flask app"""
    return '''from flask import Flask, render_template, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/status")
def status():
    return jsonify({"status": "Universe is running", "generated_by": "YOU-N-I-VERSE Builder"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
'''