/*
 * data/tree.js — árbol fijo de la explicación.
 * Script clásico (no ES module) para que funcione abriendo index.html con file://.
 */
(function (ns) {
  "use strict";

  ns.TREE = {
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
})(window.BFSVisual = window.BFSVisual || {});
