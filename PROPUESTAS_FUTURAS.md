# Propuestas de implementación futura

> Documento de ideas, no de compromisos. **Nada de lo que sigue está implementado.**
> La idea es decidir con criterio antes de escribir código y evitar sobre-ingeniería.

---

## 0. Resumen ejecutivo

- Lo realmente reusable del proyecto actual **no es el motor BFS**: es el reproductor
  (`player`), el tema, el print, los deep-links y el shell.
- Recomendación: **núcleo compartido + un módulo por algoritmo**, sin framework y sin
  build, preservando la promesa de abrir con `file://`.
- Próximo algoritmo sugerido: **ordenamiento** (vista de array). Es el segundo caso
  más barato y el que mejor presiona el contrato de módulos.
- **No** construir un "framework de visualizaciones" hasta tener **tres tipos de vista**
  funcionando. Es la regla de tres: la abstracción correcta aparece recién con el tercer
  caso concreto, no con el primero.
- El costo real de cada algoritmo nuevo no es el código: es **el copy didáctico**.

---

## 1. Qué hay hoy (y qué es realmente reusable)

| Pieza | Estado actual | Reuso potencial |
|-------|---------------|-----------------|
| `lib/player.js` | Genérico de facto: recibe escenas, maneja índice, teclado, animación y reduced-motion | **Alto** |
| Tema claro/oscuro | Variables CSS + `localStorage` + anti-flash | **Alto** |
| Deep-links y shell | `?tree=&target=&scene=` y `#N` | **Alto** |
| Print / PDF | CSS de impresión + 3 diagramas por fase | **Alto** (con ajustes por vista) |
| `lib/trace.js` | BFS-específico: cola FIFO, `status`, `order` y `label` en español | **Bajo** |
| `lib/render.js` | Árbol-específico: nodos, aristas, cola | **Bajo** |
| `lib/scenes.js` | Guía curada de BFS + generador del modo Explorar | **Bajo** |
| `tests/` + CI | Infra de Playwright y gate de deploy | **Alto** |

**Conclusión incómoda pero sana:** el motor puro es BFS y está bien que lo sea. Intentar
convertirlo en un "motor genérico de algoritmos" es el atajo que después se paga caro.
Lo que se comparte es la **cáscara** (player, tema, print), no el cerebro de cada algoritmo.

---

## 2. Tres caminos posibles

| Opción | Qué implica | Pros | Contras | Cuándo conviene |
|--------|-------------|------|---------|-----------------|
| **A. Módulos independientes** | Cada algoritmo es una página con su HTML/JS; se copia el shell | Rápido, aislado, cero abstracción | Duplicación, arreglar un bug 6 veces | 1–2 algoritmos |
| **B. Núcleo + módulos** | `core/` compartido (player, tema, print) + `algorithms/<id>/` | Balance, migración incremental, fallas aisladas | Hay que definir un contrato mínimo | **Ahora (recomendado)** |
| **C. Framework genérico de vistas** | Registro de vistas y algoritmos, todo plug-and-play | Máximo reuso, catálogo uniforme | Sobre-ingeniería, API prematura, más código que contenido | Recién con 3+ vistas |

**Recomendación: B.** Es un "estrangular" suave: se extrae el núcleo sin cambiar
comportamiento, BFS pasa a ser el módulo #1, y el resto se suma de a uno.

---

## 3. Contrato propuesto para un módulo (borrador)

La idea no es escribirlo hoy, sino tener claro **qué necesita el shell de un algoritmo**:

```js
AlgorithmModule = {
  id: "bfs",
  title: "BFS en un árbol",
  family: "grafos",
  complexity: "O(V + E)",

  view: "graph",              // "graph" | "array" | "matrix" | "table"
  datasets: [ ... ],          // árboles, arrays, matrices de ejemplo

  trace(dataset, options),    // puro: dataset + objetivo → Snapshot[]
  group(snapshots),           // política de escenas (visita, pasada, celda...)
  narrate(snapshot, ctx),     // estado → texto (separado del motor)
  createView(container, dataset) // monta y actualiza la vista
}
```

### Snapshots: estado, no relato

Hoy `trace()` devuelve `label` con texto en español. Para varios algoritmos e idiomas
conviene separar:

```js
Snapshot = {
  phase: "evaluate",          // qué está pasando
  focus: ["E"],               // a quién mirar
  status: { A: "base", ... }, // estado por elemento
  metrics: { visits: 3, comparisons: 2, queue: 2 },
  // sin texto
}
```

`narrate(snapshot, ctx)` traduce estado → frase. Ventajas: i18n gratis, tests del motor
sin comparar strings, copy editable sin tocar la lógica. Costo: una capa más. **Hacerlo
recién cuando entre el segundo algoritmo**; hoy el `label` cumple.

### Interfaz de vista

```js
View = {
  mount(dataset),       // construye el SVG/DOM inicial
  update(snapshot),     // aplica un estado
  printSVG(snapshot),   // versión estática para el PDF
  destroy()             // limpia listeners
}
```

El `player` no sabe qué hay adentro: solo pide "mostrame este snapshot".

---

## 4. Granularidad: snapshot → beat → escena

Tres niveles, cada uno con un propósito:

1. **Snapshot**: estado atómico. Es lo que produce el motor.
2. **Beat**: transición dominante (desencolar, comparar, intercambiar).
3. **Escena**: unidad pedagógica, con título y texto. Es lo que ve el usuario.

La política de agrupación **depende del algoritmo**, no del shell:

| Algoritmo | Escena natural | Snapshot típico |
|-----------|----------------|-----------------|
| BFS | Una visita (desencolar + evaluar + expandir) | Cambio de fase |
| Ordenamiento | Una pasada o un `partition` | Comparación / intercambio |
| Dijkstra | Extraer el mínimo y relajar sus aristas | Distancia actualizada |
| DP | Una celda o una fila | Cálculo de una celda |
| Backtracking | Una decisión (poner/quitar reina) | Estado del tablero |

**Guía curada vs. generada:** entregar siempre primero el modo generado; la guía curada
solo para algoritmos "de bandera". El copy curado es caro y no escala linealmente.

**Guarda de memoria:** si un dataset genera más de ~500 snapshots, conviene generarlos
de forma perezosa (iterador) o muestrear. Medir antes de optimizar; para arrays de 8–12
elementos no hace falta.

---

## 5. Escalabilidad del sitio (rutas y carga)

| Opción | Cómo se ve | Pros | Contras |
|--------|------------|------|---------|
| **Multi-página** | `/algorithms/bfs/`, `/algorithms/sorting/`, `core/` compartido | Aísla fallas, SEO, URLs limpias, sigue funcionando con `file://` | Shell repetido en cada página |
| **Shell único + registro** | `index.html?algo=bfs` o `#/bfs` | Un solo shell, tema y player compartidos | Si no se parte el JS, crece; los ES modules rompen `file://` |
| **Build (Astro/Vite)** | Proyecto compilado | DX moderna, componentes | Agrega build y mantenimiento; rompe "abrir y listo" |

**Recomendación:** multi-página con `core/` compartido y scripts clásicos (los mismos
`<script>` de hoy). Preserva `file://`, aísla errores y no obliga a un bundler.

Cuando existan 3+ algoritmos, la raíz pasa a ser un **catálogo** con tarjetas por familia
y la página de BFS se mueve a `/algorithms/bfs/`. Es un cambio de URL; aceptable antes de
una versión 1.0. Si molesta, se deja la raíz como BFS y el catálogo en `/algoritmos/`.

---

## 6. Tipos de vista: el eje real de reuso

| Vista | Algoritmos | Esfuerzo | Notas |
|-------|-----------|----------|-------|
| **Grafo / árbol** | BFS, DFS, Dijkstra, topológico, union-find | Ya existe (parametrizar) | Nodos, aristas, cola/pila, distancias |
| **Array** | Ordenamientos, búsqueda binaria, two pointers | **Bajo** | Barras o celdas, punteros, swaps |
| **Matriz / grilla** | DP, N-Reinas, laberintos, flood fill | Medio | Tabla o celdas; mucha área visual |
| **Tabla** | DP con filas/columnas, hash | Medio | Similar a matriz con encabezados |

**Próxima vista: array.** Es la que valida el contrato con menos conceptos nuevos
(no hay aristas ni cola; hay punteros y comparaciones) y habilita 4–6 algoritmos de golpe.

**No** hacer un renderer universal. Cada vista es un módulo chico con la misma interfaz;
el shell no necesita saber si dibuja nodos o barras.

---

## 7. Roadmap por olas (con criterio de salida)

| Ola | Contenido | Criterio para pasar a la siguiente |
|-----|-----------|-----------------------------------|
| **0. Extraer núcleo** | Mover player, tema, print y utilidades a `core/`; BFS queda como módulo #1 | Los 14 tests siguen verdes, la página se ve idéntica, no hay lógica duplicada |
| **1. Array** | Ordenamiento (burbuja, inserción, selección) + búsqueda binaria | 2 módulos con el mismo contrato; medir tiempo de alta de un algoritmo nuevo |
| **2. Grafos** | DFS y Dijkstra reusando la vista de grafo | La vista se parametriza por semántica de estado (cola vs. pila vs. distancias) |
| **3. Matriz** | LCS, mochila, N-Reinas | Con 3 tipos de vista, recién ahí evaluar un registro genérico |
| **4. Catálogo** | Página índice, filtros, i18n, PDF por algoritmo | El catálogo no conoce detalles de cada algoritmo |

**No hacer todavía:** editor de árboles/datos por el usuario, plugins de terceros,
backend, cuentas, analytics invasivo, build step.

---

## 8. Algoritmos candidatos

| Algoritmo | Familia | Vista | Dificultad | Valor didáctico | Prioridad |
|-----------|---------|-------|------------|-----------------|-----------|
| BFS | Grafos | Grafo | — | **Hecho** | — |
| DFS | Grafos | Grafo | Baja | Pila vs. cola; contraste directo con BFS | **P1** |
| Ordenamiento burbuja/inserción/selección | Ordenamiento | Array | Baja | Comparaciones e intercambios | **P1** |
| Búsqueda binaria | Búsqueda | Array | Baja | Descartar mitades; `O(log n)` | **P1** |
| Dijkstra | Grafos | Grafo | Media | Prioridad, distancias, relajación | P2 |
| Ordenamiento topológico | Grafos | Grafo | Media | Dependencias; cierra el ciclo con BFS/DFS | P2 |
| Merge sort / quick sort | Ordenamiento | Array | Media | Divide y vencerás; recursión visible | P2 |
| LCS | DP | Matriz | Media | Tabla, subproblemas, reconstrucción | P2 |
| Mochila 0/1 | DP | Matriz | Media | Decisión incluir/no incluir | P3 |
| N-Reinas | Backtracking | Matriz | Media | Poda y retroceso | P3 |
| BST: insertar/buscar/recorrer | Estructuras | Árbol | Media | Propiedad de orden | P3 |
| Union-Find | Estructuras | Grafo | Media | Componentes; camino a Kruskal | P3 |
| Hash / colisiones | Estructuras | Tabla | Media | Función hash y encadenamiento | P3 |

---

## 9. Pedagogía y consistencia entre algoritmos

- **Roles semánticos compartidos**, no colores por algoritmo:
  `idle` (gris), `candidate` (ámbar), `active` (azul), `done` (verde), `rejected` (rojo).
  Cada vista los mapea a su manera; la leyenda se arma desde los roles.
- **Métricas visibles**: comparaciones, intercambios, visitas, tamaño de cola/pila,
  distancia. Es lo que convierte la animación en explicación.
- **Una idea por escena.** El equivalente a "descubrir no es evaluar" en BFS:
  en ordenamiento es "comparar no es intercambiar"; en Dijkstra, "relajar no es visitar".
- **Accesibilidad**: teclado, `aria-live` para la narración, reduced-motion, contraste
  y una paleta que no dependa solo del color.
- **Print**: 3 diagramas por fase + leyenda + todas las escenas. Un PDF por algoritmo.

---

## 10. Riesgos y anti-patrones

1. **Framework antes del tercer caso.** La abstracción prematura es el riesgo #1.
2. **Deuda de copy.** El código se escribe una vez; la explicación se reescribe diez.
3. **Un renderer para gobernarlos a todos.** Termina lleno de `if (view === ...)`.
4. **Build step creep.** Vite/Astro resuelven DX, pero rompen `file://` y suman mantenimiento.
5. **Explosión de snapshots.** Un grafo grande puede generar miles de estados.
6. **Pirámide de tests invertida.** El motor puro se testea barato; E2E solo para el shell
   y un flujo por algoritmo.
7. **Narración acoplada al motor.** Dificulta i18n y hace frágiles los tests.
8. **Plugins de usuario.** Si algún día se permite cargar algoritmos, hay que aislar y
   validar; no es un objetivo de este proyecto.

---

## 11. Decisiones que conviene registrar (ADR)

| ADR | Pregunta |
|-----|----------|
| ADR-001 | ¿Núcleo + módulos o framework genérico? |
| ADR-002 | ¿Multi-página o shell único con registro? |
| ADR-003 | ¿Scripts clásicos (file://) o ES modules (requiere servidor)? |
| ADR-004 | ¿Narración dentro del snapshot o en una capa aparte? |
| ADR-005 | ¿Política de escenas por algoritmo o global? |

---

## 12. Preguntas abiertas (para decidir con el dueño del proyecto)

1. ¿`file://` es un requisito que querés mantener? (cambia toda la estrategia de carga)
2. ¿Público objetivo: estudiantes, entrevistas, docencia, uso personal?
3. ¿Bilingüe español/inglés desde el principio o después?
4. ¿Cuántos algoritmos y en qué plazo? (define cuánto invertir en infraestructura)
5. ¿Querés que el usuario edite datos/árboles, o alcanza con datasets curados?
6. ¿Métricas de uso? (si sí, elegir algo liviano y respetuoso de la privacidad)

---

## 13. Recomendación concreta (si tuviera que elegir hoy)

1. **Ola 0**: extraer `core/` sin cambiar comportamiento. Los tests son la red de seguridad.
2. Sumar **ordenamiento** como segundo módulo y usarlo para romper el contrato a propósito.
3. Recién ahí decidir si el registro genérico aporta o estorba.
4. Mantener **sin build** y con `file://` como restricción dura, salvo que vos digas lo contrario.
5. Crear el catálogo cuando haya **3 algoritmos**, no antes.

---

## Glosario mínimo

- **Renderer / vista**: la pieza que dibuja un estado en pantalla.
- **Snapshot**: foto completa del estado en un instante.
- **Contrato**: conjunto mínimo de cosas que un módulo debe ofrecer para que el shell lo use.
- **Regla de tres**: no abstraigas hasta tener tres casos concretos que lo justifiquen.
- **ADR**: registro corto de una decisión de arquitectura y por qué se tomó.
