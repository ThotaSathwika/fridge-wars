(() => {
  'use strict';

  const DATA_URL = '../data/battles.json';
  const POLL_MS = 4000;

  const CHEFS = {
    'chef-nonna': { name: 'Nonna', full: 'Chef Nonna', emoji: '👵', motto: 'Love, butter, and no shortcuts.', cls: 'nonna', colors: ['#c8323c', '#fbf1dc', '#e8a04a'] },
    'chef-blaze': { name: 'Blaze', full: 'Chef Blaze', emoji: '🔥', motto: 'Max heat. Zero fear.', cls: 'blaze', colors: ['#ff6a13', '#ffb000', '#1a1a1a'] },
    'chef-zen':   { name: 'Zen',   full: 'Chef Zen',   emoji: '🍃', motto: 'Less, but perfect.', cls: 'zen', colors: ['#8fa98a', '#ffffff', '#3f5a46'] },
  };
  const ORDER = ['chef-nonna', 'chef-blaze', 'chef-zen'];
  const SCORE_LABELS = { taste: 'Taste', creativity: 'Creativity', ease: 'Ease' };

  const $ = (id) => document.getElementById(id);
  const state = {
    battles: [],
    selectedId: readHash(),
    lastText: null,
    lastLatestKey: null,
    loadedOnce: false,
    failed: false,
  };

  // ---------- helpers ----------
  function esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function arr(v) { return Array.isArray(v) ? v.filter((x) => x !== null && x !== undefined && x !== '') : []; }
  function num(v) { const n = Number(v); return Number.isFinite(n) ? n : null; }

  function normChef(id) {
    if (!id) return '';
    let s = String(id).toLowerCase().trim().replace(/^@/, '').replace(/\s+/g, '-');
    if (CHEFS[s]) return s;
    if (CHEFS['chef-' + s]) return 'chef-' + s;
    const hit = ORDER.find((k) => s.includes(k.slice(5)));
    return hit || s;
  }
  function chef(id) {
    const key = normChef(id);
    if (CHEFS[key]) return { key, ...CHEFS[key] };
    const pretty = String(id || 'Mystery Chef').replace(/^chef-/i, '').replace(/[-_]/g, ' ');
    const name = pretty.replace(/\b\w/g, (c) => c.toUpperCase());
    return { key, name, full: 'Chef ' + name, emoji: '👨‍🍳', motto: '', cls: 'guest', colors: ['#bbb', '#fff', '#666'] };
  }
  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (isNaN(d)) return '';
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }
  function readHash() {
    const m = location.hash.match(/battle-(\d+)/);
    return m ? Number(m[1]) : null;
  }

  function normalize(json) {
    const list = arr(json && json.battles).filter((b) => b && typeof b === 'object');
    list.forEach((b, i) => { if (num(b.id) === null) b.id = i + 1; else b.id = num(b.id); });
    list.sort((a, b) => a.id - b.id);
    return list;
  }

  function entryTotal(e) {
    const t = num(e.total);
    if (t !== null) return t;
    const s = e.scores || {};
    return Object.values(s).reduce((acc, v) => acc + (num(v) || 0), 0);
  }

  function winnerEntry(b) {
    if (!b.winner) return null;
    const w = normChef(b.winner);
    return arr(b.entries).find((e) => normChef(e.chef) === w) || null;
  }

  // ---------- data loading ----------
  async function load() {
    try {
      const res = await fetch(DATA_URL + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const text = await res.text();
      const json = JSON.parse(text); // a half-written file throws here; we keep the last good copy
      setLive(true);
      if (text === state.lastText) return;
      state.lastText = text;

      const battles = normalize(json);
      const latest = battles[battles.length - 1];
      const latestKey = latest && latest.winner ? latest.id + '|' + normChef(latest.winner) : (latest ? latest.id + '|' : '');
      const isNewWinner = state.loadedOnce && latest && latest.winner && latestKey !== state.lastLatestKey;

      state.battles = battles;
      state.lastLatestKey = latestKey;
      if (isNewWinner) {
        state.selectedId = null;
        if (location.hash) history.replaceState(null, '', location.pathname + location.search);
      }
      state.loadedOnce = true;
      render();
      if (isNewWinner) celebrate(latest);
    } catch (err) {
      setLive(false);
      if (!state.loadedOnce) render();
    }
  }

  function setLive(ok) {
    state.failed = !ok;
    const el = $('onair');
    el.classList.toggle('off', !ok);
    $('live-label').textContent = ok ? 'LIVE' : 'RECONNECTING';
  }

  // ---------- rendering ----------
  function render() {
    renderLeaderboard();
    const b = currentBattle();
    renderStage(b);
    renderRecipe(b);
    renderHistory(b);
  }

  function currentBattle() {
    const list = state.battles;
    if (!list.length) return null;
    if (state.selectedId !== null) {
      const found = list.find((b) => b.id === state.selectedId);
      if (found) return found;
    }
    return list[list.length - 1];
  }

  function renderLeaderboard() {
    const wins = {};
    ORDER.forEach((k) => (wins[k] = 0));
    state.battles.forEach((b) => {
      if (!b.winner) return;
      const k = normChef(b.winner);
      wins[k] = (wins[k] || 0) + 1;
    });
    const keys = Object.keys(wins);
    const top = Math.max(0, ...keys.map((k) => wins[k]));
    const leaders = keys.filter((k) => wins[k] === top && top > 0);
    const fought = state.battles.length;

    $('leaderboard').innerHTML = `
      <div class="lb-head">
        <h2>Leaderboard</h2>
        <span class="lb-count">${fought} ${fought === 1 ? 'battle' : 'battles'} fought</span>
      </div>
      <div class="lb-grid">
        ${keys.map((k) => {
          const c = chef(k);
          const lead = leaders.includes(k);
          return `
          <div class="lb-tile ${c.cls}${lead ? ' leading' : ''}">
            ${lead ? `<span class="lb-crown" title="${leaders.length > 1 ? 'Tied for the lead' : 'In the lead'}">👑</span>` : ''}
            <span class="lb-avatar">${c.emoji}</span>
            <div class="lb-info">
              <strong>${esc(c.full)}</strong>
              <small>${esc(c.motto)}</small>
            </div>
            <div class="lb-wins"><b>${wins[k]}</b><small>${wins[k] === 1 ? 'win' : 'wins'}</small></div>
          </div>`;
        }).join('')}
      </div>`;
  }

  function renderStage(b) {
    const stage = $('stage');
    if (!b) {
      const offline = state.failed && !state.lastText;
      stage.innerHTML = `
        <div class="empty">
          <div class="empty-fridge" aria-hidden="true"><span class="door"></span><span class="snow">❄️</span></div>
          <h2>The kitchen is quiet…</h2>
          <p>Tell the critic what's in your fridge.</p>
          <p class="empty-hint">${offline
            ? "Can't reach the scorecard yet. Serve this page from the fridge-wars folder."
            : 'This page is watching live. The first battle will appear here on its own.'}</p>
        </div>`;
      return;
    }

    const latest = state.battles[state.battles.length - 1];
    const isLatest = b.id === latest.id;
    const entries = arr(b.entries).slice().sort((x, y) => {
      const ix = ORDER.indexOf(normChef(x.chef)); const iy = ORDER.indexOf(normChef(y.chef));
      return (ix < 0 ? 99 : ix) - (iy < 0 ? 99 : iy);
    });
    const win = b.winner ? normChef(b.winner) : null;
    const maxTotal = Math.max(30, ...entries.map(entryTotal));

    stage.innerHTML = `
      <div class="battle-head">
        <div>
          <span class="eyebrow">${isLatest ? '<span class="pulse"></span> Latest battle' : '⏪ Rewind'}</span>
          <h2>Battle #${esc(b.id)}</h2>
          ${fmtDate(b.created_at) ? `<time>${esc(fmtDate(b.created_at))}</time>` : ''}
        </div>
        ${isLatest ? '' : '<button class="btn ghost" id="to-latest">Back to latest ⏩</button>'}
      </div>

      <div class="fridge">
        <span class="fridge-label">🧊 In the fridge</span>
        <ul class="tags">
          ${arr(b.ingredients).map((i) => `<li>${esc(i)}</li>`).join('') || '<li class="muted">mystery ingredients</li>'}
        </ul>
      </div>

      <div class="cards">
        ${entries.length ? entries.map((e) => card(e, win, maxTotal)).join('') : '<p class="muted center">The chefs are still sharpening their knives…</p>'}
      </div>

      ${b.verdict ? `
      <blockquote class="verdict">
        <span class="q" aria-hidden="true">“</span>
        <p>${esc(b.verdict)}</p>
        <cite>The Fridge Critic${win ? ` · crowns ${esc(chef(win).full)}` : ''}</cite>
      </blockquote>` : (win ? '' : '<p class="judging">⚖️ The critic is tasting…</p>')}
    `;
    const back = $('to-latest');
    if (back) back.addEventListener('click', () => openBattle(null));
  }

  function card(e, win, maxTotal) {
    const c = chef(e.chef);
    const isWin = win && normChef(e.chef) === win;
    const scores = e.scores || {};
    const keys = Object.keys(SCORE_LABELS).concat(Object.keys(scores).filter((k) => !SCORE_LABELS[k]));
    const total = entryTotal(e);
    const steps = arr(e.steps);
    const uses = arr(e.uses);
    const time = num(e.time_minutes);

    return `
      <article class="card ${c.cls}${isWin ? ' winner' : (win ? ' loser' : '')}">
        ${isWin ? '<div class="crown" aria-label="Winner">👑</div>' : ''}
        <header class="card-top">
          <span class="avatar">${c.emoji}</span>
          <div class="who"><h3>${esc(c.full)}</h3><small>${esc(c.motto)}</small></div>
          ${isWin ? '<span class="badge">Winner</span>' : ''}
        </header>
        <h4 class="dish">${esc(e.dish || 'Untitled dish')}</h4>
        ${e.tagline ? `<p class="tagline">${esc(e.tagline)}</p>` : ''}
        ${e.trash_talk ? `<p class="trash"><span aria-hidden="true">🗯️</span> ${esc(e.trash_talk)}</p>` : ''}
        <div class="scores">
          ${keys.filter((k) => scores[k] !== undefined).map((k) => {
            const v = num(scores[k]) || 0;
            const pct = Math.max(0, Math.min(100, v * 10));
            return `<div class="score">
              <span class="s-label">${esc(SCORE_LABELS[k] || k)}</span>
              <span class="s-bar"><i style="--v:${pct / 100}"></i></span>
              <span class="s-val">${esc(v)}</span>
            </div>`;
          }).join('')}
        </div>
        <div class="total">
          <span>Total</span>
          <strong>${esc(total)}</strong><small>/ ${esc(maxTotal)}</small>
        </div>
        ${e.critic_note ? `<p class="note"><b>Critic:</b> ${esc(e.critic_note)}</p>` : ''}
        ${steps.length || uses.length ? `
        <details class="method">
          <summary>The method${time !== null ? ` · ${esc(time)} min` : ''}</summary>
          ${uses.length ? `<ul class="uses">${uses.map((u) => `<li>${esc(u)}</li>`).join('')}</ul>` : ''}
          ${steps.length ? `<ol>${steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
        </details>` : ''}
      </article>`;
  }

  function renderRecipe(b) {
    const el = $('recipe');
    const we = b && winnerEntry(b);
    if (!b || !b.winner) { el.innerHTML = ''; return; }
    const rc = b.recipe_card || {};
    const c = chef(rc.chef || b.winner);
    const dish = rc.dish || (we && we.dish) || 'The Winning Dish';
    const serves = num(rc.serves);
    const time = num(rc.time_minutes) ?? (we ? num(we.time_minutes) : null);
    const ingredients = arr(rc.ingredients).length ? arr(rc.ingredients) : (we ? arr(we.uses) : []);
    const steps = arr(rc.steps).length ? arr(rc.steps) : (we ? arr(we.steps) : []);
    const tip = rc.tip || '';

    el.innerHTML = `
      <div class="recipe-title no-print">
        <h2>The winning recipe</h2>
        <button class="btn" id="print-btn">🖨️ Print / Save as PDF</button>
      </div>
      <article class="recipe-card ${c.cls}" id="recipe-card">
        <div class="rc-band"></div>
        <header class="rc-head">
          <span class="rc-kicker">Fridge Wars · Battle #${esc(b.id)} champion</span>
          <h2>${esc(dish)}</h2>
          <p class="rc-by">${c.emoji} by ${esc(c.full)}</p>
        </header>
        <div class="rc-meta">
          ${serves !== null ? `<div><span>🍽️</span><b>${esc(serves)}</b><small>serves</small></div>` : ''}
          ${time !== null ? `<div><span>⏱️</span><b>${esc(time)}</b><small>minutes</small></div>` : ''}
          ${ingredients.length ? `<div><span>🧺</span><b>${ingredients.length}</b><small>ingredients</small></div>` : ''}
        </div>
        <div class="rc-body">
          <div class="rc-ing">
            <h3>Ingredients</h3>
            <ul>${ingredients.map((i) => `<li>${esc(i)}</li>`).join('') || '<li>Whatever was in the fridge</li>'}</ul>
          </div>
          <div class="rc-steps">
            <h3>Method</h3>
            <ol>${steps.map((s) => `<li>${esc(s)}</li>`).join('') || '<li>Cook with love.</li>'}</ol>
          </div>
        </div>
        ${tip ? `<aside class="rc-tip"><b>${esc(c.name)}'s tip</b><p>${esc(tip)}</p></aside>` : ''}
        <footer class="rc-foot">FRIDGE WARS · judged by the Fridge Critic${b.created_at && fmtDate(b.created_at) ? ' · ' + esc(fmtDate(b.created_at)) : ''}</footer>
      </article>`;
    $('print-btn').addEventListener('click', () => window.print());
  }

  function renderHistory(current) {
    const el = $('history');
    const others = state.battles.filter((b) => !current || b.id !== current.id).reverse();
    if (!state.battles.length) { el.innerHTML = ''; return; }
    el.innerHTML = `
      <h2>Earlier battles</h2>
      ${others.length ? `<ul class="h-list">
        ${others.map((b) => {
          const w = b.winner ? chef(b.winner) : null;
          const we = winnerEntry(b);
          const ing = arr(b.ingredients);
          return `<li>
            <button class="h-item ${w ? w.cls : ''}" data-id="${esc(b.id)}">
              <span class="h-num">#${esc(b.id)}</span>
              <span class="h-main">
                <b>${esc(we && we.dish ? we.dish : (w ? w.full + ' wins' : 'Undecided'))}</b>
                <small>${esc(ing.slice(0, 5).join(' · '))}${ing.length > 5 ? ' …' : ''}</small>
              </span>
              <span class="h-win">${w ? `${w.emoji} ${esc(w.name)}` : '⚖️'}<small>${esc(fmtDate(b.created_at))}</small></span>
            </button>
          </li>`;
        }).join('')}
      </ul>` : '<p class="muted">No earlier battles yet. This is the first one.</p>'}`;
    el.querySelectorAll('.h-item').forEach((btn) =>
      btn.addEventListener('click', () => openBattle(Number(btn.dataset.id))));
  }

  function openBattle(id) {
    const latest = state.battles[state.battles.length - 1];
    state.selectedId = latest && id === latest.id ? null : id;
    const url = location.pathname + location.search + (state.selectedId !== null ? '#battle-' + state.selectedId : '');
    history.pushState(null, '', url);
    render();
    $('stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  window.addEventListener('popstate', () => { state.selectedId = readHash(); render(); });

  // ---------- celebration ----------
  function celebrate(b) {
    const c = chef(b.winner);
    const we = winnerEntry(b);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const banner = $('banner');
    banner.className = 'banner show ' + c.cls;
    banner.innerHTML = `<span class="b-kicker">Battle #${esc(b.id)} · New champion</span>
      <span class="b-name">${c.emoji} ${esc(c.full)}</span>
      ${we && we.dish ? `<span class="b-dish">${esc(we.dish)}</span>` : ''}`;
    clearTimeout(celebrate.t);
    celebrate.t = setTimeout(() => { banner.className = 'banner ' + c.cls; }, 4200);

    if (reduce) return;
    const fx = $('fx');
    const colors = c.colors.concat(['#ffd56b']);
    const bits = ['🎉', '✨', c.emoji, '👑'];
    const n = window.innerWidth < 600 ? 70 : 140;
    for (let i = 0; i < n; i++) {
      const p = document.createElement('i');
      const emoji = Math.random() < 0.12;
      p.className = 'confetti' + (emoji ? ' emoji' : '');
      if (emoji) p.textContent = bits[Math.floor(Math.random() * bits.length)];
      p.style.left = Math.random() * 100 + 'vw';
      p.style.background = emoji ? 'none' : colors[i % colors.length];
      p.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px');
      p.style.setProperty('--rot', (Math.random() * 900 - 450) + 'deg');
      p.style.animationDuration = (2.4 + Math.random() * 2) + 's';
      p.style.animationDelay = (Math.random() * 0.6) + 's';
      fx.appendChild(p);
    }
    setTimeout(() => { fx.innerHTML = ''; }, 5500);
  }

  // ---------- go ----------
  load();
  setInterval(load, POLL_MS);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) load(); });
})();
