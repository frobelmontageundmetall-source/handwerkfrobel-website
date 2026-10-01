// Mobile Navigation
document.querySelectorAll('.nav-toggle').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var links = document.querySelector('.nav-links');
    if (links) {
      var open = links.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
  });
});

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

  function refresh() {
    if (waLink) waLink.href = 'https://wa.me/4915142814446?text=' + encodeURIComponent(buildText());
  }
  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);
  refresh();

  form.addEventListener('submit', function (e) { e.preventDefault(); });

  if (mailCopy) {
    mailCopy.addEventListener('click', function () {
      var text = buildText();
      function done() {
        if (mailStatus) mailStatus.textContent = 'Anfrage kopiert — einfach in eine E-Mail an info@handwerkfrobel.de einfügen.';
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(function () {
          if (mailStatus) mailStatus.textContent = 'Kopieren nicht möglich — bitte Text markieren und manuell kopieren.';
        });
      }
    });
  }
})();
