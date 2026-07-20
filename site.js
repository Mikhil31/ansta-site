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

  document.addEventListener('DOMContentLoaded', function () {
    initReveal();
    initNav();
    initCounters();
    initTilt();
    initParallax();
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
  var NUMBER = '919945694326'; // +91 99456 94326
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
