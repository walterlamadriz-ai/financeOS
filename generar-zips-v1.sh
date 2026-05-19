#!/bin/bash
# generar-zips-v1.sh — FinanceOS v1.0
# Genera los dos ZIPs finales para Gumroad
# Ejecutar desde: ~/Downloads/financeos/financeos/
# Uso: bash generar-zips-v1.sh

set -e

PROJECT_DIR="$(pwd)"
OUTPUT_DIR="$HOME/Downloads"
VERSION="v1.0"

echo "FinanceOS — Generando ZIPs v1.0 para Gumroad..."
echo "Proyecto: $PROJECT_DIR"
echo "Output:   $OUTPUT_DIR"
echo ""

if [ ! -f "package.json" ]; then
  echo "ERROR: Ejecutá este script desde la carpeta del proyecto"
  exit 1
fi

TEMP_DIR=$(mktemp -d)
echo "Carpeta temporal: $TEMP_DIR"

# ── Copiar código fuente ──────────────────────────────────────────────────────
echo "Copiando archivos..."
mkdir -p "$TEMP_DIR/src"

rsync -a \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  --exclude='LICENSE-*.txt' \
  --exclude='LICENSE-*.md' \
  --exclude='README-*.md' \
  --exclude='*-GUIDE.md' \
  --exclude='LINKS.txt' \
  --exclude='generar-zips*.sh' \
  "$PROJECT_DIR/" \
  "$TEMP_DIR/src/"

echo "Código copiado."

# ── ZIP PERSONAL ──────────────────────────────────────────────────────────────
echo ""
echo "Generando FinanceOS-Personal-$VERSION.zip..."

PERSONAL_DIR="$TEMP_DIR/FinanceOS-Personal-$VERSION"
mkdir -p "$PERSONAL_DIR"

# Código fuente
cp -r "$TEMP_DIR/src/." "$PERSONAL_DIR/"

# Documentación
cp "$PROJECT_DIR/LICENSE-PERSONAL.txt"   "$PERSONAL_DIR/LICENSE.txt"
cp "$PROJECT_DIR/README-PERSONAL.md"     "$PERSONAL_DIR/README.md"
cp "$PROJECT_DIR/BACKUP-GUIDE.md"        "$PERSONAL_DIR/BACKUP-GUIDE.md"
cp "$PROJECT_DIR/LINKS.txt"              "$PERSONAL_DIR/LINKS.txt"

cd "$TEMP_DIR"
zip -r "$OUTPUT_DIR/FinanceOS-Personal-$VERSION.zip" "FinanceOS-Personal-$VERSION/" -x "*.DS_Store"
echo "  ✓ FinanceOS-Personal-$VERSION.zip ($(du -sh "$OUTPUT_DIR/FinanceOS-Personal-$VERSION.zip" | cut -f1))"

# ── ZIP PRO ───────────────────────────────────────────────────────────────────
echo ""
echo "Generando FinanceOS-Pro-$VERSION.zip..."

PRO_DIR="$TEMP_DIR/FinanceOS-Pro-$VERSION"
mkdir -p "$PRO_DIR"

# Código fuente
cp -r "$TEMP_DIR/src/." "$PRO_DIR/"

# Documentación Pro (más completa)
cp "$PROJECT_DIR/LICENSE-PRO.txt"          "$PRO_DIR/LICENSE.txt"
cp "$PROJECT_DIR/README-PRO.md"            "$PRO_DIR/README.md"
cp "$PROJECT_DIR/CLIENT-DELIVERY-GUIDE.md" "$PRO_DIR/CLIENT-DELIVERY-GUIDE.md"
cp "$PROJECT_DIR/WHITE-LABEL-GUIDE.md"     "$PRO_DIR/WHITE-LABEL-GUIDE.md"
cp "$PROJECT_DIR/BACKUP-GUIDE.md"          "$PRO_DIR/BACKUP-GUIDE.md"
cp "$PROJECT_DIR/LINKS.txt"               "$PRO_DIR/LINKS.txt"

cd "$TEMP_DIR"
zip -r "$OUTPUT_DIR/FinanceOS-Pro-$VERSION.zip" "FinanceOS-Pro-$VERSION/" -x "*.DS_Store"
echo "  ✓ FinanceOS-Pro-$VERSION.zip ($(du -sh "$OUTPUT_DIR/FinanceOS-Pro-$VERSION.zip" | cut -f1))"

# ── Limpiar ───────────────────────────────────────────────────────────────────
rm -rf "$TEMP_DIR"

echo ""
echo "✅ ZIPs listos en ~/Downloads:"
echo ""
echo "   FinanceOS-Personal-$VERSION.zip"
echo "   → Subir a Gumroad Personal (\$49)"
echo "   → Contenido: código + README + LICENSE + BACKUP-GUIDE + LINKS"
echo ""
echo "   FinanceOS-Pro-$VERSION.zip"
echo "   → Subir a Gumroad Pro (\$97)"
echo "   → Contenido: código + README-PRO + LICENSE-PRO + CLIENT-DELIVERY-GUIDE"
echo "                + WHITE-LABEL-GUIDE + BACKUP-GUIDE + LINKS"
echo ""
echo "Próximo paso: subir cada ZIP en gumroad.com → tu producto → Files"
