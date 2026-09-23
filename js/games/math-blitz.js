export function mathBlitz(root, g, header) {
  let time = 20, last = 0, answer = false, rival = 0, aiProgress = 0;

  root.innerHTML = `<div class="game-screen">
    ${header("Math Blitz", 0, 0)}
    <div class="row"><span>Time</span><b id="mbTime">20s</b></div>
    <div class="track"><div id="mbTimer" class="fill"></div></div>
    <div class="prompt"><div><strong id="mbQuestion"></strong><small>Is this equation true?</small></div></div>
    <div class="controls">
      <button class="choice" data-answer="true">True</button>
      <button class="choice" data-answer="false">False</button>
    </div>
  </div>`;

  function question() {
    const a = 2 + Math.floor(Math.random() * 19);
    const b = 2 + Math.floor(Math.random() * 14);
    const multiply = Math.random() < .5;
    answer = Math.random() < .62;
    let result = multiply ? a * b : a + b;
    if (!answer) result += Math.random() < .5 ? 1 + Math.floor(Math.random() * 4) : -1;
    $("mbQuestion").textContent = `${a} ${multiply ? "×" : "+"} ${b} = ${result}`;
  }

  document.querySelectorAll("[data-answer]").forEach(button => {
    button.addEventListener("click", () => {
      if (g.over) return;
      if ((button.dataset.answer === "true") !== answer) {
        g.finish(`The rival scored ${rival}.`, g.score);
        return;
      }
      g.score++;
      $("gameScore").textContent = g.score;
      g.sound("score");
      question();
    });
  });

  question();

  function frame(now) {
    if (g.over) return;
    const dt = Math.min(.05, Math.max(0, (now - last) / 1000));
    last = now;
    time -= dt;
    aiProgress += dt / Math.max(.32, .85 - g.score * .012);

    if (aiProgress >= 1) {
      rival++;
      aiProgress -= 1;
      $("rivalScore").textContent = rival;
    }

    $("mbTime").textContent = `${Math.max(0, time).toFixed(1)}s`;
    $("mbTimer").style.transform = `scaleX(${Math.max(0, time / 20)})`;

    if (time <= 0) {
      g.finish(`Time ran out. Rival score: ${rival}.`, g.score);
      return;
    }
    g.raf = requestAnimationFrame(frame);
  }

  g.raf = requestAnimationFrame(frame);
}
