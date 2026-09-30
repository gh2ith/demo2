(function () {
  'use strict';

  /* ==========================================================================
     1. HERO HEADLINE REVEAL & VIDEO AUTOPLAY
     ========================================================================== */
  function initHero() {
    var hero = document.getElementById('hero');
    if (!hero) return;

    var video = hero.querySelector('.hero-video');

    // Arm first (hides lines), then release on next frames so the CSS transition runs
    hero.classList.add('hero--armed');
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        hero.classList.add('hero--ready');
      });
    });

    if (!video) return;

    var offscreen = false;

    function tryPlay() {
      if (offscreen) return;
      video.muted = true;
      var p = video.play();
      if (p && typeof p.catch === 'function') {
        p.catch(function () {});
      }
    }

    tryPlay();
    var retryInterval = setInterval(function () {
      if (video.paused && !offscreen) {
        tryPlay();
      } else if (!video.paused) {
        clearInterval(retryInterval);
      }
    }, 1000);

    function onFirstGesture() {
      tryPlay();
      document.removeEventListener('click', onFirstGesture);
      document.removeEventListener('touchstart', onFirstGesture);
    }
    document.addEventListener('click', onFirstGesture);
    document.addEventListener('touchstart', onFirstGesture, { passive: true });

    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) tryPlay();
    });

    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          offscreen = !entry.isIntersecting;
          if (offscreen) {
            video.pause();
          } else {
            tryPlay();
          }
        });
      }, { threshold: 0 }).observe(hero);
    }
  }


  /* ==========================================================================
     2. ABOUT SECTION REVEAL & VIDEO CONTROL
     ========================================================================== */
  function initAboutSection() {
    const aboutSection = document.getElementById('about');
    if (!aboutSection) return;

    const aboutVideo = aboutSection.querySelector('.about-video');

    // Arm the section so it animates when scrolled into view
    aboutSection.classList.add('about--armed');

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              aboutSection.classList.add('is-revealed');
              if (aboutVideo && aboutVideo.paused) {
                aboutVideo.play().catch(() => {});
              }
            } else {
              if (aboutVideo && !aboutVideo.paused) {
                aboutVideo.pause();
              }
            }
          });
        },
        { threshold: 0.2 }
      );

      observer.observe(aboutSection);
    } else {
      aboutSection.classList.add('is-revealed');
      if (aboutVideo) aboutVideo.play().catch(() => {});
    }
  }


  /* ==========================================================================
     3. SERVICES STACKED ACCORDION (INTERACTIVE & SMOOTH ANIMATION)
     ========================================================================== */
  function initServiceStack() {
    const stack = document.getElementById('serviceStack') || document.querySelector('.services .stack');
    if (!stack) return;

    const cards = Array.from(stack.querySelectorAll('.card'));
    if (!cards.length) return;

    const toggles = cards.map(c => c.querySelector('.card__toggle'));

    function setActive(index, allowToggle) {
      const isCurrentlyActive = cards[index].classList.contains('is-active');

      cards.forEach((card, i) => {
        // If clicking currently active card, toggle it closed; otherwise open the clicked card
        const open = (i === index) ? (allowToggle ? !isCurrentlyActive : true) : false;
        
        card.classList.toggle('is-active', open);
        
        const toggle = toggles[i];
        if (toggle) {
          toggle.setAttribute('aria-expanded', String(open));
        }
        
        const panel = card.querySelector('.card__panel');
        if (panel) {
          panel.toggleAttribute('inert', !open);
        }
      });
    }

    cards.forEach((card, i) => {
      const toggleBtn = toggles[i];
      const cardTab = card.querySelector('.card__tab');

      // 1. Click on the toggle button
      if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          setActive(i, true);
        });

        // Keyboard arrow navigation
        toggleBtn.addEventListener('keydown', (e) => {
          const last = toggles.length - 1;
          let next = null;

          if (e.key === 'ArrowDown') next = i === last ? 0 : i + 1;
          if (e.key === 'ArrowUp') next = i === 0 ? last : i - 1;
          if (e.key === 'Home') next = 0;
          if (e.key === 'End') next = last;

          if (next !== null && toggles[next]) {
            e.preventDefault();
            toggles[next].focus();
          }
        });
      }

      // 2. Click on the header tab area outside the toggle button
      if (cardTab) {
        cardTab.addEventListener('click', (e) => {
          if (e.target.closest('a') && !e.target.closest('.card__toggle')) return;
          setActive(i, true);
        });
      }

      // 3. Click anywhere on an inactive card to open it
      card.addEventListener('click', (e) => {
        if (!card.classList.contains('is-active')) {
          if (e.target.closest('a')) return;
          setActive(i, false);
        }
      });
    });

    // Initialize first active card (Card 0 open by default)
    const initialActive = cards.findIndex(c => c.classList.contains('is-active'));
    setActive(initialActive >= 0 ? initialActive : 0, false);
  }


  /* ==========================================================================
     4. STATS COUNTER ANIMATION
     ========================================================================== */
  function initStatsCounter() {
    const statsSection = document.getElementById('stats');
    if (!statsSection) return;

    const counters = statsSection.querySelectorAll('.stat-card__number');
    let animated = false;

    function runCounters() {
      counters.forEach((counter) => {
        const target = +counter.getAttribute('data-target') || 0;
        const suffix = counter.getAttribute('data-suffix') || '';
        const duration = 1800;
        const stepTime = 25;
        const totalSteps = duration / stepTime;
        const increment = target / totalSteps;
        let current = 0;

        const timer = setInterval(() => {
          current += increment;
          if (current >= target) {
            counter.textContent = target + suffix;
            clearInterval(timer);
          } else {
            counter.textContent = Math.floor(current) + suffix;
          }
        }, stepTime);
      });
    }

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !animated) {
              animated = true;
              runCounters();
            }
          });
        },
        { threshold: 0.25 }
      );

      observer.observe(statsSection);
    } else {
      runCounters();
    }
  }


  /* ==========================================================================
     5. SMOOTH SCROLLING FOR ALL SECTION LINKS (WITH NAVBAR OFFSET)
     ========================================================================== */
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (!href || href === '#') return;

        let target = null;
        if (href === '#home' || href === '#hero') {
          target = document.getElementById('home') || document.getElementById('hero');
        } else if (href === '#get-started') {
          target = document.getElementById('services') || document.getElementById('about');
        } else {
          target = document.querySelector(href);
        }

        if (target) {
          e.preventDefault();

          // Close mobile menu if open
          const mobileMenu = document.getElementById('mobileMenu');
          const hamburger = document.getElementById('hamburger');
          if (mobileMenu && mobileMenu.classList.contains('open')) {
            mobileMenu.classList.remove('open');
            if (hamburger) hamburger.setAttribute('aria-expanded', 'false');
          }

          const nav = document.querySelector('.nav');
          const navHeight = nav ? nav.offsetHeight : 70;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - (navHeight + 10);

          window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: 'smooth'
          });

          if (window.history && window.history.pushState && href !== '#home' && href !== '#get-started') {
            window.history.pushState(null, null, href);
          }
        }
      });
    });
  }


  /* ==========================================================================
     6. MOBILE HAMBURGER MENU
     ========================================================================== */
  function initMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');
    if (!hamburger || !mobileMenu) return;

    hamburger.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = mobileMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      }
    });
  }


  /* ==========================================================================
     7. NAVBAR SCROLL STYLING EFFECT
     ========================================================================== */
  function initNavScroll() {
    const nav = document.querySelector('.nav');
    if (!nav) return;

    function handleScroll() {
      if (window.scrollY > 30) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }


  /* ==========================================================================
     8. FOOTER INTERACTIONS (COPY & YEAR)
     ========================================================================== */
  function initFooter() {
    const footer = document.querySelector('.footer');
    if (!footer) return;

    // Dynamic copyright year
    const copyrightYear = footer.querySelector('.footer__bottom p');
    if (copyrightYear) {
      const currentYear = new Date().getFullYear();
      copyrightYear.innerHTML = `&copy; ${currentYear} HR Management System. All rights reserved.`;
    }

    // Copy email or phone on click
    const copyItems = footer.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]');
    copyItems.forEach((item) => {
      item.addEventListener('click', (e) => {
        const spanEl = item.querySelector('span');
        const textToCopy = spanEl ? spanEl.textContent : '';
        if (navigator.clipboard && textToCopy) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            const originalText = spanEl.textContent;
            spanEl.textContent = 'Copied to clipboard!';
            item.style.color = 'var(--primary-light)';

            setTimeout(() => {
              spanEl.textContent = originalText;
              item.style.color = '';
            }, 1800);
          }).catch(() => {});
        }
      });
    });
  }


  /* ==========================================================================
     INITIALIZATION ON DOM READY
     ========================================================================== */
  function initAll() {
    initHero();
    initAboutSection();
    initServiceStack();
    initStatsCounter();
    initSmoothScroll();
    initMobileMenu();
    initNavScroll();
    initFooter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();