/* ANSTA static site — motion engine: scroll reveals, sticky-nav condense,
   count-up stats, 3D card tilt, parallax, carousel and the enquiry form.
   Plain vanilla JS, no dependencies, no build step (GitHub Pages friendly). */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- scroll reveal (supports data-reveal="up|left|right|scale") ---- */
  function initReveal() {
    var reveals = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
    reveals.forEach(function (el) {
      var d = getComputedStyle(el).display;
      if ((d === 'grid' || d === 'flex') && el.childElementCount >= 3 && !el.hasAttribute('data-nostagger')) {
        el.setAttribute('data-stag', '1');
        Array.prototype.forEach.call(el.children, function (c) { c.setAttribute('data-sc', '0'); });
      }
    });

    function show(el) {
      el.setAttribute('data-seen', '1');
      if (el.hasAttribute('data-stag')) {
        Array.prototype.forEach.call(el.children, function (c, i) {
          setTimeout(function () { c.setAttribute('data-sc', 'in'); }, Math.min(i, 14) * 70);
        });
      }
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    var vh = window.innerHeight, seq = 0;
    reveals.forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * 0.94) {
        el.style.transitionDelay = (seq * 90) + 'ms';
        if (el.hasAttribute('data-stag')) Array.prototype.forEach.call(el.children, function (c, i) { c.style.transitionDelay = (seq * 90 + i * 70) + 'ms'; });
        seq++;
        requestAnimationFrame(function () { requestAnimationFrame(function () { show(el); }); });
      } else {
        io.observe(el);
      }
    });

    // Safety net: never leave content stuck hidden if rAF/IO is starved.
    setTimeout(function () {
      reveals.forEach(function (el) { if (!el.hasAttribute('data-seen')) show(el); });
    }, 1600);
  }

  /* ---- sticky nav condense + scroll-progress bar ---- */
  function initNav() {
    var nav = document.querySelector('.navbar');
    function onScroll() {
      var st = window.scrollY || document.documentElement.scrollTop;
      if (nav) { if (st > 20) nav.setAttribute('data-scrolled', '1'); else nav.removeAttribute('data-scrolled'); }
      var h = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty('--scrollp', (h > 0 ? (st / h) * 100 : 0).toFixed(2) + '%');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---- count-up stats, fired when each stat scrolls into view ---- */
  function initCounters() {
    var els = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
    if (!els.length) return;
    function run(el) {
      var target = parseFloat(el.getAttribute('data-count')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var start = performance.now(), dur = 1500;
      function step(now) {
        var t = Math.min(1, (now - start) / dur);
        var e = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(e * target) + suffix;
        if (t < 1) requestAnimationFrame(step);
      }
      el.textContent = '0' + suffix;
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
    // Fallback so numbers are never left at 0.
    setTimeout(function () { els.forEach(function (el) { if (el.textContent === '0' + (el.getAttribute('data-suffix') || '')) run(el); }); }, 1800);
  }

  /* ---- 3D tilt on [data-tilt] (pointer devices only) ---- */
  function initTilt() {
    if (reduce || !window.matchMedia || !matchMedia('(hover: hover)').matches) return;
    Array.prototype.forEach.call(document.querySelectorAll('[data-tilt]'), function (el) {
      var max = 8;
      el.style.transformStyle = 'preserve-3d';
      el.addEventListener('mousemove', function (ev) {
        var r = el.getBoundingClientRect();
        var px = (ev.clientX - r.left) / r.width - 0.5;
        var py = (ev.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(700px) rotateX(' + (-py * max) + 'deg) rotateY(' + (px * max) + 'deg) translateY(-6px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---- lightweight parallax on [data-parallax] (speed via data-speed) ---- */
  function initParallax() {
    if (reduce) return;
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
    if (!items.length) return;
    var ticking = false;
    function update() {
      var y = window.scrollY || document.documentElement.scrollTop;
      items.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-speed')) || 0.15;
        el.style.transform = 'translate3d(0,' + (y * speed).toFixed(1) + 'px,0)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ---- open + scroll to a course when arriving at Courses.html#id ---- */
  function openCourseFromHash() {
    var id = (location.hash || '').replace('#', '');
    if (!id) return;
    var el = document.getElementById(id);
    if (el && el.tagName === 'DETAILS') {
      // collapse other course panels so the linked one is the clear focus
      Array.prototype.forEach.call(document.querySelectorAll('details.course'), function (d) {
        if (d !== el) d.open = false;
      });
      el.open = true;
      setTimeout(function () { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
    }
  }

  /* ---- facilities slideshow: autoplay + swipe + thumbnails + keyboard ---- */
  function initGallery() {
    var gal = document.querySelector('.gal');
    if (!gal) return;
    var slides = Array.prototype.slice.call(gal.querySelectorAll('.gal-slide'));
    var thumbs = Array.prototype.slice.call(gal.querySelectorAll('.gal-thumb'));
    var bar = gal.querySelector('.gal-progress i');
    var prevBtn = document.querySelector('.gal-prev');
    var nextBtn = document.querySelector('.gal-next');
    var n = slides.length;
    if (!n) return;

    var DWELL = 5500;
    var cur = 0, timer = null, paused = false, startAt = 0, remaining = DWELL;
    gal.style.setProperty('--gal-dwell', DWELL + 'ms');

    // the first slide holds the walkthrough video; while it plays the carousel holds still
    var vSlide = gal.querySelector('[data-video]');
    var video = vSlide && vSlide.querySelector('.gal-video');
    var soundBtn = vSlide && vSlide.querySelector('.gal-sound');
    var vp = vSlide && vSlide.querySelector('.vp');
    var vpPlay = vp && vp.querySelector('.vp-play');
    var vpSeek = vp && vp.querySelector('.vp-seek');
    var vpCur = vp && vp.querySelector('.vp-cur');
    var vpDur = vp && vp.querySelector('.vp-dur');
    var vpFull = vp && vp.querySelector('.vp-full');
    var videoLock = false, inView = false, scrubbing = false;

    function replayProgress() {
      if (reduce || !bar) return;
      bar.style.animation = 'none';
      void bar.offsetWidth;          // force reflow so the animation restarts
      bar.style.animation = '';
    }
    function clearTimer() { if (timer) { clearTimeout(timer); timer = null; } }
    function arm(ms) {
      clearTimer();
      if (reduce || paused || videoLock) return;   // videoLock: nothing re-arms under a playing video
      startAt = Date.now();
      remaining = ms;
      timer = setTimeout(function () { go(cur + 1); }, ms);
    }
    function stopVideo() {
      if (!video) return;
      videoLock = false;
      scrubbing = false;
      video.pause();
      video.currentTime = 0;
      video.muted = true;                 // next visit starts silent again
      vSlide.classList.remove('is-video-playing');
      vSlide.classList.remove('is-paused-video');
      if (soundBtn) {
        soundBtn.setAttribute('aria-pressed', 'false');
        soundBtn.setAttribute('aria-label', 'Turn on sound for the academy tour');
        var l = soundBtn.querySelector('span'); if (l) l.textContent = 'Tap for sound';
      }
    }
    // muted playback is always permitted, so this never gets refused the way unmuted play() can be
    function playMuted() {
      if (!video || !inView || slides[cur] !== vSlide || !video.paused) return;
      var p = video.play();
      if (p && p.catch) p.catch(function () { videoLock = false; arm(DWELL); });
    }
    function go(i) {
      i = ((i % n) + n) % n;
      // stop the tour whenever we land on any other slide, wherever we came from
      if (vSlide && slides[i] !== vSlide) stopVideo();
      slides[cur].removeAttribute('data-active');
      thumbs[cur].removeAttribute('data-active');
      cur = i;
      slides[cur].setAttribute('data-active', '');
      thumbs[cur].setAttribute('data-active', '');
      replayProgress();
      clearTimer();                       // never leave the previous slide's timer running
      if (slides[cur] === vSlide) playMuted(); else arm(DWELL);
    }
    function pause() {
      if (paused) return;
      paused = true;
      remaining = Math.max(400, DWELL - (Date.now() - startAt));
      clearTimer();
      gal.classList.add('is-paused');
    }
    function resume() {
      if (!paused || videoLock) return;   // never slide away from a video that's playing
      paused = false;
      gal.classList.remove('is-paused');
      arm(remaining);              // finishes the leftover of the current slide
    }

    if (video) {
      // the tour plays silently on its own; sound is only ever turned on deliberately
      function fmt(s) {
        if (!isFinite(s)) return '0:00';
        s = Math.max(0, Math.floor(s));
        return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2);
      }
      function engage() {                  // reveal our own player bar
        vSlide.classList.add('is-video-playing');
        if (video.paused) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      }
      function setSound(on) {
        video.muted = !on;
        if (on) engage();
        if (soundBtn) {
          soundBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
          soundBtn.setAttribute('aria-label', on ? 'Mute the academy tour' : 'Turn on sound for the academy tour');
          var l = soundBtn.querySelector('span'); if (l) l.textContent = on ? 'Sound on' : 'Tap for sound';
        }
      }
      if (soundBtn) soundBtn.addEventListener('click', function (ev) { ev.stopPropagation(); setSound(video.muted); });
      // clicking the picture turns sound on, which is what people try first;
      // once the bar is up, a click is a play/pause toggle like any other player
      video.addEventListener('click', function () {
        if (!vSlide.classList.contains('is-video-playing')) { setSound(true); return; }
        if (video.paused) video.play(); else video.pause();
      });

      if (vpPlay) vpPlay.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (video.paused) video.play(); else video.pause();
      });
      if (vpFull) vpFull.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var el = vSlide, req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (document.fullscreenElement) document.exitFullscreen();
        else if (req) req.call(el);
      });
      if (vpSeek) {
        function seekTo() {
          if (!isFinite(video.duration)) return;
          video.currentTime = (vpSeek.value / 1000) * video.duration;
        }
        // pointerdown/up bracket the drag so the timeupdate handler stops fighting the thumb
        vpSeek.addEventListener('pointerdown', function (ev) { ev.stopPropagation(); scrubbing = true; });
        vpSeek.addEventListener('input', function () {
          vpSeek.style.setProperty('--vp-pct', (vpSeek.value / 10) + '%');
          if (isFinite(video.duration) && vpCur) vpCur.textContent = fmt((vpSeek.value / 1000) * video.duration);
        });
        vpSeek.addEventListener('change', function () { seekTo(); scrubbing = false; });
        window.addEventListener('pointerup', function () { if (scrubbing) { seekTo(); scrubbing = false; } });
        vpSeek.addEventListener('click', function (ev) { ev.stopPropagation(); });
      }
      video.addEventListener('loadedmetadata', function () { if (vpDur) vpDur.textContent = fmt(video.duration); });
      video.addEventListener('timeupdate', function () {
        if (scrubbing || !isFinite(video.duration) || !video.duration) return;
        var pct = (video.currentTime / video.duration) * 1000;
        if (vpSeek) { vpSeek.value = pct; vpSeek.style.setProperty('--vp-pct', (pct / 10) + '%'); }
        if (vpCur) vpCur.textContent = fmt(video.currentTime);
      });

      video.addEventListener('play', function () {
        videoLock = true;
        clearTimer();
        vSlide.classList.remove('is-paused-video');
        if (vpPlay) vpPlay.setAttribute('aria-label', 'Pause');
      });
      video.addEventListener('ended', function () { videoLock = false; go(cur + 1); });
      // if playback stalls or the browser blocks it, don't strand the carousel on a frozen slide
      video.addEventListener('pause', function () {
        vSlide.classList.add('is-paused-video');
        if (vpPlay) vpPlay.setAttribute('aria-label', 'Play');
        // once the bar is up the viewer is in charge — never slide out from under them.
        // only a stalled/blocked passive autoplay releases the carousel.
        if (video.ended || vSlide.classList.contains('is-video-playing')) return;
        videoLock = false;
        arm(DWELL);
      });

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          inView = entries[0].isIntersecting;
          if (inView) playMuted();
          else if (!video.paused) { video.pause(); videoLock = false; }
        }, { threshold: 0.35 }).observe(gal);
      } else { inView = true; }
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { go(cur - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { go(cur + 1); });
    thumbs.forEach(function (t, i) { t.addEventListener('click', function () { go(i); }); });

    gal.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); go(cur - 1); }
      else if (ev.key === 'ArrowRight') { ev.preventDefault(); go(cur + 1); }
    });

    // pause while hovering / focused, resume on leave
    gal.addEventListener('mouseenter', pause);
    gal.addEventListener('mouseleave', resume);
    gal.addEventListener('focusin', pause);
    gal.addEventListener('focusout', resume);

    // swipe / drag on the stage (pointer events, mouse + touch)
    var stage = gal.querySelector('.gal-stage');
    var downX = null;
    if (stage) {
      stage.addEventListener('pointerdown', function (ev) {
        // never let a swipe steal a drag that belongs to the player bar
        if (videoLock || (vp && vp.contains(ev.target))) return;
        downX = ev.clientX; pause();
      });
      window.addEventListener('pointerup', function (ev) {
        if (downX === null || videoLock) return;
        var dx = ev.clientX - downX;
        downX = null;
        if (Math.abs(dx) > 42) go(cur + (dx < 0 ? 1 : -1));
        else resume();
      });
    }

    // don't let autoplay race ahead while the tab is hidden
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause(); else resume();
    });

    if (!reduce) {
      gal.classList.add('is-playing');
      replayProgress();
      if (slides[cur] !== vSlide) arm(DWELL);   // the video slide holds until the clip ends
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    initNav();
    initCounters();
    initTilt();
    initParallax();
    initGallery();
    openCourseFromHash();
  });
  window.addEventListener('hashchange', openCourseFromHash);
})();

/* Course carousel (Home) — referenced from inline onclick handlers. */
function scrollTrack(dir) {
  var t = document.getElementById('course-track');
  if (t) t.scrollBy({ left: dir * 320, behavior: 'smooth' });
}

/* WhatsApp enquiry (Contact) — builds a pre-filled chat from the form fields
   and opens it. wa.me can only pre-fill; the visitor taps send in WhatsApp. */
function sendWhatsApp() {
  var NUMBER = '919740888397'; // +91 97408 88397
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  var name = val('cf-name'), phone = val('cf-phone'), email = val('cf-email'), course = val('cf-course'), msg = val('cf-msg');
  var statusEl = document.getElementById('form-status');
  function setStatus(text, bg, border, color) {
    if (!statusEl) return;
    statusEl.style.display = 'block';
    statusEl.textContent = text;
    statusEl.style.background = bg;
    statusEl.style.borderColor = border;
    statusEl.style.color = color;
  }
  if (!name || !phone) {
    setStatus('Please enter at least your name and phone number before sending on WhatsApp.', '#fff6e5', 'var(--gold)', '#8a6410');
    return false;
  }
  var lines = ['New ANSTA enquiry', 'Name: ' + name, 'Phone: ' + phone];
  if (email) lines.push('Email: ' + email);
  if (course) lines.push('Program: ' + course);
  if (msg) lines.push('Message: ' + msg);
  var url = 'https://wa.me/' + NUMBER + '?text=' + encodeURIComponent(lines.join('\n'));
  window.open(url, '_blank', 'noopener');
  setStatus('✓ Opening WhatsApp with your details — just tap send in the chat.', 'var(--color-accent-100)', 'var(--teal)', 'var(--color-accent-700)');
  return false;
}

/* Enquiry form (Contact) — referenced from the form's onsubmit handler. */
function handleSubmit(e) {
  e.preventDefault();
  var form = e.target;
  var statusEl = document.getElementById('form-status');
  function setStatus(text, bg, border, color) {
    if (!statusEl) return;
    statusEl.style.display = 'block';
    statusEl.textContent = text;
    statusEl.style.background = bg;
    statusEl.style.borderColor = border;
    statusEl.style.color = color;
  }
  if (form.action.indexOf('YOUR_FORM_ID') !== -1) {
    setStatus('✓ Form works! To receive these enquiries, add your free Formspree form ID in the form action (replace YOUR_FORM_ID).', '#fff6e5', 'var(--gold)', '#8a6410');
    form.reset();
    return false;
  }
  setStatus('Sending…', 'var(--color-accent-100)', 'var(--teal)', 'var(--color-accent-700)');
  fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
    .then(function (r) {
      if (r.ok) {
        setStatus('✓ Thank you — your enquiry has been sent. We’ll respond during office hours (Mon–Sat, 9 AM–6 PM).', 'var(--color-accent-100)', 'var(--teal)', 'var(--color-accent-700)');
        form.reset();
      } else {
        setStatus('Something went wrong. Please call or WhatsApp us instead.', '#ffece9', 'var(--color-accent)', 'var(--color-accent-700)');
      }
    })
    .catch(function () {
      setStatus('Something went wrong. Please call or WhatsApp us instead.', '#ffece9', 'var(--color-accent)', 'var(--color-accent-700)');
    });
  return false;
}
