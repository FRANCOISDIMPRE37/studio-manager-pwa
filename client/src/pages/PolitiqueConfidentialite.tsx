import Layout from "@/components/Layout";

export default function PolitiqueConfidentialite() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10 text-sm leading-relaxed" style={{ color: 'var(--brand-text)', background: 'var(--brand-navy)' }}>
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--brand-cyan)' }}>
        Politique de Confidentialité
      </h1>
      <p className="mb-8 text-xs" style={{ color: 'var(--brand-text-muted)' }}>Dernière mise à jour : Mars 2026 — Studio Manager by Intemporelle</p>

      {/* Section 1 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--brand-cyan)' }}>1. Responsable de traitement</h2>
        <p>
          La présente politique de confidentialité s'applique à l'application <strong>Studio Manager</strong>, accessible à l'adresse <strong>app.intemporelle.eu</strong>, éditée par <strong>Intemporelle</strong> (François Dimpre), France.
        </p>
        <p className="mt-2">Contact RGPD : <a href="mailto:rgpd@intemporelle.eu" style={{ color: 'var(--brand-cyan)' }}>rgpd@intemporelle.eu</a></p>
      </section>

      {/* Section 2 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--brand-cyan)' }}>2. Données collectées et finalités</h2>
        <p className="mb-3">Studio Manager collecte et traite les catégories de données suivantes :</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse mb-4" style={{ borderColor: 'var(--brand-border)' }}>
            <thead>
              <tr style={{ background: 'var(--brand-surface)', color: 'var(--brand-cyan)' }}>
                <th className="p-3 text-left border" style={{ borderColor: 'var(--brand-border)' }}>Catégorie</th>
                <th className="p-3 text-left border" style={{ borderColor: 'var(--brand-border)' }}>Données</th>
                <th className="p-3 text-left border" style={{ borderColor: 'var(--brand-border)' }}>Finalité</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderColor: 'var(--brand-border)' }}>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Identité clients</td>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Nom, prénom, date de naissance, téléphone</td>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Gestion de la relation client</td>
              </tr>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'var(--brand-border)' }}>
                <td className="p-3 border font-semibold" style={{ borderColor: 'var(--brand-border)', color: 'var(--brand-pink)' }}>Données de santé ⚠️</td>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Antécédents médicaux, allergies, contre-indications</td>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Évaluation médicale pré-intervention</td>
              </tr>
              <tr style={{ borderColor: 'var(--brand-border)' }}>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Données mineurs</td>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Identité représentant légal, autorisation parentale</td>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Conformité légale</td>
              </tr>
              <tr style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'var(--brand-border)' }}>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Données professionnels</td>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Données de connexion, facturation</td>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Gestion des abonnements</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="p-4 rounded-lg border-l-4 text-xs" style={{ background: 'rgba(255, 82, 130, 0.08)', borderColor: 'var(--brand-pink)', color: 'var(--brand-text-muted)' }}>
          <strong style={{ color: 'var(--brand-pink)' }}>⚠️ Données de santé — Article 9 RGPD :</strong> Les données médicales constituent des données sensibles au sens du RGPD. Leur traitement est subordonné à votre <strong>consentement explicite</strong> recueilli avant toute intervention.
        </div>
      </section>

      {/* Section 3 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--brand-cyan)' }}>3. Base légale des traitements</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ background: 'var(--brand-surface)', color: 'var(--brand-cyan)' }}>
                <th className="p-3 text-left border" style={{ borderColor: 'var(--brand-border)' }}>Traitement</th>
                <th className="p-3 text-left border" style={{ borderColor: 'var(--brand-border)' }}>Base légale (RGPD)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Questionnaires médicaux", "Consentement explicite (art. 9§2a) + Obligation légale (art. 6§1c)"],
                ["Autorisations parentales", "Obligation légale (art. 6§1c)"],
                ["Gestion des rendez-vous", "Exécution du contrat (art. 6§1b)"],
                ["Facturation", "Obligation légale (art. 6§1c) — Code du commerce"],
              ].map(([t, b], i) => (
                <tr key={i} style={{ background: i % 2 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                  <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>{t}</td>
                  <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--brand-cyan)' }}>4. Durées de conservation</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ background: 'var(--brand-surface)', color: 'var(--brand-cyan)' }}>
                <th className="p-3 text-left border" style={{ borderColor: 'var(--brand-border)' }}>Catégorie</th>
                <th className="p-3 text-left border" style={{ borderColor: 'var(--brand-border)' }}>Durée</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Questionnaires médicaux adultes", "3 ans actifs + 5 ans archives"],
                ["Autorisations parentales mineurs", "Jusqu'à la majorité + 3 ans"],
                ["Données de rendez-vous", "1 an"],
                ["Données de facturation", "10 ans (obligation légale)"],
                ["Données de connexion", "12 mois"],
              ].map(([c, d], i) => (
                <tr key={i} style={{ background: i % 2 ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                  <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>{c}</td>
                  <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 5 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--brand-cyan)' }}>5. Vos droits</h2>
        <p className="mb-3">Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :</p>
        <ul className="space-y-2 list-none">
          {[
            ["Droit d'accès (art. 15)", "Obtenir une copie de vos données personnelles"],
            ["Droit de rectification (art. 16)", "Corriger des données inexactes ou incomplètes"],
            ["Droit à l'effacement (art. 17)", "Demander la suppression de vos données"],
            ["Droit à la limitation (art. 18)", "Restreindre le traitement de vos données"],
            ["Droit à la portabilité (art. 20)", "Recevoir vos données dans un format structuré"],
            ["Droit d'opposition (art. 21)", "Vous opposer au traitement de vos données"],
            ["Retrait du consentement", "Retirer votre consentement à tout moment"],
          ].map(([droit, desc], i) => (
            <li key={i} className="flex gap-3 p-3 rounded" style={{ background: 'var(--brand-surface)' }}>
              <span style={{ color: 'var(--brand-cyan)' }}>→</span>
              <div>
                <strong style={{ color: 'var(--brand-text)' }}>{droit}</strong>
                <span style={{ color: 'var(--brand-text-muted)' }}> — {desc}</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Pour exercer vos droits : <a href="mailto:rgpd@intemporelle.eu" style={{ color: 'var(--brand-cyan)' }}>rgpd@intemporelle.eu</a>
        </p>
        <p className="mt-2" style={{ color: 'var(--brand-text-muted)' }}>
          Vous disposez également du droit d'introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-cyan)' }}>CNIL</a>.
        </p>
      </section>

      {/* Section 6 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--brand-cyan)' }}>6. Sécurité des données</h2>
        <p className="mb-3">Intemporelle met en œuvre les mesures de sécurité suivantes :</p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            "Chiffrement en transit (TLS 1.3)",
            "Chiffrement au repos (AES-256)",
            "Authentification sécurisée (OAuth 2.0)",
            "Contrôle d'accès basé sur les rôles",
            "Hébergement exclusivement dans l'UE",
            "Sauvegardes chiffrées quotidiennes",
            "Journalisation des accès aux données sensibles",
            "Tests de sécurité réguliers",
          ].map((m, i) => (
            <li key={i} className="flex items-center gap-2 p-3 rounded text-xs" style={{ background: 'var(--brand-surface)', listStyle: 'none' }}>
              <span style={{ color: 'var(--brand-cyan)' }}>✓</span>
              <span>{m}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Section 7 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3" style={{ color: 'var(--brand-cyan)' }}>7. Sous-traitants</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ background: 'var(--brand-surface)', color: 'var(--brand-cyan)' }}>
                <th className="p-3 text-left border" style={{ borderColor: 'var(--brand-border)' }}>Sous-traitant</th>
                <th className="p-3 text-left border" style={{ borderColor: 'var(--brand-border)' }}>Rôle</th>
                <th className="p-3 text-left border" style={{ borderColor: 'var(--brand-border)' }}>Localisation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>OVHcloud (certifié HDS)</td>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Hébergement cloud certifié HDS</td>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>France — Gravelines (GRA11)</td>
              </tr>
              <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>IONOS</td>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Nom de domaine</td>
                <td className="p-3 border" style={{ borderColor: 'var(--brand-border)' }}>Allemagne (UE)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--brand-text-muted)' }}>
          Aucun transfert de données hors de l'Union Européenne n'est effectué.
        </p>
      </section>

      <div className="mt-10 pt-6 text-xs text-center" style={{ borderTop: '1px solid var(--brand-border)', color: 'var(--brand-text-muted)' }}>
        Studio Manager by Intemporelle — <a href="mailto:rgpd@intemporelle.eu" style={{ color: 'var(--brand-cyan)' }}>rgpd@intemporelle.eu</a>
      </div>
    </div>
  );
}
