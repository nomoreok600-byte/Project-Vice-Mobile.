"use strict";

// Shared animation helpers for Tile Master.
// Works with game screens created dynamically inside #app.

(() => {
  const app = document.getElementById("app");
  if (!app) return;

  let lastScore = "";
  let scoreFlashTimer = 0;

  function popScore() {
    const score = document.getElementById("gameScore");
    if (!score) return;

    score.classList.remove("score-pop");
    void score.offsetWidth;
    score.classList.add("score-pop");

    app.classList.remove("score-flash");
    void app.offsetWidth;
    app.classList.add("score-flash");

    clearTimeout(scoreFlashTimer);
    scoreFlashTimer = setTimeout(() => {
      app.classList.remove("score-flash");
    }, 260);
  }

  function checkScore() {
    const score = document.getElementById("gameScore");
    if (!score) {
      lastScore = "";
      return;
    }

    const value = score.textContent.trim();
    if (lastScore !== "" && value !== lastScore) popScore();
    lastScore = value;
  }

  // Animate game views and newly created UI, including cards rendered later.
  const viewObserver = new MutationObserver(() => {
    checkScore();
  });

  viewObserver.observe(app, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Add consistent pressed feedback to buttons created by each mini-game.
  app.addEventListener("pointerdown", event => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;

    button.classList.remove("tile-flash");
    if (
      button.classList.contains("tile") ||
      button.classList.contains("pad")
    ) {
      void button.offsetWidth;
      button.classList.add("tile-flash");
    }
  }, { passive: true });

  // Keyboard users get the same score feedback.
  app.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      const button = event.target.closest("button");
      if (button && !button.disabled) {
        requestAnimationFrame(checkScore);
      }
    }
  });

  // Expose a small helper if a game wants to trigger feedback manually.
  window.TileMasterFX = {
    score: popScore,
    refresh: checkScore
  };
})();
