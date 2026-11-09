/*
 * lib/trace.js — motor puro. No conoce el DOM ni los colores.
 * Recibe un árbol y un objetivo, devuelve una lista de estados (snapshots).
 */
(function (ns) {
  "use strict";

  function baseState(target) {
    return {
      target: target,
      visible: [],
      order: {},
      status: {},
      queue: [],
      result: null,      // null | "found" | "exhausted"
      phase: "idle",
      label: "",
      active: null,
      edgeOrder: null
    };
  }

  function clone(state) {
    return {
      target: state.target,
      visible: state.visible.slice(),
      order: Object.assign({}, state.order),
      status: Object.assign({}, state.status),
      queue: state.queue.slice(),
      result: state.result,
      phase: state.phase,
      label: state.label,
      active: state.active,
      edgeOrder: state.edgeOrder ? Object.assign({}, state.edgeOrder) : null
    };
  }

  function has(list, value) {
    return list.indexOf(value) !== -1;
  }

  /*
   * Opciones:
   *   previsible: si es true, todos los nodos están visibles desde el inicio
   *               (útil para la segunda corrida, sin volver a "componer" el árbol).
   */
  function trace(tree, target, options) {
    var opts = options || {};
    var states = [];
    var state = baseState(target);
    states.push(clone(state)); // 0: vacío

    var ids = Object.keys(tree.nodes);
    if (opts.previsible) {
      for (var v = 0; v < ids.length; v++) {
        state.visible.push(ids[v]);
        state.status[ids[v]] = "pending";
      }
    }

    // Semilla: la raíz entra en la cola.
    if (!has(state.visible, tree.root)) {
      state.visible.push(tree.root);
    }
    state.order[tree.root] = 1;
    state.status[tree.root] = "queued";
    state.queue.push(tree.root);
    state.phase = "seed";
    state.label = "Semilla: " + tree.root + " entra en la cola (orden #1).";
    states.push(clone(state)); // 1

    var nextOrder = 2;

    while (state.queue.length > 0) {
      // 1. Desencolar
      var node = state.queue.shift();
      state.status[node] = "base";
      state.active = node;
      state.phase = "dequeue";
      state.label = "Desencolar " + node + ".";
      states.push(clone(state));

      // 2. Evaluar (variante 2)
      var match = node === target;
      state.status[node] = "eval";
      state.phase = "evaluate";
      state.label = "Evaluar " + node + ": ¿es " + target + "? " + (match ? "Sí." : "No.");
      states.push(clone(state));

      if (match) {
        state.status[node] = "found";
        state.phase = "found";
        state.result = "found";
        state.label = "¡" + node + " es el objetivo! Fin del recorrido.";
        states.push(clone(state));
        return { target: target, states: states, result: "found", at: node };
      }

      // 3. Expandir y encolar en orden de aparición
      state.status[node] = "base";
      state.phase = "expand";
      var children = tree.adj[node] || [];
      if (children.length) {
        for (var i = 0; i < children.length; i++) {
          var child = children[i];
          if (!has(state.visible, child)) {
            state.visible.push(child);
          }
          state.order[child] = nextOrder++;
          state.status[child] = "queued";
          state.queue.push(child);
        }
        state.label = "Expandir " + node + ": aparecen " + children.join(", ") + " y se encolan.";
      } else {
        state.label = node + " no tiene hijos.";
      }
      states.push(clone(state));
    }

    // 4. Cola vacía: no alcanzable
    state.phase = "exhausted";
    state.result = "exhausted";
    state.active = null;
    state.label = "Cola vacía: " + target + " no está en el árbol.";
    states.push(clone(state));
    return { target: target, states: states, result: "exhausted", at: null };
  }

  function overviewState(tree, mode, target) {
    var state = baseState(target || "F");
    var ids = Object.keys(tree.nodes);
    for (var i = 0; i < ids.length; i++) {
      state.visible.push(ids[i]);
      state.status[ids[i]] = mode; // "faint" | "pending"
      state.order[ids[i]] = null;
    }
    state.phase = "overview";
    state.label = mode === "faint"
      ? "Este es el árbol completo. Ahora vamos a ver cómo se arma solo."
      : "Cada padre numera a sus hijos de izquierda a derecha: ese es el orden de aparición.";
    return state;
  }

  ns.trace = trace;
  ns.overviewState = overviewState;
  ns.cloneState = clone;
})(window.BFSVisual = window.BFSVisual || {});
