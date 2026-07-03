import type { NoaProfile } from '@/types/noa'

/**
 * Données de Noa Bouchet-Muller — source unique de vérité.
 * Même structure que les données démo « dembele » d'ATHLETE CV,
 * triées pour alimenter les modes Classique et Cinématique.
 */
export const noaProfile: NoaProfile = {
  identity: {
    first: 'Noa',
    last: 'Bouchet-Muller',
    sport: 'Football',
    emoji: '🧤',
    discipline: 'Gardien de but · N°1',
    tagline:
      'Gardien international — deux Coupes du Monde FIFA (U17 & U20) avant 19 ans.',
    bio: 'Gardien de but international formé dans un environnement français d’élite avec une expérience de la Coupe du Monde de la FIFA aux niveaux U17 et U20. Gardien à haut volume d’arrêts avec un sang-froid malgré la pression, une communication claire et une gestion de match fiable. Joue au football en club depuis l’âge de 8 ans.',
    location: 'Antibes (06), France',
    colors: { a: '#79e0cf', b: '#8bb6ff' },
    avatar: '/images/noa3.jpeg',
    verified: true,
    contact: [
      { icon: '📅', label: 'Date de naissance', value: '20/08/2007' },
      { icon: '🇫🇷', label: 'Nationalité', value: 'Française' },
      { icon: '⭐', label: 'Éligibilité', value: 'Nouvelle-Calédonie (Franco-Calédonien)' },
      { icon: '📞', label: 'Téléphone', value: '+33 7 69 69 98 75', href: 'tel:+33769699875' },
      { icon: '✉️', label: 'Courriel', value: 'bnoa843@gmail.com', href: 'mailto:bnoa843@gmail.com' },
    ],
  },

  /* ================= MODE CLASSIQUE ================= */
  classic: {
    stats: [
      { label: 'Âge', value: '18', unit: 'ans' },
      { label: 'Taille', value: '1m86', unit: '' },
      { label: 'Poids', value: '80', unit: 'kg' },
      { label: 'Arrêts — CDM U20 2025', value: '49', unit: '🧤' },
      { label: 'Moyenne d’arrêts / match officiel', value: '13', unit: '' },
      { label: 'Pied préféré', value: 'Droit', unit: '' },
    ],
    palmares: [
      { icon: '🏆', name: 'Coupe du Monde U20 — Chili', count: '2025' },
      { icon: '🌍', name: 'Coupe du Monde U17 — Indonésie', count: '2023' },
      { icon: '🧤', name: 'Arrêts en Coupe du Monde U20', count: '49' },
      { icon: '⏱️', name: 'Minutes disputées au Chili', count: '315' },
    ],
    career: [
      { year: '2025/26', club: 'Cavigal Nice Sport', detail: 'U19 National' },
      { year: '2024/25', club: 'Cavigal Nice Sport', detail: 'U18 Régional 1' },
      { year: '2023/24', club: 'FC Mougins', detail: 'U17 Régional' },
      { year: '2022/23', club: 'FC Mougins', detail: 'U16 Régional 1' },
      { year: '2021/22', club: 'OGC Nice', detail: 'U15 Régional 1' },
      { year: '2020/21', club: 'OGC Nice', detail: 'U14 Régional 1' },
      { year: '2019/20', club: 'OGC Nice', detail: 'U13 Élite' },
      { year: '2018/19', club: 'OGC Nice', detail: 'U12 Élite' },
    ],
    education: [
      {
        year: '2025/2026',
        qualification: 'BTS NDRC (Première année validée)',
        institution: 'Lycée Audiberti',
        location: 'Antibes, France',
      },
      {
        year: '2024/2025',
        qualification: 'Baccalauréat STMG Option RH',
        institution: 'Lycée Audiberti',
        location: 'Antibes, France',
        result: 'Mention Assez Bien',
        notes: 'Moyenne générale : 15/20 — Examen : 13,5/20',
      },
      {
        year: '2021/2022',
        qualification: 'Brevet des Collèges',
        institution: 'Collège Parc Impérial',
        location: 'Nice, France',
        result: 'Mention Bien',
      },
    ],
    experience: [
      {
        title: 'Volontaire JO Paris 2024',
        organization: 'Allianz Riviera',
        period: '2024',
        location: 'Nice, France',
        description:
          'Équipe services aux athlètes et Ballkids Football durant les Jeux Olympiques de Paris 2024.',
      },
      {
        title: 'Stagiaire Sales Development / Marketing',
        organization: 'TimeToBeem',
        period: '1 mois',
        location: 'France',
        description: 'Prospection, CRM et cold calling en environnement B2B SaaS.',
      },
    ],
    languages: [
      { language: 'Français', proficiency: 'Natif' },
      { language: 'Anglais', proficiency: 'Compétence professionnelle (préparation TOEFL en cours)' },
      { language: 'Espagnol', proficiency: 'Notions / Intermédiaire' },
    ],
    references: [
      { name: 'Pierre Wajoka', role: 'Head Coach U20 New Caledonia', phone: '+687 79 64 67' },
      { name: 'François Louis Marie', role: 'Coach adjoint U20 New Caledonia', phone: '+687 75 15 99' },
      {
        name: 'François Seguin',
        role: 'Entraîneur des gardiens',
        organization: 'Olympique de Marseille',
        phone: '+33 (0)6 81 64 39 45',
      },
      { name: 'Birame Seck', role: 'Head Coach', organization: 'L’envol', phone: '+33 (0)6 60 76 67 09' },
    ],
  },

  /* ================= MODE CINÉMATIQUE ================= */
  cinematic: {
    // Galerie plein écran — uniquement les photos de match (pas de fond studio
    // gris). Le texte est ancré en bas de l'écran, les têtes restent visibles.
    gallery: [
      { src: '/images/Noa1.jpeg', alt: 'Noa en action, dégagement au pied — Coupe du Monde U20', position: '50% 14%' },
      { src: '/images/noa2.jpeg', alt: 'Noa de dos, bras ouverts, maillot floqué MULLER — Coupe du Monde U20', position: '50% 5%' },
      { src: '/images/WhatsApp Image 2026-06-27 at 18.32.38.jpeg', alt: 'Noa de dos, maillot MULLER 1, stade FIFA U-20 World Cup', position: '65% 30%' },
    ],
    socials: [
      { icon: 'instagram', label: 'Instagram — @noa.muller1', url: 'https://www.instagram.com/noa.muller1/' },
    ],
    // Les 3 meilleurs arrêts de Noa — CDM U20 (extraits de la vidéo YouTube
    // « GK Highlights | FIFA U20 World Cup 2025 »). Ajuster start/end (secondes)
    // pour caler chaque clip sur le bon moment.
    videos: [
      {
        youtubeId: 'ThdXE7YrFok',
        title: 'Réflexe à bout portant',
        category: 'vs France · Phase de poules',
        description: 'Parade réflexe face à une frappe à bout portant — 8 arrêts dans le match.',
        start: 10,
        end: 40,
        zoom: 1.32,
        shiftY: '-3%',
      },
      {
        youtubeId: 'ThdXE7YrFok',
        title: 'Horizontale pleine lucarne',
        category: 'vs USA · Phase de poules',
        description: 'Détente horizontale pour sortir une frappe qui filait en lucarne — 14 arrêts dans le match.',
        start: 60,
        end: 95,
        zoom: 1.32,
        shiftY: '-3%',
      },
      {
        youtubeId: 'ThdXE7YrFok',
        title: 'Face-à-face décisif',
        category: 'vs Afrique du Sud · Phase de poules',
        description: 'Sortie gagnée dans le un-contre-un — record du tournoi avec 17 arrêts.',
        start: 120,
        end: 155,
        zoom: 1.32,
        shiftY: '-3%',
      },
    ],
    chips: ['🧤 Gardien de but', '#1 Nouvelle-Calédonie U20', '🌍 CDM U17 & U20', '📍 Antibes, France'],
    stats: [
      { label: 'Arrêts — Coupe du Monde U20 2025', value: '49', unit: '🧤' },
      { label: 'Moyenne d’arrêts / match officiel', value: '13', unit: '' },
      { label: 'Minutes disputées au Chili', value: '315', unit: 'min' },
      { label: 'Coupes du Monde FIFA', value: '2', unit: '🌍' },
    ],
    worldCupTitle: 'Coupe du Monde U20 — Chili 2025 · arrêts par match',
    worldCupMatches: [
      { opponent: 'France', stage: 'Poule', minutes: 90, score: '6-0', saves: 8 },
      { opponent: 'USA', stage: 'Poule', minutes: 90, score: '9-1', saves: 14 },
      { opponent: 'Afrique du Sud', stage: 'Poule', minutes: 90, score: '5-0', saves: 17 },
      { opponent: 'Panama', stage: 'Amical', minutes: 90, score: '2-0', saves: 6 },
      { opponent: 'Égypte', stage: 'Amical', minutes: 45, score: '0-0', saves: 4 },
    ],
    career: [
      { year: '2025', club: 'Coupe du Monde U20 — Chili', detail: '49 arrêts' },
      { year: '2025/26', club: 'Cavigal Nice Sport', detail: 'U19 National' },
      { year: '2024', club: 'Volontaire JO Paris 2024', detail: 'Allianz Riviera' },
      { year: '2023', club: 'Coupe du Monde U17 — Indonésie', detail: '1re sélection' },
      { year: '2022/23', club: 'Stage Olympique de Marseille', detail: 'Ligue 1' },
      { year: '2018-22', club: 'Formation OGC Nice', detail: 'U12 → U15' },
    ],
    palmares: [
      { icon: '🏆', name: 'Coupe du Monde U20 (phase de groupes)', count: '2025' },
      { icon: '🌍', name: 'Coupe du Monde U17', count: '2023' },
    ],
  },

  /* ================= CV COMPLET (interface info.html) ================= */
  complet: {
    photo1: '/images/noa3.jpeg',
    photo2: '/images/noa5.jpeg',
    photoPos: 'center 15%',
    number: '1',
    team: { name: 'Cavigal Nice Sport — U19 National' },
    titleIcon: '🧤',
    profileText:
      'Gardien de but international formé dans un environnement français d’élite avec une expérience de la Coupe du Monde de la FIFA aux niveaux U17 et U20. Gardien à haut volume d’arrêts avec un sang-froid malgré la pression, une communication claire et une gestion de match fiable. Joue au football en club depuis l’âge de 8 ans.',
    physicalTitle: 'Caractéristiques physiques',
    physical: [
      { name: 'Taille', value: '1m86' },
      { name: 'Poids', value: '80 kg' },
      { name: 'Âge', value: '18 ans' },
      { name: 'Pied préféré', value: 'Droit', highlight: true },
    ],
    positionsTitle: 'Poste de jeu',
    positionsIcon: '🧤',
    positions: [
      { label: 'Principal', name: 'Gardien de but', detail: 'GK — N°1' },
      { label: 'Sélection', name: 'Nouvelle-Calédonie', detail: 'U20 international' },
    ],
    skills: [
      { name: 'Volume d’arrêts', value: 96 },
      { name: 'Sang-froid', value: 95 },
      { name: 'Distribution', value: 92 },
      { name: 'Communication', value: 90 },
      { name: 'Jeu aérien', value: 88 },
    ],
    timeline: [
      { date: '2025 - Présent', title: 'Cavigal Nice Sport', sub: 'U19 National • France' },
      { date: 'Oct. 2025', title: 'Coupe du Monde U20 — Chili', sub: '49 arrêts en 315 minutes 🧤' },
      { date: '2023 - 2025', title: 'FC Mougins → Cavigal', sub: 'U16 → U18 • France' },
      { date: 'Nov. 2023', title: 'Coupe du Monde U17 — Indonésie', sub: 'Première sélection mondiale' },
      { date: '2018 - 2022', title: 'OGC Nice', sub: 'Formation U12 Élite → U15 R1' },
    ],
    palmares: [
      { icon: '🏆', name: 'Coupe du Monde U20 — Chili', year: '2025' },
      { icon: '🌍', name: 'Coupe du Monde U17 — Indonésie', year: '2023' },
      { icon: '🧤', name: '49 arrêts en Coupe du Monde U20', year: '13/match' },
      { icon: '🇫🇷', name: 'Stages pro : OM, SM Caen, RC Lens, AC Ajaccio, RS Berkane', year: '2021-2026' },
    ],
    pdfUrl: '/docs/Noa_Bouchet_Muller_GK_2026.pdf',
    lastUpdate: 'Juillet 2026',
  },
}
