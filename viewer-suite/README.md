# Viewer Suite

Mini-application Next.js autonome pour le Mode Cinématique et le Mode CV Classique.

## Architecture

- `app/`
  - `layout.tsx` : racine du layout Next.js
  - `page.tsx` : page principale avec bascule de mode
  - `globals.css` : styles globaux et animations
- `components/`
  - `CinematicMode.tsx` : vue immersive animée, navigation temps réel
  - `ClassicCvMode.tsx` : rendu print-friendly et structuré du CV
  - `ModeSwitcher.tsx` : contrôle de sélection du mode
- `data/`
  - `data.ts` : mock data typé de profil utilisateur
- `types/`
  - `profile.ts` : types TypeScript partagés

## Installation

1. Positionnez-vous dans le dossier `viewer-suite`
2. Lancez `npm install`
3. Démarrez avec `npm run dev`

## Usage

- `http://localhost:3000` pour tester le mode Cinématique et le mode CV Classique.
- Composants séparés et indépendants, prêts à être extraits dans une librairie ou intégrés dans un autre projet.
