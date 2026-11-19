#!/usr/bin/env bash
# Actualiza la invitación en el VPS: trae los cambios, instala y compila.
# Uso (desde la carpeta del repo en el VPS):  ./deploy/actualizar.sh
#
# Compila en una carpeta aparte y luego la cambia por dist/ de golpe,
# así Nginx nunca sirve una versión a medio compilar.
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "Falta .env.local (cópialo de .env.example y llena los valores de Supabase)." >&2
  exit 1
fi

git pull --ff-only
npm ci
npm run typecheck
npx vite build --outDir .dist-nueva --emptyOutDir

rm -rf .dist-anterior
[ -d dist ] && mv dist .dist-anterior
mv .dist-nueva dist

echo "Listo: dist/ actualizado. Si algo salió mal, regresa con:  rm -rf dist && mv .dist-anterior dist"
