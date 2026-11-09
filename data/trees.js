/*
 * data/trees.js — árboles de la explicación.
 * Script clásico (no ES module) para que funcione abriendo index.html con file://.
 * Coordenadas fijas en un viewBox de 800x400: nada de layout automático.
 */
(function (ns) {
  "use strict";

  var classic = {
    label: "Clásico · A–G",
    defaultTarget: "F",
    root: "A",
    nodes: {
      A: { label: "A", x: 400, y: 72 },
      B: { label: "B", x: 220, y: 192 },
      C: { label: "C", x: 400, y: 192 },
      D: { label: "D", x: 580, y: 192 },
      E: { label: "E", x: 140, y: 312 },
      F: { label: "F", x: 300, y: 312 },
      G: { label: "G", x: 580, y: 312 }
    },
    edges: [
      ["A", "B"],
      ["A", "C"],
      ["A", "D"],
      ["B", "E"],
      ["B", "F"],
      ["D", "G"]
    ],
    adj: {
      A: ["B", "C", "D"],
      B: ["E", "F"],
      C: [],
      D: ["G"],
      E: [],
      F: [],
      G: []
    }
  };

  /*
   * Árbol ancho: un nivel intermedio con tres padres y seis nietos.
   * Sirve para ver la "ola" completa antes de bajar de nivel.
   */
  var wide = {
    label: "Ancho · 10 nodos",
    defaultTarget: "H",
    root: "A",
    nodes: {
      A: { x: 400, y: 64 },
      B: { x: 160, y: 190 },
      C: { x: 400, y: 190 },
      D: { x: 640, y: 190 },
      E: { x: 80, y: 320 },
      F: { x: 240, y: 320 },
      G: { x: 360, y: 320 },
      H: { x: 480, y: 320 },
      I: { x: 600, y: 320 },
      J: { x: 720, y: 320 }
    },
    edges: [
      ["A", "B"],
      ["A", "C"],
      ["A", "D"],
      ["B", "E"],
      ["B", "F"],
      ["C", "G"],
      ["C", "H"],
      ["D", "I"],
      ["D", "J"]
    ],
    adj: {
      A: ["B", "C", "D"],
      B: ["E", "F"],
      C: ["G", "H"],
      D: ["I", "J"],
      E: [],
      F: [],
      G: [],
      H: [],
      I: [],
      J: []
    }
  };

  /*
   * Árbol profundo: cuatro niveles con una sola rama que baja.
   * Sirve para contrastar "nivel por nivel" contra "bajar por una rama".
   */
  var deep = {
    label: "Profundo · 6 nodos",
    defaultTarget: "F",
    root: "A",
    nodes: {
      A: { x: 400, y: 60 },
      B: { x: 250, y: 170 },
      C: { x: 550, y: 170 },
      D: { x: 170, y: 280 },
      E: { x: 330, y: 280 },
      F: { x: 170, y: 365 }
    },
    edges: [
      ["A", "B"],
      ["A", "C"],
      ["B", "D"],
      ["B", "E"],
      ["D", "F"]
    ],
    adj: {
      A: ["B", "C"],
      B: ["D", "E"],
      C: [],
      D: ["F"],
      E: [],
      F: []
    }
  };

  ns.TREES = {
    classic: classic,
    wide: wide,
    deep: deep
  };

  /* Compatibilidad con el arranque anterior. */
  ns.TREE = classic;
})(window.BFSVisual = window.BFSVisual || {});
