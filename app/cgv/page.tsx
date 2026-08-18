import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Conditions Générales de Vente — ATHLETE CV',
  robots: { index: false },
}

export default function CgvPage() {
  return (
    <div className="legal">
      <h1>Conditions Générales de Vente</h1>
      <p className="upd">Dernière mise à jour : 18 août 2026</p>

      <h2>1. Objet</h2>
      <p>
        Les présentes conditions générales de vente (« CGV ») régissent les ventes de services proposés par{' '}
        l&apos;agence TALAREF (« le Vendeur ») via le site ATHLETE CV
        (« le Site ») à toute personne y effectuant un achat (« le Client »). Toute commande implique
        l&apos;acceptation pleine et entière des présentes CGV.
      </p>

      <h2>2. Services et offres</h2>
      <p>Le Site propose la création d&apos;un CV d&apos;athlète en ligne accessible via un lien. Les offres et leurs caractéristiques :</p>
      <ul>
        <li><strong>Starter — Gratuit</strong> : CV complet, photos illimitées, thème par défaut, modifications illimitées, watermark visible.</li>
        <li><strong>Pro Athlète — 49 € (ou 29 € en offre de lancement)</strong> : tout Starter, plus vidéos highlights, personnalisation complète, QR code téléchargeable, sans watermark, valable pour toute la saison (jusqu&apos;au 30 juin).</li>
        <li><strong>Sur-mesure — à partir de 249 €</strong> : tout Pro Athlète (Pass Saison inclus), plus shooting photo de match par un photographe du réseau, CV monté sur mesure avec direction artistique, accompagnement personnalisé durant la saison.</li>
      </ul>

      <h2>3. Prix</h2>
      <p>
        Les prix sont indiqués en euros. Le Vendeur se réserve le droit de modifier ses prix à tout moment ;
        les services sont facturés sur la base des tarifs en vigueur au moment de la validation de la commande.{' '}
        Les prix s&apos;entendent toutes taxes comprises (TVA applicable au taux légal en vigueur).
      </p>

      <h2>4. Commande et paiement</h2>
      <p>
        La commande est validée après création d&apos;un compte et paiement en ligne. Le paiement s&apos;effectue
        par les moyens proposés sur le Site. La commande n&apos;est définitive qu&apos;après confirmation du paiement.
      </p>

      <h2>5. Modifications et disponibilité</h2>
      <p>
        Les modifications du CV sont illimitées pour l&apos;ensemble des offres (Starter, Pro Athlète, Sur-mesure) 
        et s&apos;effectuent de manière autonome en ligne (self-service) par le Client via l&apos;éditeur dédié.
      </p>

      <h2>6. Droit de rétractation</h2>
      <p>
        Conformément à l&apos;article L221-28 du Code de la consommation, le Client reconnaît que la fourniture
        d&apos;un contenu numérique commence dès la validation de la commande et renonce expressément à son droit
        de rétractation une fois l&apos;exécution du service commencée avec son accord. Aucun remboursement ne sera effectué après le début de l&apos;exécution du service.
      </p>

      <h2>7. Disponibilité du service</h2>
      <p>
        Le Vendeur s&apos;efforce d&apos;assurer la disponibilité du Site mais ne saurait être tenu responsable
        des interruptions liées à la maintenance, à l&apos;hébergeur ou à des causes indépendantes de sa volonté.
      </p>

      <h2>8. Responsabilité</h2>
      <p>
        Le Client est seul responsable de l&apos;exactitude des informations qu&apos;il fournit pour son CV. Le
        Vendeur ne saurait être tenu responsable des conséquences d&apos;informations erronées fournies par le Client.
      </p>

      <h2>9. Données personnelles</h2>
      <p>
        Le traitement des données personnelles est décrit dans les{' '}
        <Link href="/mentions-legales" style={{ color: 'var(--accent)' }}>mentions légales</Link>.
        Le Client dispose d&apos;un droit d&apos;accès, de rectification et de suppression de ses données.
      </p>

      <h2>10. Droit applicable et litiges</h2>
      <p>
        Les présentes CGV sont soumises au droit français. En cas de litige, une solution amiable sera recherchée
        avant toute action judiciaire. À défaut, les tribunaux compétents seront ceux du ressort du siège du Vendeur.
        En cas de litige non résolu à l&apos;amiable, le Client peut saisir le médiateur de la consommation compétent.
      </p>

      <p style={{ marginTop: 40 }}>
        <Link href="/" style={{ color: 'var(--accent)' }}>← Retour à l&apos;accueil</Link>
      </p>
    </div>
  )
}
