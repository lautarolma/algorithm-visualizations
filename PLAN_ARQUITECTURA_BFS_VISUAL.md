# Plan de arquitectura — Visual didáctica: árbol BFS por orden de aparición

> Alcance: ejemplo **puramente didáctico**, genérico, sin relación con Fly-in.
> Un árbol simple que se va **componiendo por ramas** y se **evalúa en el orden
> algorítmico de aparición**, con colores que distinguen las fases del proceso.
> Incluye contenido didáctico imprimible y reproducible con la barra espaciadora.
>
> **Estado: implementado y verificado.** Ver §11 para archivos, controles y
> resultado de las pruebas. La impresión quedó en 3 páginas A4 (formato informal
> aceptado); no se compactó a 2.

---

## 1. La idea en una frase

Mostrar que BFS no "salta" por el árbol: **descubre hijos al expandir, los encola
por orden de aparición y los evalúa en ese mismo orden**, nivel por nivel.

Árbol de trabajo (uno solo, fijo):

```
        A
      / | \
     B  C  D
    / \    |
   E   F   G
```

- Orden de aparición / evaluación con objetivo `F`:
  `A(#1) → B(#2) → C(#3) → D(#4) → E(#5) → F(#6)` y **para**.
- `G(#7)` existe pero **nunca se evalúa**: encontramos el objetivo antes.
- Segunda corrida con objetivo inexistente (`Z`): cola vacía → estado rojo.

Ese contraste (encontrado vs agotado) es el corazón de la variante 2.

---

## 2. Variante 1 + Variante 2 en una sola línea de tiempo

- **Variante 1 (recorrido)** corre siempre en **color base**: desencolar, expandir,
  encolar. Es el "esqueleto" del algoritmo.
- **Variante 2 (búsqueda)** **interfiere** en un beat propio, con **color resaltante**:
  evaluar el nodo desencolado contra el objetivo.
- Estados terminales con color propio: **encontrado** y **agotado**.

Secuencia de beats por nodo:

```
desencolar (base) → evaluar (resaltante) → ¿coincide?
   ├── sí → encontrado (verde) → fin
   └── no → expandir/encolar hijos (base) → siguiente
cola vacía sin coincidencia → agotado (rojo) → fin
```

Esto enseña una distinción clave: **descubrir no es evaluar**. `F` puede estar en la
cola desde el paso 2 y aun así no se evalúa hasta que le toca el frente.

---

## 3. Semántica de colores (minimalista)

| Color | Token | Significado | Cuándo aparece |
|-------|-------|-------------|----------------|
| Azul pizarra | `--c-base` | Recorrido BFS | desencolar, expandir, encolar |
| Ámbar | `--c-eval` | Evaluación (variante 2) | se compara el nodo con el objetivo |
| Verde | `--c-found` | Objetivo encontrado | la comparación da verdadero |
| Rojo | `--c-exhausted` | Cola agotada | no hay objetivo y la cola queda vacía |
| Gris | `--c-pending` | Pendiente / en cola | nodo descubierto que aún no se evalúa |

Reglas:
- Un solo color "activo" por beat; el resto vuelve a su estado anterior.
- El gris es el estado por defecto, no un estado de proceso.
- La leyenda final ocupa una sola línea visual: 5 puntos + etiqueta.

Accesibilidad: además del color, cada beat tiene **forma/gesto** (pulso, badge, tachado)
para no depender solo del color (daltonismo).

---

## 4. Contenido didáctico: 10 escenas

Cada escena = un título, un párrafo corto y un estado visual. La barra espaciadora
avanza a la siguiente. `Shift+Espacio` o `←` retrocede. `R` reinicia. `P` imprime.

| # | Escena | Texto (síntesis) | Visual |
|---|--------|------------------|--------|
| 1 | Qué vas a ver | BFS recorre por niveles; las ramas nacen al expandir | Árbol tenue, sin cola |
| 2 | Orden de aparición | Los hijos se declaran de izquierda a derecha; ese orden manda | Flechas de orden sobre el árbol |
| 3 | La cola | FIFO: entra por atrás, sale por el frente | Cola `[A]`, frente destacado |
| 4 | Desencolar | Sale el frente; eso es "procesar" | `A` en azul, cola `[]` |
| 5 | Evaluar | ¿Es el objetivo? Esta pregunta es la variante 2 | `A` en ámbar |
| 6 | Expandir | Si no coincide, sus hijos aparecen y se encolan en orden | `B,C,D` nacen, cola `[B,C,D]` |
| 7 | La ola | La cola procesa todo un nivel antes de bajar | Nivel 1 completo en azul |
| 8 | Descubrir ≠ evaluar | `F` ya está en la cola, pero espera su turno | `F` gris en cola, `E` en ámbar |
| 9 | Encontrado | Al desencolar `F`, la evaluación da verdadero y frena | `F` verde, resto congelado |
| 10 | Si no está | Con objetivo `Z`, la cola se vacía: rojo | Corrida alterna + leyenda |

Notas de guion:
- La escena 8 es la más importante: evita el error conceptual de "BFS encuentra
  apenas descubre".
- La escena 10 usa una segunda corrida (mismo árbol, objetivo `Z`), no un árbol nuevo.
- Al final: leyenda de colores + una línea de complejidad `O(V+E)` tiempo, `O(V)` memoria.

---

## 5. Interacción

| Tecla | Acción |
|-------|--------|
| `Espacio` | Avanzar una escena (si hay animación en curso, la completa) |
| `Shift+Espacio` / `←` | Retroceder una escena |
| `R` | Reiniciar |
| `P` | Imprimir / exportar a PDF |

Detalles:
- `preventDefault` en `Espacio` para evitar el scroll.
- Estado derivado de un índice de escena: retroceder es gratis (no se recalcula).
- `aria-live="polite"` en la narración.
- `prefers-reduced-motion`: transiciones instantáneas, sin autoplay.
- En móvil: botones equivalentes (anterior/siguiente), sin depender del teclado.

---

## 6. Impresión (el contenido "se imprime")

La misma página, con `@media print`:

- Se ocultan controles, pistas de teclado y navegación.
- Se muestran **todas** las escenas, no solo la activa.
- Se incluyen **3 diagramas estáticos** clave: inicio, la ola, encontrado.
- Se imprime la leyenda de colores y la nota de complejidad.
- `print-color-adjust: exact` para que los colores salgan.
- `break-inside: avoid` en escenas y diagramas.
- Salida: A4, 1–2 páginas, legible en blanco y negro (los badges numéricos
  distinguen aunque el color se pierda).

Limitación asumida: la animación no se imprime. Se imprime el **estado resuelto**
de cada diagrama clave, que es lo que sirve como guía de estudio.

---

## 7. Arquitectura

```
BFS_visual/
├── index.html          # shell: árbol, cola, narración, controles, leyenda
├── styles.css          # tokens de color, layout, animación, @media print
├── data/
│   └── tree.js         # árbol fijo: nodos, coords, adj, orden de hijos
├── lib/
│   ├── trace.js        # motor puro: árbol + objetivo → beats[]
│   ├── render.js       # beat → SVG/DOM (nodos, cola, badges, colores)
│   ├── scenes.js       # 10 escenas: título, texto, rango de beats
│   └── player.js       # índice de escena, teclado, play/pause, reset
└── app.js              # composición
```

Sin build, sin dependencias, sin red. Se abre con `file://`.

**Decisión técnica:** se usan **scripts clásicos**, no `<script type="module">`.
Los módulos ES se cargan con CORS y los navegadores los bloquean desde `file://`;
los scripts clásicos sí funcionan sin servidor. Cada archivo expone su API en
`window.BFSVisual`.

### 7.1 Contrato del motor

```js
// Entrada
Tree = {
  nodes: [{ id: "A", x: 400, y: 60 }, ...],
  adj: { A: ["B", "C", "D"], B: ["E", "F"], C: [], D: ["G"], E: [], F: [], G: [] },
  root: "A",
  childOrder: { A: ["B", "C", "D"], B: ["E", "F"], D: ["G"] }
}

// Salida: beats deterministas, sin DOM
Beat = {
  type: "dequeue" | "evaluate" | "expand" | "enqueue" | "found" | "exhausted",
  node: "A",
  target: "F",
  order: 1,                 // orden de aparición
  children: ["B", "C", "D"],// solo en expand/enqueue
  queueBefore: [],
  queueAfter: ["B", "C", "D"],
  match: null | true | false,
  color: "base" | "eval" | "found" | "exhausted" | "pending",
  scene: 4                  // escena a la que pertenece
}
```

Invariantes:
- El motor no conoce colores ni DOM: devuelve `type` y el renderer mapea a `color`.
- Un beat = una transición dominante.
- Las escenas agrupan beats; avanzar escena = saltar al último beat del grupo.
- El orden de hijos sale de `childOrder`, nunca del orden de iteración de un objeto.

---

## 8. Estimación de esfuerzo

Metodología: ~900–1.200 líneas totales × 10–14 tokens/línea, más copy didáctico
(10 escenas + leyenda) y 2–3 ciclos de revisión. La incertidumbre está en el
**guion didáctico** y en el **CSS de impresión**, no en BFS. Margen: ±35%.

| Entregable | Tokens generados | Tokens procesados | Tiempo de modelo | Revisión humana |
|------------|------------------|-------------------|------------------|-----------------|
| **MVP** (1 árbol, 10 escenas, 5 colores, leyenda, espacio/atrás, print básico) | 11–15k | 35–60k | 20–30 min | 1,5–2,5 h |
| **Pulido** (2 corridas encontrado/agotado, 3 diagramas impresos, reduced-motion, móvil) | 15–20k | 50–85k | 30–45 min | 2,5–4 h |
| A mano, misma calidad | — | — | — | 6–9 h |

Desglose del MVP:
- Motor de beats + fases: 3–4k
- Render SVG + cola + badges + colores: 4–5k
- Escenas + copy didáctico: 3–4k
- Print CSS + 3 diagramas estáticos: 2–3k
- Teclado + player + accesibilidad: 1–2k

**Lectura rápida:** ~20–30 min míos y 1,5–2,5 h tuyas de revisión para el MVP;
~30–45 min míos y 2,5–4 h tuyas para la versión pulida e imprimible.

---

## 9. Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Mezclar colores de variante 1 y 2 y volverlo ilegible | Alto | Un color activo por beat; gris para pendientes |
| El print no muestra el estado de cada escena | Medio | 3 diagramas estáticos clonados + texto completo |
| "Descubrir = encontrar" (error conceptual) | Alto | Escena 8 dedicada; `F` gris esperando su turno |
| `Espacio` scrollea la página | Bajo | `preventDefault` + botones equivalentes |
| Layout del árbol "a ojo" | Medio | Coordenadas fijas; nada de force-directed |
| Copy flojo | Medio | Escenas separadas y revisables; el texto es el 40% del valor |

---

## 10. Definición de terminado

- [x] Recorrido y búsqueda comparten una sola línea de tiempo.
- [x] Cada beat tiene exactamente un color activo y un gesto no cromático.
- [x] `Espacio` avanza, `Shift+Espacio`/`←` retrocede, `R` reinicia, `P` imprime.
- [x] La escena 8 demuestra que `F` espera en la cola sin ser evaluado.
- [x] La corrida con `Z` termina en rojo y se explica como resultado válido.
- [x] La leyenda final explica los 5 colores en una línea.
- [x] `Ctrl+P` produce 3 páginas A4 legibles, con texto completo y 3 diagramas
      (formato informal aceptado; no se compactó a 2).
- [x] Funciona con `file://`, sin red, sin build.
- [x] Respeta `prefers-reduced-motion` y es usable con teclado y en móvil.

---

## 11. Estado de implementación

**Archivos:**

```
BFS_visual/
├── index.html          # shell, paneles, controles, leyenda
├── styles.css          # tema, animaciones, responsive, @media print
├── data/tree.js        # árbol A(B(E,F), C, D(G))
├── lib/trace.js        # motor puro: árbol + objetivo → snapshots
├── lib/render.js       # SVG, cola, colores, badges, SVG de impresión
├── lib/scenes.js       # 10 escenas y copy didáctico
├── lib/player.js       # índice de escena, animación, teclado
└── app.js              # composición, impresión, deep-link ?scene=N
```

**Cómo abrir:** `index.html` con doble clic o `file://`. No requiere servidor.
Para saltar a una escena: `index.html?scene=7` (1–10).

**Controles:** `Espacio` avanza · `Shift+Espacio` o `←` retrocede · `R` reinicia ·
`P` imprime. Botones equivalentes para móvil.

**Verificación realizada:**
- `jsdom`: las 10 escenas, retroceso, reset y `?scene=10`, sin errores de consola.
- Firefox headless: capturas de escenas 1, 6, 7, 9 y 10 (árbol, cola, colores,
  encontrado, agotado y leyenda).
- WeasyPrint: PDF A4 de 3 páginas con 3 diagramas, leyenda y las 10 escenas.

**Extensiones posibles (no implementadas):** selector de objetivo en vivo,
más árboles, modo oscuro, deploy en GitHub Pages, test E2E con Playwright.
