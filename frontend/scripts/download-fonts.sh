#!/usr/bin/env bash
set -euo pipefail

FONTS_DIR="$(dirname "$0")/../public/fonts"
mkdir -p "$FONTS_DIR"

echo "Downloading Poppins (latin)..."

curl -sL \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" \
  | grep -o 'https://fonts.gstatic.com/s/poppins/[^)]*\.woff2' \
  | grep 'Z1xlFd2JQEk\|JJfecnFHGPc' \
  | while read -r url; do
    weight="$(echo "$url" | grep -o 'LDz8\|LDz8\|JJfe\|LGT9\|LEj6\|LCz7' | head -1)"
    case "$weight" in
      LDz8) w="300" ;;
      JJfe) w="400" ;;
      LGT9) w="500" ;;
      LEj6) w="600" ;;
      LCz7) w="700" ;;
    esac
    echo "  poppins-${w}.woff2"
    curl -sLo "$FONTS_DIR/poppins-${w}.woff2" "$url"
  done

echo "Downloading Material Symbols Outlined..."

curl -sL \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36" \
  "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL@20..48,100..700,0..1&display=swap" \
  | grep -o 'https://fonts.gstatic.com/s/materialsymbolsoutlined/[^)]*\.woff2' \
  | while read -r url; do
    echo "  material-symbols-outlined.woff2"
    curl -sLo "$FONTS_DIR/material-symbols-outlined.woff2" "$url"
  done

echo "Done. Fonts in $FONTS_DIR"
ls -lh "$FONTS_DIR"
