/**
 * Types du CV de Noa — même modèle de données que le CV démo « dembele »
 * d'ATHLETE CV (ProfileView + mode cinématique), enrichi des sections
 * spécifiques au dossier de Noa (formation, expériences, langues, références).
 */

export interface StatItem {
  label: string
  value: string
  unit?: string
}

export interface TrophyItem {
  icon: string
  name: string
  count: string
}

export interface CareerStep {
  year: string
  club: string
  detail?: string
}

export interface ContactItem {
  icon: string
  label: string
  value: string
  href?: string
}

export interface EducationEntry {
  year: string
  qualification: string
  institution: string
  location: string
  result?: string
  notes?: string
}

export interface ProfessionalExperience {
  title: string
  organization: string
  period: string
  location: string
  description: string
}

export interface LanguageSkill {
  language: string
  proficiency: string
}

export interface Reference {
  name: string
  role: string
  organization?: string
  phone: string
}

export interface MatchStat {
  opponent: string
  stage: string
  minutes: number
  score: string
  saves: number
}

/** Identité + rendu ProfileView (mêmes champs que dembele.json). */
export interface NoaIdentity {
  first: string
  last: string
  sport: string
  emoji: string
  discipline: string
  tagline: string
  bio: string
  location: string
  colors: { a: string; b: string }
  avatar: string
  verified: boolean
  contact: ContactItem[]
}

/** Mode Classique — stats, parcours, diplômes, clubs, références. */
export interface NoaClassicData {
  stats: StatItem[]
  palmares: TrophyItem[]
  career: CareerStep[]
  education: EducationEntry[]
  experience: ProfessionalExperience[]
  languages: LanguageSkill[]
  references: Reference[]
  characteristics?: Record<string, string>
  showCharacteristics?: boolean
}

export interface GalleryPhoto {
  src: string
  alt: string
  /** object-position CSS, réglé par image pour garder tête/action visibles. */
  position: string
}

export interface SocialLink {
  /** Clé de l'icône SVG intégrée (voir CinematicView). */
  icon: 'instagram'
  label: string
  url: string
}

export interface VideoClip {
  youtubeId: string
  title: string
  category: string
  description: string
  /** Début du clip en secondes dans la vidéo YouTube. */
  start: number
  /** Fin du clip en secondes. */
  end: number
  /** Zoom dans l'image pour masquer le navigateur capturé dans la vidéo (ex. 1.3). */
  zoom?: number
  /** Décalage vertical du cadrage (ex. '-3%' remonte l'image). */
  shiftY?: string
}

/** Mode Cinématique — médias, citation, moments clés, dataviz de performances. */
export interface NoaCinematicData {
  /** Galerie plein écran, cliquable pour changer de photo (voir CinematicView). */
  gallery: GalleryPhoto[]
  socials: SocialLink[]
  videos: VideoClip[]
  chips: string[]
  stats: StatItem[]
  worldCupTitle: string
  worldCupMatches: MatchStat[]
  career: CareerStep[]
  palmares: TrophyItem[]
}

export interface PhysicalAttribute {
  name: string
  value: string
  highlight?: boolean
}

export interface PositionCard {
  label: string
  name: string
  detail: string
}

export interface SkillRating {
  name: string
  value: number
}

export interface TimelineEntry {
  date: string
  title: string
  sub: string
}

export interface PalmaresYearItem {
  icon: string
  name: string
  year: string
}

/**
 * Page « CV complet » — interface info.html : header navy, colonnes
 * profil/compétences, footer print. Modèle partagé par tous les joueurs
 * (Noa, démo Dembélé, futurs profils).
 */
export interface NoaCompletData {
  photo1: string
  photo2: string
  photoPos: string
  number: string
  team: { name: string }
  titleIcon: string
  profileText: string
  physicalTitle: string
  physical: PhysicalAttribute[]
  positionsTitle: string
  positionsIcon: string
  positions: PositionCard[]
  skills: SkillRating[]
  timeline: TimelineEntry[]
  palmares: PalmaresYearItem[]
  /** PDF officiel importé (exception Noa). Absent → impression navigateur thémée. */
  pdfUrl?: string
  lastUpdate: string
}

/** Sous-ensemble d'identité requis par la vue CV complet (header + contacts). */
export interface CompletIdentity {
  first: string
  last: string
  contact: ContactItem[]
}

/**
 * Profil minimal consommé par CvCompletView — NoaProfile y est
 * structurellement assignable ; les profils démo (Dembélé) le remplissent
 * directement sans porter les sections classic/cinematic.
 */
export interface CvCompletProfile {
  identity: CompletIdentity
  complet: NoaCompletData
}

export interface NoaProfile {
  identity: NoaIdentity
  classic: NoaClassicData
  cinematic: NoaCinematicData
  complet: NoaCompletData
}
