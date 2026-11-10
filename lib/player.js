/*
 * lib/player.js — máquina de estados de la presentación.
 * El player no sabe dibujar: recibe un render(state) y avisa qué escena cambió.
 */
(function (ns) {
  "use strict";

  function createPlayer(options) {
    var scenes = options.scenes;
    var render = options.render;
    var onScene = options.onScene;
    var motionQuery = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : null;
    var reduced = motionQuery ? motionQuery.matches : false;

    var index = 0;
    var animating = false;
    var timer = null;

    function stopTimer() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function lastFrame(scene) {
      return scene.frames[scene.frames.length - 1];
    }

    function finishCurrent() {
      stopTimer();
      animating = false;
      render(lastFrame(scenes[index]));
    }

    function show(i, animate) {
      if (i < 0 || i >= scenes.length) {
        return;
      }

      stopTimer();
      animating = false;
      index = i;

      var scene = scenes[index];
      if (onScene) {
        onScene(index, scene);
      }

      var frames = scene.frames;
      if (!animate || reduced || frames.length <= 1 || !scene.speed) {
        render(lastFrame(scene));
        return;
      }

      var k = 0;
      animating = true;

      function step() {
        if (!animating) {
          return;
        }
        render(frames[k]);
        k += 1;
        if (k < frames.length) {
          timer = setTimeout(step, scene.speed);
        } else {
          animating = false;
          timer = null;
        }
      }

      step();
    }

    function next() {
      if (animating) {
        finishCurrent();
        return;
      }
      if (index < scenes.length - 1) {
        show(index + 1, true);
      }
    }

    function prev() {
      if (animating) {
        stopTimer();
        animating = false;
      }
      if (index > 0) {
        show(index - 1, false);
      }
    }

    function reset() {
      stopTimer();
      animating = false;
      show(0, false);
    }

    function goTo(i) {
      show(i, false);
    }

    /*
     * Cambia la línea de tiempo en caliente (selector de objetivo / árbol).
     * Mantiene el índice dentro de rango para no quedar fuera de la lista.
     */
    function setScenes(next) {
      stopTimer();
      animating = false;
      scenes = next;
      if (index > scenes.length - 1) {
        index = Math.max(0, scenes.length - 1);
      }
    }

    function getIndex() {
      return index;
    }

    function isAnimating() {
      return animating;
    }

    /*
     * Si el usuario cambia la preferencia del sistema en vivo, cortamos la
     * animación en curso y mostramos el estado final de la escena.
     */
    if (motionQuery && motionQuery.addEventListener) {
      motionQuery.addEventListener("change", function (event) {
        reduced = event.matches;
        if (reduced && animating) {
          stopTimer();
          animating = false;
          render(lastFrame(scenes[index]));
        }
      });
    }

    return {
      next: next,
      prev: prev,
      reset: reset,
      goTo: goTo,
      setScenes: setScenes,
      getIndex: getIndex,
      isAnimating: isAnimating
    };
  }

  ns.createPlayer = createPlayer;
})(window.BFSVisual = window.BFSVisual || {});
