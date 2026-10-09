// Statistik (Google Analytics 4) – wird erst nach Einwilligung geladen
var GA_MEASUREMENT_ID = 'G-8TN4KR48EF';
var CONSENT_KEY = 'frobel_stat_consent';

// Ereignis senden. Tut nichts, solange gtag nicht geladen ist (also ohne Einwilligung).
function trackEvent(name, params) {
  try {
    if (typeof window.gtag === 'function') {
      // send_to: Ereignisse nur an GA4 senden, nicht an weitere mit dem Google-Tag verbundene Ziele
      window.gtag('event', name, Object.assign({ send_to: GA_MEASUREMENT_ID }, params || {}));
    }
  } catch (e) { /* Tracking darf die Seite nie stören */ }
}

(function () {
  var banner = null;

  function readConsent() {
    try { return window.localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }
  function writeConsent(value) {
    try { window.localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* ohne Speicher: Hinweis erscheint erneut */ }
  }

  function loadAnalytics() {
    if (window.__frobelGaLoaded || !GA_MEASUREMENT_ID) return;
    window.__frobelGaLoaded = true;
    window['ga-disable-' + GA_MEASUREMENT_ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'granted'
    });
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false
    });
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(s);
  }

  function stopAnalytics() {
    window['ga-disable-' + GA_MEASUREMENT_ID] = true;
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: 'denied' });
    }
    // Bereits gesetzte Analytics-Cookies entfernen
    var host = window.location.hostname;
    var parts = host.split('.');
    var domains = ['', host, '.' + host];
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name === '_gid' || name.indexOf('_ga_') === 0 || name.indexOf('_gat') === 0) {
        domains.forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
  }

  function buildBanner() {
    var el = document.createElement('div');
    el.className = 'consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Datenschutz-Einstellungen');
    el.innerHTML =
      '<h2>Statistik erlauben?</h2>' +
      '<p>Mit Ihrer Zustimmung messen wir mit Google Analytics, welche Seiten und Kontaktwege ' +
      '(WhatsApp, Telefon, Anfrage) genutzt werden. Dabei werden Cookies gesetzt und Daten an Google ' +
      'übertragen. Ohne Zustimmung wird nichts geladen. Mehr in der ' +
      '<a href="datenschutz.html#statistik">Datenschutzerklärung</a>.</p>' +
      '<div class="consent-actions">' +
      '<button type="button" class="btn consent-btn" data-consent="denied">Ablehnen</button>' +
      '<button type="button" class="btn consent-btn" data-consent="granted">Zustimmen</button>' +
      '</div>';
    el.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-consent]');
      if (!b) return;
      var value = b.getAttribute('data-consent');
      writeConsent(value);
      if (value === 'granted') loadAnalytics(); else stopAnalytics();
      el.hidden = true;
    });
    document.body.appendChild(el);
    return el;
  }

  function showBanner(focus) {
    if (!banner) banner = buildBanner();
    banner.hidden = false;
    if (focus) {
      var first = banner.querySelector('button');
      if (first) first.focus();
    }
  }

  function init() {
    if (!GA_MEASUREMENT_ID) return;
    var consent = readConsent();
    if (consent === 'granted') loadAnalytics();
    else if (consent !== 'denied') showBanner(false);

    document.querySelectorAll('[data-cookie-settings]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        showBanner(true);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

// Klicks auf Telefon- und WhatsApp-Links
(function () {
  function linkLocation(el) {
    if (el.classList.contains('wa-float')) return 'floating_button';
    if (el.id === 'wa-send') return 'kontakt_formular';
    if (el.closest('header')) return 'header';
    if (el.closest('footer')) return 'footer';
    if (el.closest('.hero, .page-hero')) return 'hero';
    if (el.closest('.cta-band')) return 'cta_band';
    return 'content';
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';

    if (/^tel:/i.test(href)) {
      trackEvent('phone_click', {
        link_url: href,
        link_location: linkLocation(a),
        transport_type: 'beacon'
      });
    } else if (/^https?:\/\/(wa\.me|api\.whatsapp\.com|web\.whatsapp\.com)\b/i.test(href) || /^whatsapp:/i.test(href)) {
      // Nur die Adresse ohne Query senden (der Nachrichtentext kann Eingaben aus dem Formular enthalten).
      trackEvent('whatsapp_click', {
        link_url: href.split('?')[0],
        link_location: linkLocation(a),
        transport_type: 'beacon'
      });
    }
  });
})();

// Mobile Navigation
(function () {
  var btn = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (!btn || !links) return;

  function setOpen(open) {
    links.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  btn.addEventListener('click', function (e) {
    e.stopPropagation();
    setOpen(!links.classList.contains('open'));
  });

  // Tippen/Klicken außerhalb schließt das Menü
  document.addEventListener('click', function (e) {
    if (links.classList.contains('open') && !links.contains(e.target) && e.target !== btn) {
      setOpen(false);
    }
  });

  // Esc schließt das Menü
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && links.classList.contains('open')) {
      setOpen(false);
      btn.focus();
    }
  });

  // Klick auf einen Link im Menü schließt es (z. B. Anker/Reload derselben Seite)
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setOpen(false); });
  });
})();

// Rotierendes Hero-Wort (21st.dev "Animated Hero"-Muster)
(function () {
  var el = document.querySelector('.rotator');
  if (!el) return;
  var words;
  try { words = JSON.parse(el.dataset.words || '[]'); } catch (e) { words = []; }
  if (words.length < 2) return;
  var i = 0;
  setInterval(function () {
    i = (i + 1) % words.length;
    el.innerHTML = '<span class="word">' + words[i] + '</span>';
  }, 2600);
})();

// Kopier-Buttons
document.querySelectorAll('.copy-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var text = btn.dataset.copy || '';
    function done() {
      var old = btn.textContent;
      btn.textContent = 'Kopiert ✓';
      setTimeout(function () { btn.textContent = old; }, 1800);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () { fallback(); });
    } else { fallback(); }
    function fallback() {
      var row = btn.closest('.contact-row');
      var val = row && row.querySelector('.val');
      if (val) {
        var r = document.createRange();
        r.selectNodeContents(val);
        var s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
      }
    }
  });
});

// Anfrage-Formular: WhatsApp-Link live aufbauen, E-Mail-Text kopierbar machen
(function () {
  var form = document.getElementById('anfrage-form');
  if (!form) return;
  var waLink = document.getElementById('wa-send');
  var mailCopy = document.getElementById('mail-copy');
  var mailStatus = document.getElementById('mail-status');

  function buildText() {
    var get = function (name) {
      var f = form.elements[name];
      return f && f.value ? f.value.trim() : '';
    };
    var leistungen = Array.prototype.filter.call(
      form.querySelectorAll('input[name="leistung"]:checked'), function () { return true; }
    ).map(function (c) { return c.value; });
    var objekt = form.querySelector('input[name="objekt"]:checked');
    var zustand = form.querySelector('input[name="zustand"]:checked');

    var lines = ['Hallo Handwerkfrobel, ich habe eine Projektanfrage:', ''];
    if (leistungen.length) lines.push('Leistung: ' + leistungen.join(', '));
    if (get('flaeche')) lines.push('Fläche: ca. ' + get('flaeche') + ' m²');
    if (objekt) lines.push('Objekt: ' + objekt.value);
    if (zustand) lines.push('Bauzustand: ' + zustand.value);
    if (get('ort')) lines.push('Ort/Stadtteil: ' + get('ort'));
    if (get('beschreibung')) lines.push('', 'Beschreibung: ' + get('beschreibung'));
    var who = [];
    if (get('name')) who.push(get('name'));
    if (get('tel')) who.push('Tel: ' + get('tel'));
    if (get('email')) who.push('E-Mail: ' + get('email'));
    if (who.length) lines.push('', who.join(' · '));
    return lines.join('\n');
  }

  var waUrl = 'https://wa.me/4915142814446';

  function refresh() {
    waUrl = 'https://wa.me/4915142814446?text=' + encodeURIComponent(buildText());
  }
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);
  refresh();

  form.addEventListener('submit', function (e) { e.preventDefault(); });

  // Pflichtangaben (im Formular mit * markiert): Leistung, Objekt, Beschreibung
  function formComplete() {
    var hasLeistung = form.querySelectorAll('input[name="leistung"]:checked').length > 0;
    var hasObjekt = !!form.querySelector('input[name="objekt"]:checked');
    var desc = form.elements['beschreibung'];
    return hasLeistung && hasObjekt && !!(desc && desc.value.trim());
  }

  function trackSubmit(method) {
    if (!formComplete()) return;
    trackEvent('contact_form_submit', {
      form_id: 'anfrage-form',
      method: method,
      transport_type: 'beacon'
    });
  }

  // WhatsApp-Weg: Im HTML bleibt die schlichte Adresse stehen. Die Nachricht mit den Formulardaten
  // wird erst beim Klick geöffnet, damit sie nicht in automatisch erfasste Link-Adressen gelangt.
  if (waLink) {
    waLink.addEventListener('click', function (e) {
      trackSubmit('whatsapp');
      e.preventDefault();
      if (e.ctrlKey || e.metaKey || e.shiftKey) window.open(waUrl, '_blank', 'noopener');
      else window.location.href = waUrl;
    });
  }

  if (mailCopy) {
    mailCopy.addEventListener('click', function () {
      var text = buildText();
      function done() {
        if (mailStatus) mailStatus.textContent = 'Anfrage kopiert — einfach in eine E-Mail an info@handwerkfrobel.de einfügen.';
        // E-Mail-Weg: erst nach erfolgreichem Kopieren zaehlen
        trackSubmit('email');
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          if (mailStatus) mailStatus.textContent = 'Kopieren nicht möglich — bitte Text markieren und manuell kopieren.';
        });
      }
    });
  }
})();
