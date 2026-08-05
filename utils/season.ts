/**
 * Calcule dynamiquement la date d'expiration de la saison en cours.
 * La saison se termine le 30 juin de chaque année.
 * Si la date fournie est après le 30 juin d'une année N, la saison expire le 30 juin de l'année N+1.
 * Si elle est avant ou égale, elle expire le 30 juin de l'année N.
 */
export function getSeasonExpirationDate(now: Date = new Date()): Date {
  const currentYear = now.getFullYear();
  // 5 représente Juin car les mois sont indexés à 0 en JS (0 = Janvier, 5 = Juin)
  const expirationDate = new Date(currentYear, 5, 30, 23, 59, 59, 999);
  
  if (now > expirationDate) {
    expirationDate.setFullYear(currentYear + 1);
  }
  
  return expirationDate;
}

/**
 * Formate une date au format français DD/MM/YYYY.
 */
export function formatDateFR(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
