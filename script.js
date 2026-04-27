/* The Writer's Collective — orbiting canvas carousel
 * 3 paintings on each side of the central Met-style logo.
 * The arc is shaped via translateY (slight downward sag in the middle),
 * translateZ (push outer cards back), and rotateY (edge cards angle inward).
 */
(function () {
  "use strict";

  const PAINTINGS = [
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286618/1920px-Church_Heart_of_the_Andes_u8pwke.jpg", caption: "Heart of the Andes" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286617/Winslow_Homer_-_Snap_the_Whip__Butler_Institute_of_American_Art_m6ijsc.jpg", caption: "Snap the Whip" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286617/David_-_The_Death_of_Socrates_bzxupw.jpg", caption: "The Death of Socrates" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286617/main-image_ra6pm1.jpg", caption: "From the Archive" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286616/2c0abcdcfe50c2ec3e128dd3c3119a70b0d84ad9_riysjc.jpg", caption: "A Quiet Study" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286616/9facac56e05d8e64bcb9b404b0bcc30421bfea15-1920x1080_iacvju.jpg", caption: "Halls of Memory" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286616/Georges_Seurat_066_ivtkfp.jpg", caption: "A Sunday Afternoon" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286616/Rosa_Bonheur__The_Horse_Fair__1852_55_ierbuz.jpg", caption: "The Horse Fair" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286616/DP140973_rpd3ag.jpg", caption: "From the Met Archive" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286616/n-4240-00-000069-xl-hd_pkzcej.jpg", caption: "Salon of Letters" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286615/e1b0e8a1b50c70aa7480dbb3ae066ba23f88f09c-2320x1305_kuomux.jpg", caption: "An Author's Window" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286615/Cole_Thomas_The_Oxbow__The_Connecticut_River_near_Northampton_1836_sfdqhc.jpg", caption: "The Oxbow" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286615/main-image-_1__eqj8ql.jpg", caption: "Pages, Bound" },
    { url: "https://res.cloudinary.com/dnickckih/image/upload/q_auto/f_auto/v1777286615/two-cut-sunflowers_rziot3.jpg", caption: "Two Cut Sunflowers" },
  ];

  const rail = document.getElementById("orbit-rail");
  if (!rail) return;

  // Build cards
  const cards = PAINTINGS.map((p, i) => {
    const li = document.createElement("li");
    li.className = "orbit__card";
    li.dataset.index = String(i);
    li.innerHTML = `
      <div class="orbit__card-inner">
        <img class="orbit__card-img" src="${p.url}" alt="${p.caption}" loading="lazy" />
      </div>
      <div class="orbit__card-caption">${p.caption}</div>
    `;
    rail.appendChild(li);
    return li;
  });

  // Slot configuration: 3 paintings on each side of the centred logo.
  // Slots: -3, -2, -1 | (logo) | +1, +2, +3
  // Plus 2 ghost slots at -4 and +4 (heavily rotated, partially visible at the edges).
  const SLOTS = [
    { offset: -4, x: -1020, y:  10, z: -160, rotY:  62, opacity: 0.55, scale: 0.95 },
    { offset: -3, x:  -740, y:  -2, z:  -40, rotY:  32, opacity: 1.0,  scale: 1.0  },
    { offset: -2, x:  -510, y:  -8, z:    0, rotY:  16, opacity: 1.0,  scale: 1.0  },
    { offset: -1, x:  -290, y: -10, z:   10, rotY:   6, opacity: 1.0,  scale: 1.0  },
    { offset:  1, x:   290, y: -10, z:   10, rotY:  -6, opacity: 1.0,  scale: 1.0  },
    { offset:  2, x:   510, y:  -8, z:    0, rotY: -16, opacity: 1.0,  scale: 1.0  },
    { offset:  3, x:   740, y:  -2, z:  -40, rotY: -32, opacity: 1.0,  scale: 1.0  },
    { offset:  4, x:  1020, y:  10, z: -160, rotY: -62, opacity: 0.55, scale: 0.95 },
  ];

  // The "center" pointer (offset 0 = the logo, no card).
  let centerIndex = 3;

  function shortest(delta, len) {
    const half = len / 2;
    let d = ((delta % len) + len) % len;
    if (d > half) d -= len;
    return d;
  }

  function render() {
    const len = cards.length;
    cards.forEach((card, i) => {
      const slotOffset = shortest(i - centerIndex, len);
      const slot = SLOTS.find((s) => s.offset === slotOffset);

      if (!slot) {
        card.dataset.hidden = "true";
        card.style.transform =
          `translate3d(${slotOffset * 1500}px, 0, -800px) rotateY(${slotOffset > 0 ? -80 : 80}deg)`;
        card.style.opacity = "0";
        card.style.zIndex = "0";
        return;
      }

      card.dataset.hidden = "false";
      card.style.transform =
        `translate3d(${slot.x}px, ${slot.y}px, ${slot.z}px) rotateY(${slot.rotY}deg) scale(${slot.scale})`;
      card.style.opacity = String(slot.opacity);
      card.style.zIndex = String(40 - Math.abs(slotOffset));
      card.style.filter =
        Math.abs(slotOffset) <= 1
          ? "saturate(1) brightness(1)"
          : Math.abs(slotOffset) === 2
            ? "saturate(0.95) brightness(0.96)"
            : "saturate(0.88) brightness(0.85)";
    });
  }

  function step(delta) {
    const len = cards.length;
    centerIndex = ((centerIndex + delta) % len + len) % len;
    render();
  }

  // Auto-advance
  let timer = null;
  function startAuto() { timer = window.setInterval(() => step(1), 4500); }

  render();
  startAuto();
})();
