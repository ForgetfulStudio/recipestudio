// Shared by every page: fills in values from site-config.js (made by app/tools/site.js from app/config.json).
//   [data-contact]  → a mailto link to contactEmail (or keeps its placeholder text)
//   a.dl            → the download link (a.dl with href="#" says "Coming soon" until there is one)
//   a.dl-beta       → the test (beta) version's download; [data-beta-ends] → the test's last day
//   [data-version]  → the app version
//   #year           → this year
// Screenshots inside .frame.zoom open full size when clicked.
(() => {
  const S = window.SITE || {};
  const $$ = s => document.querySelectorAll(s);
  $$('#year').forEach(e => e.textContent = new Date().getFullYear());
  $$('[data-version]').forEach(e => e.textContent = S.version || '');
  if (S.contactEmail) $$('[data-contact]').forEach(e => {
    const a = document.createElement('a'); a.href = 'mailto:' + S.contactEmail; a.textContent = S.contactEmail;
    e.replaceChildren(a); e.classList.remove('fill');
  });
  $$('a.dl').forEach(a => {
    if (S.download) a.href = S.download;
    else if (a.getAttribute('href') === '#') { a.setAttribute('aria-disabled', 'true'); a.textContent = 'Coming soon'; }
  });
  // The test (beta) version: its own download, and the last day of the test.
  $$('a.dl-beta').forEach(a => {
    if (S.betaDownload) a.href = S.betaDownload;
    else { a.setAttribute('aria-disabled', 'true'); a.textContent = 'Coming soon'; }
  });
  if (S.betaEnds) $$('[data-beta-ends]').forEach(e => { e.textContent = new Date(S.betaEnds + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); });
  document.addEventListener('click', e => {
    const img = e.target.closest('.frame.zoom img');
    if (img) {
      const box = document.createElement('div'); box.className = 'lightbox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', img.alt);
      const big = new Image(); big.src = img.src; big.alt = img.alt; box.appendChild(big);
      const close = () => { box.remove(); document.removeEventListener('keydown', key); };
      const key = ev => { if (ev.key === 'Escape') close(); };
      box.addEventListener('click', close); document.addEventListener('keydown', key);
      document.body.appendChild(box);
    }
  });
})();
