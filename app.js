/*
 * app.js — composición: datos → trazas → escenas → player → render.
 * Script clásico para que funcione con file:// (sin bundler, sin red).
 */
(function (ns) {
  "use strict";

  var TREES = ns.TREES;
  var tree = TREES.classic;
  var renderer = null;

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
    treeSelect: document.getElementById("tree-select"),
    targetSelect: document.getElementById("target-select"),
    themeButton: document.getElementById("btn-theme"),
    legendButton: document.getElementById("btn-legend"),
    legend: document.getElementById("legend"),
    legendList: document.getElementById("legend-list"),
    prevButton: document.getElementById("btn-prev"),
    nextButton: document.getElementById("btn-next"),
    lessonCard: document.querySelector(".card-lesson"),
    progress: document.getElementById("progress"),
    printOnly: document.getElementById("print-only")
  };

  var state = {
    treeKey: "classic",
    target: "F",
    guide: true,
    scenes: [],
    run: null
  };

  function render(snapshot) {
    if (renderer) {
      renderer(snapshot);
    }
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
   * el trace real, con copy correcto para ese árbol y ese objetivo.
   */
  function isGuide(treeKey, target) {
    return treeKey === "classic" && target === "F";
  }

  function validTarget(value) {
    return value === "Z" || Object.prototype.hasOwnProperty.call(tree.nodes, value);
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
    els.prevButton.disabled = index === 0;
    els.nextButton.disabled = index === state.scenes.length - 1;
    syncUrl(index);
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

  /* ---------- Selectores ---------- */

  function buildTreeOptions() {
    var html = Object.keys(TREES).map(function (key) {
      return '<option value="' + key + '">' + TREES[key].label + "</option>";
    }).join("");

    els.treeSelect.innerHTML = html;
    els.treeSelect.value = state.treeKey;
  }

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

  function setTree(key) {
    if (!TREES[key]) {
      return;
    }

    state.treeKey = key;
    tree = TREES[key];
    renderer = ns.createRenderer(tree, els);

    if (!validTarget(state.target)) {
      state.target = tree.defaultTarget || Object.keys(tree.nodes)[0];
    }

    state.guide = isGuide(state.treeKey, state.target);
    buildTargetOptions();
    rebuild(0);
  }

  function setTarget(value) {
    if (!validTarget(value)) {
      return;
    }

    state.target = value;
    state.guide = isGuide(state.treeKey, value);
    rebuild(0);
  }

  /* ---------- Deep-link ---------- */

  function readTreeFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var key = params.get("tree");
    return key && Object.prototype.hasOwnProperty.call(TREES, key) ? key : "classic";
  }

  function readTargetFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var target = params.get("target");
    return target && validTarget(target) ? target : null;
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

  function syncUrl(index) {
    try {
      var params = new URLSearchParams(window.location.search);

      if (state.treeKey === "classic") {
        params.delete("tree");
      } else {
        params.set("tree", state.treeKey);
      }

      if (state.target === "F") {
        params.delete("target");
      } else {
        params.set("target", state.target);
      }

      if (index > 0) {
        params.set("scene", String(index + 1));
      } else {
        params.delete("scene");
      }

      var query = params.toString();
      var url = window.location.pathname + (query ? "?" + query : "");
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

    // No pisamos atajos del navegador (Ctrl/Cmd+P, Alt+←, etc.).
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return;
    }

    // Los controles de formulario manejan sus propias teclas (incluido el typeahead).
    if (tag === "SELECT" || tag === "INPUT" || tag === "TEXTAREA") {
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

  function toggleLegend() {
    var open = !els.legend.classList.contains("is-visible");
    els.legend.classList.toggle("is-visible", open);
    els.legendButton.setAttribute("aria-expanded", String(open));
  }

  els.nextButton.addEventListener("click", function () {
    player.next();
  });
  els.prevButton.addEventListener("click", function () {
    player.prev();
  });
  document.getElementById("btn-reset").addEventListener("click", function () {
    player.reset();
  });
  document.getElementById("btn-print").addEventListener("click", function () {
    window.print();
  });
  els.themeButton.addEventListener("click", toggleTheme);
  els.legendButton.addEventListener("click", toggleLegend);

  /* ---------- Tema ---------- */

  var themeQuery = window.matchMedia
    ? window.matchMedia("(prefers-color-scheme: dark)")
    : null;

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }

  function applyTheme(theme) {
    var isDark = theme === "dark";
    document.documentElement.setAttribute("data-theme", theme);
    els.themeButton.setAttribute("aria-pressed", String(isDark));
    els.themeButton.setAttribute("aria-label", isDark ? "Activar tema claro" : "Activar tema oscuro");
  }

  function storedTheme() {
    try {
      var saved = window.localStorage.getItem("bfs-theme");
      return saved === "dark" || saved === "light" ? saved : null;
    } catch (error) {
      return null;
    }
  }

  function toggleTheme() {
    var next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    try {
      window.localStorage.setItem("bfs-theme", next);
    } catch (error) {
      /* modo privado / file:// pueden bloquear localStorage. */
    }
  }

  function initTheme() {
    var saved = storedTheme();
    applyTheme(saved || currentTheme());

    if (themeQuery && themeQuery.addEventListener) {
      themeQuery.addEventListener("change", function (event) {
        if (!storedTheme()) {
          applyTheme(event.matches ? "dark" : "light");
        }
      });
    }
  }

  /* ---------- Contenido imprimible ---------- */

  var LEGEND = [
    ["base", "Azul: recorrido (desencolar y expandir)"],
    ["eval", "Ámbar: evaluación (¿es el objetivo?)"],
    ["found", "Verde: encontrado"],
    ["exhausted", "Rojo: cola agotada"],
    ["pending", "Gris: en cola, sin evaluar"]
  ];

  function legendMarkup() {
    return LEGEND.map(function (item) {
      return '<li><span class="swatch swatch-' + item[0] + '"></span>' + item[1] + "</li>";
    }).join("");
  }

  function initLegend() {
    els.legendList.innerHTML = legendMarkup();
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

  state.treeKey = readTreeFromUrl();
  tree = TREES[state.treeKey];
  renderer = ns.createRenderer(tree, els);

  state.target = readTargetFromUrl() || tree.defaultTarget || Object.keys(tree.nodes)[0];
  if (!validTarget(state.target)) {
    state.target = tree.defaultTarget || Object.keys(tree.nodes)[0];
  }
  state.guide = isGuide(state.treeKey, state.target);

  buildTreeOptions();
  buildTargetOptions();
  initTheme();
  initLegend();

  els.treeSelect.addEventListener("change", function () {
    setTree(els.treeSelect.value);
  });
  els.targetSelect.addEventListener("change", function () {
    setTarget(els.targetSelect.value);
  });

  rebuild(readSceneFromUrl());
})(window.BFSVisual = window.BFSVisual || {});
