/* ============================================================
   SPARK Enterprise v7.0 — Application JavaScript
   Canvas particles, scroll reveals, counters, carousel, tabs,
   FAQ accordion, navigation, forms, app demo, ROI calculator,
   blog filters, API tabs, dark/light mode, back to top, cookies
   ============================================================ */

(function () {
  'use strict';

  // ==========================================================
  // 1. CANVAS PARTICLE / CONSTELLATION ANIMATION
  // ==========================================================
  function initParticles() {
    const canvas = document.getElementById('heroCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let animationId;
    let width, height;

    const PARTICLE_COUNT = 80;
    const CONNECTION_DISTANCE = 150;
    const MOUSE_RADIUS = 200;
    let mouse = { x: -1000, y: -1000 };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      width = canvas.width = rect.width;
      height = canvas.height = rect.height;
    }

    function createParticle() {
      const goldHues = [
        'rgba(232, 166, 52, ',
        'rgba(232, 92, 74, ',
        'rgba(200, 150, 50, ',
      ];
      const colorBase = goldHues[Math.floor(Math.random() * goldHues.length)];
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: 1.5 + Math.random() * 2,
        colorBase: colorBase,
        alpha: 0.3 + Math.random() * 0.5,
        pulseSpeed: 0.005 + Math.random() * 0.01,
        pulsePhase: Math.random() * Math.PI * 2,
      };
    }

    function init() {
      resize();
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push(createParticle());
      }
    }

    function animate(time) {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        const pulse = Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.15 + 0.85;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.02;
          p.vx += dx / dist * force;
          p.vy += dy / dist * force;
        }

        p.vx *= 0.999;
        p.vy *= 0.999;

        const drawAlpha = p.alpha * pulse;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * pulse, 0, Math.PI * 2);
        ctx.fillStyle = p.colorBase + drawAlpha + ')';
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const cdx = p.x - p2.x;
          const cdy = p.y - p2.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < CONNECTION_DISTANCE) {
            const lineAlpha = (1 - cdist / CONNECTION_DISTANCE) * 0.15;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = 'rgba(232, 166, 52, ' + lineAlpha + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    }

    canvas.parentElement.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });

    canvas.parentElement.addEventListener('mouseleave', () => {
      mouse.x = -1000;
      mouse.y = -1000;
    }, { passive: true });

    window.addEventListener('resize', () => {
      resize();
    }, { passive: true });

    init();
    animationId = requestAnimationFrame(animate);
  }

  // ==========================================================
  // 2. SCROLL REVEAL (Intersection Observer)
  // ==========================================================
  function initScrollReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    document.documentElement.classList.add('js-reveal-ready');

    const allRevealable = document.querySelectorAll('.reveal, .stagger-item');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target.classList.contains('stagger-item')) {
              const staggerIndex = parseInt(entry.target.dataset.stagger || '0', 10);
              setTimeout(() => {
                entry.target.classList.add('visible');
              }, staggerIndex * 50);
            } else {
              entry.target.classList.add('visible');
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );

    allRevealable.forEach((el) => observer.observe(el));
  }

  // ==========================================================
  // 3. ANIMATED COUNTERS (Stats + Impact)
  // ==========================================================
  function initCounters() {
    const counters = document.querySelectorAll('[data-target]');

    const formatValue = (val, el) => {
      const suffix = el.dataset.suffix || '';
      const prefix = el.dataset.prefix || '';
      const isDecimal = el.dataset.decimal === 'true';
      const format = el.dataset.format || '';

      if (isDecimal) {
        return prefix + val.toFixed(1) + suffix;
      }

      const rounded = Math.round(val);

      if (format === 'abbr' || format === 'abbr-impact') {
        if (rounded >= 1000000) return prefix + (rounded / 1000000).toFixed(1) + 'M' + suffix;
        if (rounded >= 1000) return prefix + Math.round(rounded / 1000) + 'K' + suffix;
        return prefix + rounded + suffix;
      }

      if (format === 'comma' || format === 'comma-impact') {
        return prefix + rounded.toLocaleString() + suffix;
      }

      if (format === 'plain-impact') {
        return prefix + rounded + suffix;
      }

      if (rounded >= 1000000) return prefix + (rounded / 1000000).toFixed(0) + 'M' + suffix;
      if (rounded >= 1000) return prefix + Math.round(rounded / 1000) + 'K' + suffix;
      return prefix + rounded + suffix;
    };

    const animateCounter = (el) => {
      const target = parseFloat(el.dataset.target);
      const duration = 2200;
      const startTime = performance.now();
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);

      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = target * easeOut(progress);
        el.textContent = formatValue(current, el);
        if (progress < 1) requestAnimationFrame(update);
      };

      requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

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
    let current = 0;
    let autoPlayTimer;

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

      dotsContainer.querySelectorAll('.carousel__dot').forEach((d, i) => {
        d.classList.toggle('active', i === current);
      });

      resetAutoPlay();
    }

    function resetAutoPlay() {
      clearInterval(autoPlayTimer);
      autoPlayTimer = setInterval(() => goTo(current + 1), 5000);
    }

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    let touchStart = 0;
    let touchEnd = 0;
    track.addEventListener('touchstart', (e) => { touchStart = e.changedTouches[0].screenX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      touchEnd = e.changedTouches[0].screenX;
      const diff = touchStart - touchEnd;
      if (Math.abs(diff) > 50) {
        if (diff > 0) goTo(current + 1);
        else goTo(current - 1);
      }
    }, { passive: true });

    resetAutoPlay();
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

        tabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach((p) => {
          p.classList.remove('active');
          p.hidden = true;
        });

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const panel = document.getElementById('tab-' + target);
        if (panel) {
          panel.classList.add('active');
          panel.hidden = false;
        }
      });
    });
  }

  // ==========================================================
  // 6. FAQ ACCORDION
  // ==========================================================
  function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach((item) => {
      const question = item.querySelector('.faq-item__question');

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        faqItems.forEach((other) => {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-item__question').setAttribute('aria-expanded', 'false');
          }
        });

        item.classList.toggle('open');
        question.setAttribute('aria-expanded', !isOpen);
      });

      question.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          question.click();
        }
      });
    });
  }

  // ==========================================================
  // 7. NAVIGATION
  // ==========================================================
  function initNavigation() {
    const nav = document.getElementById('nav');
    const hamburger = document.getElementById('hamburger');
    const mobileNav = document.getElementById('mobileNav');

    const handleScroll = () => {
      if (window.scrollY > 50) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    hamburger.addEventListener('click', () => {
      const isActive = hamburger.classList.contains('active');
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', !isActive);
      document.body.style.overflow = !isActive ? 'hidden' : '';
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileNav.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
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
          const navHeight = document.getElementById('nav').offsetHeight;
          const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  // ==========================================================
  // 9. EMAIL FORMS (Web3Forms)
  // ==========================================================
  function initForms() {
    const forms = [
      { formId: 'emailForm', messageId: 'formMessage' },
      { formId: 'newsletterForm', messageId: 'newsletterMessage' },
    ];

    forms.forEach(({ formId, messageId }) => {
      const form = document.getElementById(formId);
      const messageEl = document.getElementById(messageId);
      if (!form || !messageEl) return;

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        submitBtn.disabled = true;

        try {
          const formData = new FormData(form);
          const res = await fetch('https://api.web3forms.com/submit', {
            method: 'POST',
            body: formData,
          });
          const data = await res.json();

          if (data.success) {
            messageEl.className = 'form-message form-message--success';
            messageEl.textContent = formId === 'newsletterForm'
              ? 'Subscribed! Welcome to the SPARK community.'
              : 'Download link sent! Check your inbox.';
            form.reset();
          } else {
            throw new Error('Submission failed');
          }
        } catch (err) {
          messageEl.className = 'form-message form-message--error';
          messageEl.textContent = 'Something went wrong. Please try again.';
        }

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        setTimeout(() => {
          messageEl.textContent = '';
          messageEl.className = 'form-message';
        }, 5000);
      });
    });
  }

  // ==========================================================
  // 10. INTERACTIVE APP DEMO (NEW)
  // ==========================================================
  function initAppDemo() {
    const screens = document.querySelectorAll('.demo__screen');
    const dots = document.querySelectorAll('.demo__dot');
    let currentScreen = 0;
    let autoTimer;

    if (!screens.length) return;

    function goToScreen(index) {
      screens.forEach((s) => s.classList.remove('demo__screen--active'));
      dots.forEach((d) => d.classList.remove('demo__dot--active'));

      currentScreen = index;
      if (currentScreen < 0) currentScreen = screens.length - 1;
      if (currentScreen >= screens.length) currentScreen = 0;

      screens[currentScreen].classList.add('demo__screen--active');
      dots[currentScreen].classList.add('demo__dot--active');

      resetAutoDemo();
    }

    function resetAutoDemo() {
      clearInterval(autoTimer);
      autoTimer = setInterval(() => goToScreen(currentScreen + 1), 3500);
    }

    dots.forEach((dot) => {
      dot.addEventListener('click', () => {
        goToScreen(parseInt(dot.dataset.demo, 10));
      });
    });

    // Swipe support on demo phone
    const demoScreen = document.getElementById('demoScreen');
    if (demoScreen) {
      let touchStartX = 0;
      demoScreen.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
      }, { passive: true });
      demoScreen.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 40) {
          if (diff > 0) goToScreen(currentScreen + 1);
          else goToScreen(currentScreen - 1);
        }
      }, { passive: true });

      // Click to advance
      demoScreen.addEventListener('click', () => goToScreen(currentScreen + 1));
    }

    resetAutoDemo();
  }

  // ==========================================================
  // 11. ROI CALCULATOR (NEW)
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

      // Calculate projected values
      const retentionImprovement = Math.min(Math.round((100 - retention) * 0.35), 25);
      const engagementBoost = Math.min(Math.round(28 + (members / 100) * 0.5), 45);
      const newRetention = Math.min(retention + retentionImprovement, 98);
      const additionalMembers = Math.round(members * (retentionImprovement / 100));
      const revenueIncrease = additionalMembers * fee * 12;

      animateValue(revenueEl, revenueIncrease, '$');
      animateValue(engagementEl, engagementBoost, '', '%');
      animateValue(retentionResultEl, retentionImprovement, '+', '%');
    }

    function animateValue(el, target, prefix, suffix) {
      prefix = prefix || '';
      suffix = suffix || '';
      const duration = 600;
      const startTime = performance.now();
      const startVal = parseInt(el.textContent.replace(/[^0-9.-]/g, '')) || 0;
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);

      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const current = Math.round(startVal + (target - startVal) * easeOut(progress));

        if (prefix === '$') {
          el.textContent = '$' + current.toLocaleString();
        } else {
          el.textContent = prefix + current + suffix;
        }

        if (progress < 1) requestAnimationFrame(update);
      };

      requestAnimationFrame(update);
    }

    membersSlider.addEventListener('input', calculate);
    feeSlider.addEventListener('input', calculate);
    retentionSlider.addEventListener('input', calculate);

    calculate();
  }

  // ==========================================================
  // 12. BLOG FILTERS (NEW)
  // ==========================================================
  function initBlogFilters() {
    const filters = document.querySelectorAll('.blog__filter');
    const cards = document.querySelectorAll('.blog-card');

    if (!filters.length) return;

    filters.forEach((filter) => {
      filter.addEventListener('click', () => {
        const category = filter.dataset.category;

        filters.forEach((f) => {
          f.classList.remove('active');
          f.setAttribute('aria-selected', 'false');
        });
        filter.classList.add('active');
        filter.setAttribute('aria-selected', 'true');

        cards.forEach((card) => {
          if (category === 'all' || card.dataset.category === category) {
            card.classList.remove('hidden');
          } else {
            card.classList.add('hidden');
          }
        });
      });
    });
  }

  // ==========================================================
  // 13. API CODE TABS (NEW)
  // ==========================================================
  function initAPITabs() {
    const tabs = document.querySelectorAll('.api__tab');
    const panels = document.querySelectorAll('.api__code-panel');

    if (!tabs.length) return;

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const lang = tab.dataset.lang;

        tabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        panels.forEach((p) => {
          p.classList.remove('active');
          p.hidden = true;
        });

        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const panel = document.querySelector('.api__code-panel[data-lang="' + lang + '"]');
        if (panel) {
          panel.classList.add('active');
          panel.hidden = false;
        }
      });
    });
  }

  // ==========================================================
  // 14. CODE COPY BUTTONS (NEW)
  // ==========================================================
  function initCodeCopy() {
    const copyBtns = document.querySelectorAll('.dev__code-copy');

    copyBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const codeBlock = btn.closest('.dev__code').querySelector('.dev__code-block code');
        if (codeBlock) {
          const text = codeBlock.textContent;
          navigator.clipboard.writeText(text).then(() => {
            const icon = btn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            btn.style.color = 'var(--buddy-teal)';
            setTimeout(() => {
              icon.className = 'fa-solid fa-copy';
              btn.style.color = '';
            }, 2000);
          }).catch(() => {
            // Fallback - silent fail
          });
        }
      });
    });
  }

  // ==========================================================
  // 15. DARK/LIGHT MODE TOGGLE (NEW)
  // ==========================================================
  function initThemeToggle() {
    const toggle = document.getElementById('themeToggle');
    if (!toggle) return;

    // Default to dark mode
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';

    toggle.addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
    });
  }

  // ==========================================================
  // 16. BACK TO TOP BUTTON (NEW)
  // ==========================================================
  function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    const handleScroll = () => {
      if (window.scrollY > 600) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ==========================================================
  // 17. COOKIE CONSENT BANNER (NEW)
  // ==========================================================
  function initCookieBanner() {
    const banner = document.getElementById('cookieBanner');
    const acceptBtn = document.getElementById('cookieAccept');
    const declineBtn = document.getElementById('cookieDecline');
    if (!banner) return;

    // Show after 1.5 seconds
    setTimeout(() => {
      banner.classList.add('visible');
    }, 1500);

    const dismiss = () => {
      banner.classList.remove('visible');
    };

    if (acceptBtn) acceptBtn.addEventListener('click', dismiss);
    if (declineBtn) declineBtn.addEventListener('click', dismiss);
  }

  // ==========================================================
  // 18. VIDEO PLAYER SIMULATION (NEW)
  // ==========================================================
  function initVideoPlayer() {
    const player = document.getElementById('videoPlayer');
    if (!player) return;

    const playBtn = player.querySelector('.video__play-btn');
    let isPlaying = false;

    function togglePlay() {
      if (isPlaying) {
        // Reset
        player.querySelector('.video__poster').style.display = '';
        playBtn.style.display = '';
        playBtn.innerHTML = '<i class="fa-solid fa-play"></i>';
        isPlaying = false;
      } else {
        // Simulate playing
        playBtn.innerHTML = '<i class="fa-solid fa-pause"></i>';
        isPlaying = true;

        // Create a simple animation as "video playing"
        const poster = player.querySelector('.video__poster-bg');
        poster.style.background = 'linear-gradient(135deg, #0e0d0b 0%, #1c1b18 50%, #242320 100%)';
        const text = poster.querySelector('.video__poster-text');
        if (text) text.textContent = 'Playing Demo...';
      }
    }

    player.addEventListener('click', togglePlay);
    player.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    });
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
    initAppDemo();
    initROICalculator();
    initBlogFilters();
    initAPITabs();
    initCodeCopy();
    initThemeToggle();
    initBackToTop();
    initCookieBanner();
    initVideoPlayer();
  });
})();
