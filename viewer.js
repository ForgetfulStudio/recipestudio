// Read-only viewer for a whole project. Used for "Export → Web page" (a single .html file) and by the
// share-link page on the website. It must not depend on anything else in the app: the factory's source
// text is copied into the exported page as-is.
function RSViewerFactory() {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const hue = s => { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
  const ini = s => (String(s || '').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2) || '?').toUpperCase();
  const short = s => String(s || '').split(':').pop().replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const img = (src, name, size = 40) => src ? `<span class="v-th" style="width:${size}px;height:${size}px"><img src="${src}" alt=""></span>` : `<span class="v-th ph" style="width:${size}px;height:${size}px;--h:${hue(name)}">${esc(ini(name))}</span>`;
  const TYPES = { raw: 'Raw material', shaped: 'Shaped crafting', shapeless: 'Shapeless crafting', smelting: 'Smelting', blasting: 'Blasting', smoking: 'Smoking', campfire: 'Campfire', stonecutting: 'Stonecutting', smithing: 'Smithing', brewing: 'Brewing', custom: 'Custom machine' };
  const css = `
  :root{--bg:#E6E9EC;--panel:#F7F8F9;--sunk:#DCE0E4;--ink:#1B2127;--muted:#5B6570;--line:#C5CCD3;--accent:#B4472A;--lapis:#2C5BA6}
  @media (prefers-color-scheme:dark){:root{--bg:#15181C;--panel:#1E2227;--sunk:#262B31;--ink:#E3E7EB;--muted:#8E99A4;--line:#363D45;--accent:#E2724C;--lapis:#79A3E6}}
  *{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
  .v-top{display:flex;gap:12px 20px;align-items:center;flex-wrap:wrap;padding:12px 16px;background:var(--panel);border-bottom:2px solid var(--line)}
  .v-top h1{margin:0;font-size:18px}.v-top .by{color:var(--muted);font-size:12px}.v-sp{flex:1}
  .v-tabs{display:flex;gap:4px;flex-wrap:wrap;background:var(--sunk);padding:3px;border-radius:4px}
  .v-tabs button{border:0;background:none;padding:6px 12px;border-radius:3px;cursor:pointer;color:var(--muted);font:inherit}
  .v-tabs button[aria-pressed=true]{background:var(--panel);color:var(--ink)}
  main{padding:16px;max-width:1500px;margin:0 auto}
  .v-board{position:relative;height:72vh;overflow:hidden;border:2px solid var(--line);border-radius:4px;background:var(--sunk);cursor:grab;touch-action:none}
  .v-world{position:absolute;left:0;top:0;transform-origin:0 0}
  .v-node{position:absolute;width:214px;background:var(--panel);border:2px solid var(--line);border-radius:4px;cursor:pointer}
  .v-node.sel{border-color:var(--accent)}
  .v-nh{font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);padding:4px 10px;border-bottom:1px solid var(--line);background:var(--sunk)}
  .v-nb{display:flex;gap:10px;align-items:center;padding:10px}.v-nb b{display:block;line-height:1.25}.v-id{font:11px ui-monospace,Consolas,monospace;color:var(--muted);overflow-wrap:anywhere}
  .v-th{display:inline-grid;place-items:center;flex:none;border-radius:3px;overflow:hidden;background:var(--sunk);border:1px solid var(--line)}
  .v-th:has(>img){position:relative}.v-th img{position:absolute;inset:0;width:100%;height:100%;object-fit:contain;image-rendering:pixelated}.v-th.ph{background:hsl(var(--h) 42% 42%);color:#fff;font-weight:700;font-size:12px}
  svg.v-edges{position:absolute;left:0;top:0;overflow:visible;pointer-events:none}svg.v-edges path{fill:none;stroke:var(--lapis);stroke-width:2.5}
  .v-side{margin-top:12px;background:var(--panel);border:2px solid var(--line);border-radius:4px;padding:14px;display:grid;gap:8px}
  .v-grid3{display:grid;grid-template-columns:repeat(3,64px);gap:4px}.v-grid3 span{height:64px;border:1px solid var(--line);background:var(--bg);display:grid;place-items:center;font-size:10px;text-align:center;overflow:hidden;padding:2px}
  .v-grid3 img{width:36px;height:36px;object-fit:contain;image-rendering:pixelated}
  .v-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}
  .v-card{background:var(--panel);border:2px solid var(--line);border-radius:4px;padding:14px;display:grid;gap:8px;align-content:start}
  .v-card h3{margin:0;font-size:16px}.v-row{display:flex;gap:12px;align-items:center}
  .v-tags{display:flex;flex-wrap:wrap;gap:4px}.v-tag{font-size:12px;background:var(--sunk);border:1px solid var(--line);padding:1px 7px;border-radius:2px}
  .v-muted{color:var(--muted)}.v-lbl{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);font-weight:600}
  table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line)}th{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
  .v-q{padding:6px 10px;border-left:3px solid var(--accent);background:var(--panel);border-radius:3px;margin:4px 0}
  .v-empty{padding:32px;text-align:center;color:var(--muted);border:2px dashed var(--line);border-radius:4px}
  .v-foot{color:var(--muted);font-size:12px;text-align:center;padding:24px}
  @media (max-width:640px){.v-board{height:60vh}}`;

  function render(root, P) {
    P = P || {}; const C = P.crafting || { nodes: [], edges: [] };
    const tabs = [['crafting', 'Crafting', C.nodes.length], ['items', 'Items', (P.items || []).length], ['mobs', 'Mobs', (P.mobs || []).length], ['dims', 'Dimensions', (P.dims || []).length], ['quests', 'Quests', (P.quests || []).length], ['server', 'Server', (P.shop || []).length + (P.ranks || []).length]].filter(t => t[2] || t[0] === 'crafting');
    let tab = 'crafting', sel = null, view = { x: 30, y: 30, z: 0.8 };
    const byRef = s => { const t = String(s || '').toLowerCase(); return C.nodes.find(n => (n.itemId || '').toLowerCase() === t || (n.name || '').toLowerCase() === t); };
    const pic = s => byRef(s)?.img || (P.items || []).find(i => (i.itemId || '').toLowerCase() === String(s || '').toLowerCase())?.img || null;
    root.innerHTML = `<header class="v-top"><div><h1>${esc(P.name || 'Project')}</h1><div class="by">Read-only view · made with RecipeStudio</div></div><span class="v-sp"></span><nav class="v-tabs">${tabs.map(([v, l, n]) => `<button data-t="${v}">${l} <small>${n}</small></button>`).join('')}</nav></header><main id="v-main"></main><p class="v-foot">Shared from RecipeStudio. Changes made after sharing aren't shown.</p>`;
    const main = root.querySelector('#v-main');
    function show() {
      root.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === tab));
      if (tab === 'crafting') return board();
      const list = (arr, fn, none) => arr.length ? `<div class="v-cards">${arr.map(fn).join('')}</div>` : `<div class="v-empty">${none}</div>`;
      if (tab === 'items') main.innerHTML = list(P.items || [], it => `<article class="v-card"><div class="v-row">${img(it.img || pic(it.itemId), it.name, 48)}<div><h3>${esc(it.name)}</h3><div class="v-id">${esc(it.itemId)}</div></div></div><div class="v-tags"><span class="v-tag">${esc(it.kind)}</span>${it.rarity && it.rarity !== 'common' ? `<span class="v-tag">${esc(it.rarity)}</span>` : ''}${String(it.tags || '').split(',').filter(t => t.trim()).map(t => `<span class="v-tag">#${esc(t.trim())}</span>`).join('')}</div>${it.tooltip ? `<i class="v-muted">${esc(it.tooltip)}</i>` : ''}${it.notes ? `<p class="v-muted" style="margin:0">${esc(it.notes)}</p>` : ''}</article>`, 'No items.');
      if (tab === 'mobs') main.innerHTML = list(P.mobs || [], m => `<article class="v-card"><div class="v-row">${img(m.img, m.name, 56)}<div><h3>${esc(m.name)}</h3><div class="v-id">${esc(m.entityId)}</div></div></div><div class="v-tags"><span class="v-tag">${esc(m.type)}</span><span class="v-tag">Level ${esc(m.level)}</span><span class="v-tag">${esc(m.health)} HP</span><span class="v-tag">${esc(m.damage)} damage</span></div>${m.spawn ? `<div><span class="v-lbl">Spawns</span> ${esc(m.spawn)}</div>` : ''}${(m.drops || []).length ? `<div><span class="v-lbl">Drops</span> ${m.drops.map(d => `${esc(short(d.item))} ${esc(d.min)}${d.max != d.min ? '–' + esc(d.max) : ''}${d.chance < 100 ? ` (${esc(d.chance)}%)` : ''}`).join(', ')}</div>` : ''}${(m.ai || []).length ? `<div class="v-tags">${m.ai.map(a => `<span class="v-tag">${esc(a)}</span>`).join('')}</div>` : ''}${m.notes ? `<p class="v-muted" style="margin:0">${esc(m.notes)}</p>` : ''}</article>`, 'No mobs.');
      if (tab === 'dims') main.innerHTML = list(P.dims || [], d => `<article class="v-card"><div style="height:70px;margin:-14px -14px 0;border-radius:2px 2px 0 0;background:linear-gradient(${esc(d.sky)},${esc(d.fog)});display:flex;align-items:flex-end;padding:8px 14px"><h3 style="color:#fff;text-shadow:0 1px 2px #000">${esc(d.name)}</h3></div><div class="v-id">${esc(d.dimId)}</div>${d.access ? `<div><span class="v-lbl">Access</span> ${esc(d.access)}</div>` : ''}${d.biomes ? `<div><span class="v-lbl">Biomes</span> ${esc(d.biomes)}</div>` : ''}${d.structures ? `<div><span class="v-lbl">Structures</span> ${esc(d.structures)}</div>` : ''}${(d.ores || []).length ? `<div><span class="v-lbl">Ores</span> ${d.ores.map(o => `${esc(short(o.item))} (Y ${esc(o.minY)} to ${esc(o.maxY)})`).join(', ')}</div>` : ''}${d.notes ? `<p class="v-muted" style="margin:0">${esc(d.notes)}</p>` : ''}</article>`, 'No dimensions.');
      if (tab === 'quests') {
        // Chapters, each a small map of hexagon quests with lines to what they need.
        const qs = P.quests || [], chs = [...(P.chapters || [])].sort((a, b) => (a.order || 0) - (b.order || 0)), byId = id => qs.find(q => q.id === id);
        const HEX = '25,1.5 46.6,13.75 46.6,36.25 25,48.5 3.4,36.25 3.4,13.75';
        const map = list => {
          if (!list.length) return '<p class="v-muted">No quests in this chapter.</p>';
          const x0 = Math.min(...list.map(q => q.x)) - 30, y0 = Math.min(...list.map(q => q.y)) - 10, x1 = Math.max(...list.map(q => q.x)) + 80, y1 = Math.max(...list.map(q => q.y)) + 90;
          const lines = list.flatMap(q => (q.deps || []).map(byId).filter(d => d && d.chapter === q.chapter).map(d => `<line x1="${d.x + 25}" y1="${d.y + 25}" x2="${q.x + 25}" y2="${q.y + 25}"/>`)).join('');
          const hexes = list.map(q => { const p = q.img || pic(q.icon); return `<g transform="translate(${q.x} ${q.y})"><title>${esc(q.title)}${q.subtitle ? ' · ' + esc(q.subtitle) : ''}</title><polygon points="${HEX}" style="fill:color-mix(in srgb, ${esc(q.color || '#79A3E6')} 30%, var(--panel));stroke:${esc(q.color || '#79A3E6')};stroke-width:3"/>${p ? `<image href="${p}" x="12" y="12" width="26" height="26" style="image-rendering:pixelated"/>` : ''}<text x="25" y="64" text-anchor="middle" style="font-size:10px;fill:var(--ink)">${esc(String(q.title || '').slice(0, 18))}</text></g>`; }).join('');
          return `<svg viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}" style="width:100%;max-height:60vh;background:var(--sunk);border-radius:4px" role="img" aria-label="Quest map"><g style="stroke:var(--muted);stroke-width:2.5">${lines}</g>${hexes}</svg>`;
        };
        const detail = q => `<div class="v-q"><b>${esc(q.title)}</b>${q.subtitle ? ` <span class="v-muted">${esc(q.subtitle)}</span>` : ''}${(q.deps || []).length ? `<div class="v-muted" style="font-size:13px">Needs: ${q.deps.map(byId).filter(Boolean).map(d => esc(d.title)).join(', ')}</div>` : ''}</div>`;
        main.innerHTML = qs.length ? chs.map(c => { const list = qs.filter(q => q.chapter === c.id); return `<section style="margin-bottom:24px"><h3 style="margin:0 0 8px">${esc(c.title)}</h3>${c.subtitle ? `<p class="v-muted" style="margin:0 0 8px">${esc(c.subtitle)}</p>` : ''}${map(list)}${list.map(detail).join('')}</section>`; }).join('') : '<div class="v-empty">No quests.</div>';
      }
      if (tab === 'server') main.innerHTML = `${(P.shop || []).length ? `<h3>Shop</h3><table><thead><tr><th>Item</th><th>Category</th><th>Buy</th><th>Sell</th></tr></thead><tbody>${P.shop.filter(s => s.item).map(s => `<tr><td>${esc(short(s.item))}</td><td>${esc(s.category || '')}</td><td>${esc(s.buy ?? '')}</td><td>${esc(s.sell ?? '')}</td></tr>`).join('')}</tbody></table>` : ''}
        ${(P.ranks || []).length ? `<h3>Ranks</h3><div class="v-cards">${P.ranks.map(r => `<article class="v-card"><h3>${esc(r.name)}</h3>${r.cost ? `<div>${esc(r.cost)}</div>` : ''}${r.notes ? `<p class="v-muted" style="margin:0">${esc(r.notes)}</p>` : ''}</article>`).join('')}</div>` : ''}`;
    }
    function board() {
      if (!C.nodes.length) { main.innerHTML = '<div class="v-empty">No recipes.</div>'; return; }
      const W = 214, nodeH = n => n.type === 'shaped' ? 160 : 96;
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      C.nodes.forEach(n => { x0 = Math.min(x0, n.x); y0 = Math.min(y0, n.y); x1 = Math.max(x1, n.x + W); y1 = Math.max(y1, n.y + nodeH(n)); });
      const by = id => C.nodes.find(n => n.id === id);
      const paths = C.edges.map(e => { const a = by(e.from), b = by(e.to); if (!a || !b) return ''; const ax = a.x + W + 6, ay = a.y + 48, bx = b.x - 9, by2 = b.y + 48, dx = Math.max(40, Math.abs(bx - ax) / 2); return `<path d="M${ax} ${ay} C${ax + dx} ${ay} ${bx - dx} ${by2} ${bx} ${by2}"/>`; }).join('');
      main.innerHTML = `<div class="v-board" id="v-board"><div class="v-world" id="v-world"><svg class="v-edges" style="left:${x0 - 200}px;top:${y0 - 200}px" width="${x1 - x0 + 400}" height="${y1 - y0 + 400}" viewBox="${x0 - 200} ${y0 - 200} ${x1 - x0 + 400} ${y1 - y0 + 400}">${paths}</svg>
        ${C.nodes.map(n => `<div class="v-node${sel === n.id ? ' sel' : ''}" data-n="${esc(n.id)}" style="left:${n.x}px;top:${n.y}px"><div class="v-nh">${esc(n.type === 'custom' && n.machine ? n.machine : TYPES[n.type] || n.type)}${n.count > 1 ? ` · ×${esc(n.count)}` : ''}</div><div class="v-nb">${img(n.img, n.name)}<div><b>${esc(n.name)}</b><div class="v-id">${esc(n.itemId)}</div></div></div></div>`).join('')}</div></div><div id="v-side"></div>`;
      const bd = main.querySelector('#v-board'), w = main.querySelector('#v-world');
      const apply = () => { w.style.transform = `translate(${view.x}px,${view.y}px) scale(${view.z})`; };
      // Fit everything in view; again whenever the size changes, until the viewer moves around themselves.
      const fitView = () => {
        const r = bd.getBoundingClientRect(); if (r.width < 80 || r.height < 80) return;
        view.z = Math.min(1, Math.max(0.1, Math.min((r.width - 60) / (x1 - x0), (r.height - 60) / (y1 - y0))));
        view.x = (r.width - (x1 - x0) * view.z) / 2 - x0 * view.z; view.y = (r.height - (y1 - y0) * view.z) / 2 - y0 * view.z; apply();
      };
      if (!board.moved) fitView(); else apply();
      if (window.ResizeObserver) new ResizeObserver(() => { if (!board.moved) fitView(); }).observe(bd);
      let drag = null;
      bd.onpointerdown = e => { const n = e.target.closest('[data-n]'); if (n) { sel = n.dataset.n; side(); bd.querySelectorAll('.v-node').forEach(x => x.classList.toggle('sel', x.dataset.n === sel)); return; } drag = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y }; bd.setPointerCapture(e.pointerId); };
      bd.onpointermove = e => { if (!drag) return; board.moved = true; view.x = drag.vx + e.clientX - drag.x; view.y = drag.vy + e.clientY - drag.y; apply(); };
      bd.onpointerup = () => { drag = null; };
      bd.onwheel = e => { e.preventDefault(); board.moved = true; const rr = bd.getBoundingClientRect(), mx = e.clientX - rr.left, my = e.clientY - rr.top, f = e.deltaY < 0 ? 1.1 : 1 / 1.1, nz = Math.min(3, Math.max(0.05, view.z * f)); view.x = mx - (mx - view.x) * nz / view.z; view.y = my - (my - view.y) * nz / view.z; view.z = nz; apply(); };
      side();
    }
    function side() {
      const el = main.querySelector('#v-side'); if (!el) return;
      const n = C.nodes.find(x => x.id === sel);
      if (!n) { el.innerHTML = '<div class="v-side v-muted">Click a block to see its recipe. Drag to move around, scroll to zoom.</div>'; return; }
      const grid = n.type === 'shaped' ? `<div class="v-grid3">${(n.grid || []).map((g, i) => { const p = (n.gridImgs || [])[i] || pic(g); return `<span title="${esc(g)}">${p ? `<img src="${p}" alt="">` : esc(g ? short(g) : '')}</span>`; }).join('')}</div>` : '';
      const ins = n.type !== 'shaped' && n.type !== 'raw' ? String(n.inputs || '').split('\n').filter(Boolean) : [];
      el.innerHTML = `<div class="v-side"><div class="v-row">${img(n.img, n.name, 48)}<div><h3 style="margin:0">${esc(n.name)}</h3><div class="v-id">${esc(n.itemId)}</div></div></div><div class="v-lbl">${esc(TYPES[n.type] || n.type)}${n.count > 1 ? ` · makes ${esc(n.count)}` : ''}</div>${grid}${ins.length ? `<div class="v-tags">${ins.map(i => `<span class="v-tag">${esc(short(i))}</span>`).join('')}</div>` : ''}${n.notes ? `<p class="v-muted" style="margin:0">${esc(n.notes)}</p>` : ''}</div>`;
    }
    root.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { tab = b.dataset.t; show(); });
    show();
  }
  return { css, render };
}
if (window.RS) {
  // A stand-alone page: the viewer code plus the project, with any "<" escaped so nothing can break out of the script.
  window.RS.viewer = {
    page: async P => {
      const LS = String.fromCharCode(0x2028), PS = String.fromCharCode(0x2029);
      const BS = String.fromCharCode(92); // a backslash, built at run time so the escapes survive copying
      const data = JSON.stringify(P).split('<').join(BS + 'u003c').split(LS).join(BS + 'u2028').split(PS).join(BS + 'u2029');
      const v = RSViewerFactory();
      const title = String(P.name || 'Project').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
      return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title} · RecipeStudio</title><style>${v.css}</style></head><body><div id="app"></div><script>${RSViewerFactory.toString()}\nRSViewerFactory().render(document.getElementById('app'), ${data});</script></body></html>`;
    }
  };
}
