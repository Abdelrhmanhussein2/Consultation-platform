
import ast

def inspect_file(filepath):
    print(f"=== {filepath} ===")
    with open(filepath, 'r', encoding='utf-8') as f:
        tree = ast.parse(f.read(), filename=filepath)
    
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            print(f"Class: {node.name} (Lines {node.lineno}-{node.end_lineno})")
            for sub in node.body:
                if isinstance(sub, ast.FunctionDef):
                    print(f"   - {sub.name} (L{sub.lineno}-L{sub.end_lineno})")
        elif isinstance(node, ast.FunctionDef):
            print(f"Function: {node.name} (L{node.lineno}-L{node.end_lineno})")

inspect_file(r"d:\work\Consultation-platform\services\super_admin_service.py")
inspect_file(r"d:\work\Consultation-platform\services\services.py")
