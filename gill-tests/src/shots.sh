#!/usr/bin/env bash
# Render stills from one film at given timestamps, for adversarial review.
# Each chrome gets its own profile or they queue behind one another's lock.
# usage: src/shots.sh 01-shopping-constellation.html tag 0.2 1.6 3.4 ...
FILM="$1"; TAG="$2"; shift 2
DIR="/tmp/shots/$TAG"
rm -rf "$DIR"; mkdir -p "$DIR"
i=0
for t in "$@"; do
  name=$(printf '%02d_t%s' "$i" "$(echo "$t" | tr '.' '_')")
  prof=$(mktemp -d)
  timeout 90 google-chrome --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --user-data-dir="$prof" --no-first-run --disable-extensions \
    --virtual-time-budget=15000 --window-size=1080,1080 \
    --screenshot="$DIR/$name.png" \
    "file:///workspace/gill-tests/$FILM?t=$t" >/dev/null 2>&1 &
  i=$((i+1))
done
wait
ls -S "$DIR" | head -40
