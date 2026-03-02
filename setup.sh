#!/bin/bash

echo "🔧 Installation des dépendances..."

# Installation racine
echo "📦 Installation des dépendances racine..."
npm install --silent > /dev/null 2>&1

# Installation frontend
echo "📦 Installation des dépendances frontend..."
cd front && npm install --silent > /dev/null 2>&1 && cd ..

# Installation backend
echo "📦 Installation des dépendances backend..."
cd back && npm install --silent > /dev/null 2>&1 && cd ..

echo "✅ Toutes les dépendances sont installées !"
