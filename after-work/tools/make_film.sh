#!/bin/bash
# Assemble the film: 12 drawings/s held on twos -> 24 fps, with the score.
set -e
cd "$(dirname "$0")/.."
FF=/tmp/claude-0/tools/node_modules/ffmpeg-static/ffmpeg
$FF -y -loglevel error -framerate 12 -i frames/%05d.jpg -i audio/afterwork.wav \
  -vf "fps=24,format=yuv420p" -c:v libx264 -preset slow -crf 18 -tune animation \
  -c:a aac -b:a 256k -shortest -movflags +faststart out/after_work_1080p.mp4
python3 tools/square.py
$FF -y -loglevel error -framerate 12 -i out/tmp/sq/%05d.jpg -i audio/afterwork.wav \
  -vf "fps=24,format=yuv420p" -c:v libx264 -preset slow -crf 19 -tune animation \
  -c:a aac -b:a 192k -shortest -movflags +faststart out/after_work_square_1080.mp4
ls -la out/*.mp4
