import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Mentions légales — ATHLETE CV',
  robots: { index: false },
}

export default function MentionsLegalesPage() {
  return (
    <div className="legal">
      <h1>Mentions légales</h1>
      <p className="upd">Dernière mise à jour : 18 août 2026</p>

      <h2>Éditeur du site</h2>
      <ul>
        <li>Nom / Raison sociale : TALAREF</li>
        <li>Statut juridique : Société par Actions Simplifiée (SAS)</li>
        <li>Adresse : Paris, France</li>
        <li>SIRET : [SIRET à compléter]</li>
        <li>E-mail : mpika.toshiro@talaref.co</li>
        <li>Téléphone : [Téléphone à compléter]</li>
      </ul>

      <h2>Directeur de la publication</h2>
      <p>MPIKA Toshiro</p>

      <h2>Hébergement</h2>
      <p>Le site est hébergé par : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.</p>

      <h2>Propriété intellectuelle</h2>
      <p>
        L&apos;ensemble des éléments du site (structure, code, design, textes, logo) est protégé par le droit de la
        propriété intellectuelle. Toute reproduction non autorisée est interdite. Les images d&apos;athlètes utilisées
        à titre d&apos;exemple proviennent de sources sous licence libre (Wikimedia Commons) ou de banques de vidéos
        libres de droits (Pexels) et restent la propriété de leurs auteurs respectifs.
      </p>

      <h2>Données personnelles (RGPD)</h2>
      <p>
        Les données collectées (nom, e-mail, mot de passe chiffré, données du CV) sont nécessaires à la fourniture
        du service. Elles ne sont ni vendues ni cédées à des tiers. Conformément au RGPD, vous disposez d&apos;un
        droit d&apos;accès, de rectification, de portabilité et de suppression de vos données. Pour exercer ces droits :{' '}
        mpika.toshiro@talaref.co.
      </p>

      <h2>Cookies</h2>
      <p>
        Le site utilise un cookie strictement nécessaire à l&apos;authentification (cookie de session sécurisé).
        Aucun cookie publicitaire ou de traçage tiers n&apos;est déposé sans consentement.
      </p>

      <h2>Contact</h2>
      <p>Pour toute question : mpika.toshiro@talaref.co.</p>

      <p style={{ marginTop: 40 }}>
        <Link href="/" style={{ color: 'var(--accent)' }}>← Retour à l&apos;accueil</Link>
        {' · '}
        <Link href="/cgv" style={{ color: 'var(--accent)' }}>CGV</Link>
      </p>
    </div>
  )
}
