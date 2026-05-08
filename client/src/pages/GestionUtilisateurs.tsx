/**
 * GestionUtilisateurs — route historique conservée pour compatibilité.
 *
 * La fiche salarié officielle est désormais /salaries : elle contient tous les
 * champs obligatoires, le préremplissage en modification et les validations
 * PC/iPad. Cette redirection évite qu'un ancien écran incomplet permette une
 * création ou modification de salarié avec des champs manquants.
 */
import { useEffect } from 'react';

export default function GestionUtilisateurs() {
  useEffect(() => {
    window.location.replace('/salaries');
  }, []);

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#e2e8f0', background: '#020617' }}>
      <p>Redirection vers la fiche salarié complète et obligatoire…</p>
    </main>
  );
}
