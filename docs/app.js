/* app.js — static PWA entry. Everything runs in the browser:
   jobs are fetched live from Arbeitnow (CORS-open), CVs parsed locally
   (pdf.js / mammoth), scored by matcher.js, stored in localStorage. */
(function () {
  'use strict';

  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  const { extractSkills, refreshIdf, computeMatch, parseSalary, detectLanguageRequirements, detectVisa, detectRelocation, detectExperienceLevel, htmlToText } = window.JA;

  /* ================= state ================= */
  const LS_KEY = 'jobapply_state_v1';
  const state = {
    cvs: [],            /* {id, filename, uploaded_at, text, contact_info, skills, education, experience} */
    activeCvId: null,
    jobs: [],           /* normalized postings */
    lastSync: null,
    applications: [],   /* {id, job_url, title, company, location, status, applied_at, notes} */
    settings: { maxPerSource: 40 },
  };
  let nextCvId = 1, nextAppId = 1;

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        Object.assign(state, saved, { settings: Object.assign(state.settings, saved.settings) });
        nextCvId = Math.max(0, ...state.cvs.map(c => c.id)) + 1;
        nextAppId = Math.max(0, ...state.applications.map(a => a.id)) + 1;
      }
    } catch (e) { console.warn('state load failed', e); }
  }
  const saveTimer = { t: null };
  function save() {
    clearTimeout(saveTimer.t);
    saveTimer.t = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({
          cvs: state.cvs, activeCvId: state.activeCvId, jobs: state.jobs,
          lastSync: state.lastSync, applications: state.applications, settings: state.settings,
        }));
      } catch (e) { toast('Storage full — export a backup and clear old CVs', 'error'); }
    }, 250);
  }

  const activeCv = () => state.cvs.find(c => c.id === state.activeCvId) || null;

  /* ================= toasts / dialog ================= */
  function toast(msg, kind) {
    const host = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast' + (kind ? ' ' + kind : '');
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3800);
  }

  const confirmModal = $('#confirm-modal');
  let confirmResolve = null;
  function askConfirm(title, msg, okLabel) {
    if (!confirmModal) return Promise.resolve(window.confirm(msg));
    $('#confirm-title').textContent = title;
    $('#confirm-msg').textContent = msg;
    $('#confirm-ok').textContent = okLabel || 'Confirm';
    confirmModal.classList.add('open');
    confirmResolve = null;
    return new Promise(res => { confirmResolve = res; });
  }
  function settleConfirm(val) {
    if (confirmResolve) { confirmResolve(val); confirmResolve = null; }
    confirmModal.classList.remove('open');
  }
  $('#confirm-ok').addEventListener('click', () => settleConfirm(true));
  $$('[data-confirm-cancel]').forEach(el => el.addEventListener('click', () => settleConfirm(false)));

  /* ================= navigation ================= */
  function showSection(name) {
    $$('.section').forEach(s => s.classList.toggle('active', s.id === name));
    $$('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.section === name));
    $('#crumb-current').textContent = $('.nav-link[data-section="' + name + '"]')?.dataset.label || name;
    $('#sidebar').classList.remove('open');
    $('#scrim').hidden = true;
    if (location.hash !== '#' + name) history.replaceState(null, '', '#' + name);
    if (name === 'settings') renderSettings();
    if (name === 'applications') renderKanban();
  }
  $$('.nav-link').forEach(l => l.addEventListener('click', (e) => { e.preventDefault(); showSection(l.dataset.section); }));
  $('#nav-toggle')?.addEventListener('click', () => { $('#sidebar').classList.add('open'); $('#scrim').hidden = false; });
  $('#sidebar-close')?.addEventListener('click', showSectionHelper);
  $('#scrim')?.addEventListener('click', showSectionHelper);
  function showSectionHelper() { showSection($('.section.active')?.id || 'dashboard'); }
  $$('[data-goto]').forEach(b => b.addEventListener('click', () => showSection(b.dataset.goto)));
  $('#hero-jobs-btn')?.addEventListener('click', () => showSection('jobs'));

  /* ================= job ingestion (live) ================= */
  function normalizeArbeitnow(raw) {
    const desc = htmlToText(raw.description || '');
    const salary = parseSalary(raw.salary || null);
    return {
      id: 'an:' + (raw.url || raw.slug),
      url: raw.url,
      title: (raw.title || 'Untitled role').trim(),
      company: raw.company_name || raw.company || 'Unknown company',
      location: raw.location || 'Germany',
      country: 'Germany',
      remote: !!raw.remote,
      description: desc,
      requirements: null,
      skills: (raw.tags || []).join(', '),
      posted_date: raw.date_time || raw.pub_date || null,
      source: 'arbeitnow',
      salary_min: salary[0], salary_max: salary[1], currency: salary[2],
      language_requirements: detectLanguageRequirements(raw.title + ' ' + desc),
      experience_level: detectExperienceLevel(raw.title || '', desc),
      visa_sponsorship: detectVisa(desc),
      relocation_support: detectRelocation(desc),
    };
  }
  async function fetchArbeitnow(limit) {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', { headers: { 'Accept': 'application/json' } });
    if (!res.ok) throw new Error('Arbeitnow answered ' + res.status);
    const data = await res.json();
    const items = data.data || [];
    return items.slice(0, limit).map(normalizeArbeitnow);
  }

  async function syncJobs(opts) {
    const btn = $('#sync-btn'), sbtn = $('#settings-sync-btn');
    btn && (btn.disabled = true);
    sbtn && (sbtn.disabled = true);
    toast('Syncing live jobs…');
    try {
      const limit = (opts && opts.limit) || state.settings.maxPerSource;
      const fetched = await fetchArbeitnow(limit);
      /* dedupe by URL, newest first */
      const byId = new Map(state.jobs.map(j => [j.id, j]));
      let added = 0, updated = 0;
      for (const j of fetched) {
        if (!byId.has(j.id)) { added++; byId.set(j.id, j); }
        else {
          const old = byId.get(j.id);
          if (old.description !== j.description) { updated++; byId.set(j.id, j); }
        }
      }
      state.jobs = [...byId.values()];
      /* keep newest 400 postings so localStorage stays healthy */
      state.jobs.sort((a, b) => (b.posted_date || '').localeCompare(a.posted_date || ''));
      if (state.jobs.length > 400) state.jobs = state.jobs.slice(0, 400);
      state.lastSync = new Date().toISOString();
      refreshIdf(state.jobs);
      scoreAll();
      save();
      renderAll();
      toast(`Sync complete — ${added} new · ${updated} updated · ${state.jobs.length} total`);
    } catch (err) {
      console.error(err);
      toast('Sync failed: ' + err.message + ' — check your internet connection.', 'error');
    } finally {
      btn && (btn.disabled = false);
      sbtn && (sbtn.disabled = false);
    }
  }
  $('#sync-btn')?.addEventListener('click', () => syncJobs());
  $('#settings-sync-btn')?.addEventListener('click', () => syncJobs());

  /* ================= scoring ================= */
  function scoreJob(job) {
    const cv = activeCv();
    if (!cv) return { score: 0, explanation: 'Upload a CV to see your match score.', strengths: [], gaps: [] };
    return computeMatch(cv, job);
  }
  function scoreAll() { /* scoring is on-the-fly; IDF refreshed after sync */ }

  function jobScore(job) {
    const cv = activeCv();
    if (!cv) return null;
    job._match = job._match && job._cvId === cv.id ? job._match : null;
    if (!job._match) { job._match = computeMatch(cv, job); job._cvId = cv.id; }
    return job._match;
  }

  /* ================= rendering: dashboard ================= */
  function renderAll() {
    renderDashboard();
    renderJobs();
    renderKanban();
    renderProfile();
  }

  function fmtDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  function renderDashboard() {
    const cv = activeCv();
    $('#stat-cvs').textContent = state.cvs.length;
    $('#stat-jobs').textContent = state.jobs.length;
    $('#stat-apps').textContent = state.applications.length;
    $('#cvs-count').textContent = state.cvs.length;

    const scored = cv ? state.jobs.map(j => ({ j, m: jobScore(j) })) : [];
    const top = scored.length ? scored.reduce((a, b) => (b.m.score > a.m.score ? b : a)) : null;
    $('#stat-top').textContent = top ? Math.round(top.m.score * 100) + '%' : '—';
    $('#hero-ring-value').textContent = top ? Math.round(top.m.score * 100) + '%' : '—';
    $('#hero-ring-jobs').textContent = state.jobs.length || '—';
    $('#hero-ring-apps').textContent = state.applications.length || '—';

    /* CV list */
    const list = $('#cvs-list');
    list.innerHTML = '';
    if (!state.cvs.length) {
      list.innerHTML = '<div class="state-block"><p>No CVs yet — upload one to unlock match scores.</p></div>';
    }
    for (const cv of state.cvs) {
      const row = document.createElement('div');
      row.className = 'cv-row' + (cv.id === state.activeCvId ? ' active' : '');
      row.innerHTML = `
        <div class="cv-row-main">
          <strong>${escapeHtml(cv.filename)}</strong>
          <span>${(cv.skills || []).length} skills · ${fmtDate(cv.uploaded_at)}</span>
        </div>
        <div class="cv-row-actions">
          <button class="btn btn-ghost btn-sm" data-use="${cv.id}">${cv.id === state.activeCvId ? 'Active' : 'Use'}</button>
          <button class="icon-btn" data-del-cv="${cv.id}" aria-label="Delete CV">✕</button>
        </div>`;
      list.appendChild(row);
    }
    $$('[data-use]', list).forEach(b => b.addEventListener('click', () => {
      state.activeCvId = parseInt(b.dataset.use, 10);
      state.jobs.forEach(j => { j._match = null; });
      save(); renderAll();
      toast('CV activated — scores refreshed');
    }));
    $$('[data-del-cv]', list).forEach(b => b.addEventListener('click', async () => {
      const ok = await askConfirm('Delete this CV?', 'Its match scores will be removed too. Applications stay.', 'Delete CV');
      if (!ok) return;
      const id = parseInt(b.dataset.delCv, 10);
      state.cvs = state.cvs.filter(c => c.id !== id);
      if (state.activeCvId === id) state.activeCvId = state.cvs[0]?.id || null;
      save(); renderAll(); toast('CV deleted');
    }));

    /* top matches */
    const tm = $('#top-matches');
    tm.innerHTML = '';
    if (!cv) { tm.innerHTML = '<div class="state-block"><p>Upload a CV to see your top matches.</p></div>'; }
    else {
      scored.sort((a, b) => b.m.score - a.m.score);
      for (const { j, m } of scored.slice(0, 5)) {
        const el = document.createElement('button');
        el.className = 'match-row';
        el.innerHTML = `
          <div class="company-badge">${escapeHtml((j.company || '?')[0].toUpperCase())}</div>
          <div class="match-meta"><strong>${escapeHtml(j.title)}</strong><span>${escapeHtml(j.company)}</span></div>
          <span class="score-pill">${Math.round(m.score * 100)}%</span>`;
        el.addEventListener('click', () => openJobModal(j.id));
        tm.appendChild(el);
      }
    }

    /* sidebar chip */
    const chip = $('#active-cv-chip');
    chip.hidden = !cv;
    if (cv) $('#active-cv-name').textContent = cv.filename;
  }

  /* ================= rendering: jobs ================= */
  const jobsState = { q: '', sort: 'score_desc', filter: 'all' };

  function renderJobs() {
    const cv = activeCv();
    const listEl = $('#jobs-list');
    const q = jobsState.q.trim().toLowerCase();
    let items = state.jobs.filter(j => {
      if (q && !(j.title + ' ' + j.company + ' ' + (j.skills || '')).toLowerCase().includes(q)) return false;
      if (jobsState.filter === 'remote' && !j.remote) return false;
      if (jobsState.filter === 'visa' && !j.visa_sponsorship) return false;
      const s = cv ? Math.round(jobScore(j).score * 100) : 0;
      if (jobsState.filter === '80+' && s < 80) return false;
      if (jobsState.filter === '60+' && s < 60) return false;
      return true;
    });
    const scoreOf = (j) => cv ? jobScore(j).score : 0;
    if (jobsState.sort === 'score_desc') items.sort((a, b) => scoreOf(b) - scoreOf(a));
    else if (jobsState.sort === 'score_asc') items.sort((a, b) => scoreOf(a) - scoreOf(b));
    else if (jobsState.sort === 'date_desc') items.sort((a, b) => (b.posted_date || '').localeCompare(a.posted_date || ''));
    else items.sort((a, b) => (a.posted_date || '').localeCompare(b.posted_date || ''));

    $('#jobs-count').textContent = items.length;
    listEl.innerHTML = '';

    if (!state.jobs.length) {
      $('#jobs-empty').hidden = false;
      $('#jobs-empty').innerHTML = '<div class="state-ico" aria-hidden="true">🛰️</div><p>No jobs yet — hit <strong>Sync jobs</strong> to fetch live postings.</p>';
      return;
    }
    $('#jobs-empty').hidden = items.length > 0;
    if (!items.length && state.jobs.length) {
      $('#jobs-empty').innerHTML = '<div class="state-ico" aria-hidden="true">🗂️</div><p>No matching jobs. Try clearing the search or filters.</p>';
    }

    const frag = document.createDocumentFragment();
    for (const j of items.slice(0, 60)) {
      const m = cv ? jobScore(j) : null;
      const card = document.createElement('article');
      card.className = 'job-card';
      card.innerHTML = `
        <div class="jc-head">
          <div class="company-badge">${escapeHtml((j.company || '?')[0].toUpperCase())}</div>
          <div class="jc-title-wrap">
            <h3>${escapeHtml(j.title)}</h3>
            <p class="jc-company">${escapeHtml(j.company)} · ${escapeHtml(j.remote && /remote/i.test(j.location) ? 'Remote' : j.location)}</p>
          </div>
          ${cv ? `<span class="score-pill">${Math.round(m.score * 100)}%</span>` : ''}
        </div>
        <div class="jc-meta">
          ${j.source === 'arbeitnow' ? '<span class="jc-meta-tag">Arbeitnow</span>' : ''}
          ${j.remote ? '<span class="jc-meta-tag">Remote</span>' : ''}
          ${j.visa_sponsorship ? '<span class="jc-meta-tag">Visa</span>' : ''}
          ${j.experience_level ? '<span class="jc-meta-tag">' + escapeHtml(j.experience_level) + '</span>' : ''}
          ${j.posted_date ? '<span class="jc-meta-tag">' + fmtDate(j.posted_date) + '</span>' : ''}
        </div>`;
      card.addEventListener('click', () => openJobModal(j.id));
      frag.appendChild(card);
    }
    listEl.appendChild(frag);
  }

  /* search + filter wiring */
  let searchTimer;
  $('#job-search').addEventListener('input', (e) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { jobsState.q = e.target.value; renderJobs(); }, 300);
  });
  $('#job-sort').addEventListener('change', (e) => { jobsState.sort = e.target.value; renderJobs(); });
  $$('#job-filters .chip').forEach(ch => ch.addEventListener('click', () => {
    $$('#job-filters .chip').forEach(c => c.classList.remove('active'));
    ch.classList.add('active');
    jobsState.filter = ch.dataset.filter;
    renderJobs();
  }));

  /* ================= job modal ================= */
  let modalJobId = null;
  function openJobModal(jobId) {
    const j = state.jobs.find(x => x.id === jobId);
    if (!j) return;
    modalJobId = jobId;
    const m = activeCv() ? jobScore(j) : { score: 0, explanation: 'Upload a CV to get a personalized score.', strengths: [], gaps: [] };
    $('#jm-title').textContent = j.title;
    $('#jm-company').textContent = `${j.company} · ${j.remote && /remote/i.test(j.location) ? 'Remote' : j.location}`;
    $('#jm-badge').textContent = (j.company || '?')[0].toUpperCase();
    $('#jm-score').textContent = Math.round(m.score * 100) + '%';
    const meta = [];
    if (j.posted_date) meta.push(fmtDate(j.posted_date));
    if (j.salary_min) meta.push(`${j.currency === 'EUR' ? '€' : j.currency === 'GBP' ? '£' : '$'}${Math.round(j.salary_min / 1000)}k${j.salary_max ? '–' + Math.round(j.salary_max / 1000) + 'k' : ''}`);
    if (j.experience_level) meta.push(j.experience_level);
    if (j.language_requirements) meta.push(j.language_requirements);
    $('#jm-meta').innerHTML = meta.map(t => `<span class="jc-meta-tag">${escapeHtml(t)}</span>`).join('');
    $('#jm-strengths').innerHTML = m.strengths.length ? m.strengths.map(s => `<span class="jm-chip">${escapeHtml(s)}</span>`).join('') : '<span class="settings-note">No overlap detected.</span>';
    $('#jm-gaps').innerHTML = m.gaps.length ? m.gaps.map(s => `<span class="jm-chip">${escapeHtml(s)}</span>`).join('') : '<span class="settings-note">Nothing major missing.</span>';
    $('#jm-explanation').textContent = m.explanation;
    $('#jm-desc').textContent = (j.description || 'No description provided.').slice(0, 2500);
    const modal = $('#job-modal');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    const modal = $('#job-modal');
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modalJobId = null;
  }
  $$('[data-close-modal]').forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); settleConfirm(false); } });

  $('#jm-apply')?.addEventListener('click', () => {
    const j = state.jobs.find(x => x.id === modalJobId);
    if (!j) return;
    if (!activeCv()) { toast('Upload a CV first — then apply away.', 'error'); return; }
    if (state.applications.some(a => a.job_url === j.url)) { toast('Already in your applications'); closeModal(); return; }
    const app = {
      id: nextAppId++, job_url: j.url, title: j.title, company: j.company,
      location: j.location, status: 'applied', applied_at: new Date().toISOString(), notes: '',
    };
    state.applications.unshift(app);
    save(); renderKanban(); renderDashboard(); closeModal();
    toast('Application saved to your kanban 🎉');
    window.open(j.url, '_blank', 'noopener');
  });
  $('#jm-save')?.addEventListener('click', () => {
    const j = state.jobs.find(x => x.id === modalJobId);
    if (!j) return;
    if (state.applications.some(a => a.job_url === j.url)) { toast('Already saved'); closeModal(); return; }
    state.applications.unshift({
      id: nextAppId++, job_url: j.url, title: j.title, company: j.company,
      location: j.location, status: 'saved', applied_at: new Date().toISOString(), notes: '',
    });
    save(); renderKanban(); renderDashboard(); closeModal();
    toast('Job saved');
  });

  /* ================= kanban ================= */
  const STATUSES = ['applied', 'interview', 'offer', 'rejected'];
  function renderKanban() {
    for (const st of STATUSES) {
      const body = $(`[data-kbody="${st}"]`);
      if (!body) continue;
      const items = state.applications.filter(a => a.status === st);
      $('#k-' + st).textContent = items.length;
      body.innerHTML = '';
      for (const a of items) {
        const el = document.createElement('div');
        el.className = 'kcard';
        el.draggable = true;
        el.dataset.appId = a.id;
        el.innerHTML = `
          <strong>${escapeHtml(a.title)}</strong>
          <span class="kcard-co">${escapeHtml(a.company)}</span>
          <div class="kcard-foot">
            <span>${fmtDate(a.applied_at)}</span>
            <button class="icon-btn kcard-del" aria-label="Remove application">✕</button>
          </div>`;
        body.appendChild(el);
      }
    }
    $('#apps-count').textContent = state.applications.length;
    $('#applications-empty').hidden = state.applications.length > 0;

    /* drag & drop (bound once — dragstart/dragover/drop on the board) */
  }
  function bindKanbanDnd() {
    const board = $('#kanban');
    let dragId = null;
    board.addEventListener('dragstart', (e) => {
      const card = e.target.closest('.kcard');
      if (!card) return;
      dragId = parseInt(card.dataset.appId, 10);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    board.addEventListener('dragend', (e) => {
      e.target.closest('.kcard')?.classList.remove('dragging');
      $$('.kcol-body').forEach(b => b.classList.remove('drag-over'));
    });
    $$('.kcol-body').forEach(body => {
      body.addEventListener('dragover', (e) => { e.preventDefault(); body.classList.add('drag-over'); });
      body.addEventListener('dragleave', () => body.classList.remove('drag-over'));
      body.addEventListener('drop', (e) => {
        e.preventDefault();
        body.classList.remove('drag-over');
        if (dragId == null) return;
        const app = state.applications.find(a => a.id === dragId);
        const newStatus = body.dataset.kbody;
        if (app && app.status !== newStatus) {
          app.status = newStatus;
          save(); renderKanban();
          toast(`Moved to ${newStatus}`);
        }
        dragId = null;
      });
    });
    board.addEventListener('click', async (e) => {
      const del = e.target.closest('.kcard-del');
      if (!del) return;
      const id = parseInt(del.closest('.kcard').dataset.appId, 10);
      const ok = await askConfirm('Remove application?', 'It will be deleted from your board.', 'Remove');
      if (!ok) return;
      state.applications = state.applications.filter(a => a.id !== id);
      save(); renderKanban(); renderDashboard();
    });
  }

  /* ================= CV upload ================= */
  function bindUpload(zoneId, inputId) {
    const zone = $(zoneId);
    const input = $(inputId);
    if (!zone || !input) return;
    zone.addEventListener('click', () => input.click());
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('drag'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault(); zone.classList.remove('drag');
      if (e.dataTransfer.files.length) handleCvFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', () => { if (input.files.length) handleCvFile(input.files[0]); input.value = ''; });
  }
  async function handleCvFile(file) {
    const nameOk = /\.(pdf|docx)$/i.test(file.name);
    if (!nameOk) { toast('Only PDF and DOCX files are supported.', 'error'); return; }
    toast('Parsing ' + file.name + '…');
    try {
      const parsed = await window.JA.parseCvFile(file);
      if (!parsed.text || parsed.text.length < 40) throw new Error('Could not read text from this file (scanned image?)');
      const cv = {
        id: nextCvId++,
        filename: file.name,
        uploaded_at: new Date().toISOString(),
        text: parsed.text.slice(0, 60000),
        contact_info: parsed.contact_info,
        skills: parsed.skills,
        education: parsed.education,
        experience: parsed.experience,
      };
      state.cvs.unshift(cv);
      state.activeCvId = cv.id;   /* new CV becomes active immediately */
      state.jobs.forEach(j => { j._match = null; });
      save(); renderAll();
      toast(`CV parsed — ${(cv.skills || []).length} skills detected, ${state.jobs.length} jobs scored`);
    } catch (err) {
      console.error(err);
      toast('Parse failed: ' + err.message, 'error');
    }
  }
  $('#top-upload-btn')?.addEventListener('click', () => $('#cv-file').click());
  bindUpload('#upload-zone', '#cv-file');

  /* ================= profile ================= */
  function renderProfile() {
    const sel = $('#profile-cv-select');
    sel.innerHTML = state.cvs.map(c => `<option value="${c.id}" ${c.id === state.activeCvId ? 'selected' : ''}>${escapeHtml(c.filename)}</option>`).join('');
    const cv = activeCv();
    if (!cv) {
      $('#profile-summary').textContent = 'Upload a CV to build your career profile.';
      ['#pf-contact', '#pf-skills', '#pf-education', '#pf-experience', '#pf-readiness-body'].forEach(id => { const el = $(id); if (el) el.innerHTML = ''; });
      return;
    }
    $('#profile-summary').textContent = `Parsed from ${cv.filename}. Everything the matching engine knows about you lives here.`;
    $('#profile-file').textContent = '';
    const contact = cv.contact_info || {};
    const setBody = (sel, html) => { const el = document.querySelector(sel); if (el) el.innerHTML = html; };
    setBody('#pf-contact .pf-body', Object.entries(contact).map(([k, v]) => `<div class="kv"><span>${escapeHtml(k)}</span><strong>${escapeHtml(String(v))}</strong></div>`).join(''));
    setBody('#pf-skills .pf-body', (cv.skills || []).map(s => `<span class="jm-chip">${escapeHtml(s)}</span>`).join(''));
    setBody('#pf-education .pf-body', (cv.education || []).map(e => `<div class="kv"><span>${escapeHtml(e.degree || '')}</span><strong>${escapeHtml(e.institution || '')}</strong></div>`).join(''));
    setBody('#pf-experience .pf-body', (cv.experience || []).map(x => `<div class="kv"><span>${escapeHtml(x.title || '')}</span><strong>${escapeHtml(x.dates || '')}</strong></div>`).join(''));
    const ring = $('#profile-ring');
    const readiness = Math.min(100, (cv.skills || []).length * 5 + Object.keys(contact).length * 10);
    const circumference = 2 * Math.PI * 52;
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference * (1 - readiness / 100);
    $('#profile-ring-num').textContent = readiness;
  }
  $('#profile-cv-select')?.addEventListener('change', (e) => {
    state.activeCvId = parseInt(e.target.value, 10);
    state.jobs.forEach(j => { j._match = null; });
    save(); renderAll();
  });

  /* ================= settings ================= */
  function renderSettings() {
    const stats = $('#settings-stats');
    const jobsBySource = {};
    state.jobs.forEach(j => { jobsBySource[j.source] = (jobsBySource[j.source] || 0) + 1; });
    stats.innerHTML = [
      ['Jobs cached', state.jobs.length],
      ...Object.entries(jobsBySource).map(([s, n]) => ['· ' + s, n]),
      ['CVs', state.cvs.length],
      ['Applications', state.applications.length],
      ['Last sync', state.lastSync ? new Date(state.lastSync).toLocaleString() : 'never'],
    ].map(([k, v]) => `<div class="kv"><span>${escapeHtml(String(k))}</span><strong>${escapeHtml(String(v))}</strong></div>`).join('');
  }
  $('#reset-data-btn')?.addEventListener('click', async () => {
    const ok = await askConfirm('Delete everything?', 'All CVs, jobs, scores and applications in THIS browser will be permanently removed.', 'Yes, delete everything');
    if (!ok) return;
    localStorage.removeItem(LS_KEY);
    state.cvs = []; state.activeCvId = null; state.jobs = []; state.applications = []; state.lastSync = null;
    renderAll();
    toast('All data cleared');
  });

  /* export / import backup */
  $('#export-btn')?.addEventListener('click', () => {
    const blob = new Blob([localStorage.getItem(LS_KEY) || '{}'], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'jobapply-backup-' + new Date().toISOString().slice(0, 10) + '.json';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Backup downloaded');
  });
  $('#import-btn')?.addEventListener('click', () => $('#import-file').click());
  $('#import-file')?.addEventListener('change', (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        localStorage.setItem(LS_KEY, JSON.stringify(data));
        load();
        refreshIdf(state.jobs);
        renderAll();
        toast('Backup imported');
      } catch (err) { toast('Invalid backup file', 'error'); }
    };
    reader.readAsText(f);
    e.target.value = '';
  });

  /* ================= misc ================= */
  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  window.addEventListener('online', () => { $('#offline-banner').hidden = true; });
  window.addEventListener('offline', () => { $('#offline-banner').hidden = false; });
  $('#offline-banner').hidden = navigator.onLine;

  /* PWA install */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const b = $('#install-btn');
    if (b) b.hidden = false;
  });
  $('#install-btn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    $('#install-btn').hidden = true;
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  /* ================= boot ================= */
  function boot() {
    load();
    refreshIdf(state.jobs);
    bindKanbanDnd();
    renderAll();
    const hash = (location.hash || '').replace('#', '');
    const fromQuery = new URLSearchParams(location.search).get('section');
    const initial = fromQuery || (hash && ['dashboard', 'profile', 'jobs', 'applications', 'settings'].includes(hash) ? hash : 'dashboard');
    showSection(initial);
    if (!state.jobs.length && navigator.onLine) syncJobs({ limit: 40 });
  }
  boot();
})();
