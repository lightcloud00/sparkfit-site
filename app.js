/* ============================================================
   SPARK Enterprise v8.0 — Application JavaScript
   Canvas particles, scroll reveals, counters, carousel, tabs,
   FAQ, navigation, forms, live demo, ROI calc, blog filters,
   API tabs, dark/light mode, back to top, cookies, team cards,
   comparison table, podcast player, status bars, perf scores,
   3D phone, timeline, growth chart, investor metrics
   ============================================================ */

(function () {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ==========================================================
  // 1. CANVAS PARTICLE / CONSTELLATION ANIMATION
  // ==========================================================
  function initParticles() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas || reducedMotion) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let width, height;
    const PARTICLE_COUNT = 80;
    const CONNECTION_DISTANCE = 150;
    const MOUSE_RADIUS = 200;
    let mouse = { x: -1000, y: -1000 };

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    }

    function createParticle() {
      const goldHues = ['rgba(232, 166, 52, ', 'rgba(232, 92, 74, ', 'rgba(200, 150, 50, '];
      return {
        x: Math.random() * width, y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
        radius: 1.5 + Math.random() * 2,
        colorBase: goldHues[Math.floor(Math.random() * goldHues.length)],
        alpha: 0.3 + Math.random() * 0.5,
        pulseSpeed: 0.005 + Math.random() * 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    }

    function init() {
      resize();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(createParticle());
    }

    function animate(time) {
      ctx.clearRect(0, 0, width, height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const pulse = Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.15 + 0.85;
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = width + 10; if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10; if (p.y > height + 10) p.y = -10;
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.02;
          p.vx += dx / dist * force; p.vy += dy / dist * force;
        }
        p.vx *= 0.999; p.vy *= 0.999;
        const drawAlpha = p.alpha * pulse;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = p.colorBase + drawAlpha + ')'; ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x, cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
          if (cdist < CONNECTION_DISTANCE) {
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(232, 166, 52, ' + ((1 - cdist / CONNECTION_DISTANCE) * 0.15) + ')';
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      requestAnimationFrame(animate);
    }

    canvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left; mouse.y = e.clientY - rect.top;
    }, { passive: true });
    canvas.parentElement.addEventListener('mouseleave', () => { mouse.x = -1000; mouse.y = -1000; }, { passive: true });
    window.addEventListener('resize', resize, { passive: true });
    init();
    requestAnimationFrame(animate);
  }

  // ==========================================================
  // 2. SCROLL REVEAL (Intersection Observer)
  // ==========================================================
  function initScrollReveal() {
    if (reducedMotion) return;
    document.documentElement.classList.add('js-reveal-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target.classList.contains('stagger-item')) {
            const idx = parseInt(entry.target.dataset.stagger || '0', 10);
            setTimeout(() => entry.target.classList.add('visible'), idx * 60);
          } else {
            entry.target.classList.add('visible');
          }
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    document.querySelectorAll('.reveal, .stagger-item').forEach((el) => observer.observe(el));
  }

  // ==========================================================
  // 3. ANIMATED COUNTERS
  // ==========================================================
  function initCounters() {
    const counters = document.querySelectorAll('[data-target]');
    const formatValue = (val, el) => {
      const suffix = el.dataset.suffix || '', prefix = el.dataset.prefix || '';
      const isDecimal = el.dataset.decimal === 'true';
      const format = el.dataset.format || '';
      if (isDecimal) return prefix + val.toFixed(1) + suffix;
      const r = Math.round(val);
      if (format === 'abbr' || format === 'abbr-impact') {
        if (r >= 1000000) return prefix + (r / 1000000).toFixed(1) + 'M' + suffix;
        if (r >= 1000) return prefix + Math.round(r / 1000) + 'K' + suffix;
        return prefix + r + suffix;
      }
      if (format === 'comma' || format === 'comma-impact') return prefix + r.toLocaleString() + suffix;
      if (format === 'plain-impact') return prefix + r + suffix;
      if (r >= 1000000) return prefix + (r / 1000000).toFixed(0) + 'M' + suffix;
      if (r >= 1000) return prefix + Math.round(r / 1000) + 'K' + suffix;
      return prefix + r + suffix;
    };
    const animateCounter = (el) => {
      const target = parseFloat(el.dataset.target);
      const duration = 2200, startTime = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const update = (ct) => {
        const p = Math.min((ct - startTime) / duration, 1);
        el.textContent = formatValue(target * easeOut(p), el);
        if (p < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { animateCounter(e.target); observer.unobserve(e.target); } });
    }, { threshold: 0.5 });
    counters.forEach((el) => observer.observe(el));
  }

  // ==========================================================
  // 4. TESTIMONIAL CAROUSEL
  // ==========================================================
  function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const dotsContainer = document.getElementById('carouselDots');
    if (!track || !dotsContainer) return;
    const slides = track.querySelectorAll('.carousel__slide');
    const prevBtn = document.querySelector('.carousel__btn--prev');
    const nextBtn = document.querySelector('.carousel__btn--next');
    let current = 0, autoPlayTimer;
    slides.forEach((_, i) => {
      const dot = document.createElement('button');
      dot.classList.add('carousel__dot');
      if (i === 0) dot.classList.add('active');
      dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    });
    function goTo(index) {
      current = index;
      if (current < 0) current = slides.length - 1;
      if (current >= slides.length) current = 0;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      dotsContainer.querySelectorAll('.carousel__dot').forEach((d, i) => d.classList.toggle('active', i === current));
      resetAuto();
    }
    function resetAuto() { clearInterval(autoPlayTimer); autoPlayTimer = setInterval(() => goTo(current + 1), 5000); }
    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));
    let touchStart = 0;
    track.addEventListener('touchstart', (e) => { touchStart = e.changedTouches[0].screenX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      const diff = touchStart - e.changedTouches[0].screenX;
      if (Math.abs(diff) > 50) { if (diff > 0) goTo(current + 1); else goTo(current - 1); }
    }, { passive: true });
    resetAuto();
  }

  // ==========================================================
  // 5. FEATURE TABS
  // ==========================================================
  function initFeatureTabs() {
    const tabs = document.querySelectorAll('.features__tab');
    const panels = document.querySelectorAll('.features__panel');
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        tabs.forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        panels.forEach((p) => { p.classList.remove('active'); p.hidden = true; });
        tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
        const panel = document.getElementById('tab-' + target);
        if (panel) { panel.classList.add('active'); panel.hidden = false; }
      });
    });
  }

  // ==========================================================
  // 6. FAQ ACCORDION
  // ==========================================================
  function initFAQ() {
    document.querySelectorAll('.faq-item').forEach((item) => {
      const q = item.querySelector('.faq-item__question');
      q.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach((o) => {
          if (o !== item) { o.classList.remove('open'); o.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false'); }
        });
        item.classList.toggle('open');
        q.setAttribute('aria-expanded', !isOpen);
      });
      q.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); q.click(); } });
    });
  }

  // ==========================================================
  // 7. NAVIGATION
  // ==========================================================
  function initNavigation() {
    const nav = document.getElementById('nav');
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');
    const handleScroll = () => { nav.classList.toggle('scrolled', window.scrollY > 50); };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    hamburger.addEventListener('click', () => {
      const isActive = hamburger.classList.contains('active');
      hamburger.classList.toggle('active'); mobileNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', !isActive);
      document.body.style.overflow = !isActive ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active'); mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
      });
    });
  }

  // ==========================================================
  // 8. SMOOTH SCROLL
  // ==========================================================
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        const targetId = anchor.getAttribute('href');
        if (targetId === '#') return;
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          const navH = document.getElementById('nav').offsetHeight;
          window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - navH - 20, behavior: 'smooth' });
        }
      });
    });
  }

  // ==========================================================
  // 9. FORMS (Web3Forms)
  // ==========================================================
  function initForms() {
    const forms = [
      { formId: 'emailForm', messageId: 'formMessage' },
      { formId: 'newsletterForm', messageId: 'newsletterMessage' },
      { formId: 'investorForm', messageId: 'investorMessage' },
      { formId: 'statusForm', messageId: 'statusMessage' },
    ];
    forms.forEach(({ formId, messageId }) => {
      const form = document.getElementById(formId);
      const msg = document.getElementById(messageId);
      if (!form || !msg) return;
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = form.querySelector('button[type="submit"]');
        const origHTML = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; btn.disabled = true;
        try {
          const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: new FormData(form) });
          const data = await res.json();
          if (data.success) {
            msg.className = 'form-message form-message--success';
            msg.textContent = formId === 'investorForm' ? 'Request sent! We\'ll be in touch within 24 hours.' :
              formId === 'statusForm' ? 'Subscribed to status updates!' :
              formId === 'newsletterForm' ? 'Subscribed! Welcome to the SPARK community.' :
              'Download link sent! Check your inbox.';
            form.reset();
          } else throw new Error('fail');
        } catch (err) {
          msg.className = 'form-message form-message--error';
          msg.textContent = 'Something went wrong. Please try again.';
        }
        btn.innerHTML = origHTML; btn.disabled = false;
        setTimeout(() => { msg.textContent = ''; msg.className = 'form-message'; }, 5000);
      });
    });
  }

  // ==========================================================
  // 10. 3D PHONE HERO — auto slide cycling
  // ==========================================================
  function initPhone3D() {
    const slides = document.querySelectorAll('.phone-3d__slide');
    if (!slides.length) return;
    let current = 0;
    function cycle() {
      slides.forEach(s => s.classList.remove('phone-3d__slide--active'));
      current = (current + 1) % slides.length;
      slides[current].classList.add('phone-3d__slide--active');
    }
    setInterval(cycle, 3500);

    // Parallax on scroll
    if (!reducedMotion) {
      const device = document.querySelector('.phone-3d__device');
      if (device) {
        window.addEventListener('scroll', () => {
          const scrollY = window.scrollY;
          const rotation = Math.min(scrollY * 0.02, 15);
          device.style.transform = `rotateY(${-8 + rotation}deg) rotateX(${2 - scrollY * 0.005}deg)`;
        }, { passive: true });
      }
    }
  }

  // ==========================================================
  // 11. LIVE APP DEMO — card swipe
  // ==========================================================
  function initLiveDemo() {
    const stack = document.getElementById('demoCardStack');
    const matchScreen = document.getElementById('demoMatchScreen');
    const likeBtn = document.getElementById('demoLike');
    const nopeBtn = document.getElementById('demoNope');
    if (!stack || !likeBtn || !nopeBtn) return;

    let cards = Array.from(stack.querySelectorAll('.demo__card'));
    let currentIdx = 0;
    let startX = 0, currentX = 0, isDragging = false;

    function getFrontCard() {
      return stack.querySelector('.demo__card--front');
    }

    function swipe(direction) {
      const front = getFrontCard();
      if (!front) return;
      const likeOverlay = front.querySelector('.demo__card-overlay--like');
      const nopeOverlay = front.querySelector('.demo__card-overlay--nope');

      if (direction === 'right' && likeOverlay) likeOverlay.style.opacity = '1';
      if (direction === 'left' && nopeOverlay) nopeOverlay.style.opacity = '1';

      front.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s';
      front.style.transform = `translateX(${direction === 'right' ? 300 : -300}px) rotate(${direction === 'right' ? 20 : -20}deg)`;
      front.style.opacity = '0';

      setTimeout(() => {
        front.classList.remove('demo__card--front');
        front.style.display = 'none';

        if (direction === 'right') {
          // Show match screen
          matchScreen.classList.add('active');
          matchScreen.addEventListener('click', function handler() {
            matchScreen.classList.remove('active');
            matchScreen.removeEventListener('click', handler);
            promoteNext();
          }, { once: true });
        } else {
          promoteNext();
        }
      }, 500);
    }

    function promoteNext() {
      const remaining = Array.from(stack.querySelectorAll('.demo__card')).filter(c => c.style.display !== 'none');
      if (remaining.length === 0) {
        // Reset all cards
        cards.forEach((c, i) => {
          c.style.display = '';
          c.style.transform = '';
          c.style.opacity = '';
          c.style.transition = '';
          c.classList.remove('demo__card--front');
          const likeO = c.querySelector('.demo__card-overlay--like');
          const nopeO = c.querySelector('.demo__card-overlay--nope');
          if (likeO) likeO.style.opacity = '0';
          if (nopeO) nopeO.style.opacity = '0';
          if (i === 0) c.classList.add('demo__card--front');
        });
        return;
      }
      // Promote the top remaining card
      remaining.forEach((c, i) => {
        c.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s';
        if (i === remaining.length - 1) {
          c.classList.add('demo__card--front');
          c.style.transform = '';
          c.style.opacity = '1';
        } else if (i === remaining.length - 2) {
          c.style.transform = 'scale(0.95) translateY(8px)';
          c.style.opacity = '0.75';
        } else {
          c.style.transform = 'scale(0.9) translateY(16px)';
          c.style.opacity = '0.5';
        }
      });
    }

    // Drag support
    function onPointerDown(e) {
      const front = getFrontCard();
      if (!front || e.target.closest('.demo__action-btn')) return;
      isDragging = true;
      startX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      front.style.transition = 'none';
    }
    function onPointerMove(e) {
      if (!isDragging) return;
      const front = getFrontCard();
      if (!front) return;
      currentX = (e.clientX || (e.touches && e.touches[0].clientX) || 0) - startX;
      const rotation = currentX * 0.1;
      front.style.transform = `translateX(${currentX}px) rotate(${rotation}deg)`;

      const likeOverlay = front.querySelector('.demo__card-overlay--like');
      const nopeOverlay = front.querySelector('.demo__card-overlay--nope');
      if (likeOverlay) likeOverlay.style.opacity = Math.min(Math.max(currentX / 80, 0), 1);
      if (nopeOverlay) nopeOverlay.style.opacity = Math.min(Math.max(-currentX / 80, 0), 1);
    }
    function onPointerUp() {
      if (!isDragging) return;
      isDragging = false;
      if (Math.abs(currentX) > 80) {
        swipe(currentX > 0 ? 'right' : 'left');
      } else {
        const front = getFrontCard();
        if (front) {
          front.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
          front.style.transform = '';
          const likeO = front.querySelector('.demo__card-overlay--like');
          const nopeO = front.querySelector('.demo__card-overlay--nope');
          if (likeO) likeO.style.opacity = '0';
          if (nopeO) nopeO.style.opacity = '0';
        }
      }
      currentX = 0;
    }

    stack.addEventListener('mousedown', onPointerDown);
    stack.addEventListener('touchstart', onPointerDown, { passive: true });
    document.addEventListener('mousemove', onPointerMove);
    document.addEventListener('touchmove', onPointerMove, { passive: true });
    document.addEventListener('mouseup', onPointerUp);
    document.addEventListener('touchend', onPointerUp);

    likeBtn.addEventListener('click', () => swipe('right'));
    nopeBtn.addEventListener('click', () => swipe('left'));
  }

  // ==========================================================
  // 12. ROI CALCULATOR
  // ==========================================================
  function initROICalculator() {
    const membersSlider = document.getElementById('roiMembers');
    const feeSlider = document.getElementById('roiFee');
    const retentionSlider = document.getElementById('roiRetention');
    if (!membersSlider || !feeSlider || !retentionSlider) return;
    const membersValue = document.getElementById('roiMembersValue');
    const feeValue = document.getElementById('roiFeeValue');
    const retentionValue = document.getElementById('roiRetentionValue');
    const revenueEl = document.getElementById('roiRevenue');
    const engagementEl = document.getElementById('roiEngagement');
    const retentionResultEl = document.getElementById('roiRetentionResult');

    function calculate() {
      const members = parseInt(membersSlider.value);
      const fee = parseInt(feeSlider.value);
      const retention = parseInt(retentionSlider.value);
      membersValue.textContent = members.toLocaleString();
      feeValue.textContent = '$' + fee;
      retentionValue.textContent = retention + '%';
      const ri = Math.min(Math.round((100 - retention) * 0.35), 25);
      const eb = Math.min(Math.round(28 + (members / 100) * 0.5), 45);
      const addl = Math.round(members * (ri / 100));
      const revInc = addl * fee * 12;
      animVal(revenueEl, revInc, '$');
      animVal(engagementEl, eb, '', '%');
      animVal(retentionResultEl, ri, '+', '%');
    }

    function animVal(el, target, prefix, suffix) {
      prefix = prefix || ''; suffix = suffix || '';
      const duration = 600, start = performance.now();
      const startVal = parseInt(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      const up = (ct) => {
        const p = Math.min((ct - start) / duration, 1);
        const c = Math.round(startVal + (target - startVal) * ease(p));
        el.textContent = prefix === '$' ? '$' + c.toLocaleString() : prefix + c + suffix;
        if (p < 1) requestAnimationFrame(up);
      };
      requestAnimationFrame(up);
    }

    membersSlider.addEventListener('input', calculate);
    feeSlider.addEventListener('input', calculate);
    retentionSlider.addEventListener('input', calculate);
    calculate();
  }

  // ==========================================================
  // 13. BLOG FILTERS
  // ==========================================================
  function initBlogFilters() {
    const filters = document.querySelectorAll('.blog__filter');
    const cards = document.querySelectorAll('.blog-card');
    if (!filters.length) return;
    filters.forEach((f) => {
      f.addEventListener('click', () => {
        const cat = f.dataset.category;
        filters.forEach((x) => { x.classList.remove('active'); x.setAttribute('aria-selected', 'false'); });
        f.classList.add('active'); f.setAttribute('aria-selected', 'true');
        cards.forEach((c) => { c.classList.toggle('hidden', cat !== 'all' && c.dataset.category !== cat); });
      });
    });
  }

  // ==========================================================
  // 14. API CODE TABS
  // ==========================================================
  function initAPITabs() {
    const tabs = document.querySelectorAll('.api__tab');
    const panels = document.querySelectorAll('.api__code-panel');
    if (!tabs.length) return;
    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const lang = tab.dataset.lang;
        tabs.forEach((t) => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        panels.forEach((p) => { p.classList.remove('active'); p.hidden = true; });
        tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
        const panel = document.querySelector('.api__code-panel[data-lang="' + lang + '"]');
        if (panel) { panel.classList.add('active'); panel.hidden = false; }
      });
    });
  }

  // ==========================================================
  // 15. CODE COPY
  // ==========================================================
  function initCodeCopy() {
    document.querySelectorAll('.dev__code-copy').forEach((btn) => {
      btn.addEventListener('click', () => {
        const code = btn.closest('.dev__code').querySelector('code');
        if (code) {
          navigator.clipboard.writeText(code.textContent).then(() => {
            const icon = btn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            btn.style.color = 'var(--buddy-teal)';
            setTimeout(() => { icon.className = 'fa-solid fa-copy'; btn.style.color = ''; }, 2000);
          }).catch(() => {});
        }
      });
    });
  }

  // ==========================================================
  // 16. DARK/LIGHT MODE TOGGLE
  // ==========================================================
  function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
      toggle.innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    });
  }

  // ==========================================================
  // 17. BACK TO TOP
  // ==========================================================
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => { btn.classList.toggle('visible', window.scrollY > 600); }, { passive: true });
    btn.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  // ==========================================================
  // 18. COOKIE BANNER
  // ==========================================================
  function initCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    if (!banner) return;
    setTimeout(() => { banner.classList.add('visible'); }, 1500);
    const dismiss = () => { banner.classList.remove('visible'); };
    document.getElementById('cookieAccept')?.addEventListener('click', dismiss);
    document.getElementById('cookieDecline')?.addEventListener('click', dismiss);
  }

  // ==========================================================
  // 19. VIDEO PLAYER SIMULATION
  // ==========================================================
  function initVideoPlayer() {
    const player = document.getElementById('videoPlayer');
    if (!player) return;
    let isPlaying = false;
    function togglePlay() {
      const playBtn = player.querySelector('.video__play-btn');
      const posterBg = player.querySelector('.video__poster-bg');
      const text = posterBg?.querySelector('.video__poster-text span');
      if (isPlaying) {
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        if (text) text.textContent = 'SPARK App Demo — 2:30';
        isPlaying = false;
      } else {
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        if (text) text.textContent = 'Playing Demo...';
        isPlaying = true;
      }
    }
    player.addEventListener('click', togglePlay);
    player.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePlay(); } });
  }

  // ==========================================================
  // 20. COMPARISON TABLE — row-by-row animation
  // ==========================================================
  function initComparisonTable() {
    const rows = document.querySelectorAll('.comparison-row');
    if (!rows.length || reducedMotion) { rows.forEach(r => r.classList.add('visible')); return; }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = parseInt(entry.target.dataset.row || '0', 10);
          setTimeout(() => entry.target.classList.add('visible'), idx * 120);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    rows.forEach((r) => observer.observe(r));
  }

  // ==========================================================
  // 21. PODCAST PLAYER
  // ==========================================================
  function initPodcast() {
    const episodes = [
      { title: 'EP 01 — The Science of Fitness Dating', duration: '42:18' },
      { title: 'EP 02 — Building Trust in Digital Connections', duration: '38:05' },
      { title: 'EP 03 — From Swipe to Squat', duration: '45:22' },
      { title: 'EP 04 — Mental Health & Movement', duration: '36:47' },
    ];
    const titleEl = document.getElementById('podcastTitle');
    const playBtn = document.getElementById('podcastPlayBtn');
    const fill = document.getElementById('podcastFill');
    const timeEl = document.querySelector('.podcast__player-time');
    if (!playBtn) return;

    let isPlaying = false, progressInterval, currentEp = -1, progress = 0;

    document.querySelectorAll('.podcast-card__play').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.episode, 10);
        if (currentEp === idx && isPlaying) { pausePodcast(); return; }
        currentEp = idx;
        titleEl.textContent = episodes[idx].title;
        if (timeEl) timeEl.textContent = '0:00 / ' + episodes[idx].duration;
        progress = 0;
        if (fill) fill.style.width = '0%';
        playPodcast();
      });
    });

    playBtn.addEventListener('click', () => {
      if (currentEp === -1) return;
      if (isPlaying) pausePodcast(); else playPodcast();
    });

    function playPodcast() {
      isPlaying = true;
      playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
      clearInterval(progressInterval);
      progressInterval = setInterval(() => {
        progress = Math.min(progress + 0.3, 100);
        if (fill) fill.style.width = progress + '%';
        if (progress >= 100) { pausePodcast(); progress = 0; if (fill) fill.style.width = '0%'; }
      }, 300);
    }

    function pausePodcast() {
      isPlaying = false;
      playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
      clearInterval(progressInterval);
    }
  }

  // ==========================================================
  // 22. STATUS BARS
  // ==========================================================
  function initStatusBars() {
    const container = document.getElementById('statusBars');
    if (!container) return;
    for (let i = 0; i < 30; i++) {
      const bar = document.createElement('div');
      bar.className = 'status__bar status__bar--green';
      bar.title = 'Day ' + (30 - i) + ': All systems operational';
      container.appendChild(bar);
    }
  }

  // ==========================================================
  // 23. PERFORMANCE SCORE RINGS
  // ==========================================================
  function initPerfScores() {
    const scores = document.querySelectorAll('.perf-score');
    if (!scores.length) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const score = parseInt(el.dataset.score, 10);
          const circle = el.querySelector('.perf-score__fill');
          const valueEl = el.querySelector('.perf-score__value');
          const circumference = 339.3;
          const offset = circumference - (circumference * score / 100);
          setTimeout(() => { circle.style.strokeDashoffset = offset; }, 200);
          // Animate number
          const duration = 1500;
          const startTime = performance.now();
          const ease = (t) => 1 - Math.pow(1 - t, 3);
          const update = (ct) => {
            const p = Math.min((ct - startTime) / duration, 1);
            valueEl.textContent = Math.round(score * ease(p));
            if (p < 1) requestAnimationFrame(update);
          };
          requestAnimationFrame(update);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    scores.forEach((s) => observer.observe(s));
  }

  // ==========================================================
  // 24. GROWTH CHART ANIMATION
  // ==========================================================
  function initGrowthChart() {
    const line = document.querySelector('.growth-chart__line');
    const area = document.querySelector('.growth-chart__area');
    if (!line) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          line.classList.add('animated');
          if (area) area.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(line);
  }

  // ==========================================================
  // INIT
  // ==========================================================
  document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initNavigation();
    initSmoothScroll();
    initScrollReveal();
    initCounters();
    initCarousel();
    initFeatureTabs();
    initFAQ();
    initForms();
    initPhone3D();
    initLiveDemo();
    initROICalculator();
    initBlogFilters();
    initAPITabs();
    initCodeCopy();
    initThemeToggle();
    initBackToTop();
    initCookieBanner();
    initVideoPlayer();
    initComparisonTable();
    initPodcast();
    initStatusBars();
    initPerfScores();
    initGrowthChart();
  });
})();
