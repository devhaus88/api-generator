"""Build api-generator.html from parts"""
OUT = r"c:\AntiG2026\flex_java_wgen200\api-generator\api-generator.html"
D = r"c:\AntiG2026\flex_java_wgen200\api-generator\parts"

CSS = open(D+r"\style.css",'r', encoding='utf-8').read()
GEN = open(D+r"\generators.js",'r', encoding='utf-8').read()
APP = open(D+r"\app.js",'r', encoding='utf-8').read()
BODY = open(D+r"\body.html",'r', encoding='utf-8').read()

html = f"""<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Progress API Generator - TOTVS OpenEdge</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>
<style>{CSS}</style>
</head>
<body>
{BODY}
<script>
{GEN}
{APP}
</script>
</body>
</html>"""

with open(OUT,'w',encoding='utf-8') as f:
    f.write(html)
print(f"Gerado: {OUT} ({len(html):,} bytes)")
