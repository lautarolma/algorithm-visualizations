/*
 * app.js — composición: datos → trazas → escenas → player → render.
 * Script clásico para que funcione con file:// (sin bundler, sin red).
 */
(function (ns) {
  "use strict";

  var tree = ns.TREE;
  var runF = ns.trace(tree, "F", {});
  var runZ = ns.trace(tree, "Z", { previsible: true });
  var scenes = ns.buildScenes(tree, runF, runZ);

  var els = {
    app: document.getElementById("app"),
    svg: document.getElementById("tree"),
    queueList: document.getElementById("queue-list"),
    queuePanel: document.getElementById("queue-panel"),
    queueNote: document.getElementById("queue-note"),
    beatLabel: document.getElementById("beat-label"),
    sceneTitle: document.getElementById("scene-title"),
    sceneText: document.getElementById("scene-text"),
    sceneIndex: document.getElementById("scene-index"),
    counter: document.getElementById("scene-counter"),
    targetChip: document.getElementById("target-chip"),
    legend: document.getElementById("legend"),
    lessonCard: document.querySelector(".card-lesson"),
    progress: document.getElementById("progress"),
    printOnly: document.getElementById("print-only")
  };

  var render = ns.createRenderer(tree, els);

  function buildProgress() {
    els.progress.innerHTML = "";
    scenes.forEach(function (_, i) {
      var span = document.createElement("span");
      span.setAttribute("data-dot", String(i));
      els.progress.appendChild(span);
    });
  }

  function updateProgress(index) {
    Array.prototype.forEach.call(els.progress.children, function (dot, i) {
      dot.classList.toggle("active", i === index);
      dot.classList.toggle("done", i < index);
    });
  }

  function onScene(index, scene) {
    var last = scene.frames[scene.frames.length - 1];

    els.sceneIndex.textContent = String(index + 1).padStart(2, "0");
    els.counter.textContent = (index + 1) + " / " + scenes.length;
    els.sceneTitle.textContent = scene.title;
    els.sceneText.textContent = scene.text;
    els.targetChip.textContent = "Objetivo: " + last.target;
    els.targetChip.classList.toggle("is-alt", last.target !== "F");
    els.legend.classList.toggle("is-visible", index === scenes.length - 1);
    updateProgress(index);

    els.lessonCard.classList.remove("swap");
    void els.lessonCard.offsetWidth;
    els.lessonCard.classList.add("swap");
  }

  var player = ns.createPlayer({
    scenes: scenes,
    render: render,
    onScene: onScene
  });

  /* ---------- Teclado ---------- */
  document.addEventListener("keydown", function (event) {
    var code = event.code;
    var target = event.target;
    var isControl = target && /^(BUTTON|INPUT|TEXTAREA|SELECT|A)$/.test(target.tagName || "");

    // Si el foco está en un control, dejamos que Espacio/Enter hagan lo suyo.
    if (isControl && (code === "Space" || code === "Enter")) {
      return;
    }

    if (code === "Space") {
      event.preventDefault();
      if (event.shiftKey) {
        player.prev();
      } else {
        player.next();
      }
      return;
    }

    if (code === "ArrowLeft") {
      event.preventDefault();
      player.prev();
      return;
    }

    if (code === "ArrowRight") {
      event.preventDefault();
      player.next();
      return;
    }

    if (code === "KeyR") {
      player.reset();
      return;
    }

    if (code === "KeyP") {
      event.preventDefault();
      window.print();
    }
  });

  /* ---------- Botones ---------- */
  document.getElementById("btn-next").addEventListener("click", function () {
    player.next();
  });
  document.getElementById("btn-prev").addEventListener("click", function () {
    player.prev();
  });
  document.getElementById("btn-reset").addEventListener("click", function () {
    player.reset();
  });
  document.getElementById("btn-print").addEventListener("click", function () {
    window.print();
  });

  /* ---------- Contenido imprimible ---------- */
  function legendMarkup() {
    return [
      '<li><span class="swatch swatch-base"></span>Azul: recorrido (desencolar y expandir)</li>',
      '<li><span class="swatch swatch-eval"></span>Ámbar: evaluación (¿es el objetivo?)</li>',
      '<li><span class="swatch swatch-found"></span>Verde: encontrado</li>',
      '<li><span class="swatch swatch-exhausted"></span>Rojo: cola agotada</li>',
      '<li><span class="swatch swatch-pending"></span>Gris: en cola, sin evaluar</li>'
    ].join("");
  }

  function printQueueMarkup(state) {
    if (!state.queue.length) {
      return '<div class="print-queue">Cola: <em>vacía</em></div>';
    }
    var chips = state.queue.map(function (id) {
      var order = state.order[id];
      return '<span class="pq">' + (order != null ? "#" + order + " " : "") + id + "</span>";
    }).join(" ");
    return '<div class="print-queue">Cola (frente → final): ' + chips + "</div>";
  }

  function buildPrint() {
    var figures = [
      { title: "Primer nivel: A se expande y encola B, C, D", state: runF.states[4] },
      { title: "La ola: todo un nivel antes de bajar", state: runF.states[13] },
      { title: "Encontrado: F coincide y el recorrido frena", state: runF.states[19] }
    ];

    var html = "";
    html += "<h1>BFS en un árbol: el orden de aparición</h1>";
    html += '<p class="subtitle">Una guía para leer el recorrido por niveles y distinguir recorrido, evaluación y resultado.</p>';
    html += '<div class="print-figures">';
    figures.forEach(function (item) {
      html += "<figure>";
      html += "<figcaption>" + item.title + "</figcaption>";
      html += ns.svgMarkup(item.state, tree);
      html += printQueueMarkup(item.state);
      html += "</figure>";
    });
    html += "</div>";
    html += '<h2 class="print-h2">Cómo leer los colores</h2>';
    html += '<ul class="print-legend">' + legendMarkup() + "</ul>";
    html += '<p class="complexity">Cada nodo entra y sale de la cola una vez: O(V) tiempo y O(V) memoria en un árbol; O(V+E) en un grafo. La búsqueda evalúa al desencolar, no al descubrir.</p>';
    html += '<div class="page-break"></div>';
    html += '<h2 class="print-h2">Las 10 escenas</h2>';
    html += '<ol class="print-scenes">';
    scenes.forEach(function (scene, i) {
      html += "<li><h2>" + (i + 1) + ". " + scene.title + "</h2><p>" + scene.text + "</p></li>";
    });
    html += "</ol>";

    els.printOnly.innerHTML = html;
  }

  function initialScene() {
    var params = new URLSearchParams(window.location.search);
    var fromQuery = parseInt(params.get("scene"), 10);
    if (!isNaN(fromQuery) && fromQuery >= 1 && fromQuery <= scenes.length) {
      return fromQuery - 1;
    }
    var fromHash = parseInt((window.location.hash || "").replace("#", ""), 10);
    if (!isNaN(fromHash) && fromHash >= 1 && fromHash <= scenes.length) {
      return fromHash - 1;
    }
    return 0;
  }

  buildProgress();
  buildPrint();
  player.goTo(initialScene());
})(window.BFSVisual = window.BFSVisual || {});
