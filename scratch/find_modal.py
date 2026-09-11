import glob
import sys
sys.stdout.reconfigure(encoding='utf-8')

files = glob.glob('C:/Users/khale/.gemini/antigravity-ide/brain/a5a59424-0a3b-4dad-b1f2-16e2e06eaf19/.user_uploaded/*.html')
for fpath in files:
    print('=== FILE:', fpath)
    with open(fpath, encoding='utf-8') as f:
        content = f.read()
    lines = content.splitlines()
    for i, l in enumerate(lines):
        if 'id="overlay"' in l or 'class="overlay' in l or 'class="modal' in l:
            print(f'  L{i+1}: {l[:150]}')
            for j in range(i, min(i+15, len(lines))):
                print(f'    {lines[j]}')
            break
