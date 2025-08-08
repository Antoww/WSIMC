# Changelog

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-08

### 🚀 Ajouté
- **Monitoring système avancé**
  - Surveillance en temps réel du CPU avec calculs corrigés (normalisé par le nombre de cœurs)
  - Monitoring de la mémoire RAM (utilisation et total)
  - Surveillance de l'espace disque avec détails de capacité
  - Affichage de l'uptime système

- **Monitoring de température**
  - Simulation réaliste des températures CPU (30-80°C)
  - Simulation des températures GPU (25-75°C)
  - Indicateurs visuels de température avec codes couleur

- **Graphiques temps réel**
  - Graphiques interactifs avec Recharts
  - Mise à jour automatique toutes les secondes
  - Cache de données intelligent pour de meilleures performances
  - Courbes lisses pour CPU, RAM et températures

- **Gestion complète des processus**
  - Page dédiée aux processus avec interface complète
  - Colonnes CPU et GPU avec pourcentages d'utilisation
  - Fonctionnalité de tri par nom, PID, CPU ou GPU
  - Barre de recherche pour filtrer les processus
  - Statistiques en temps réel (nombre de processus, utilisation totale)

- **Interface utilisateur moderne**
  - Navigation à 3 onglets : Monitor, Hardware Details, Processes
  - Design responsive avec Tailwind CSS
  - Animations fluides avec Framer Motion
  - Icônes Lucide React pour une meilleure UX

- **Système de thèmes**
  - Thème sombre par défaut
  - Thème clair disponible
  - Bouton de basculement lune/soleil
  - Persistance du choix de thème dans localStorage

- **Architecture technique**
  - Backend Rust avec Tauri 1.5
  - Frontend React + TypeScript
  - APIs système optimisées avec sysinfo
  - Structure de code modulaire et maintenable

### 🐛 Corrigé
- Calculs CPU incorrects affichant des pourcentages > 100%
- Icône PNG corrompue remplacée par une icône fonctionnelle
- Erreurs de compilation TypeScript
- Problèmes de navigation et de structure des composants

### 🧹 Nettoyé
- Suppression des fichiers de démonstration (demo-web.html)
- Suppression des scripts de lancement obsolètes (launch.ps1)
- Suppression des composants de sauvegarde non utilisés
- Suppression des fichiers de test et utilitaires temporaires
- Structure de projet optimisée et organisée

### 📋 Technique
- **Technologies utilisées :**
  - Tauri 1.5 (Framework d'application desktop)
  - React 18 + TypeScript (Frontend)
  - Rust (Backend)
  - Tailwind CSS (Styling)
  - Framer Motion (Animations)
  - Recharts (Graphiques)
  - Lucide React (Icônes)

- **Architecture :**
  - Pattern de composants React modulaires
  - Gestion d'état avec hooks React
  - Cache de données optimisé
  - APIs Rust exposées via Tauri

### 🎯 Performance
- Mise à jour des données toutes les secondes
- Cache intelligent pour éviter les recalculs
- Interface utilisateur réactive
- Consommation mémoire optimisée

### 📦 Distribution
- Exécutable Windows (.exe) : ~5.9 MB
- Icône d'application personnalisée
- Build de production optimisé

---

## Informations de version

**Date de release :** 8 août 2025  
**Taille de l'exécutable :** ~5.9 MB  
**Plateformes supportées :** Windows  
**Prérequis :** Windows 10/11 64-bit

## Installation

1. Télécharger `WSIMC.exe` depuis les releases GitHub
2. Exécuter le fichier (aucune installation requise)
3. L'application se lance directement

## Utilisation

- **Onglet Monitor :** Vue d'ensemble du système avec graphiques temps réel
- **Onglet Hardware Details :** Informations détaillées sur le matériel et températures
- **Onglet Processes :** Gestion complète des processus système
- **Bouton thème :** Basculer entre thème sombre et clair (icône lune/soleil)

## Contributions

Ce projet est maintenu par [Antoww](https://github.com/Antoww).  
Développé avec l'assistance de GitHub Copilot.

---

*Pour rapporter des bugs ou suggérer des améliorations, veuillez créer une issue sur le [repository GitHub](https://github.com/Antoww/WSIMC).*
