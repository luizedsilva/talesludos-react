#!/usr/bin/env bash
# Regrava o vídeo tutorial (public/video/como-criar-um-jogo.mp4) e a capa (.jpg).
#
# Faz o build, serve o site com "vite preview", grava a construção do jogo com o
# gravar.mjs (Chrome headless + puppeteer-core), acelera em 3x o trecho repetitivo
# (cenas e desafios dos locais 2 a 4) e gera o MP4 final.
#
# Requisitos: Node.js, ffmpeg e Google Chrome (ou CHROME=/caminho/do/chrome).
# Uso, na raiz do repositório:  npm install && scripts/video-tutorial/gravar.sh
# OUT_DIR=/outra/pasta grava o MP4 e a capa em outro lugar (padrão: public/video).
# Os arquivos intermediários (as três partes gravadas) ficam numa pasta em $TMPDIR (ou /tmp).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$HERE/../.." && pwd)"
PORT=4173
SPEEDUP=3
OUT_DIR="${OUT_DIR:-$ROOT/public/video}"
WORK="$(mktemp -d "${TMPDIR:-/tmp}/tales-video.XXXXXX")"
echo "Arquivos intermediários em $WORK"

cd "$ROOT"
npm run build

# Chama o vite direto (e não via npx) para que o PID seja o do servidor e o kill o encerre.
"$ROOT/node_modules/.bin/vite" preview --port "$PORT" --strictPort >"$WORK/preview.log" 2>&1 &
PREVIEW_PID=$!
trap 'kill "$PREVIEW_PID" 2>/dev/null || true' EXIT
for _ in $(seq 30); do
  curl -s -o /dev/null "http://localhost:$PORT/" && break
  sleep 1
done

echo "Gravando (cerca de 5 minutos)..."
node "$HERE/gravar.mjs" "http://localhost:$PORT/" "$HERE/imagens" "$WORK"

# Três partes: a do meio (cenas e desafios dos locais 2 a 4) é acelerada.
ffmpeg -v error -y -i "$WORK/parte1.webm" -i "$WORK/parte2.webm" -i "$WORK/parte3.webm" -filter_complex "\
[0:v]fps=25,setpts=PTS-STARTPTS[v1];\
[1:v]fps=25,setpts=(PTS-STARTPTS)/$SPEEDUP[v2];\
[2:v]fps=25,setpts=PTS-STARTPTS[v3];\
[v1][v2][v3]concat=n=3:v=1,format=yuv420p[out]" \
  -map "[out]" -c:v libx264 -preset slow -crf 27 -tune stillimage -movflags +faststart -an \
  "$OUT_DIR/como-criar-um-jogo.mp4"
ffmpeg -v error -y -ss 2.5 -i "$OUT_DIR/como-criar-um-jogo.mp4" -frames:v 1 -q:v 3 "$OUT_DIR/como-criar-um-jogo.jpg"

FINAL="$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT_DIR/como-criar-um-jogo.mp4")"
printf 'Pronto: %s (%dmin%02ds). Atualize a duração na seção "Vídeo tutorial" do README.\n' \
  "$OUT_DIR/como-criar-um-jogo.mp4" "$(( ${FINAL%.*} / 60 ))" "$(( ${FINAL%.*} % 60 ))"
