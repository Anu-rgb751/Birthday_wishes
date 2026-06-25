/* =========================================================
   BIRTHDAY SURPRISE WEBSITE — SCRIPT
   ---------------------------------------------------------
   Sections:
   1. Floating hearts (ambient background)
   2. Image fallback handling (graceful missing-photo state)
   3. Landing seal-opening sequence
   4. Scroll-reveal animations (IntersectionObserver)
   5. Gallery lightbox
   6. Confetti + heart burst + surprise modal
   7. Background music controls
========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* =======================================================
     1. FLOATING HEARTS
     Continuously spawns small heart glyphs that float
     upward and fade out, purely as ambient atmosphere.
  ======================================================= */
  const heartsContainer = document.getElementById('floating-hearts');
  const HEART_GLYPHS = ['❤', '❤️', '💗', '💕'];

  function spawnHeart() {
    const heart = document.createElement('span');
    heart.className = 'floating-heart';
    heart.textContent = HEART_GLYPHS[Math.floor(Math.random() * HEART_GLYPHS.length)];

    const startLeft = Math.random() * 100; // vw
    const drift = (Math.random() * 120 - 60) + 'px';
    const duration = 8 + Math.random() * 8; // seconds
    const size = 0.9 + Math.random() * 1.2; // rem

    heart.style.left = startLeft + 'vw';
    heart.style.setProperty('--drift', drift);
    heart.style.fontSize = size + 'rem';
    heart.style.animationDuration = duration + 's';

    heartsContainer.appendChild(heart);
    setTimeout(() => heart.remove(), duration * 1000 + 200);
  }

  if (!prefersReducedMotion) {
    // Seed a few hearts immediately, then keep spawning on an interval.
    for (let i = 0; i < 5; i++) setTimeout(spawnHeart, i * 400);
    setInterval(spawnHeart, 1400);
  }

  /* =======================================================
     2. IMAGE FALLBACK HANDLING
     If a photo path (images/photoN.jpg) hasn't been added
     yet, swap in a soft gradient placeholder instead of a
     broken-image icon.
  ======================================================= */
  function watchImage(img) {
    const fallback = img.nextElementSibling;
    if (!fallback || !fallback.classList.contains('img-fallback')) return;

    const reveal = () => fallback.classList.add('show');

    if (img.complete && img.naturalWidth === 0) {
      reveal();
    } else {
      img.addEventListener('error', reveal);
    }
  }
  document.querySelectorAll('.gallery-item img').forEach(watchImage);

  /* =======================================================
     3. LANDING SEAL-OPENING SEQUENCE
  ======================================================= */
  const landing = document.getElementById('landing');
  const openBtn = document.getElementById('open-gift-btn');
  const mainContent = document.getElementById('main-content');
  const landingContentEl = landing.querySelector('.landing-content');
  const hero = document.getElementById('hero');

  function openGift() {
    if (landing.classList.contains('is-opening')) return;
    landing.classList.add('is-opening');
    openBtn.setAttribute('aria-disabled', 'true');

    const finalize = () => {
      landing.style.display = 'none';
      mainContent.hidden = false;
      window.scrollTo({ top: 0, behavior: 'auto' });

      // Kick off the hero entrance animation.
      requestAnimationFrame(() => hero.classList.add('visible'));
    };

    if (prefersReducedMotion) {
      // Skip the animated sequence entirely.
      setTimeout(finalize, 50);
      return;
    }

    landingContentEl.addEventListener('animationend', function handler(e) {
      if (e.animationName === 'flapOpen') {
        landingContentEl.removeEventListener('animationend', handler);
        finalize();
      }
    });

    // Safety fallback in case the animationend event doesn't fire.
    setTimeout(finalize, 1500);
  }

  openBtn.addEventListener('click', openGift);

  /* =======================================================
     4. SCROLL-REVEAL ANIMATIONS
  ======================================================= */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in-view'));
  }

  /* =======================================================
     5. GALLERY LIGHTBOX
  ======================================================= */
  const galleryImgs = Array.from(document.querySelectorAll('.gallery-item .img-wrap img'));
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  let currentIndex = 0;

  function showLightbox(index) {
    currentIndex = (index + galleryImgs.length) % galleryImgs.length;
    const img = galleryImgs[currentIndex];
    // Don't open the lightbox for a photo that hasn't actually loaded yet.
    if (img.complete && img.naturalWidth === 0) return;
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.hidden = false;
    requestAnimationFrame(() => lightbox.classList.add('is-open'));
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    setTimeout(() => { lightbox.hidden = true; }, 300);
  }

  galleryImgs.forEach((img, i) => {
    img.closest('.img-wrap').addEventListener('click', () => showLightbox(i));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightboxPrev.addEventListener('click', () => showLightbox(currentIndex - 1));
  lightboxNext.addEventListener('click', () => showLightbox(currentIndex + 1));
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', (e) => {
    if (lightbox.hidden) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showLightbox(currentIndex - 1);
    if (e.key === 'ArrowRight') showLightbox(currentIndex + 1);
  });

  /* =======================================================
     6. SURPRISE: CONFETTI + HEART BURST + MODAL
  ======================================================= */
  const surpriseBtn = document.getElementById('surprise-btn');
  const modal = document.getElementById('surprise-modal');
  const modalClose = document.getElementById('modal-close');
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  const CONFETTI_COLORS = ['#e07b95', '#f3b8c6', '#d8b573', '#e8cf9c', '#fbf3ec'];

  function launchConfetti() {
    const pieces = [];
    const count = prefersReducedMotion ? 0 : 130;

    for (let i = 0; i < count; i++) {
      pieces.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * canvas.height * 0.3,
        size: 5 + Math.random() * 6,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        speedY: 2 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 2,
        rotation: Math.random() * 360,
        spin: (Math.random() - 0.5) * 8,
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
      });
    }

    const startTime = performance.now();
    const duration = 3800;

    function frame(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = now - startTime;

      pieces.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.rotation += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;
        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      });

      if (elapsed < duration) {
        requestAnimationFrame(frame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    if (count > 0) requestAnimationFrame(frame);
  }

  function launchHeartBurst(originEl) {
    if (prefersReducedMotion) return;
    const rect = originEl.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;

    for (let i = 0; i < 14; i++) {
      const heart = document.createElement('span');
      heart.className = 'burst-heart';
      heart.textContent = '❤';
      heart.style.left = originX + 'px';
      heart.style.top = originY + 'px';

      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 90;
      heart.style.setProperty('--bx', Math.cos(angle) * distance + 'px');
      heart.style.setProperty('--by', Math.sin(angle) * distance - 40 + 'px');

      document.body.appendChild(heart);
      setTimeout(() => heart.remove(), 1100);
    }
  }

  function openModal() {
    modal.hidden = false;
    requestAnimationFrame(() => modal.classList.add('is-open'));
  }
  function closeModal() {
    modal.classList.remove('is-open');
    setTimeout(() => { modal.hidden = true; }, 300);
  }

  surpriseBtn.addEventListener('click', () => {
    launchConfetti();
    launchHeartBurst(surpriseBtn);
    openModal();
  });
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (!modal.hidden && e.key === 'Escape') closeModal();
  });

  /* =======================================================
     7. BACKGROUND MUSIC CONTROLS
     Replace audio/birthday-song.mp3 with your own track —
     no other changes needed.
  ======================================================= */
  const audio = document.getElementById('bg-audio');
  const musicToggle = document.getElementById('music-toggle');
  const musicWidget = document.querySelector('.music-widget');
  let audioFailed = false;

  audio.addEventListener('error', () => {
    audioFailed = true;
    musicWidget.classList.add('is-disabled');
    musicToggle.setAttribute('aria-label', 'Music unavailable — add audio/birthday-song.mp3');
  }, true);

  musicToggle.addEventListener('click', () => {
    if (audioFailed) return;

    if (audio.paused) {
      audio.play().then(() => {
        musicToggle.classList.add('is-playing');
        musicToggle.setAttribute('aria-pressed', 'true');
        musicToggle.setAttribute('aria-label', 'Pause background music');
      }).catch(() => {
        audioFailed = true;
        musicWidget.classList.add('is-disabled');
      });
    } else {
      audio.pause();
      musicToggle.classList.remove('is-playing');
      musicToggle.setAttribute('aria-pressed', 'false');
      musicToggle.setAttribute('aria-label', 'Play background music');
    }
  });

});
