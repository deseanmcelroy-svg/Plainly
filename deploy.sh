#!/bin/bash
# Plainly deploy script
# Usage: bash deploy.sh "your commit message"

set -e

MSG=${1:-"Update Plainly"}

echo "🧹 Cleaning capacitor files..."
rm -f capacitor.config.ts capacitor.config.js
rm -rf ios/ android/

echo "📦 Staging changes..."
git add .

echo "💾 Committing: $MSG"
git commit -m "$MSG" 2>/dev/null || echo "Nothing new to commit"

echo "🚀 Pushing to GitHub..."
git push

echo "✅ Done! Vercel will deploy in ~30 seconds."
echo "   Check: https://vercel.com"
