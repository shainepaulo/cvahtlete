import type { CvCompletProfile } from '@/types/noa'

/**
 * CV complet démo d'Ousmane Dembélé — même modèle que data/noa.ts, limité au
 * sous-ensemble CvCompletProfile (vitrine, hors Supabase). Pas de `pdfUrl` :
 * le bouton Imprimer déclenche l'impression navigateur thémée (@media print),
 * comme pour tous les futurs joueurs de la plateforme.
 */
export const dembeleCompletProfile: CvCompletProfile = {
  identity: {
    first: 'Ousmane',
    last: 'Dembélé',
    contact: [
      { icon: '📅', label: 'Date de naissance', value: '15/05/1997' },
      { icon: '🇫🇷', label: 'Nationalité', value: 'Français' },
      { icon: '📞', label: 'Téléphone', value: '+33 6 XX XX XX XX' },
      { icon: '✉️', label: 'Courriel', value: 'contact@dembele.com' },
      { icon: '📱', label: 'Médias sociaux', value: '@o.dembele7' },
    ],
  },
  complet: {
    photo1: '/images/3.webp',
    photo2: '/images/4.avif',
    photoPos: 'center 20%',
    number: '#10',
    team: { name: 'Paris Saint-Germain' },
    titleIcon: '⚽',
    profileText:
      "Ailier rapide et agile, doté d'une technique exceptionnelle et d'une grande capacité de dribble. " +
      'Ambidextre, ce qui lui permet de jouer sur les deux ailes avec la même efficacité. ' +
      "Fort dans les situations de un contre un, créateur d'occasions et buteur régulier. " +
      'Capable de faire des différences décisives dans les grands matchs.',
    physicalTitle: 'Caractéristiques physiques',
    physical: [
      { name: 'Taille', value: '1,78 m' },
      { name: 'Poids', value: '67 kg' },
      { name: 'Pied préféré', value: 'Ambidextre', highlight: true },
    ],
    positionsTitle: 'Poste(s) de jeu',
    positionsIcon: '🎯',
    positions: [
      { label: 'Principal', name: 'Ailier', detail: 'Gauche / Droit' },
      { label: 'Secondaire', name: 'Avant-centre', detail: 'Attaquant' },
    ],
    skills: [
      { name: 'Vitesse', value: 95 },
      { name: 'Dribble', value: 92 },
      { name: 'Passes', value: 82 },
      { name: 'Tirs', value: 78 },
      { name: 'Technique', value: 90 },
    ],
    timeline: [
      { date: '2023 - Présent', title: 'Paris Saint-Germain', sub: 'Ligue 1 • France' },
      { date: '2017 - 2023', title: 'FC Barcelone', sub: 'La Liga • Espagne' },
      { date: '2016 - 2017', title: 'Borussia Dortmund', sub: 'Bundesliga • Allemagne' },
      { date: '2015 - 2016', title: 'Stade Rennais', sub: 'Ligue 1 • France' },
    ],
    palmares: [
      { icon: '🇺🇸', name: 'Coupe du Monde (États-Unis)', year: '2026 — En cours' },
      { icon: '🏅', name: "Ballon d'Or", year: '2025' },
      { icon: '🏆', name: 'Ligue des Champions', year: '2025, 2026' },
      { icon: '🏆', name: 'Coupe du Monde', year: '2018' },
      { icon: '🏆', name: 'Ligue des Nations', year: '2021' },
      { icon: '🏆', name: 'La Liga', year: '2019' },
      { icon: '🏆', name: 'Ligue 1', year: '2024, 2025' },
      { icon: '🏆', name: 'Coupe de France', year: '2024' },
    ],
    lastUpdate: 'Juillet 2026',
  },
}
