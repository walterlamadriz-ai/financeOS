#!/bin/bash
# generar-zips.sh
# Genera los dos ZIPs listos para subir a Gumroad
# Ejecutar desde: ~/Downloads/financeos/financeos/
# Uso: bash generar-zips.sh

set -e

PROJECT_DIR="$(pwd)"
OUTPUT_DIR="$HOME/Downloads"
VERSION="v1.3"

echo "FinanceOS — Generando ZIPs para Gumroad..."
echo "Proyecto: $PROJECT_DIR"
echo "Output:   $OUTPUT_DIR"
echo ""

# ── Verificar que estamos en la carpeta correcta ──────────────────────────────
if [ ! -f "package.json" ]; then
  echo "ERROR: Ejecutá este script desde la carpeta del proyecto (donde está package.json)"
  exit 1
fi

if [ ! -d "src" ]; then
  echo "ERROR: No se encontró la carpeta src/"
  exit 1
fi

# ── Copiar archivos base al temp ──────────────────────────────────────────────
TEMP_DIR=$(mktemp -d)
echo "Preparando archivos en $TEMP_DIR..."

# Crear carpeta base
mkdir -p "$TEMP_DIR/financeos-$VERSION"

# Copiar todo excepto node_modules, dist, .git
rsync -a \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  --exclude='LICENSE-*.txt' \
  --exclude='generar-zips.sh' \
  "$PROJECT_DIR/" \
  "$TEMP_DIR/financeos-$VERSION/"

echo "Archivos copiados."

# ── ZIP PERSONAL ──────────────────────────────────────────────────────────────
echo ""
echo "Generando financeos-personal-$VERSION.zip..."

cp "$PROJECT_DIR/LICENSE-PERSONAL.txt" "$TEMP_DIR/financeos-$VERSION/LICENSE.txt"

cd "$TEMP_DIR"
zip -r "$OUTPUT_DIR/financeos-personal-$VERSION.zip" "financeos-$VERSION/" -x "*.DS_Store"
echo "  ✓ $OUTPUT_DIR/financeos-personal-$VERSION.zip ($(du -sh "$OUTPUT_DIR/financeos-personal-$VERSION.zip" | cut -f1))"

# ── ZIP PRO ───────────────────────────────────────────────────────────────────
echo ""
echo "Generando financeos-pro-$VERSION.zip..."

cp "$PROJECT_DIR/LICENSE-PRO.txt" "$TEMP_DIR/financeos-$VERSION/LICENSE.txt"

cd "$TEMP_DIR"
zip -r "$OUTPUT_DIR/financeos-pro-$VERSION.zip" "financeos-$VERSION/" -x "*.DS_Store"
echo "  ✓ $OUTPUT_DIR/financeos-pro-$VERSION.zip ($(du -sh "$OUTPUT_DIR/financeos-pro-$VERSION.zip" | cut -f1))"

# ── Limpiar temp ──────────────────────────────────────────────────────────────
rm -rf "$TEMP_DIR"

echo ""
echo "✅ ZIPs listos en ~/Downloads:"
echo "   financeos-personal-$VERSION.zip  ← subir a Gumroad Personal ($49)"
echo "   financeos-pro-$VERSION.zip       ← subir a Gumroad Pro ($97)"
echo ""
echo "Próximo paso: crear los productos en gumroad.com"
