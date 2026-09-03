#!/usr/bin/env bash
# Перевірка збірки UI (урок 7): кожен продуктовий екран у research/wireframes/
# підключає ui/kit.css, не має власних стилів і класів поза кітом, не тягне стокові фото.
# Використання: scripts/check-kit.sh   (код виходу 1, якщо є дефекти)
cd "$(dirname "$0")/../research/wireframes" || exit 2
fail=0
for f in *.html; do
  case "$f" in _*) continue;; esac
  kit=$(grep -c 'ui/kit.css' "$f")
  styles=$(grep -c '<style\|style="' "$f")
  concept=$(grep -c '_concept\|iconify\|class="phone"' "$f")
  stock=$(grep -c 'unsplash\|pexels\|images\.' "$f")
  # класи всередині .kit-shell без префікса kit-
  foreign=$(python3 - "$f" <<'PY'
import re,sys
s=open(sys.argv[1],encoding='utf-8').read()
i=s.find('<div class="kit-shell')
if i<0: print('NO-SHELL'); sys.exit()
seg=s[i:]
j=seg.find('<script>')
seg=seg[:j] if j>0 else seg
bad=set()
for m in re.finditer(r'class="([^"]*)"',seg):
    for c in m.group(1).split():
        if not c.startswith('kit-'): bad.add(c)
print(' '.join(sorted(bad)) if bad else '-')
PY
)
  if [ "$kit" != 1 ] || [ "$styles" != 0 ] || [ "$concept" != 0 ] || [ "$stock" != 0 ] || [ "$foreign" != "-" ]; then
    echo "DEFECT $f: kit=$kit styles=$styles concept=$concept stock=$stock foreign=$foreign"; fail=1
  fi
done
# кіт: значення прямо в класах (поза :root)
lit=$(awk '/^\/\* ───────── База/{p=1} p' ../../ui/kit.css | grep -o '#[0-9a-fA-F]\{3,6\}\|rgba\?([^)]*)' | wc -l)
[ "$lit" != 0 ] && { echo "DEFECT ui/kit.css: $lit hardcoded colors outside :root"; fail=1; }
grep -q '!important' ../../ui/kit.css && { echo "DEFECT ui/kit.css: !important"; fail=1; }
grep -q 'style="' ../../ui/kit.html && { echo "DEFECT ui/kit.html: inline style"; fail=1; }
[ $fail = 0 ] && echo "OK: усі екрани на кіті, кіт чистий"
exit $fail
