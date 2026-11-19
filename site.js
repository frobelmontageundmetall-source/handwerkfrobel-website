// Einwilligung (Google Analytics 4 und Google Ads) – der Google-Tag wird erst nach Einwilligung geladen
var GA_MEASUREMENT_ID = 'G-8TN4KR48EF';
var ADS_ID = 'AW-17775235346';
// Conversion-Label der Google-Ads-Conversion (aus dem Ereignis-Snippet: send_to 'AW-17775235346/LABEL').
// Solange das Label leer ist, wird keine Ads-Conversion gesendet.
var ADS_CONVERSION_LABEL = 'mh6tCPvr4rsdEJKi8ptC';
var CONSENT_KEY = 'frobel_consent_v2';

// Aktuelle Auswahl der Besucher (Standard: nichts erlaubt)
var frobelConsent = { stat: false, ads: false };

// Ereignis senden. Tut nichts, solange gtag nicht geladen ist (also ohne Einwilligung).
function trackEvent(name, params) {
  try {
    if (typeof window.gtag !== 'function') return;
    if (frobelConsent.stat) {
      // send_to: Ereignisse nur an GA4 senden, nicht an weitere mit dem Google-Tag verbundene Ziele
      window.gtag('event', name, Object.assign({ send_to: GA_MEASUREMENT_ID }, params || {}));
    }
    // Google-Ads-Conversion: nur mit Werbe-Einwilligung, nur bei WhatsApp-Klick und Anfrage
    if (frobelConsent.ads && ADS_CONVERSION_LABEL &&
        (name === 'whatsapp_click' || name === 'contact_form_submit')) {
      window.gtag('event', 'conversion', {
        send_to: ADS_ID + '/' + ADS_CONVERSION_LABEL,
        transport_type: 'beacon'
      });
    }
  } catch (e) { /* Tracking darf die Seite nie stören */ }
}

(function () {
  var banner = null;

  function readConsent() {
    try {
      var raw = window.localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      var c = JSON.parse(raw);
      return { stat: c.stat === true, ads: c.ads === true };
    } catch (e) { return null; }
  }
  function writeConsent(c) {
    try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify(c)); } catch (e) { /* ohne Speicher: Hinweis erscheint erneut */ }
  }

  function ensureGtag(firstId) {
    if (window.__frobelGtagLoaded) return;
    window.__frobelGtagLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    // Standard: alles verweigert; erst die Auswahl der Besucher schaltet Bereiche frei
    window.gtag('consent', 'default', {
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied'
    });
    window.gtag('js', new Date());
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(firstId);
    document.head.appendChild(s);
  }

  // Bereits gesetzte Cookies der abgewählten Bereiche entfernen
  function removeCookies(c) {
    var host = window.location.hostname;
    var parts = host.split('.');
    var domains = ['', host, '.' + host];
    if (parts.length > 2) domains.push('.' + parts.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      var isStat = name === '_ga' || name === '_gid' || name.indexOf('_ga_') === 0 || name.indexOf('_gat') === 0;
      var isAds = name.indexOf('_gcl_') === 0;
      if ((isStat && !c.stat) || (isAds && !c.ads)) {
        domains.forEach(function (d) {
          document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
  }

  function applyConsent(c) {
    frobelConsent = c;
    window['ga-disable-' + GA_MEASUREMENT_ID] = !c.stat;
    if (c.stat || c.ads) {
      ensureGtag(c.stat ? GA_MEASUREMENT_ID : ADS_ID);
      window.gtag('consent', 'update', {
        analytics_storage: c.stat ? 'granted' : 'denied',
        ad_storage: c.ads ? 'granted' : 'denied',
        ad_user_data: c.ads ? 'granted' : 'denied',
        ad_personalization: 'denied' // keine personalisierte Werbung, nur Erfolgsmessung
      });
      if (c.stat && !window.__frobelGaConfigured) {
        window.__frobelGaConfigured = true;
        window.gtag('config', GA_MEASUREMENT_ID, {
          allow_google_signals: false,
          allow_ad_personalization_signals: false
        });
      }
      if (c.ads && !window.__frobelAdsConfigured) {
        window.__frobelAdsConfigured = true;
        window.gtag('config', ADS_ID, { allow_ad_personalization_signals: false });
      }
    } else if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied'
      });
    }
    if (!c.stat || !c.ads) removeCookies(c);
  }

  function buildBanner() {
    var el = document.createElement('div');
    el.className = 'consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Datenschutz-Einstellungen');
    el.innerHTML =
      '<h2>Ihre Datenschutz-Einstellungen</h2>' +
      '<p>Mit Ihrer Zustimmung nutzen wir Google-Dienste. Dabei werden Cookies gesetzt und Daten an Google ' +
      'übertragen. Ohne Zustimmung wird nichts geladen. Mehr in der ' +
      '<a href="datenschutz.html#statistik">Datenschutzerklärung</a>.</p>' +
      '<label class="consent-opt"><input type="checkbox" data-opt="stat">' +
      '<span><strong>Statistik (Google Analytics)</strong>Welche Seiten und Kontaktwege (WhatsApp, Telefon, Anfrage) genutzt werden.</span></label>' +
      '<label class="consent-opt"><input type="checkbox" data-opt="ads">' +
      '<span><strong>Werbung (Google Ads)</strong>Messung, ob eine Anzeige zu einer Anfrage geführt hat. Keine personalisierte Werbung.</span></label>' +
      '<div class="consent-actions">' +
      '<button type="button" class="btn consent-btn" data-consent="none">Alle ablehnen</button>' +
      '<button type="button" class="btn consent-btn" data-consent="all">Alle zustimmen</button>' +
      '<button type="button" class="btn consent-btn consent-save" data-consent="custom">Auswahl speichern</button>' +
      '</div>';
    el.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-consent]');
      if (!b) return;
      var v = b.getAttribute('data-consent');
      var c;
      if (v === 'all') c = { stat: true, ads: true };
      else if (v === 'none') c = { stat: false, ads: false };
      else c = {
        stat: !!el.querySelector('[data-opt="stat"]').checked,
        ads: !!el.querySelector('[data-opt="ads"]').checked
      };
      writeConsent(c);
      applyConsent(c);
      el.hidden = true;
    });
    document.body.appendChild(el);
    return el;
  }

  function showBanner(focus) {
    if (!banner) banner = buildBanner();
    // Haken zeigen die aktuelle Auswahl (bei erstem Besuch: nichts angehakt)
    banner.querySelector('[data-opt="stat"]').checked = frobelConsent.stat;
    banner.querySelector('[data-opt="ads"]').checked = frobelConsent.ads;
    banner.hidden = false;
    if (focus) {
      var first = banner.querySelector('button');
      if (first) first.focus();
    }
  }

  function init() {
    var consent = readConsent();
    if (consent) applyConsent(consent);
    else showBanner(false);

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
  // Bei "Bewegung reduzieren" bleibt das erste Wort stehen (kein automatischer Wechsel)
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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

// PU-Check (pu-boden.html): Kurzformular aufklappen, per #pu-check direkt geöffnet (QR-Code Broschüre)
(function () {
  var form = document.getElementById('pu-check-form');
  var toggle = document.getElementById('pu-check-toggle');
  if (!form || !toggle) return;
  var desc = form.elements['beschreibung'];
  var mailBtn = document.getElementById('pu-check-mail');

  function setOpen(open, scroll) {
    form.hidden = !open;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      if (scroll) document.getElementById('pu-check').scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(function () { desc.focus({ preventScroll: true }); }, 250);
    }
  }

  toggle.addEventListener('click', function () { setOpen(form.hidden, false); });
  form.querySelector('.pu-check-close').addEventListener('click', function () {
    setOpen(false);
    toggle.focus();
  });

  if (location.hash === '#pu-check') setOpen(true, true);
  window.addEventListener('hashchange', function () {
    if (location.hash === '#pu-check') setOpen(true, true);
  });

  function buildText() {
    var get = function (name) {
      var f = form.elements[name];
      return f && f.value ? f.value.trim() : '';
    };
    var lines = ['Hallo Handwerkfrobel, passt ein fugenloser PU-Boden zu meinem Projekt?', ''];
    lines.push('Leistung: Fugenlose Bodenbeschichtung (PU)');
    if (get('flaeche')) lines.push('Fläche: ca. ' + get('flaeche') + ' m²');
    lines.push('Ort/Stadtteil: ' + get('ort'));
    lines.push('', 'Beschreibung: ' + get('beschreibung'));
    return lines.join('\n');
  }

  function track(method) {
    trackEvent('contact_form_submit', { form_id: 'pu-check-form', method: method, transport_type: 'beacon' });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    track('whatsapp');
    window.location.href = 'https://wa.me/4915142814446?text=' + encodeURIComponent(buildText());
  });

  if (mailBtn) {
    mailBtn.addEventListener('click', function () {
      if (!form.reportValidity()) return;
      track('email');
      window.location.href = 'mailto:info@handwerkfrobel.de?subject=' +
        encodeURIComponent('PU-Check: Anfrage über die Website') + '&body=' + encodeURIComponent(buildText());
    });
  }
})();
