export default function MentionsLegales() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-sm leading-relaxed" style={{ color: 'var(--brand-text)', background: 'var(--brand-navy)' }}>
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--brand-cyan)' }}>
        Mentions Légales & CGU
      </h1>
      <p className="mb-10 text-xs" style={{ color: 'var(--brand-text-muted)' }}>Version 1.0 — Mars 2026 — Studio Manager by Intemporelle</p>

      {/* Mentions légales */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--brand-cyan)' }}>Mentions Légales</h2>
        <div className="p-5 rounded-lg space-y-2" style={{ background: 'var(--brand-surface)' }}>
          <p><strong>Éditeur :</strong> Intemporelle — François Dimpre</p>
          <p><strong>Site :</strong> app.intemporelle.eu</p>
          <p><strong>Contact :</strong> <a href="mailto:rgpd@intemporelle.eu" style={{ color: 'var(--brand-cyan)' }}>rgpd@intemporelle.eu</a></p>
          <p><strong>Hébergeur :</strong> Manus (Union Européenne)</p>
          <p><strong>Nom de domaine :</strong> IONOS SARL — 7 place de la Gare, BP 70109, 57201 Sarreguemines Cedex</p>
        </div>
      </section>

      {/* CGU */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--brand-cyan)' }}>Conditions Générales d'Utilisation (CGU)</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Article 1 — Objet</h3>
            <p style={{ color: 'var(--brand-text-muted)' }}>
              Les présentes CGU régissent l'accès et l'utilisation de l'application <strong style={{ color: 'var(--brand-text)' }}>Studio Manager</strong>, logiciel SaaS destiné exclusivement aux professionnels du tatouage et du piercing pour la gestion de leur activité.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Article 2 — Obligations de l'utilisateur professionnel</h3>
            <p className="mb-2" style={{ color: 'var(--brand-text-muted)' }}>En tant que responsable de traitement au sens du RGPD, l'utilisateur s'engage à :</p>
            <ul className="space-y-2">
              {[
                "Informer ses clients de la collecte et du traitement de leurs données personnelles (art. 13 RGPD)",
                "Recueillir le consentement explicite de chaque client avant tout traitement de données de santé",
                "Ne collecter que les données strictement nécessaires (principe de minimisation, art. 5§1c RGPD)",
                "Respecter les durées de conservation définies dans la politique de confidentialité",
                "Signaler immédiatement toute violation de données à rgpd@intemporelle.eu",
                "Ne pas utiliser la plateforme à des fins illicites",
              ].map((item, i) => (
                <li key={i} className="flex gap-2 text-xs p-2 rounded" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--brand-text-muted)', listStyle: 'none' }}>
                  <span style={{ color: 'var(--brand-cyan)', flexShrink: 0 }}>→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Article 3 — Données de santé — Obligations spécifiques</h3>
            <div className="p-4 rounded-lg border-l-4 text-xs" style={{ background: 'rgba(255, 82, 130, 0.08)', borderColor: 'var(--brand-pink)', color: 'var(--brand-text-muted)' }}>
              <p className="font-semibold mb-2" style={{ color: 'var(--brand-pink)' }}>⚠️ Données de santé — Obligations renforcées</p>
              <p>Les questionnaires médicaux contiennent des données de santé au sens de l'article 9 du RGPD. L'utilisateur s'engage à :</p>
              <ul className="mt-2 space-y-1">
                <li>• Utiliser ces données uniquement pour l'évaluation médicale pré-intervention</li>
                <li>• Ne pas partager les données médicales avec des tiers non autorisés</li>
                <li>• Tenir un registre des activités de traitement (art. 30 RGPD)</li>
                <li>• Réaliser une AIPD si nécessaire (traitements à risque élevé)</li>
              </ul>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Article 4 — Responsabilités</h3>
            <p style={{ color: 'var(--brand-text-muted)' }}>
              <strong style={{ color: 'var(--brand-text)' }}>Intemporelle</strong> est responsable du bon fonctionnement technique de la plateforme et de la sécurité de l'infrastructure.
            </p>
            <p className="mt-2" style={{ color: 'var(--brand-text-muted)' }}>
              <strong style={{ color: 'var(--brand-text)' }}>L'utilisateur professionnel</strong> est seul responsable de l'utilisation qu'il fait de la plateforme, de la légalité des traitements effectués, et du respect du RGPD vis-à-vis de ses propres clients.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Article 5 — Droit applicable</h3>
            <p style={{ color: 'var(--brand-text-muted)' }}>
              Les présentes CGU sont soumises au <strong style={{ color: 'var(--brand-text)' }}>droit français</strong>. En cas de litige, les parties s'efforceront de trouver une solution amiable. À défaut, les tribunaux français seront compétents.
            </p>
          </div>
        </div>
      </section>

      {/* CGV */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--brand-cyan)' }}>Conditions Générales de Vente (CGV)</h2>
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Article 1 — Objet</h3>
            <p style={{ color: 'var(--brand-text-muted)' }}>
              Les présentes CGV régissent les relations entre <strong style={{ color: 'var(--brand-text)' }}>Intemporelle</strong> et tout professionnel souscrivant un abonnement à Studio Manager. Ces CGV sont exclusivement applicables aux professionnels (B2B).
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Article 2 — Abonnement et paiement</h3>
            <p style={{ color: 'var(--brand-text-muted)' }}>
              L'abonnement est souscrit pour une durée mensuelle ou annuelle, tacitement reconductible. Le paiement est effectué par prélèvement automatique ou carte bancaire. En cas d'impayé, l'accès peut être suspendu après mise en demeure de 15 jours.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Article 3 — Résiliation</h3>
            <p style={{ color: 'var(--brand-text-muted)' }}>
              L'abonnement peut être résilié à tout moment depuis l'espace client, avec effet à la fin de la période en cours. Les données sont conservées 30 jours après résiliation, puis définitivement supprimées.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--brand-text)' }}>Article 4 — Disponibilité du service</h3>
            <p style={{ color: 'var(--brand-text-muted)' }}>
              Intemporelle s'engage à maintenir un taux de disponibilité de 99,5% (hors maintenance planifiée) et à notifier le client en cas d'incident de sécurité dans les 24 heures.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-10 pt-6 text-xs text-center" style={{ borderTop: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)' }}>
        Studio Manager by Intemporelle — <a href="mailto:rgpd@intemporelle.eu" style={{ color: 'var(--brand-cyan)' }}>rgpd@intemporelle.eu</a>
      </div>
    </div>
  );
}
