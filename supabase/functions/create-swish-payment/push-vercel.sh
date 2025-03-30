#!/bin/bash

echo "📦 Förbereder Git push till Vercel-repo..."

# Steg 1: Hämta senaste ändringar från GitHub
git pull origin main --rebase || exit 1

# Steg 2: Lägg till alla ändringar
git add .

# Steg 3: Commit-meddelande
read -p "📝 Commit-meddelande: " msg
git commit -m "$msg"

# Steg 4: Pusha till GitHub
echo "🚀 Pushar till GitHub..."
git push origin main
