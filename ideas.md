# Idées de design — Studio Manager by Intemporelle

## Contexte
Application de gestion de studio photo/vidéo pour Intemporelle (RGPD & Cybersécurité, Tours 37).
Palette de marque : bleu marine #0D1B4B, cyan #83D0F5, rose/magenta #C0396A, blanc.
Utilisateurs : photographes, vidéastes, directeurs de studio.
Utilisation principale : tablette Android en studio.

---

<response>
<probability>0.07</probability>
<text>
## Approche 1 — Brutalisme Technique / "Control Room"

**Design Movement:** Brutalisme numérique inspiré des interfaces de contrôle industriel et des cockpits d'avion.

**Core Principles:**
- Grilles asymétriques avec des colonnes de largeurs inégales (3:5:2)
- Données brutes visibles, pas de masquage cosmétique
- Hiérarchie typographique agressive : titres en majuscules condensées, données en monospace
- Contraste extrême : fond très sombre, texte très lumineux

**Color Philosophy:**
- Fond : #050C1F (quasi-noir bleu)
- Primaire : #83D0F5 (cyan Intemporelle) pour les données actives
- Accent : #C0396A (rose) pour les alertes et CTA
- Texte : #E8F4FF (blanc bleuté)
- Grilles et séparateurs : #1A2D6B (bleu marine visible)

**Layout Paradigm:**
- Sidebar fixe étroite à gauche (icônes uniquement)
- Zone centrale divisée en panneaux redimensionnables
- Barre de statut en bas avec métriques en temps réel
- Pas de cartes arrondies — rectangles nets avec bordures fines

**Signature Elements:**
- Lignes de scan horizontales subtiles en arrière-plan
- Indicateurs d'état style LED (points colorés)
- Typographie monospace pour les chiffres et codes

**Interaction Philosophy:**
- Feedback immédiat sur chaque action
- Micro-animations de type "terminal" (apparition caractère par caractère)
- Transitions instantanées, pas de flou

**Animation:**
- Entrée des données : effet typewriter
- Transitions de pages : glissement horizontal rapide (150ms)
- Hover : bordure cyan qui s'illumine

**Typography System:**
- Titres : Space Grotesk Bold / Condensed
- Corps : JetBrains Mono (lisibilité des données)
- Labels : Space Grotesk Medium uppercase
</text>
</response>

<response>
<probability>0.08</probability>
<text>
## Approche 2 — Minimalisme Suisse / "Atelier Propre"

**Design Movement:** Typographie internationale suisse, inspirée des studios de design haut de gamme.

**Core Principles:**
- Espace blanc généreux comme élément de design actif
- Typographie comme seul ornement
- Grille modulaire stricte de 8px
- Couleur utilisée avec parcimonie pour guider l'attention

**Color Philosophy:**
- Fond : #F8F9FC (blanc cassé légèrement bleuté)
- Primaire : #0D1B4B (bleu marine Intemporelle) pour les éléments importants
- Accent : #83D0F5 (cyan) pour les interactions
- Texte principal : #0D1B4B
- Texte secondaire : #6B7A99

**Layout Paradigm:**
- Navigation latérale gauche avec labels texte (pas d'icônes seules)
- Contenu principal en colonnes fluides
- Sections séparées par de l'espace, pas des lignes
- Tableaux de données épurés, zéro décoration superflue

**Signature Elements:**
- Ligne fine horizontale bleue marine sous les titres de section
- Numérotation des éléments en style éditorial (01, 02, 03)
- Badges de statut minimalistes (texte coloré, pas de fond)

**Interaction Philosophy:**
- Transitions douces et discrètes
- Focus visible mais élégant
- Pas d'animations superflues

**Animation:**
- Fade-in à 200ms pour les nouvelles données
- Underline qui se déroule au hover des liens
- Aucune animation de page

**Typography System:**
- Titres : DM Serif Display (contraste avec le reste)
- Corps : DM Sans Regular/Medium
- Données : DM Mono
</text>
</response>

<response>
<probability>0.09</probability>
<text>
## Approche 3 — Dark Professional / "Studio Nocturne" ✅ CHOISIE

**Design Movement:** Interface professionnelle sombre inspirée des logiciels créatifs (Lightroom, DaVinci Resolve, Final Cut Pro) — conçue pour une utilisation en studio avec éclairage ambiant réduit.

**Core Principles:**
- Fond sombre pour réduire la fatigue oculaire en studio
- Hiérarchie visuelle par la luminosité (pas uniquement la couleur)
- Sidebar persistante avec navigation iconographique + labels
- Cartes avec profondeur subtile (pas plates, pas excessivement 3D)

**Color Philosophy:**
- Fond app : #0A1628 (bleu nuit profond, marque Intemporelle)
- Fond cartes : #0F2040 (bleu marine légèrement plus clair)
- Primaire : #83D0F5 (cyan Intemporelle) — actions, liens actifs
- Accent chaud : #C0396A (rose Intemporelle) — CTA, alertes, badges importants
- Texte principal : #E8F4FF
- Texte secondaire : #7A9CC4
- Bordures : #1E3A5F (bleu marine discret)

**Layout Paradigm:**
- Sidebar gauche fixe (64px) avec icônes + tooltip au hover
- Header compact avec nom du studio + avatar
- Zone principale en grille responsive (1 col tablette, 2-3 col desktop)
- Bottom navigation bar sur mobile/tablette (style app native)

**Signature Elements:**
- Gradient subtil bleu marine → bleu nuit sur le fond
- Ligne d'accent cyan sur l'élément actif de la sidebar
- Badges de statut avec fond semi-transparent et bordure colorée

**Interaction Philosophy:**
- Transitions fluides 200-300ms cubic-bezier
- Hover : légère élévation des cartes (translateY -2px + shadow)
- Active states clairement visibles (fond cyan à 15% d'opacité)

**Animation:**
- Entrée des pages : fade + slide-up (300ms)
- Cartes : apparition en cascade avec délai de 50ms
- Chargement : skeleton screens aux couleurs du thème

**Typography System:**
- Titres : Outfit Bold/SemiBold (moderne, géométrique)
- Corps : Outfit Regular/Medium
- Données numériques : Outfit Medium avec tabular-nums
- Taille base : 14px (optimisé tablette)
</text>
</response>
