# Migrazioni in Italia — dashboard editoriale

Dashboard interattiva in stile data journalism (impostazione istituzionale "New Yorker")
sulle migrazioni in Italia: presenza, flussi, lavoro, permessi e un **simulatore costi**
che confronta rimpatrio vs inserimento e gettito fiscale.

## Comandi

```bash
npm install
npm run dev        # sviluppo locale (http://127.0.0.1:5173)
npm run build:ci   # build statica in dist/ (dati gia incorporati) ← usata dal deploy
npm run build      # build che PRIMA rigenera i dati dai CSV locali (vedi sotto)
npm run preview    # anteprima della build
```

### Rigenerare i dati dai CSV (opzionale)

`npm run data` ricostruisce `src/data/migrationData.js` dai CSV ISTAT/Eurostat.
Lo script `scripts/build_data.py` si aspetta i CSV in una cartella locale
(in origine `~/Downloads/CSV_migranti`). Se quella cartella e stata spostata,
aggiorna il percorso in cima a `scripts/build_data.py`.

I dati attuali sono **gia incorporati** nel bundle: il sito funziona e si builda
anche senza i CSV. Per questo il deploy usa `build:ci` (solo `vite build`).

## Deploy gratuito su GitHub Pages (automatico)

1. Crea un repo su GitHub e fai push di questa cartella.
2. Su GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Il workflow `.github/workflows/deploy.yml` builda e pubblica a ogni push su `main`/`master`.

Il sito e statico (nessun backend). In alternativa: Netlify/Vercel con build command
`npm run build:ci` e publish directory `dist`.

> Nota: `vite.config.js` usa `base: "./"` (percorsi relativi), quindi funziona sia su
> dominio dedicato sia su `username.github.io/nome-repo/` senza modifiche.

## Note

- **Veste grafica**: prima pagina in stile broadsheet/quotidiano (testata, apertura a
  tre colonne, scatola dei numeri, richiami), accento arancione.
- **Font**: Playfair Display + PT Serif, caricati da Google Fonts in `index.html`
  (funziona su GitHub Pages; richiede connessione al primo caricamento).
- **Footer social**: già collegati Instagram e Substack reali in `SiteFooter`.

## Fonti

I dati provengono da ISTAT ed Eurostat e sono citati e **linkati** nella sezione
"Metodo" della pagina. Lo scenario economico del simulatore e una stima dichiarata,
non una previsione (vedi nota metodologica nella sezione "Costi").
