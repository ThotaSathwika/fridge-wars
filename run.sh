#!/bin/sh
# Serve the Fridge Wars scoreboard. Open http://localhost:8766/site/ afterwards.
cd "$(dirname "$0")" && exec python3 -m http.server "${PORT:-8766}"
