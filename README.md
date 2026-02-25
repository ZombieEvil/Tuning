# ULTRA RUMBLE — Guide (site statique)

Ce ZIP contient un site vitrine/guide **fan-made** (non officiel) pour **MY HERO ULTRA RUMBLE** :
- Roster + fiches personnages (variantes J/R/B/V, etc.)
- Générateur de builds **T.U.N.I.N.G.** (copie + export PNG)
- Pages Guides / Meta / Ressources / Contact

## Lancer en local

> Important : ouvre le site via un **petit serveur**, pas en double-cliquant le fichier HTML.

Dans le dossier du site :

```bash
python -m http.server 8000
```

Puis ouvre : `http://localhost:8000`

## Où sont les tunings ?

Le fichier fourni **TUNING ULTRA RUMBLE - HOME.csv** contient **la liste** des personnages/variantes, mais **pas** les réglages détaillés de tuning (slots/skills/niveaux).
Donc par défaut, les fiches affichent “Build indisponible (à remplir)”.

### Ajouter un build

1) Ouvre le modèle : `assets/data/tuning/example.json`  
2) Crée un fichier de build au nom du **variantId** :

Exemple pour `MIDORIYA J` (variantId = `midoriya-j`) :
- crée `assets/data/tuning/midoriya-j.json`

3) Recharge le site : la fiche et le générateur affichent ton build.

### Format de build (JSON)

- `title` : nom du build
- `updatedOn` : date (YYYY-MM-DD)
- `characterVariantId` : id de variante (ex: `midoriya-j`)
- `slots` : liste d’objets `{ "slot": "...", "skill": "...", "level": 1, "why": "..." }`

## Éditer le texte des fiches personnages

Chaque personnage a un fichier :
- `assets/data/content/<baseId>.json`

Ex :
- `assets/data/content/midoriya.json`

Tu peux y modifier :
- playstyle
- tips
- synergies
- sources

## Déploiement

Tu peux déposer le dossier sur :
- GitHub Pages
- Netlify
- Vercel

## Sources (liens)

- Site officiel (EU) : https://en.bandainamcoent.eu/my-hero-academia/my-hero-ultra-rumble
- News / patch notes (EU) : https://en.bandainamcoent.eu/my-hero-academia/my-hero-ultra-rumble/news
- News / patch notes (US) : https://www.bandainamcoent.com/games/my-hero-ultra-rumble/news
- Site officiel (JP) : https://mhaur.bn-ent.net/
- Base de données *non officielle* (assets / tuning) : https://fr.ultrarumble.com/tuning

## Scripts (optionnels)
 (optionnels)

Dans `tools/` : script pour (re)générer `assets/data/roster.json` depuis un CSV “HOME” au même format.
