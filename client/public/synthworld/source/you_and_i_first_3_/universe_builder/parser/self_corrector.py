
import os
import logging
import ast
from bs4 import BeautifulSoup

try:
    from replit import db
except ImportError:
    # Fallback for environments without replit
    class MockDB:
        def __init__(self):
            self._data = {}
        def get(self, key, default=None):
            return self._data.get(key, default)
        def __getitem__(self, key):
            return self._data[key]
        def __setitem__(self, key, value):
            self._data[key] = value
        def __contains__(self, key):
            return key in self._data
    db = MockDB()

logging.basicConfig(filename="logs/builder.log", level=logging.INFO)

def validate_and_correct(generated_dir="generated_app"):
    """
    Validate and correct generated files
    """
    try:
        corrections = []
        if "corrections" not in db:
            db["corrections"] = []

        # Walk through generated_app
        for root, _, files in os.walk(generated_dir):
            for fname in files:
                path = os.path.join(root, fname)
                rel_path = os.path.relpath(path, generated_dir)
                
                # Validate Python files
                if fname.endswith(".py"):
                    try:
                        with open(path, "r") as f:
                            code = f.read()
                        ast.parse(code)  # Check syntax
                        logging.info(f"Validated Python file: {rel_path}")
                    except SyntaxError as e:
                        logging.warning(f"Syntax error in {rel_path}: {str(e)}")
                        # Basic fix: Comment out invalid lines
                        with open(path, "r") as f:
                            lines = f.readlines()
                        
                        corrected_lines = []
                        for i, line in enumerate(lines):
                            if i + 1 == e.lineno:
                                corrected_lines.append(f"# SYNTAX ERROR: {line}")
                            else:
                                corrected_lines.append(line)
                        
                        with open(path, "w") as f:
                            f.writelines(corrected_lines)
                        
                        corrections.append({
                            "file": rel_path,
                            "issue": "Syntax error",
                            "fix": "Commented invalid line"
                        })
                        logging.info(f"Corrected syntax in {rel_path}")

                # Validate HTML files
                elif fname.endswith(".html"):
                    try:
                        with open(path, "r") as f:
                            content = f.read()
                        soup = BeautifulSoup(content, "html.parser")
                        if not soup.find():
                            raise ValueError("Empty HTML")
                        logging.info(f"Validated HTML file: {rel_path}")
                    except Exception as e:
                        logging.warning(f"Invalid HTML in {rel_path}: {str(e)}")
                        # Basic fix: Wrap in valid HTML structure
                        with open(path, "r") as f:
                            content = f.read()
                        
                        corrected_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Corrected {fname}</title>
</head>
<body>
    {content}
</body>
</html>"""
                        
                        with open(path, "w") as f:
                            f.write(corrected_content)
                        
                        corrections.append({
                            "file": rel_path,
                            "issue": "Invalid HTML",
                            "fix": "Wrapped in valid HTML structure"
                        })
                        logging.info(f"Corrected HTML in {rel_path}")

        # Store corrections in database
        if corrections:
            db["corrections"].extend(corrections)
            logging.info(f"Stored {len(corrections)} corrections")
        
        return corrections

    except Exception as e:
        logging.error(f"Self-corrector failed: {str(e)}")
        return []
