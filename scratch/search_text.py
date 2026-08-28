import os

search_terms = ["صندوق المحادثات", "محادثات موثقة", "فلترة داخل الرسائل", "الرسائل", "بدء محادثة جديدة"]

def search_files():
    found = False
    for root, dirs, files in os.walk("e:/Consultation-platform"):
        if ".git" in root or "__pycache__" in root or "node_modules" in root or "dist" in root:
            continue
        for file in files:
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                for term in search_terms:
                    if term in content:
                        print(f"FOUND '{term}' in file: {path}")
                        found = True
            except Exception as e:
                pass
    if not found:
        print("No search terms found in any file in the entire repository.")

if __name__ == "__main__":
    search_files()
