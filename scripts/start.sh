#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"
cd "$DIR"

echo "🚀 Starting Developer Dashboard on http://localhost:3000 ..."

# Open browser after 2 seconds
(sleep 2 && open http://localhost:3000) &

npm run dev
