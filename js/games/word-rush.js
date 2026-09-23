export function wordRush(root, g, header) {
  const words = ["MINT", "CLOUD", "BRISK", "PLANT", "STONE", "RIVER", "LIGHT", "QUICK", "EMBER", "NORTH"];
  let time = 20, last = 0, rival = 0, progress = 0;

  root.innerHTML = `<div class="game-screen">
    ${header("Word Rush", 0, 0)}
    <div class="row"><span>Time</span><b id="wrTime">20s</b></div>
    <div class="track"><div id="wrTimer" class="fill"></div></div>
    <div class="prompt"><div><strong id="wrWord"></strong><small>Type the word exactly.</small></div></div>
    <input id="wrInput" class="input" autocomplete="off" autocapitalize="characters" spellcheck="false">
    <p class="note">Rival typed: <b id="rivalScore">0</b></p>
  </div>`;

  function nextWord() {
    $("wrWord").textContent = words[Math.floor(Math.random() * words.length)];
    $("wrInput").value = "";
  }

  $("wrInput").addEventListener("input", () => {
    if ($("wrInput").value.trim().toUpperCase() !== $("wrWord").textContent) return;
    g.score++;
    $("gameScore").textContent = g.score;
    g.sound("score");
    nextWord();
  });

  nextWord();

  function frame(now) {
    if (g.over) return;
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
    last = now;
    time -= dt;
    progress += dt / Math.max(.48, 1.2 - g.score * .018);

    if (progress >= 1) {
      rival++;
      progress -= 1;
      $("rivalScore").textContent = rival;
    }

    $("wrTime").textContent = `${Math.max(0, time).toFixed(1)}s`;
    $("wrTimer").style.transform = `scaleX(${Math.max(0, time / 20)})`;

    if (time <= 0) {
      g.finish(`The rival typed ${rival} words.`, g.score);
      return;
    }
    g.raf = requestAnimationFrame(frame);
  }

  g.raf = requestAnimationFrame(frame);
}
