# AGENTS.md — ns-creative-studio

Guida per agenti/AI che lavorano su questo repo. Leggere prima di modificare.

## Cos'è

Generatore di **creative Instagram** per uno studio ciglia & unghie (`@ns.lashandnails`).
È una **PWA vanilla** (HTML + CSS + JS puro), senza framework, senza build, senza npm.
Tutto viene disegnato su un `<canvas>` 2D ed esportato come PNG.

L'utente finale è la titolare dello studio: compila un form, vede l'anteprima live sul
canvas, scarica il PNG (o lo condivide via Web Share API su iOS standalone).

Lingua UI: **italiano**. Palette: nude (cream/oro/marrone). Font: "Mont" (embedded base64).

## Struttura

Tutto il codice sta in **`index.html`** (unico file). Non esistono `src/`, componenti, moduli.

```
index.html            # App intera: <style> + HTML UI + <script> con tutta la logica
manifest.webmanifest  # PWA manifest (theme #F7F1E8, portrait, standalone)
sw.js                 # Service worker cache-first, versionato (CACHE = 'ns-studio-vN')
icons/                # icon.svg + PNG generati
.github/workflows/    # deploy GitHub Pages su push a main
```

`index.html` è ~700 KB **solo** per i 4 blob base64 dei font alle righe ~16-19. Ignorarli.

## Layout di `index.html`

- `<style>` (~riga 15-55): `:root` con le CSS var della palette + styling UI.
- HTML UI (~riga 58-140): pannello form (toggle template, toggle formato, campi per
  template, footer, bottone download) + `.preview` con `<canvas id="cv">`.
- `<script>` (~riga 140 a fine): stato, helper di disegno, funzioni `draw*`, event handler.

## Concetti chiave

### Template (le "creative")
Toggle `#tpl` in alto. Ogni template ha:
1. un `<button data-t="...">` nel toggle,
2. un blocco campi `<div id="fields...">` (tutti tranne uno hanno `.hidden`),
3. una funzione `drawXxx(W, H)`,
4. una riga nel dispatcher `draw()`.

Template attuali:
| data-t      | fields id         | draw fn         | note |
|-------------|-------------------|-----------------|------|
| `offerta`   | `fieldsOfferta`   | `drawOfferta`   | promo con prezzo barrato |
| `listino`   | `fieldsListino`   | `drawListino`   | forza formato Story |
| `pd`        | `fieldsPd`        | `drawPd`        | Prima/Dopo, foto 16:9 impilate, drag+zoom, layout fluido a cursore Y |
| `risultato` | `fieldsRisultato` | `drawRisultato` | box unico 16:9 col risultato finale, drag+zoom, blocco centrato verticalmente |
| `newpost`   | `fieldsNewPost`   | `drawNewPost`   | forza Story; texture "new post" in corsivo (SERIF) + riquadro con corner marks + titolo oro bold sopra il box |
| `cover`     | `fieldsCover`     | `drawCover`     | formato fisso 1080×1080; copertina highlight: solo icona centrata nel cerchio IG; sfondo chiaro fisso, 26 icone via dropdown |

L'handler dei tab (`#tpl button` click) fa il toggle delle classi `.active` e `.hidden`,
setta `template`, e forza `format='story'` per `listino` e `newpost`. Per `cover`
nasconde `#footerField` e `#fmtField` (formato fisso 1080×1080, niente footer).

### Copertine highlight (`cover`)
- Formato **1080×1080** (deciso in `draw()`, non usa il toggle formato).
- Stato: `coverIcon` (26 valori). Sfondo chiaro nude fisso (niente selettore).
- Icone: dispatcher `drawIcon(kind,cx,cy,size,col)` con uno `switch` su ~26 forme disegnate a mano
  (heart/star/sparkle/flower/lash hanno funzioni dedicate; il resto è inline).
  `iconLash` ricolora `lashMotif` (che usa COL.gold fisso) via `globalCompositeOperation='source-atop'`.
- Selettore UI: `#cv_icon` (`<select>`, con voci utili in cima: Feedback, Recensioni, ...).
- Solo icona centrata: il nome dell'highlight si scrive in Instagram, non nell'immagine.
- IG ritaglia un cerchio al centro: l'icona sta nella safe-zone (~30% del lato), con anello guida.

### Layout fluido (pd / risultato)
`drawPd` e `drawRisultato` NON usano coordinate Y fisse: pre-misurano i testi presenti,
calcolano lo spazio residuo e dimensionano i box per riempirlo (16:9 per pd, 4:5 per risultato,
cap a `W-120` di larghezza). Ogni elemento vuoto non lascia buchi; il footer resta ancorato in basso.

### Font
- `Mont` (embedded base64) per tutto il resto.
- `SERIF` (const, fallback di sistema `Georgia`) usato in corsivo per i tocchi eleganti del New Post.
- Helper `cornerMarks(x,y,w,h,len,col)` disegna gli angoli a "mirino".

### Formato / dimensioni canvas
Toggle `#fmt`: **Feed 1080×1350** (4:5) o **Story 1080×1920** (9:16).
`draw()` imposta `cv.width/height` in base a `format`. Non esiste un selettore di aspect
ratio generico: i formati sono questi due fissi.

### Palette (definita in DUE posti — tenerli allineati)
- CSS: `:root { --gold --brown --muted --bg --card }` per la UI.
- JS: oggetto `COL { bgTop bgBot gold goldSoft brown muted rose cream boxFill }` per il canvas.

### Helper di disegno riutilizzabili
- `centerText(text, y, font, color, tracking)` — testo centrato, con tracking opzionale.
- `fitFont(text, weight, startSize, maxW, tracking)` — riduce il font finché entra in `maxW`.
- `coverImage(img, x, y, w, h, radius, transform)` — clip rounded-rect + object-fit cover.
  `transform = { zoom, ox, oy }` (ox/oy offset normalizzato -1..1, zoom scala aggiuntiva).
- `bg`, `drawFooter`, `pin`, `lashMotif`, `hairline`, `priceBlock`.
- `$(id)` = `getElementById(id).value` (attenzione: **esplode se l'id non esiste**; tutti i
  campi devono essere sempre nel DOM, anche se `.hidden`).

### Immagini Prima/Dopo (drag + zoom)
- Stato: `photoPrima`, `photoDopo`, `photoRis` (oggetti `Image`), e `tf = { prima:{zoom,ox,oy}, dopo:{...}, ris:{...} }`.
- `pdRects` = rettangoli dei box in coordinate canvas, ricalcolati a ogni `drawPd`/`drawRisultato`,
  usati per l'hit-test del drag.
- Drag: listener mouse+touch sul canvas → `dragDown/dragMove/dragEnd` aggiornano `tf[key].ox/oy`.
  Attivo quando `template === 'pd' || 'risultato'` e la foto del box è caricata.
- Zoom: slider `#zPrima`/`#zDopo`/`#zRis` (mostrati con `.show` dopo l'upload) → `tf[key].zoom`.

## Convenzioni

- **NON introdurre framework, bundler o dipendenze.** Resta vanilla e single-file.
- Ogni nuovo template segue lo schema a 4 punti sopra (button + fields + drawFn + dispatcher).
- Ogni campo di testo con id `x` deve esistere sempre nel DOM (per via di `$`).
- Le coordinate di layout in `drawXxx` sono in genere due set: uno per `feed`, uno per `story`.
- Il canvas è 1080 di larghezza fissa; centrare gli elementi rispetto a `W`.

## Workflow / test

Nessuna toolchain. Per provare in locale:

```
python3 -m http.server 8000   # poi apri http://localhost:8000
```

Check rapido di sintassi JS (estrae il blocco <script> e lo compila):

```
node -e "const fs=require('fs');const m=fs.readFileSync('index.html','utf8').match(/<script>([\s\S]*?)<\/script>/);require('vm').compileFunction(m[1]);console.log('JS OK')"
```

## Deploy

Push su `main` → GitHub Pages (workflow in `.github/workflows/`).
**Ricordarsi di bumpare `CACHE` in `sw.js`** (`ns-studio-vN` → `vN+1`) a ogni modifica di
`index.html`/asset, altrimenti la PWA serve la versione vecchia dalla cache.

## Note per i commit

Messaggi in **inglese**, conventional commits (`feat:`, `fix:`, `refactor:`, ...).
