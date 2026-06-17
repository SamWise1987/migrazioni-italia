# AGENTS.md

## Obiettivo del progetto

Dashboard editoriale e data journalism sulle migrazioni in Italia, costruita con Vite, HTML/CSS/JavaScript e dati visuali.

Il progetto serve anche come repository didattica per imparare a leggere, revisionare e migliorare codice usando Codex e Claude Code.

## Regole operative

- Prima di modificare codice, spiega il piano.
- Non riscrivere l’intero progetto se non richiesto.
- Mantieni il comportamento esistente salvo richiesta esplicita.
- Preferisci modifiche piccole, leggibili e progressive.
- Se fai refactor, separa logica, dati, UI e stile.
- Non aggiungere dipendenze senza spiegare perché.
- Dopo ogni modifica importante, indica quali file sono stati toccati e perché.

## Review

Quando fai code review controlla:

- leggibilità;
- duplicazioni;
- struttura dei componenti;
- accessibilità;
- responsive design;
- performance;
- qualità dei dati;
- coerenza narrativa della dashboard;
- possibili bug;
- sicurezza;
- correttezza dei comandi npm.

## Comandi utili

Prima di chiudere una modifica, se disponibili, eseguire:

```bash
npm install
npm run build
npm run lint
