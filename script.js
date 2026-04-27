/* The Writer's Collective — wheel-driven orbital carousel.
 *
 *   • Cards travel on a continuous horizontal track around the central logo.
 *   • The mouse wheel drives a target offset; the rendered offset eases toward it
 *     each frame so motion is silky even after the wheel stops.
 *   • Cards pass *behind* the logo (logo sits on a higher Z plane) without
 *     popping out of existence — they just keep cruising.
 *   • Hover on a card slides it forward (Z) and scales it up, revealing the
 *     caption / description.
 */
(function () {
  "use strict";

  const PAINTINGS = [
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286618/1920px-Church_Heart_of_the_Andes_u8pwke.jpg",
      title: "Heart of the Andes",
      author: "Frederic Edwin Church, 1859" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286617/Winslow_Homer_-_Snap_the_Whip__Butler_Institute_of_American_Art_m6ijsc.jpg",
      title: "Snap the Whip",
      author: "Winslow Homer, 1872" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286617/David_-_The_Death_of_Socrates_bzxupw.jpg",
      title: "The Death of Socrates",
      author: "Jacques-Louis David, 1787" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286617/main-image_ra6pm1.jpg",
      title: "From the Archive",
      author: "Anonymous master, c. 19th c." },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286616/2c0abcdcfe50c2ec3e128dd3c3119a70b0d84ad9_riysjc.jpg",
      title: "A Quiet Study",
      author: "School of the Romantics" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286616/9facac56e05d8e64bcb9b404b0bcc30421bfea15-1920x1080_iacvju.jpg",
      title: "Halls of Memory",
      author: "Folio impression" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286616/Georges_Seurat_066_ivtkfp.jpg",
      title: "A Sunday on La Grande Jatte (study)",
      author: "Georges Seurat, 1884" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286616/Rosa_Bonheur__The_Horse_Fair__1852_55_ierbuz.jpg",
      title: "The Horse Fair",
      author: "Rosa Bonheur, 1852–55" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286616/DP140973_rpd3ag.jpg",
      title: "From the Met Archive",
      author: "Met collection" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286616/n-4240-00-000069-xl-hd_pkzcej.jpg",
      title: "Salon of Letters",
      author: "Late 19th c. genre study" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286615/e1b0e8a1b50c70aa7480dbb3ae066ba23f88f09c-2320x1305_kuomux.jpg",
      title: "An Author's Window",
      author: "From the writer's archive" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286615/Cole_Thomas_The_Oxbow__The_Connecticut_River_near_Northampton_1836_sfdqhc.jpg",
      title: "The Oxbow",
      author: "Thomas Cole, 1836" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286615/main-image-_1__eqj8ql.jpg",
      title: "Pages, Bound",
      author: "First-edition spines" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286615/two-cut-sunflowers_rziot3.jpg",
      title: "Two Cut Sunflowers",
      author: "Vincent van Gogh, 1887" },
  ];

  const orbit = document.querySelector(".orbit");
  const rail = document.getElementById("orbit-rail");
  if (!rail || !orbit) return;

  /* ---------- Build cards ---------- */
  const cards = PAINTINGS.map((p, i) => {
    const li = document.createElement("li");
    li.className = "orbit__card";
    li.dataset.index = String(i);
    li.innerHTML = `
      <div class="orbit__card-pop">
        <div class="orbit__card-frame">
          <img class="orbit__card-img" src="${p.url}" alt="${p.title}" loading="lazy" draggable="false" />
        </div>
        <figcaption class="orbit__card-caption">
          <span class="orbit__card-title">${p.title}</span>
          <span class="orbit__card-author">${p.author}</span>
        </figcaption>
      </div>
    `;
    rail.appendChild(li);
    return li;
  });

  /* ---------- Geometry ---------- */
  const N      = cards.length;
  const STEP   = 460;          // px between adjacent cards on the track
  const TRACK  = N * STEP;     // virtual loop length
  const HALF   = TRACK / 2;
  const VISIBLE_X = 1280;      // |x| beyond which a card fades out
  const FADE_X    = 200;       // px window over which the fade happens

  // Map a wrapped X coordinate (around the centre) to perspective transforms.
  function pose(x) {
    const abs = Math.abs(x);
    // gentle outward tilt: edge cards rotate inward toward the camera
    const rotY  = -clamp(x / 900, -1.05, 1.05) * 22;
    // mild push-back at the extremes
    const z     = -Math.min(abs / 6, 80);
    // subtle vertical sag — center sits a hair lower
    const y     = -8 + (abs / 1600) * 18;
    // soften saturation/brightness toward the edges
    const sat   = 1 - Math.min(abs / 4500, 0.18);
    const bri   = 1 - Math.min(abs / 5500, 0.18);
    // fade in/out beyond VISIBLE_X
    let opacity = 1;
    if (abs > VISIBLE_X) opacity = Math.max(0, 1 - (abs - VISIBLE_X) / FADE_X);
    // the dead-center 110px strip sits *behind* the logo — don't dim it, just
    // let the logo's stacking-context handle occlusion. (We keep opacity = 1.)
    return { x, y, z, rotY, sat, bri, opacity };
  }

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /* ---------- State + animation loop ---------- */
  let target  = 0; // virtual scroll position (px)
  let current = 0;
  let running = false;
  let lastFrame = 0;

  function applyPose(card, p) {
    card.style.setProperty("--x", `${p.x.toFixed(1)}px`);
    card.style.setProperty("--y", `${p.y.toFixed(1)}px`);
    card.style.setProperty("--z", `${p.z.toFixed(1)}px`);
    card.style.setProperty("--rotY", `${p.rotY.toFixed(2)}deg`);
    card.style.setProperty("--sat", p.sat.toFixed(3));
    card.style.setProperty("--bri", p.bri.toFixed(3));
    card.style.opacity = p.opacity.toFixed(3);
    // pointer-events only on visible cards so hover targets line up
    card.style.pointerEvents = p.opacity > 0.4 ? "auto" : "none";
  }

  function render() {
    cards.forEach((card, i) => {
      // raw distance from current scroll position, then wrap into (-HALF, HALF]
      let x = i * STEP - current;
      x = ((x + HALF) % TRACK + TRACK) % TRACK - HALF;

      const p = pose(x);
      applyPose(card, p);
      // Higher z-index for cards farther from center so the side cards layer
      // on top of the ones still emerging behind the logo.
      const abs = Math.abs(p.x);
      card.style.zIndex = String(40 - Math.min(40, Math.round(abs / 60)));
    });
  }

  function frame(t) {
    if (!lastFrame) lastFrame = t;
    const dt = Math.min(64, t - lastFrame);
    lastFrame = t;
    // Critically-damped ease toward target: ~0.10 per 16ms feels silky
    const k = 1 - Math.pow(0.0001, dt / 1000); // frame-rate independent
    current += (target - current) * k;
    render();
    if (Math.abs(target - current) > 0.05) {
      requestAnimationFrame(frame);
    } else {
      current = target;
      render();
      running = false;
    }
  }

  function kick() {
    if (running) return;
    running = true;
    lastFrame = 0;
    requestAnimationFrame(frame);
  }

  /* ---------- Wheel input ---------- */
  // The wheel anywhere on the page (within the stage) drives the carousel.
  // Vertical wheel deltas translate to horizontal track movement so a regular
  // mouse wheel works. Horizontal trackpad scroll also works.
  function onWheel(e) {
    const dy = Math.abs(e.deltaY);
    const dx = Math.abs(e.deltaX);
    const delta = dx > dy ? e.deltaX : e.deltaY;
    if (!delta) return;
    e.preventDefault();
    // Tune sensitivity: ~one card per ~3 wheel notches
    target += delta * 1.6;
    kick();
  }

  // Touch / drag support (bonus, since it's nearly free)
  let dragStartX = 0;
  let dragStartTarget = 0;
  let dragging = false;
  function onPointerDown(e) {
    dragging = true;
    dragStartX = e.clientX;
    dragStartTarget = target;
    orbit.classList.add("is-grabbing");
  }
  function onPointerMove(e) {
    if (!dragging) return;
    target = dragStartTarget - (e.clientX - dragStartX) * 1.4;
    kick();
  }
  function onPointerUp() {
    dragging = false;
    orbit.classList.remove("is-grabbing");
  }

  /* ---------- Wire up ---------- */
  // Capture wheel on the whole stage so users don't need to aim at the orbit.
  const stage = document.querySelector(".stage") || document.body;
  stage.addEventListener("wheel", onWheel, { passive: false });

  orbit.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("pointercancel", onPointerUp);

  // Keyboard left/right for accessibility
  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft")  { target -= STEP; kick(); }
    if (e.key === "ArrowRight") { target += STEP; kick(); }
  });

  render();
})();
