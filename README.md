# BFS en un árbol — el orden de aparición

Visual didáctica del recorrido BFS sobre un árbol: la cola FIFO, el orden de
aparición de los hijos y la diferencia entre **descubrir** un nodo y **evaluarlo**
como objetivo.

Sin frameworks, sin bundler, sin red. Abrís `index.html` y funciona.

## Cómo abrirla

- **Doble clic** en `index.html` (funciona con `file://`).
- O servidor local: `npm run serve` → <http://localhost:4173>.

## Controles

| Tecla | Acción |
|-------|--------|
| `Espacio` | Avanza |
| `Shift`+`Espacio` o `←` | Retrocede |
| `R` | Reinicia |
| `P` | Imprime |

Hay botones equivalentes para móvil.

## Modos

- **Guía**: árbol clásico (`A–G`) buscando `F`. Son 10 escenas curadas que
  incluyen la corrida con `Z` (objetivo inexistente) para explicar el estado rojo.
- **Explorar**: cualquier otro árbol u objetivo. La línea de tiempo se genera
  desde el recorrido real, beat por beat, con copy armado desde el estado.

Cambiás de modo eligiendo árbol u objetivo en la barra superior. El badge dice
en cuál estás.

## Árboles

| Clave | Nombre | Nodos | Para qué |
|-------|--------|-------|----------|
| `classic` | Clásico · A–G | 7 | La guía curada y la corrida `Z` |
| `wide` | Ancho · 10 nodos | 10 | Ver la "ola" completa de un nivel |
| `deep` | Profundo · 6 nodos | 6 | Contraste nivel-por-nivel vs. bajar por una rama |

## Tema y deep-links

- El botón `◐` alterna claro/oscuro. La preferencia queda en `localStorage`.
- Sin preferencia guardada, respeta `prefers-color-scheme`.
- La impresión siempre sale en claro (A4, 3 diagramas + todas las escenas).
- Deep-links: `?tree=wide&target=B&scene=5` (el árbol y el objetivo son
  opcionales; `scene` es 1-based). También acepta `#5`.

## Tests

```bash
npm install
npx playwright install chromium
npm run test:e2e
```

Los tests levantan un servidor estático en el puerto `4173` y verifican escenas,
teclado, selectores, tema, impresión, reduced-motion y móvil.

## PDF de la guía

```bash
npm run pdf   # genera guia-bfs.pdf con el CSS de impresión
```

## Deploy en GitHub Pages

El workflow `.github/workflows/pages.yml` publica el sitio estático en cada push
a `main` (copiando solo `index.html`, `styles.css`, `app.js`, `data/` y `lib/`).

1. Creá el repo en GitHub y agregá el remote:

   ```bash
   git remote add origin git@github.com:TU_USUARIO/bfs-visual.git
   git push -u origin main
   ```

2. En el repo: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. El próximo push a `main` (o *Run workflow*) publica el sitio en
   `https://TU_USUARIO.github.io/bfs-visual/`.

## Estructura

```
index.html          shell, paneles, controles, leyenda
styles.css          tema claro/oscuro, animaciones, responsive, @media print
data/trees.js       los tres árboles (coordenadas fijas, viewBox 800x400)
lib/trace.js        motor puro: árbol + objetivo → snapshots
lib/render.js       SVG, cola, colores, badges, SVG de impresión
lib/scenes.js       guía curada (10 escenas) y modo Explorar
lib/player.js       índice de escena, animación, teclado, cambio de timeline
app.js              composición, selectores, tema, deep-links, impresión
tests/              E2E con Playwright
tools/print-pdf.mjs genera el PDF de la guía
```

El diseño completo está en `PLAN_ARQUITECTURA_BFS_VISUAL.md`.
