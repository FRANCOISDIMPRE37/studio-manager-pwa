import glob

files = glob.glob('/home/ubuntu/app/dist/public/assets/*.js')
for f in files:
    with open(f, 'r', encoding='utf-8') as fh:
        content = fh.read()

    replacements = {
        '07 — Fiche de Traçabilité Matériel Stérile"': '04 — Fiche de Traçabilité Matériel Stérile"',
        '02 — Questionnaire Médical Tatouage Mineur': '05 — Questionnaire Médical Tatouage Mineur',
        '03 — Autorisation Parentale': '06 — Autorisation Parentale',
        '04 — Questionnaire Médical Tatouage Majeur': '07 — Questionnaire Médical Tatouage Majeur',
        'Tatouage (05-07)': 'Tatouage (05-09)',
        '06 — Soins Post-Tatouage': '09 — Soins Post-Tatouage',
        '05 — Fiche de Traçabilité Matériel Stérile (Tatouage)': '08 — Fiche de Traçabilité Matériel Stérile (Tatouage)',
        '07b — Questionnaire Médical Dermographie Mineur': '10 — Questionnaire Médical Dermographie Mineur',
        '07c — Autorisation Parentale Soins Post-Dermographie': '11 — Autorisation Parentale',
        '08 — Questionnaire Médical Dermographe': '12 — Questionnaire Médical Dermographie Majeur',
        '09 — Soins Post-Dermographie (Maquillage Permanent)': '14 — Soins Post-Dermographie',
        '10 — Fiche de Séance Dermographe': '13 — Fiche de Traçabilité Matériel Stérile (Dermographie)',
        'Dermographie (08-10)': 'Dermographie (10-14)',
        'RGPD & Confidentialité (11-12)': 'RGPD & Confidentialité (15-16)',
        '11 — Engagement de Confidentialité (RGPD Art. 29)': '15 — Engagement de Confidentialité (RGPD Art. 29)',
        '12 — Information Client — Protection des Données (RGPD)': '16 — Information Client — Protection des Données (RGPD)',
    }

    for old, new in replacements.items():
        content = content.replace(old, new)

    content = content.replace('08 — Fiche de Traçabilité Matériel Stérile (Tatouage)', '##FICHE_TAT##')
    content = content.replace('09 — Soins Post-Tatouage', '08 — Fiche de Traçabilité Matériel Stérile (Tatouage)')
    content = content.replace('##FICHE_TAT##', '09 — Soins Post-Tatouage')

    content = content.replace('13 — Fiche de Traçabilité Matériel Stérile (Dermographie)', '##FICHE_DERMO##')
    content = content.replace('14 — Soins Post-Dermographie', '13 — Fiche de Traçabilité Matériel Stérile (Dermographie)')
    content = content.replace('##FICHE_DERMO##', '14 — Soins Post-Dermographie')

    with open(f, 'w', encoding='utf-8') as fh:
        fh.write(content)

    content = content.replace('13 — Fiche de Traçabilité Matériel Stérile (Dermographie)', '##FICHE13##')
    content = content.replace('14 — Soins Post-Dermographie', '13 — Fiche de Traçabilité Matériel Stérile (Dermographie)')
    content = content.replace('##FICHE13##', '14 — Soins Post-Dermographie')

print("OK - corrections appliquées")
