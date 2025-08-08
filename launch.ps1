#!/usr/bin/env pwsh
# Script de lancement rapide pour WSIMC

Write-Host "🚀 WSIMC - What's In My Computer?" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Vérifier les prérequis
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js non installé!" -ForegroundColor Red
    exit 1
}

try {
    $rustVersion = cargo --version 2>$null
    Write-Host "✅ Rust: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust non installé!" -ForegroundColor Red
    exit 1
}

# Aller dans le dossier de l'app
Set-Location "tauri-app"

# Installer les dépendances si nécessaire
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

# Lancer l'application
Write-Host "🎯 Lancement de l'application..." -ForegroundColor Green
npm run tauri dev
