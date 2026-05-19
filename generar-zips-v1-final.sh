#!/bin/bash
# generar-zips-v1-final.sh — FinanceOS v1.0 Final
# Ejecutar desde: ~/Downloads/financeos/financeos/
set -e

PROJECT_DIR="$(pwd)"
OUTPUT_DIR="$HOME/Downloads"
VERSION="v1.0"

echo "FinanceOS — Generando ZIPs finales v1.0..."
echo ""

if [ ! -f "package.json" ]; then
  echo "ERROR: Ejecuta este script desde la carpeta del proyecto"
  exit 1
fi

TEMP_DIR=$(mktemp -d)

# Copiar código fuente
mkdir -p "$TEMP_DIR/src"
rsync -a \
  --exclude='node_modules' --exclude='dist' --exclude='.git' \
  --exclude='.DS_Store' --exclude='*.log' \
  --exclude='LICENSE-*.txt' --exclude='LICENSE-*.md' \
  --exclude='README-*.md' --exclude='*-GUIDE.md' \
  --exclude='START-HERE-*.md' --exclude='PRIVACY-AND-DATA.md' \
  --exclude='LINKS.txt' --exclude='generar-zips*.sh' \
  "$PROJECT_DIR/" "$TEMP_DIR/src/"

# ── ZIP PERSONAL ──────────────────────────────────────────────────────────────
echo "Generando FinanceOS-Personal-$VERSION.zip..."
PDIR="$TEMP_DIR/FinanceOS-Personal-$VERSION"
mkdir -p "$PDIR"
cp -r "$TEMP_DIR/src/." "$PDIR/"
cp "$PROJECT_DIR/01-START-HERE-PERSONAL.md"  "$PDIR/01-START-HERE.md"
cp "$PROJECT_DIR/02-INSTALL-AS-APP-PWA.md"   "$PDIR/02-INSTALL-AS-APP-PWA.md"
cp "$PROJECT_DIR/BACKUP-GUIDE.md"             "$PDIR/03-BACKUP-GUIDE.md"
cp "$PROJECT_DIR/05-PRIVACY-AND-DATA.md"      "$PDIR/04-PRIVACY-AND-DATA.md"
cp "$PROJECT_DIR/LICENSE-PERSONAL.txt"        "$PDIR/LICENSE.txt"
cp "$PROJECT_DIR/LINKS.txt"                   "$PDIR/LINKS.txt"

cd "$TEMP_DIR"
zip -r "$OUTPUT_DIR/FinanceOS-Personal-$VERSION.zip" "FinanceOS-Personal-$VERSION/" -x "*.DS_Store"
echo "  ✓ FinanceOS-Personal-$VERSION.zip ($(du -sh "$OUTPUT_DIR/FinanceOS-Personal-$VERSION.zip" | cut -f1))"

# ── ZIP PRO ───────────────────────────────────────────────────────────────────
echo "Generando FinanceOS-Pro-$VERSION.zip..."
PRODIR="$TEMP_DIR/FinanceOS-Pro-$VERSION"
mkdir -p "$PRODIR"
cp -r "$TEMP_DIR/src/." "$PRODIR/"
cp "$PROJECT_DIR/01-START-HERE-PRO.md"          "$PRODIR/01-START-HERE.md"
cp "$PROJECT_DIR/02-INSTALL-AS-APP-PWA.md"       "$PRODIR/02-INSTALL-AS-APP-PWA.md"
cp "$PROJECT_DIR/03-WHITE-LABEL-GUIDE.md"        "$PRODIR/03-WHITE-LABEL-GUIDE.md"
cp "$PROJECT_DIR/04-DEPLOY-TECHNICAL-GUIDE.md"   "$PRODIR/04-DEPLOY-TECHNICAL-GUIDE.md"
cp "$PROJECT_DIR/CLIENT-DELIVERY-GUIDE.md"       "$PRODIR/05-CLIENT-DELIVERY-GUIDE.md"
cp "$PROJECT_DIR/BACKUP-GUIDE.md"                "$PRODIR/06-BACKUP-GUIDE.md"
cp "$PROJECT_DIR/05-PRIVACY-AND-DATA.md"         "$PRODIR/07-PRIVACY-AND-DATA.md"
cp "$PROJECT_DIR/LICENSE-PRO.txt"                "$PRODIR/LICENSE.txt"
cp "$PROJECT_DIR/LINKS.txt"                      "$PRODIR/LINKS.txt"

cd "$TEMP_DIR"
zip -r "$OUTPUT_DIR/FinanceOS-Pro-$VERSION.zip" "FinanceOS-Pro-$VERSION/" -x "*.DS_Store"
echo "  ✓ FinanceOS-Pro-$VERSION.zip ($(du -sh "$OUTPUT_DIR/FinanceOS-Pro-$VERSION.zip" | cut -f1))"

rm -rf "$TEMP_DIR"

echo ""
echo "✅ ZIPs finales listos en ~/Downloads:"
echo "   FinanceOS-Personal-$VERSION.zip → Gumroad Personal (\$49)"
echo "   FinanceOS-Pro-$VERSION.zip      → Gumroad Pro (\$97)"
