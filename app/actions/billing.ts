"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getStripe } from "@/utils/stripe";

/**
 * Facturation côté utilisateur — PAIEMENT UNIQUE, jamais d'abonnement.
 * L'annulation d'essai est la seule écriture initiée par l'utilisateur :
 * elle passe par le serveur (session vérifiée) puis Stripe ; le webhook
 * payment_intent.canceled fait foi pour couper les avantages.
 */

export interface MyBilling {
  status: "free" | "active" | "trialing" | "past_due" | "canceled";
  plan: string;
  /** ISO — présent uniquement pendant l'essai Pro. */
  trialEndsAt: string | null;
}

export async function getMyBilling(): Promise<MyBilling | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select("status, plan, trial_ends_at")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) return null;
  return {
    status: data.status as MyBilling["status"],
    plan: data.plan,
    trialEndsAt: data.trial_ends_at,
  };
}

export interface CancelTrialResult {
  ok?: string;
  error?: string;
}

/**
 * Annulation pendant l'essai Pro (avant J+3) :
 *  · l'autorisation Stripe est annulée => AUCUN débit ;
 *  · le CV devient instantanément indisponible en ligne (visibility private) ;
 *  · les avantages du plan sont coupés immédiatement (sans attendre le webhook,
 *    qui confirme ensuite — idempotent).
 */
export async function cancelTrial(): Promise<CancelTrialResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Connecte-toi pour gérer ton offre." };

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("status, stripe_payment_intent_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!sub || sub.status !== "trialing") {
    return { error: "Aucun essai en cours à annuler." };
  }

  if (sub.stripe_payment_intent_id) {
    try {
      const stripe = getStripe();
      const intent = await stripe.paymentIntents.retrieve(sub.stripe_payment_intent_id);
      if (intent.status === "requires_capture") {
        await stripe.paymentIntents.cancel(intent.id);
      }
    } catch (e) {
      console.error("[billing] Annulation Stripe impossible :", e);
      return { error: "Annulation impossible pour le moment. Réessaie ou contacte-nous." };
    }
  }

  const now = new Date().toISOString();
  await admin
    .from("subscriptions")
    .update({ status: "canceled", plan: "free", trial_ends_at: null, updated_at: now })
    .eq("user_id", user.id);
  await admin.from("profiles").update({ plan: "free" }).eq("id", user.id);
  await admin.from("cvs").update({ visibility: "private" }).eq("user_id", user.id);

  revalidatePath("/dashboard");
  return { ok: "Essai annulé : aucun débit. Ton CV n'est plus visible en ligne." };
}
