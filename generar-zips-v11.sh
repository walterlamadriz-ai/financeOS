#!/bin/bash
# generar-zips-v11.sh — FinanceOS v1.2
# ZIP Personal = solo documentación (sin código fuente)
# ZIP Pro = código fuente + documentación completa
# Ejecutar desde: ~/Downloads/financeos/financeos/

set -e

PROJECT_DIR="$(pwd)"
OUTPUT_DIR="$HOME/Downloads"
VERSION="v1.2"

echo "FinanceOS — Generando ZIPs limpios $VERSION..."

if [ ! -f "package.json" ]; then
  echo "ERROR: Ejecuta desde la carpeta del proyecto (donde está package.json)"
  exit 1
fi

TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# ── ZIP PERSONAL — SOLO DOCUMENTACIÓN ────────────────────────────────────────
echo ""
echo "Generando FinanceOS-Personal-$VERSION.zip (solo docs)..."

PDIR="$TEMP_DIR/FinanceOS-Personal-$VERSION"
mkdir -p "$PDIR"

# Solo archivos de documentación — sin código fuente ni archivos técnicos
for f in \
  "01-START-HERE-PERSONAL.md:01-START-HERE.md" \
  "02-INSTALL-AS-APP-PWA.md:02-INSTALL-AS-APP-PWA.md" \
  "BACKUP-GUIDE.md:03-BACKUP-GUIDE.md" \
  "05-PRIVACY-AND-DATA.md:04-PRIVACY-AND-DATA.md" \
  "LICENSE-PERSONAL.txt:LICENSE.txt" \
  "LINKS.txt:LINKS.txt"
do
  SRC="${f%%:*}"
  DST="${f##*:}"
  if [ -f "$PROJECT_DIR/$SRC" ]; then
    cp "$PROJECT_DIR/$SRC" "$PDIR/$DST"
    echo "  + $DST"
  else
    echo "  ⚠ No encontrado: $SRC (omitido)"
  fi
done

# Agregar README Personal si existe
for readme in "README-PERSONAL.md" "01-START-HERE-PERSONAL.md"; do
  if [ -f "$PROJECT_DIR/$readme" ] && [ ! -f "$PDIR/README.md" ]; then
    cp "$PROJECT_DIR/$readme" "$PDIR/README.md"
    echo "  + README.md"
    break
  fi
done

# Validar que no haya código fuente
if [ -d "$PDIR/src" ]; then
  echo "ERROR: src/ encontrado en Personal — abortando"
  exit 1
fi

cd "$TEMP_DIR"
zip -r "$OUTPUT_DIR/FinanceOS-Personal-$VERSION.zip" "FinanceOS-Personal-$VERSION/" -x "*.DS_Store" -x "__MACOSX/*"
echo "  ✓ FinanceOS-Personal-$VERSION.zip ($(du -sh "$OUTPUT_DIR/FinanceOS-Personal-$VERSION.zip" | cut -f1))"

# ── ZIP PRO — CÓDIGO FUENTE + DOCUMENTACIÓN ───────────────────────────────────
echo ""
echo "Generando FinanceOS-Pro-$VERSION.zip (código + docs)..."

PRODIR="$TEMP_DIR/FinanceOS-Pro-$VERSION"
mkdir -p "$PRODIR"

# Código fuente completo (sin node_modules, dist, git, logs, docs md)
rsync -a \
  --exclude='node_modules/' \
  --exclude='dist/' \
  --exclude='.git/' \
  --exclude='.DS_Store' \
  --exclude='*.log' \
  --exclude='*.md' \
  --exclude='*.txt' \
  --exclude='*.sh' \
  "$PROJECT_DIR/" "$PRODIR/"

# Documentación Pro completa
for f in \
  "01-START-HERE-PRO.md:01-START-HERE.md" \
  "02-INSTALL-AS-APP-PWA.md:02-INSTALL-AS-APP-PWA.md" \
  "03-WHITE-LABEL-GUIDE.md:03-WHITE-LABEL-GUIDE.md" \
  "04-DEPLOY-TECHNICAL-GUIDE.md:04-DEPLOY-TECHNICAL-GUIDE.md" \
  "CLIENT-DELIVERY-GUIDE.md:05-CLIENT-DELIVERY-GUIDE.md" \
  "BACKUP-GUIDE.md:06-BACKUP-GUIDE.md" \
  "05-PRIVACY-AND-DATA.md:07-PRIVACY-AND-DATA.md" \
  "LICENSE-PRO.txt:LICENSE.txt" \
  "LINKS.txt:LINKS.txt"
do
  SRC="${f%%:*}"
  DST="${f##*:}"
  if [ -f "$PROJECT_DIR/$SRC" ]; then
    cp "$PROJECT_DIR/$SRC" "$PRODIR/$DST"
    echo "  + $DST"
  else
    echo "  ⚠ No encontrado: $SRC (omitido)"
  fi
done

cd "$TEMP_DIR"
zip -r "$OUTPUT_DIR/FinanceOS-Pro-$VERSION.zip" "FinanceOS-Pro-$VERSION/" -x "*.DS_Store" -x "__MACOSX/*"
echo "  ✓ FinanceOS-Pro-$VERSION.zip ($(du -sh "$OUTPUT_DIR/FinanceOS-Pro-$VERSION.zip" | cut -f1))"

# ── VALIDACIÓN AUTOMÁTICA ─────────────────────────────────────────────────────
echo ""
echo "═══ VALIDACIÓN ═══"
echo ""

echo "ZIP Personal — no debe tener código fuente:"
CONTAM=$(unzip -l "$OUTPUT_DIR/FinanceOS-Personal-$VERSION.zip" 2>/dev/null \
  | grep -iE "src/|package\.json|package-lock|vite\.config|build\.js|DEPLOY|config\.js|vercel\.json|netlify\.toml|Advisor|ReportePDF|[-_]PRO|WHITE.LABEL|CLIENT.DELIVERY|LICENSE.PRO" \
  | grep -v "PRIVACY" || true)
if [ -z "$CONTAM" ]; then
  echo "  ✅ LIMPIO — sin archivos técnicos o Pro"
else
  echo "  ❌ CONTAMINADO:"
  echo "$CONTAM"
fi

echo ""
echo "ZIP Pro — debe tener código fuente:"
SRC_COUNT=$(unzip -l "$OUTPUT_DIR/FinanceOS-Pro-$VERSION.zip" 2>/dev/null | grep -c "src/" || true)
if [ "$SRC_COUNT" -gt 0 ]; then
  echo "  ✅ Código fuente presente ($SRC_COUNT archivos en src/)"
else
  echo "  ❌ ERROR: src/ no encontrado en Pro"
fi

echo ""
echo "✅ ZIPs listos en ~/Documents/FinanceOS-Releases/v1.2/:"
echo "   FinanceOS-Personal-$VERSION.zip — solo docs, sin código fuente"
echo "   FinanceOS-Pro-$VERSION.zip      — código fuente + documentación Pro"
echo ""
echo "Subir a Gumroad:"
echo "  gumroad.com → Personal → Edit → Files → reemplazar ZIP"
echo "  gumroad.com → Pro      → Edit → Files → reemplazar ZIP"
