#!/usr/bin/env pwsh

# Script de lancement WSIMC Tauri
Write-Host "🚀 Lancement de WSIMC Tauri..." -ForegroundColor Green

# Ajouter Cargo au PATH si nécessaire
$cargoPath = "$env:USERPROFILE\.cargo\bin"
if ($env:PATH -notlike "*$cargoPath*") {
    Write-Host "📦 Ajout de Cargo au PATH..." -ForegroundColor Yellow
    $env:PATH += ";$cargoPath"
}

# Vérifier que Rust/Cargo est disponible
try {
    $rustVersion = & cargo --version 2>$null
    Write-Host "✅ Rust détecté: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: Cargo/Rust non trouvé!" -ForegroundColor Red
    Write-Host "Veuillez redémarrer votre terminal ou redémarrer votre PC." -ForegroundColor Yellow
    Read-Host "Appuyez sur Entrée pour continuer..."
    exit 1
}

# Aller dans le bon répertoire
Set-Location "$PSScriptRoot"
Write-Host "📁 Répertoire: $(Get-Location)" -ForegroundColor Cyan

# Installer les dépendances si nécessaire
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installation des dépendances..." -ForegroundColor Yellow
    npm install
}

# Lancer l'application
Write-Host "🎯 Lancement de l'application..." -ForegroundColor Green
Write-Host "Cela peut prendre quelques minutes la première fois..." -ForegroundColor Yellow
npm run tauri dev
