/*
 * lib/render.js — traduce snapshots a SVG/DOM. No decide el algoritmo.
 * Script clásico para file://.
 */
(function (ns) {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
  var STATUS_CLASSES = ["s-queued", "s-base", "s-eval", "s-found", "s-pending", "s-faint"];

  function svgEl(name, attrs) {
    var el = document.createElementNS(SVG_NS, name);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        el.setAttribute(key, attrs[key]);
      });
    }
    return el;
  }

  function buildEdgeLabelPosition(a, b) {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2 - 7
    };
  }

  function initTree(svg, tree) {
    svg.innerHTML = "";
    var edgeLayer = svgEl("g", { "class": "edges" });
    var edgeEls = {};
    var edgeLabelEls = {};

    tree.edges.forEach(function (pair) {
      var key = pair[0] + "-" + pair[1];
      var a = tree.nodes[pair[0]];
      var b = tree.nodes[pair[1]];

      var line = svgEl("line", {
        "class": "edge",
        "data-edge": key,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y
      });
      edgeEls[key] = line;
      edgeLayer.appendChild(line);

      var pos = buildEdgeLabelPosition(a, b);
      var label = svgEl("text", {
        "class": "edge-label",
        "data-edge-label": key,
        x: pos.x,
        y: pos.y
      });
      label.textContent = "";
      edgeLabelEls[key] = label;
      edgeLayer.appendChild(label);
    });

    svg.appendChild(edgeLayer);

    var nodeLayer = svgEl("g", { "class": "nodes" });
    var nodeEls = {};
    var orderTextEls = {};
    var markEls = {};

    Object.keys(tree.nodes).forEach(function (id) {
      var n = tree.nodes[id];
      var node = svgEl("g", {
        "class": "node",
        "data-node": id,
        transform: "translate(" + n.x + " " + n.y + ")"
      });

      var inner = svgEl("g", { "class": "node-inner" });
      inner.appendChild(svgEl("circle", { "class": "halo", r: 32 }));
      inner.appendChild(svgEl("circle", { "class": "disc", r: 24 }));

      var nlabel = svgEl("text", { "class": "nlabel", y: 5 });
      nlabel.textContent = n.label || id;
      inner.appendChild(nlabel);

      var badge = svgEl("g", {
        "class": "order-badge",
        transform: "translate(20 -20)"
      });
      badge.appendChild(svgEl("circle", { r: 10 }));
      var obtext = svgEl("text", { "class": "obtext", y: 1 });
      badge.appendChild(obtext);
      inner.appendChild(badge);
      orderTextEls[id] = obtext;

      var mark = svgEl("text", { "class": "mark", y: -36 });
      inner.appendChild(mark);
      markEls[id] = mark;

      node.appendChild(inner);
      nodeEls[id] = node;
      nodeLayer.appendChild(node);
    });

    svg.appendChild(nodeLayer);
    return {
      nodeEls: nodeEls,
      edgeEls: edgeEls,
      edgeLabelEls: edgeLabelEls,
      orderTextEls: orderTextEls,
      markEls: markEls
    };
  }

  function reconcileQueue(state, list) {
    var chips = list._chips || (list._chips = {});
    var wanted = state.queue;

    Object.keys(chips).forEach(function (id) {
      if (wanted.indexOf(id) === -1) {
        chips[id].remove();
        delete chips[id];
      }
    });

    wanted.forEach(function (id, idx) {
      var chip = chips[id];
      if (!chip) {
        chip = document.createElement("li");
        chip.className = "qchip enter";

        var qorder = document.createElement("span");
        qorder.className = "qorder";
        var qid = document.createElement("span");
        qid.className = "qid";
        qid.textContent = id;

        chip.appendChild(qorder);
        chip.appendChild(qid);
        list.appendChild(chip);
        chips[id] = chip;
      }
      var order = state.order[id];
      chip.querySelector(".qorder").textContent = order != null ? "#" + order : "";
      chip.classList.toggle("is-front", idx === 0);
    });

    var empty = list.querySelector(".qempty");
    if (wanted.length === 0) {
      if (!empty) {
        empty = document.createElement("li");
        empty.className = "qempty";
        list.appendChild(empty);
      }
      empty.textContent = state.result === "exhausted"
        ? "cola vacía · sin objetivo"
        : "cola vacía";
    } else if (empty) {
      empty.remove();
    }
  }

  function createRenderer(tree, elements) {
    var dom = initTree(elements.svg, tree);

    return function render(state) {
      var visible = state.visible;

      Object.keys(tree.nodes).forEach(function (id) {
        var node = dom.nodeEls[id];
        var isVisible = visible.indexOf(id) !== -1;
        node.classList.toggle("is-visible", isVisible);

        STATUS_CLASSES.forEach(function (cls) {
          node.classList.remove(cls);
        });
        node.classList.add("s-" + (state.status[id] || "pending"));

        var order = state.order[id];
        if (order != null) {
          node.classList.add("has-order");
          dom.orderTextEls[id].textContent = order;
        } else {
          node.classList.remove("has-order");
          dom.orderTextEls[id].textContent = "";
        }

        var status = state.status[id];
        var mark = dom.markEls[id];
        mark.textContent = status === "eval" ? "?" : (status === "found" ? "✓" : "");
        mark.setAttribute("class", "mark" + (status === "eval"
          ? " mark-eval"
          : status === "found"
            ? " mark-found"
            : ""));
      });

      tree.edges.forEach(function (pair) {
        var key = pair[0] + "-" + pair[1];
        var edgeVisible = visible.indexOf(pair[0]) !== -1 && visible.indexOf(pair[1]) !== -1;
        dom.edgeEls[key].classList.toggle("is-visible", edgeVisible);

        var label = dom.edgeLabelEls[key];
        var edgeOrder = state.edgeOrder && state.edgeOrder[key];
        if (edgeVisible && edgeOrder != null) {
          label.textContent = edgeOrder;
          label.classList.add("is-visible");
        } else {
          label.textContent = "";
          label.classList.remove("is-visible");
        }
      });

      reconcileQueue(state, elements.queueList);

      elements.queuePanel.classList.toggle("is-empty", state.queue.length === 0);
      elements.queuePanel.classList.toggle("is-exhausted", state.result === "exhausted");
      elements.queuePanel.classList.toggle("is-found", state.result === "found");
      elements.app.classList.toggle("result-found", state.result === "found");
      elements.app.classList.toggle("result-exhausted", state.result === "exhausted");

      elements.beatLabel.textContent = state.label || "";
      elements.queueNote.textContent = state.result === "found"
        ? "Objetivo encontrado: el recorrido se detiene."
        : state.result === "exhausted"
          ? "Cola vacía: el objetivo no está en el árbol."
          : state.queue.length
            ? "El frente (izquierda) es el próximo en procesarse."
            : "La cola está vacía.";
    };
  }

  /* Versión string del SVG, para los diagramas impresos. */
  function svgMarkup(state, tree) {
    var parts = [];
    parts.push('<svg class="print-svg" viewBox="0 0 800 400" role="img" aria-label="Árbol de ejemplo con el estado del recorrido BFS">');

    tree.edges.forEach(function (pair) {
      var a = tree.nodes[pair[0]];
      var b = tree.nodes[pair[1]];
      var visible = state.visible.indexOf(pair[0]) !== -1 && state.visible.indexOf(pair[1]) !== -1;
      parts.push('<line x1="' + a.x + '" y1="' + a.y + '" x2="' + b.x + '" y2="' + b.y + '" class="edge' + (visible ? " is-visible" : "") + '"/>');
    });

    Object.keys(tree.nodes).forEach(function (id) {
      var n = tree.nodes[id];
      var visible = state.visible.indexOf(id) !== -1;
      var status = state.status[id] || "pending";
      var order = state.order[id];
      var mark = status === "eval" ? "?" : (status === "found" ? "✓" : "");

      parts.push('<g class="node' + (visible ? " is-visible" : "") + " s-" + status + (order != null ? " has-order" : "") + '" transform="translate(' + n.x + " " + n.y + ')">');
      parts.push('<circle class="halo" r="32"/>');
      parts.push('<circle class="disc" r="24"/>');
      parts.push('<text class="nlabel" y="5">' + id + "</text>");
      if (order != null) {
        parts.push('<g class="order-badge" transform="translate(20 -20)"><circle r="10"/><text class="obtext" y="1">' + order + "</text></g>");
      }
      if (mark) {
        parts.push('<text class="mark mark-' + status + '" y="-36">' + mark + "</text>");
      }
      parts.push("</g>");
    });

    parts.push("</svg>");
    return parts.join("");
  }

  ns.initTree = initTree;
  ns.createRenderer = createRenderer;
  ns.svgMarkup = svgMarkup;
})(window.BFSVisual = window.BFSVisual || {});
