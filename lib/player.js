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
    var reduced = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

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

    function getIndex() {
      return index;
    }

    function isAnimating() {
      return animating;
    }

    return {
      next: next,
      prev: prev,
      reset: reset,
      goTo: goTo,
      getIndex: getIndex,
      isAnimating: isAnimating
    };
  }

  ns.createPlayer = createPlayer;
})(window.BFSVisual = window.BFSVisual || {});
