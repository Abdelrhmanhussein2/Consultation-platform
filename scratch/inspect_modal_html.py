import sys, glob, re
sys.stdout.reconfigure(encoding='utf-8')

for fpath in glob.glob('C:/Users/khale/.gemini/antigravity-ide/brain/a5a59424-0a3b-4dad-b1f2-16e2e06eaf19/.user_uploaded/*.html'):
    with open(fpath, encoding='utf-8') as f:
        text = f.read()
    print('===> FILE:', fpath)
    for m in re.finditer(r'<div[^>]*class=["\'][^"\']*(?:modal|drawer|popup|dialog)[^"\']*["\'][^>]*>', text):
        print('  TAG:', m.group(0))
        print('  SNIPPET:', text[m.start():m.start()+800])
        print('  -------------------------')
