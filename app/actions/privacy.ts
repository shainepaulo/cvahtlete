"use server";

export interface ContactUnlockResult {
  approved: boolean;
}

/**
 * Demande de déverrouillage d'une coordonnée sensible (téléphone / e-mail).
 * Pas de workflow d'approbation tierce pour l'instant : la demande est
 * "approuvée" après un court délai simulant l'aller-retour réseau, comme
 * prévu pour cette itération (approbation réelle = incrément suivant).
 */
export async function requestContactUnlock(input: {
  cvSlug: string;
  fieldLabel: string;
}): Promise<ContactUnlockResult> {
  const cvSlug = String(input.cvSlug ?? "").trim();
  const fieldLabel = String(input.fieldLabel ?? "").trim();
  if (!cvSlug || !fieldLabel) return { approved: false };

  await new Promise((resolve) => setTimeout(resolve, 650));
  return { approved: true };
}
