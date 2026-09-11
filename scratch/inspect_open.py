import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('C:/Users/khale/.gemini/antigravity-ide/brain/a5a59424-0a3b-4dad-b1f2-16e2e06eaf19/.user_uploaded/media_1789057812556.html', encoding='utf-8') as f:
    text = f.read()

import re
# Find open360 or open function
for m in re.finditer(r'function open\w*\(', text):
    print('FUNC:', m.group(0))
    print(text[m.start():m.start()+1500])
    print('='*50)
