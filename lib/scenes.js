/*
 * lib/scenes.js — las 10 escenas didácticas.
 * Cada escena es un título, un texto y una lista de frames (snapshots).
 * Al avanzar, el player reproduce los frames de la escena.
 */
(function (ns) {
  "use strict";

  function makeScene(title, text, frames, speed) {
    return {
      title: title,
      text: text,
      frames: frames,
      speed: speed || 0
    };
  }

  function buildScenes(tree, runF, runZ) {
    var intro = ns.overviewState(tree, "faint");

    var order = ns.overviewState(tree, "pending");
    order.edgeOrder = {
      "A-B": 1,
      "A-C": 2,
      "A-D": 3,
      "B-E": 1,
      "B-F": 2,
      "D-G": 1
    };
    order.label = "Cada padre numera a sus hijos de izquierda a derecha: ese es el orden de aparición.";

    return [
      makeScene(
        "Qué vas a ver",
        "BFS no adivina: cuando expande un nodo, descubre sus hijos y los pone en una cola en el orden en que aparecen. Después los procesa en ese mismo orden. Vamos a ver cómo el árbol se arma solo y cómo la cola decide qué sigue.",
        [intro]
      ),
      makeScene(
        "Orden de aparición",
        "Los hijos de cada nodo se declaran de izquierda a derecha. Ese orden es el que hereda la cola. Nada de saltos: primero A, después los hijos de A, y después los hijos de esos hijos.",
        [order]
      ),
      makeScene(
        "La cola",
        "Empezamos con la raíz. La cola es FIFO: lo primero que entra es lo primero que sale. El frente está a la izquierda; ahí se decide cuál es el próximo nodo en procesarse.",
        [runF.states[1]]
      ),
      makeScene(
        "Desencolar",
        "Sale A del frente. Desencolar es tomar el nodo que la cola tenía esperando. Ese nodo es el que vamos a procesar ahora, no el que acabamos de descubrir.",
        [runF.states[2]],
        600
      ),
      makeScene(
        "Evaluar",
        "Antes de expandir, preguntamos: ¿este nodo es el objetivo? Esa pregunta es la parte de búsqueda. Si la respuesta es no, el nodo queda marcado como procesado y seguimos.",
        [runF.states[3]],
        750
      ),
      makeScene(
        "Expandir",
        "A no era el objetivo. Entonces aparecen sus hijos B, C y D, y se encolan en ese orden. Ahí empieza a componerse el árbol: las ramas nacen cuando su padre se expande.",
        [runF.states[4]],
        750
      ),
      makeScene(
        "La ola",
        "La cola procesa B, después C y después D: todo el nivel antes de bajar. Por eso BFS avanza como una ola. Los hijos de B y D se van encolando detrás, y esperan su turno.",
        runF.states.slice(5, 14),
        420
      ),
      makeScene(
        "Descubrir no es evaluar",
        "F ya está en la cola desde que expandimos B, pero todavía no se evaluó. Primero le toca a E. Estar en la cola no es haber sido encontrado: la evaluación ocurre recién cuando el nodo llega al frente.",
        runF.states.slice(14, 17),
        650
      ),
      makeScene(
        "Encontrado",
        "Ahora sí: F llega al frente, se evalúa y coincide. Se pinta de verde y el recorrido se detiene. G queda esperando en la cola, pero ya no importa: el objetivo apareció antes.",
        runF.states.slice(17, 20),
        750
      ),
      makeScene(
        "Si no está",
        "Si el objetivo no existe, la cola se vacía y el algoritmo termina en rojo. No es un error: es la respuesta “no alcanzable”. La leyenda de abajo resume qué significa cada color.",
        runZ.states.slice(1),
        170
      )
    ];
  }

  ns.buildScenes = buildScenes;
})(window.BFSVisual = window.BFSVisual || {});
