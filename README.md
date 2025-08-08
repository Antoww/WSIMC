# 🖥️ WSIMC - What's In My Computer?

Une application desktop moderne pour analyser les composants hardware de votre ordinateur.

![Tauri](https://img.shields.io/badge/tauri-%2324C8DB.svg?style=for-the-badge&logo=tauri&logoColor=%23FFFFFF)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Rust](https://img.shields.io/badge/rust-%23000000.svg?style=for-the-badge&logo=rust&logoColor=white)

## ✨ Fonctionnalités

### � **Monitoring temps réel**
- Utilisation CPU avec graphiques animés
- Consommation RAM en direct
- Mise à jour toutes les 2 secondes

### ⚙️ **Analyse hardware complète**
- **Système** : OS, version, nom PC, uptime
- **Processeur** : Modèle, cœurs, fréquences
- **Mémoire** : RAM totale/utilisée/libre, swap
- **Stockage** : Tous les disques avec espaces et pourcentages
- **GPU** : Cartes graphiques avec mémoire vidéo (si disponible)

### 🎨 **Interface moderne**
- Design glassmorphism avec Tailwind CSS
- Animations fluides avec Framer Motion
- Thème responsive et professionnel
- Navigation par onglets intuitive

## 🚀 Installation et lancement

### Prérequis
- [Node.js](https://nodejs.org/) (v16+)
- [Rust](https://rustup.rs/) 
- [Visual Studio Build Tools](https://visualstudio.microsoft.com/fr/visual-cpp-build-tools/) avec "Outils de build C++"

### Lancement
```bash
cd tauri-app
npm install
npm run tauri dev
```

### Build de production
```bash
npm run tauri build
```

## 🛠️ Technologies

- **Backend** : Rust + Tauri + sysinfo (analyse système native)
- **Frontend** : React + TypeScript + Tailwind CSS
- **Animations** : Framer Motion
- **Icons** : Lucide React
- **Build** : Vite

## 📁 Structure

```
WSIMC/
├── tauri-app/           # Application principale
│   ├── src/             # Frontend React
│   ├── src-tauri/       # Backend Rust
│   └── package.json
├── demo-web.html        # Démonstration web
└── README.md
```

## 🎯 Avantages

- ✅ **Performance** : ~15-30 MB RAM (vs 150+ MB Electron)
- ✅ **Sécurité** : Backend Rust isolé
- ✅ **Cross-platform** : Windows, macOS, Linux
- ✅ **Interface native** : WebView système
- ✅ **Hot reload** : Développement rapide

## 📸 Aperçu

L'application dispose de deux vues principales :
- **Monitoring** : Surveillance temps réel CPU/RAM
- **Hardware** : Informations détaillées de tous les composants

---

**Développé avec ❤️ en Rust + React**
