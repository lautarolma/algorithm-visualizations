/*
 * app.js — composición: datos → trazas → escenas → player → render.
 * Script clásico para que funcione con file:// (sin bundler, sin red).
 */
(function (ns) {
  "use strict";

  var tree = ns.TREE;

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
    modeChip: document.getElementById("mode-chip"),
    targetSelect: document.getElementById("target-select"),
    legend: document.getElementById("legend"),
    lessonCard: document.querySelector(".card-lesson"),
    progress: document.getElementById("progress"),
    printOnly: document.getElementById("print-only")
  };

  var renderer = ns.createRenderer(tree, els);

  var state = {
    target: "F",
    guide: true,
    scenes: [],
    run: null
  };

  function render(snapshot) {
    renderer(snapshot);
  }

  var player = ns.createPlayer({
    scenes: [],
    render: render,
    onScene: onScene
  });

  /* ---------- Escenas ---------- */

  /*
   * La guía curada solo aplica al árbol clásico buscando F. Cualquier otra
   * combinación entra en modo Explorar: la línea de tiempo se genera desde
   * el trace real, con copy correcto para ese objetivo.
   */
  function isGuide(target) {
    return target === "F";
  }

  function rebuild(startIndex) {
    var scenes;
    var run;

    if (state.guide) {
      run = ns.trace(tree, "F", {});
      var runZ = ns.trace(tree, "Z", { previsible: true });
      scenes = ns.buildScenes(tree, run, runZ);
    } else {
      run = ns.trace(tree, state.target, {});
      scenes = ns.buildLiveScenes(tree, state.target, run);
    }

    state.scenes = scenes;
    state.run = run;

    player.setScenes(scenes);
    buildProgress();
    buildPrint();

    els.modeChip.textContent = state.guide ? "Guía" : "Explorar";
    els.modeChip.classList.toggle("is-live", !state.guide);

    var clamped = Math.max(0, Math.min(startIndex || 0, scenes.length - 1));
    player.goTo(clamped);
  }

  function onScene(index, scene) {
    var last = scene.frames[scene.frames.length - 1];

    els.sceneIndex.textContent = String(index + 1).padStart(2, "0");
    els.counter.textContent = (index + 1) + " / " + state.scenes.length;
    els.sceneTitle.textContent = scene.title;
    els.sceneText.textContent = scene.text;
    els.targetChip.textContent = "Objetivo: " + last.target;
    els.targetChip.classList.toggle("is-alt", last.result === "exhausted");
    els.targetChip.classList.toggle("is-found", last.result === "found");
    els.legend.classList.toggle("is-visible", index === state.scenes.length - 1);
    updateProgress(index);

    els.lessonCard.classList.remove("swap");
    void els.lessonCard.offsetWidth;
    els.lessonCard.classList.add("swap");
  }

  /* ---------- Progreso ---------- */

  function buildProgress() {
    els.progress.innerHTML = "";
    state.scenes.forEach(function (_, i) {
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

  /* ---------- Selector de objetivo ---------- */

  function buildTargetOptions() {
    var ids = Object.keys(tree.nodes);
    var html = ids.map(function (id) {
      return '<option value="' + id + '">' + id + "</option>";
    }).join("");

    if (ids.indexOf("Z") === -1) {
      html += '<option value="Z">Z (no está)</option>';
    }

    els.targetSelect.innerHTML = html;
    els.targetSelect.value = state.target;
  }

  function setTarget(value) {
    state.target = value;
    state.guide = isGuide(value);
    syncUrl();
    rebuild(0);
  }

  /* ---------- Deep-link ---------- */

  function readTargetFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var target = params.get("target");
    var exists = target && (Object.prototype.hasOwnProperty.call(tree.nodes, target) || target === "Z");
    return exists ? target : "F";
  }

  function readSceneFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var scene = parseInt(params.get("scene"), 10);
    if (!isNaN(scene) && scene >= 1) {
      return scene - 1;
    }
    var hash = parseInt((window.location.hash || "").replace("#", ""), 10);
    if (!isNaN(hash) && hash >= 1) {
      return hash - 1;
    }
    return 0;
  }

  function syncUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      if (state.target === "F") {
        params.delete("target");
      } else {
        params.set("target", state.target);
      }
      params.delete("scene");
      var query = params.toString();
      var url = window.location.pathname + (query ? "?" + query : "") + window.location.hash;
      window.history.replaceState(null, "", url);
    } catch (error) {
      /* file:// puede rechazar replaceState; el deep-link de lectura sigue vivo. */
    }
  }

  /* ---------- Teclado ---------- */

  document.addEventListener("keydown", function (event) {
    var code = event.code;
    var target = event.target;
    var tag = target && target.tagName;

    // Los controles nativos manejan sus propias teclas.
    if ((tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") &&
        (code === "Space" || code === "Enter" || code.indexOf("Arrow") === 0)) {
      return;
    }
    if (tag === "BUTTON" && (code === "Space" || code === "Enter")) {
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

  function printQueueMarkup(snapshot) {
    if (!snapshot.queue.length) {
      return '<div class="print-queue">Cola: <em>vacía</em></div>';
    }
    var chips = snapshot.queue.map(function (id) {
      var order = snapshot.order[id];
      return '<span class="pq">' + (order != null ? "#" + order + " " : "") + id + "</span>";
    }).join(" ");
    return '<div class="print-queue">Cola (frente → final): ' + chips + "</div>";
  }

  /*
   * Los 3 diagramas impresos se eligen por fase, no por índice fijo:
   * así funcionan con cualquier árbol y cualquier objetivo.
   */
  function pickFigureStates(run) {
    var states = run.states;
    var seed = states[1] || states[0];
    var firstExpand = null;
    var mid = null;

    for (var i = 0; i < states.length; i++) {
      if (!firstExpand && states[i].phase === "expand") {
        firstExpand = states[i];
      }
      if (!mid && states[i].phase === "dequeue" && i > states.length * 0.5) {
        mid = states[i];
      }
    }

    return [
      seed,
      firstExpand || mid || states[Math.floor(states.length / 2)],
      states[states.length - 1]
    ];
  }

  function buildPrint() {
    var figures = pickFigureStates(state.run);
    var roles = [
      "La semilla",
      "Primera expansión",
      state.run.result === "found" ? "Encontrado" : "No alcanzable"
    ];
    var treeName = tree.label || "el árbol";

    var html = "";
    html += "<h1>BFS en un árbol: el orden de aparición</h1>";
    html += '<p class="subtitle">Buscando ' + state.target + " en " + treeName +
      ". Recorrido por niveles, evaluación y resultado.</p>";
    html += '<div class="print-figures">';

    figures.forEach(function (snapshot, i) {
      html += "<figure>";
      html += "<figcaption>" + roles[i] + ": " + snapshot.label + "</figcaption>";
      html += ns.svgMarkup(snapshot, tree);
      html += printQueueMarkup(snapshot);
      html += "</figure>";
    });

    html += "</div>";
    html += '<h2 class="print-h2">Cómo leer los colores</h2>';
    html += '<ul class="print-legend">' + legendMarkup() + "</ul>";
    html += '<p class="complexity">Cada nodo entra y sale de la cola una vez: O(V) tiempo y O(V) memoria en un árbol; O(V+E) en un grafo. La búsqueda evalúa al desencolar, no al descubrir.</p>';
    html += '<div class="page-break"></div>';
    html += '<h2 class="print-h2">Las ' + state.scenes.length + ' escenas</h2>';
    html += '<ol class="print-scenes">';

    state.scenes.forEach(function (scene, i) {
      html += "<li><h2>" + (i + 1) + ". " + scene.title + "</h2><p>" + scene.text + "</p></li>";
    });

    html += "</ol>";

    els.printOnly.innerHTML = html;
  }

  /* ---------- Arranque ---------- */

  state.target = readTargetFromUrl();
  state.guide = isGuide(state.target);

  buildTargetOptions();
  els.targetSelect.addEventListener("change", function () {
    setTarget(els.targetSelect.value);
  });

  rebuild(readSceneFromUrl());
})(window.BFSVisual = window.BFSVisual || {});
