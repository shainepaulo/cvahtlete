# Audit V1 & Comparaison Modèle Noah

Ce document évalue l'état fonctionnel actuel de la version V1 de **CV Athlete**, identifie les éléments manquants pour compléter cette version, et propose une refonte du formulaire/builder générique en s'inspirant des atouts et limites du modèle sur-mesure de **Noa Muller**.

---

## 1. État de la V1 Actuelle (Compilation & Build)

L'application est saine et robuste sur le plan technique :
* **Vérification TypeScript (`tsc --noEmit`)** : Passée avec **0 erreur**.
* **Build Next.js (`npm run build`)** : Passé avec succès. Toutes les routes dynamiques (`/[slug]`), statiques (`/tarifs`, `/concept`) et d'administration/builder sont générées correctement.

---

## 2. Audit Détaillé des Fonctionnalités V1

Voici l'analyse de conformité par rapport au périmètre attendu pour la V1 :

### 1️⃣ Profil Sportif Personnalisable
* **Statut** : **Fonctionnel (statique)**
* **Ce qui est implémenté** : Le builder classique permet d'éditer l'identité (Nom, prénom, sport, poste, accroche, bio, localisation, photo) et une table de caractéristiques physiques ou générales (Nationalité, Taille, Poids, Club, Numéro).
* **Ce qui manque (Écart V1)** :
  * **Drag & Drop des blocs** : Actuellement, l'ordre des sections (À propos → Stats → Palmarès → Parcours) est codé en dur dans [ProfileView.tsx](file:///Users/toshh/Desktop/TALAREF/Website/cvahtlete/components/ProfileView.tsx). L'utilisateur ne peut pas réorganiser ses blocs comme sur Beacons/Linktree.

### 2️⃣ URL Publique
* **Statut** : **Fonctionnel**
* **Ce qui est implémenté** : Servie via `/[slug]`, avec gestion RLS (visibilité publique ou privée accessible uniquement via lien direct), et redirection si le compte est bloqué/suspendu.
* **Ce qui manque** :
  * Une redirection propre ou une sous-route pour le mode cinématique (ex: `cvathlete.com/teddy/cine` au lieu de `cvathlete.com/cine?u=teddy`).

### 3️⃣ Médias & Highlights
* **Statut** : **Partiellement Implémenté**
* **Ce qui est implémenté** : L'athlète peut ajouter une photo de profil et une seule image de fond signature (`cineBg`) pour le mode cinématique.
* **Ce qui manque (Écart V1)** :
  * **Highlights Vidéo** : Il n'y a actuellement aucun champ dans le builder générique ni de colonne dans la table SQL `cvs` pour stocker des liens vidéos (YouTube/Vimeo) pour les utilisateurs classiques. Seul le profil codé en dur de Noa Muller en bénéficie.

### 4️⃣ Statistiques & Parcours
* **Statut** : **Fonctionnel**
* **Ce qui est implémenté** : Formulaire dynamique avec ajout/suppression de lignes (jusqu'à 12 entrées max) pour les statistiques clés, le palmarès et le parcours (chronologie).

### 5️⃣ PDF Automatique
* **Statut** : **Rudimentaire**
* **Ce qui est implémenté** : Dans la vue complète, le bouton "Imprimer" appelle `window.print()`, s'appuyant sur les règles `@media print` de [cv-complet.css](file:///Users/toshh/Desktop/TALAREF/Website/cvahtlete/components/noa/complet/cv-complet.css) pour générer une mise en page propre.
* **Ce qui manque (Écart V1)** :
  * **Bouton d'export PDF direct** : Aucun bouton "Télécharger mon CV PDF" n'est présent sur le profil public classique `/[slug]`.
  * **Génération automatique** : Pas de service de génération PDF automatique (côté serveur ou client) exportant un fichier propre sans passer par la boîte de dialogue d'impression du navigateur.

### 6️⃣ QR Code
* **Statut** : **Fonctionnel**
* **Ce qui est implémenté** : Génération dynamique d'un QR code via l'API externe `qrserver.com` affiché dans le tableau de bord utilisateur (accessible uniquement pour les comptes Pro/Club/Saison).
* **Ce qui manque (Écart V1)** :
  * **Athlete Card** : La fonctionnalité de génération d'une carte d'identité sportive visuelle (contenant la photo, le sport, le poste, le QR code et l'URL publique) prête à être partagée sur Instagram ou imprimée n'existe pas.

---

## 3. Analyse du CV de Noah : Quoi Transposer dans le Builder Unique ?

Le profil sur-mesure de **Noa Muller** regorge d'éléments premium qu'il faut intégrer au builder générique tout en éliminant les spécificités trop rigides.

### 🌟 Ce qu'il faut intégrer / généraliser à tous les athlètes :

1. **Le sélecteur de mode (Classic vs Cinematic)** :
   * Actuellement exclusif à la route `/cv/noa`, ce switch doit être présent en haut de chaque profil d'athlète (si l'option Pro est active) pour permettre aux recruteurs de basculer en un clic.
2. **Le Privacy Lock (Coordonnées Floutées)** :
   * Les coordonnées (téléphone, e-mail) et les contacts des références doivent être floutés par défaut avec le composant [BlurValue](file:///Users/toshh/Desktop/TALAREF/Website/cvahtlete/components/privacy/BlurValue.tsx), nécessitant un clic de vérification du recruteur.
3. **Le découpage des vidéos (Cuts YouTube)** :
   * Transposer le modèle de données de Noa où chaque highlight vidéo a : un `youtubeId`, un titre, une catégorie, une description, ainsi que des paramètres de début/fin (`start` / `end` en secondes) et de positionnement (`zoom`, `shiftY`).
4. **La double photo interactive** :
   * Dans la vue complète du profil, la possibilité de mettre deux photos (ex: portrait studio + action en match) interchangeables au clic apporte un effet très qualitatif.
5. **Le Dossier Complet (Education, Expériences, Références)** :
   * Permettre à tous les athlètes d'éditer leur parcours extra-sportif, leurs compétences clés (avec barres de progression %), leurs langues et leurs références professionnelles directement dans le builder.

### 🗑️ Ce qu'il faut enlever ou simplifier :

1. **La table des matchs spécifique ("worldCupMatches")** :
   * Trop spécifique aux sports collectifs et aux statistiques de gardien (arrêts, minutes). Il faut la remplacer par une section "Statistiques détaillées par saison" plus générique ou ne pas l'imposer par défaut.
2. **La duplication de route pour la vue complète** :
   * Avoir une sous-route `/complet` alourdit la structure. Le profil classique unique `/[slug]` doit directement intégrer les informations complètes (via des accordéons ou des onglets) pour éviter de multiplier les pages.

---

## 4. Plan de Priorisation pour Finaliser la V1

Pour que la V1 soit totalement fonctionnelle et commercialisable sans lancer 40 chantiers :

```mermaid
graph TD
    A[V1 Actuelle] --> B[1. Intégrer les Highlights Vidéos & Galerie dans le Builder]
    A --> C[2. Ajouter l'export PDF & switch Classique/Cine sur /[slug]]
    A --> D[3. Créer l'Athlete Card avec QR Code dans le Dashboard]
    B --> E[V1 FINALE PRÊTE]
    C --> E
    D --> E
```

### 📋 Actions immédiates proposées :
1. **Élargir la structure SQL & Données (`CvData`)** :
   * Ajouter les colonnes JSONB `videos` (pour les clips découpés) et `gallery` (carrousel photo) dans la table `cvs`.
2. **Unifier le Rendu Public (`/[slug]`)** :
   * Fusionner le switch de mode `ClassicView` / `CinematicView` de Noa pour que n'importe quel joueur bénéficiant de l'option Pro puisse être vu dans les deux modes sur sa page unique.
3. **Générer le PDF automatique** :
   * Ajouter un bouton de téléchargement PDF sur le profil classique qui lance proprement l'impression de la vue complète du CV.
