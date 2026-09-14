/* JobApply AI — dashboard logic */
document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    /* ---------- helpers ---------- */
    const $ = (sel, root = document) => (root || document).querySelector(sel);
    const $$ = (sel, root = document) => Array.from((root || document).querySelectorAll(sel));

    const esc = (s) => String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

    const fmtDate = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const fmtDateTime = (iso) => {
        if (!iso) return '—';
        const d = new Date(iso);
        if (Number.isNaN(d.getTime())) return '—';
        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ' +
            d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    };

    const extOf = (name) => {
        const parts = String(name || '').split('.');
        return parts.length > 1 ? parts.pop().slice(0, 4).toUpperCase() : 'DOC';
    };

    const initials = (name) => {
        const words = String(name || '?').trim().split(/\s+/).filter(Boolean);
        if (!words.length) return '?';
        if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
        return (words[0][0] + words[1][0]).toUpperCase();
    };

    const scoreTone = (s) => (s >= 80 ? 'good' : s >= 50 ? 'mid' : 'low');

    const debounce = (fn, ms) => {
        let t;
        return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
    };

    async function api(path, opts) {
        const resp = await fetch(path, opts);
        let body = null;
        try { body = await resp.json(); } catch (e) { /* empty body */ }
        if (!resp.ok) {
            const msg = (body && (body.detail || body.message)) || ('Request failed (' + resp.status + ')');
            const err = new Error(msg);
            err.status = resp.status;
            throw err;
        }
        return body;
    }

    function setText(sel, v) {
        const el = $(sel);
        if (el) el.textContent = v;
    }

    /* ---------- toasts ---------- */
    const toastsEl = $('#toasts');

    function toast(msg, type, ms) {
        type = type || 'info';
        ms = ms || 3800;
        if (!toastsEl) return;
        const el = document.createElement('div');
        el.className = 'toast ' + type;
        const ico = type === 'success' ? '✓' : (type === 'error' ? '!' : 'i');
        el.innerHTML = '<span class="toast-ico">' + ico + '</span>' +
            '<div class="toast-msg">' + esc(msg) + '</div>';
        toastsEl.appendChild(el);
        setTimeout(() => {
            el.classList.add('out');
            setTimeout(() => el.remove(), 260);
        }, ms);
    }

    /* ---------- state ---------- */
    const state = {
        cvs: [],
        applications: [],
        recs: [],
        activeCvId: null,
        profileCvId: null,
        jobsLoaded: false,
        filter: 'all',
        search: '',
        sort: 'score_desc',
    };

    /* ---------- navigation ---------- */
    const sidebar = $('#sidebar');
    const scrim = $('#scrim');
    const navToggle = $('#nav-toggle');
    const sidebarClose = $('#sidebar-close');
    const navLinks = $$('.nav-link');
    const crumbCurrent = $('#crumb-current');

    function mobileNavOpen() { return !!(sidebar && sidebar.classList.contains('open')); }

    function openMobileNav() {
        if (!sidebar) return;
        sidebar.classList.add('open');
        if (scrim) {
            scrim.hidden = false;
            requestAnimationFrame(() => scrim.classList.add('show'));
        }
        if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
    }

    function closeMobileNav() {
        if (!sidebar) return;
        sidebar.classList.remove('open');
        if (scrim) {
            scrim.classList.remove('show');
            setTimeout(() => { scrim.hidden = true; }, 260);
        }
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    }

    function setSection(name) {
        $$('.section').forEach((s) => s.classList.toggle('active', s.id === name));
        navLinks.forEach((l) => l.classList.toggle('active', l.dataset.section === name));
        const link = navLinks.find((l) => l.dataset.section === name);
        if (link && crumbCurrent) crumbCurrent.textContent = link.dataset.label || name;
        if (mobileNavOpen()) closeMobileNav();
        if (name === 'applications') loadApplications();
        if (name === 'jobs') loadJobs(false);
        if (name === 'profile') renderProfile();
        if (name === 'settings') loadSettings();
    }

    if (navToggle) {
        navToggle.addEventListener('click', () => (mobileNavOpen() ? closeMobileNav() : openMobileNav()));
    }
    if (sidebarClose) sidebarClose.addEventListener('click', closeMobileNav);
    if (scrim) scrim.addEventListener('click', closeMobileNav);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMobileNav();
            settleConfirm(false);
            closeModal();
        }
    });

    navLinks.forEach((link) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            setSection(link.dataset.section);
        });
    });

    $$('[data-goto]').forEach((btn) => {
        btn.addEventListener('click', () => setSection(btn.dataset.goto));
    });

    /* ---------- refresh ---------- */
    const refreshBtn = $('#refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            refreshBtn.style.transition = 'transform 0.8s linear';
            refreshBtn.style.transform = 'rotate(360deg)';
            setTimeout(() => { refreshBtn.style.transition = ''; refreshBtn.style.transform = ''; }, 850);
            try {
                state.jobsLoaded = false;
                await loadCVs();
                await loadApplications();
                await loadJobs(true);
                toast('All data refreshed', 'success');
            } catch (err) {
                toast(err.message || 'Refresh failed — check the server', 'error');
            }
        });
    }

    /* ---------- CV upload (click + drag & drop) ---------- */
    const uploadZone = $('#upload-zone');
    const cvFileInput = $('#cv-file');

    ['#top-upload-btn', '#hero-upload-btn'].forEach((sel) => {
        const btn = $(sel);
        if (btn && cvFileInput) btn.addEventListener('click', () => cvFileInput.click());
    });

    if (uploadZone && cvFileInput) {
        uploadZone.addEventListener('click', () => cvFileInput.click());
        uploadZone.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                cvFileInput.click();
            }
        });
        ['dragenter', 'dragover'].forEach((ev) => uploadZone.addEventListener(ev, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.add('dragging');
        }));
        ['dragleave', 'drop'].forEach((ev) => uploadZone.addEventListener(ev, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.classList.remove('dragging');
            if (ev === 'drop' && e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleUploadFile(e.dataTransfer.files[0]);
            }
        }));
    }

    if (cvFileInput) {
        cvFileInput.addEventListener('change', () => {
            if (cvFileInput.files && cvFileInput.files[0]) handleUploadFile(cvFileInput.files[0]);
            cvFileInput.value = '';
        });
    }

    async function handleUploadFile(file) {
        const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
        if (ext !== '.pdf' && ext !== '.docx') {
            toast('Only PDF and DOCX files are supported', 'error');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast('File too large (max 10 MB)', 'error');
            return;
        }
        const fd = new FormData();
        fd.append('file', file);
        if (uploadZone) uploadZone.classList.add('uploading');
        try {
            const data = await api('/upload-cv', { method: 'POST', body: fd });
            if (data.parsed) {
                toast(file.name + ' parsed — profile & matches updated', 'success');
            } else {
                toast(file.name + ' uploaded, but auto-parsing failed', 'info');
            }
            // Make the freshly uploaded CV the active one so the dashboard
            // rings and job scores reflect it immediately.
            if (data.cv_id) state.activeCvId = data.cv_id;
            await loadCVs();
            state.jobsLoaded = false;
            await loadJobs(true);
        } catch (err) {
            toast(err.message || 'Upload failed', 'error');
        } finally {
            if (uploadZone) uploadZone.classList.remove('uploading');
        }
    }

    /* ---------- CVs ---------- */
    async function loadCVs() {
        try {
            const data = await api('/cvs/');
            state.cvs = data.data || [];
            const parsed = state.cvs.filter((c) => c.status === 'parsed');
            const preferred = parsed.length ? parsed[parsed.length - 1] : state.cvs[state.cvs.length - 1];
            if (state.activeCvId == null || !state.cvs.some((c) => c.id === state.activeCvId)) {
                state.activeCvId = preferred ? preferred.id : null;
            }
            renderCVs();
            renderTopMatches();
            updateStatsAndHero();
            renderProfile();
        } catch (err) {
            console.error(err);
            const list = $('#cvs-list');
            if (list) {
                list.innerHTML = '<div class="state-block error">Error loading CVs: ' + esc(err.message) + '</div>';
            }
        }
    }

    function renderCVs() {
        const list = $('#cvs-list');
        const count = $('#cvs-count');
        if (count) count.textContent = state.cvs.length;
        if (!list) return;

        if (!state.cvs.length) {
            list.innerHTML = '<div class="state-block"><div class="state-ico">📄</div>' +
                '<p>No CVs yet — drop your first CV in the upload zone above.</p></div>';
            return;
        }

        const sorted = state.cvs.slice().sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));
        list.innerHTML = sorted.map((cv) => {
            const active = cv.id === state.activeCvId ? ' active' : '';
            const status = cv.status === 'parsed' ? 'parsed' : 'uploaded';
            return '<div class="cv-item' + active + '" data-cv-id="' + cv.id + '">' +
                '<div class="cv-doc">' + esc(extOf(cv.filename)) + '</div>' +
                '<div class="cv-item-meta">' +
                    '<div class="cv-name" title="' + esc(cv.filename) + '">' + esc(cv.filename) + '</div>' +
                    '<div class="cv-sub">' + esc(fmtDateTime(cv.upload_date)) + '</div>' +
                '</div>' +
                '<span class="cv-status ' + status + '">' + status + '</span>' +
                '<div class="cv-actions">' +
                    '<button class="icon-btn small use-cv" title="Use this CV for matching" aria-label="Use this CV for matching">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>' +
                    '</button>' +
                    '<button class="icon-btn small danger del-cv" title="Delete CV" aria-label="Delete CV">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>' +
                    '</button>' +
                '</div>' +
            '</div>';
        }).join('');

        $$('.use-cv', list).forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = e.currentTarget.closest('.cv-item');
                state.activeCvId = Number(item.dataset.cvId);
                state.jobsLoaded = false;
                renderCVs();
                renderTopMatches();
                updateStatsAndHero();
                renderProfile();
                loadJobs(true);
                toast('Active CV switched — matches recalculated', 'success');
            });
        });

        $$('.del-cv', list).forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const item = e.currentTarget.closest('.cv-item');
                deleteCv(Number(item.dataset.cvId));
            });
        });
    }

    async function deleteCv(id) {
        if (!(await askConfirm('Delete this CV?', 'Its applications will remain, but the CV and its parsed data will be removed.', 'Delete CV'))) return;
        try {
            await api('/cvs/' + id, { method: 'DELETE' });
            if (state.activeCvId === id) state.activeCvId = null;
            toast('CV deleted', 'success');
            state.jobsLoaded = false;
            await loadCVs();
            await loadJobs(true);
            if ($('#applications').classList.contains('active')) loadApplications();
        } catch (err) {
            toast(err.message || 'Could not delete CV', 'error');
        }
    }

    /* ---------- stats + hero rings ---------- */
    function updateStatsAndHero() {
        setText('#stat-cvs', state.cvs.length);
        setText('#stat-jobs', state.recs.length || '—');
        setText('#stat-top', state.recs.length ? state.recs[0].match.score + '%' : '—');
        setText('#stat-apps', state.applications.length);
        setText('#cvs-count', state.cvs.length);

        const topScore = state.recs.length ? state.recs[0].match.score : 0;
        setRing('#hero-ring-value', topScore);
        setRing('#hero-ring-jobs', state.recs.length ? 100 : 0);
        setRing('#hero-ring-apps', state.recs.length ? Math.min(100, (state.applications.length / state.recs.length) * 100) : 0);
        setText('#hero-ring-jobs', state.recs.length || '—');
        setText('#hero-ring-apps', state.applications.length);

        const chip = $('#active-cv-chip');
        const chipName = $('#active-cv-name');
        const activeCv = state.cvs.find((c) => c.id === state.activeCvId);
        if (chip && chipName) {
            if (activeCv) {
                chip.hidden = false;
                chipName.textContent = activeCv.filename;
            } else {
                chip.hidden = false;
                chipName.textContent = state.cvs.length ? 'No parsed CV yet' : 'Upload a CV to start';
            }
        }
    }

    function setRing(sel, pct) {
        const el = $(sel);
        if (!el) return;
        const ring = el.closest('.ring');
        if (ring) ring.style.setProperty('--p', Math.max(0, Math.min(100, Math.round(pct))));
        el.textContent = pct > 0 ? Math.round(pct) + '%' : '—';
    }

    /* ---------- top matches (dashboard) ---------- */
    function renderTopMatches() {
        const wrap = $('#top-matches');
        if (!wrap) return;

        if (!state.recs.length) {
            wrap.innerHTML = '<div class="state-block"><div class="state-ico">✨</div>' +
                '<p>No parsed CV yet — upload one to unlock AI matching.</p></div>';
            return;
        }

        wrap.innerHTML = state.recs.slice(0, 6).map((rec, i) => {
            const tone = scoreTone(rec.match.score);
            return '<button class="match-row" data-job-id="' + rec.job.id + '">' +
                '<span class="mr-rank">#' + (i + 1) + '</span>' +
                '<span class="mr-score ' + tone + '">' + rec.match.score + '%</span>' +
                '<span class="mr-body">' +
                    '<span class="mr-title">' + esc(rec.job.title) + '</span>' +
                    '<span class="mr-sub">' + esc(rec.job.company || '—') + ' · ' + esc(rec.job.location || '—') + '</span>' +
                '</span>' +
                '<svg class="mr-arrow" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
            '</button>';
        }).join('');

        $$('.match-row', wrap).forEach((btn) => {
            btn.addEventListener('click', () => openJobModal(Number(btn.dataset.jobId)));
        });
    }

    /* ---------- career profile ---------- */
    const profileCvSelect = $('#profile-cv-select');
    if (profileCvSelect) {
        profileCvSelect.addEventListener('change', () => {
            state.profileCvId = Number(profileCvSelect.value) || null;
            renderProfile();
        });
    }

    function renderProfile() {
        const select = profileCvSelect;
        if (select) {
            const wanted = state.profileCvId || state.activeCvId;
            select.innerHTML = state.cvs.map((c) =>
                '<option value="' + c.id + '"' + (c.id === wanted ? ' selected' : '') + '>' +
                esc(c.filename) + '</option>'
            ).join('');
        }
        const cvId = state.profileCvId || state.activeCvId;
        const cvMeta = state.cvs.find((c) => c.id === cvId);

        const summary = $('#profile-summary');
        const fileTag = $('#profile-file');
        if (fileTag) {
            fileTag.innerHTML = cvMeta
                ? '<span>Source: ' + esc(cvMeta.filename) + '</span>'
                : '<span>No CV selected</span>';
        }
        if (summary) {
            summary.textContent = cvMeta
                ? 'Parsed from your CV. Everything the matching engine knows about you lives here.'
                : 'Upload a CV to build your career profile — the parser extracts contact info, skills, education and experience.';
        }

        const ring = $('#profile-ring');
        if (ring) {
            const readiness = cvMeta && cvMeta.status === 'parsed'
                ? computeReadiness()
                : 0;
            const C = 2 * Math.PI * 52;
            ring.style.strokeDashoffset = String(C * (1 - readiness / 100));
            ring.style.stroke = readiness >= 70 ? '#7c9070' : (readiness >= 40 ? '#b08a3e' : '#bd6b52');
            setText('#profile-ring-num', cvMeta ? readiness + '%' : '—');
        }

        renderContact(cvId);
        renderSkills(cvId);
        renderEducation(cvId);
        renderExperience(cvId);
        renderReadiness();
    }

    let fullCvCache = {};
    async function fetchCvDetail(cvId) {
        if (!cvId) return null;
        if (fullCvCache[cvId]) return fullCvCache[cvId];
        try {
            const data = await api('/cvs/' + cvId);
            fullCvCache[cvId] = data.data || null;
            return fullCvCache[cvId];
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    function computeReadiness() {
        let score = 0;
        if ($('#pf-contact .contact-row')) score += 20;
        const skillCount = $$('#pf-skills .skill-tag').length;
        if (skillCount >= 8) score += 30;
        else if (skillCount >= 4) score += 20;
        else if (skillCount >= 1) score += 10;
        if ($$('#pf-education .edu-item').length) score += 25;
        if ($$('#pf-experience .exp-item').length) score += 25;
        return score;
    }

    async function renderContact(cvId) {
        const body = $('#pf-contact .pf-body');
        if (!body) return;
        body.classList.add('is-empty');
        body.textContent = 'Loading…';
        const cv = await fetchCvDetail(cvId);
        const c = cv && cv.contact_info;
        if (!c || (!c.email && !c.phone && !c.location && !c.name)) {
            body.textContent = 'No contact details parsed.';
            return;
        }
        body.classList.remove('is-empty');
        const row = (label, value, ico) =>
            '<div class="contact-row"><span class="contact-ico">' + ico + '</span>' +
            '<span class="contact-text">' + esc(value) + '</span></div>';
        let html = '';
        if (c.name) html += row('Name', c.name, '👤');
        if (c.email) html += row('Email', c.email, '✉');
        if (c.phone) html += row('Phone', c.phone, '☎');
        if (c.location) html += row('Location', c.location, '📍');
        body.innerHTML = html || 'No contact details parsed.';
    }

    async function renderSkills(cvId) {
        const body = $('#pf-skills .pf-body');
        if (!body) return;
        body.classList.add('is-empty');
        body.textContent = 'Loading…';
        const cv = await fetchCvDetail(cvId);
        const skills = (cv && Array.isArray(cv.skills)) ? cv.skills : [];
        if (!skills.length) {
            body.textContent = 'No skills parsed yet.';
            return;
        }
        body.classList.remove('is-empty');
        const shown = skills.slice(0, 24);
        body.innerHTML = '<div class="tags-wrap">' +
            shown.map((s) => '<span class="skill-tag">' + esc(s) + '</span>').join('') +
            (skills.length > shown.length
                ? '<span class="skill-more">+' + (skills.length - shown.length) + ' more</span>'
                : '') +
            '</div>';
    }

    async function renderEducation(cvId) {
        const body = $('#pf-education .pf-body');
        if (!body) return;
        body.classList.add('is-empty');
        body.textContent = 'Loading…';
        const cv = await fetchCvDetail(cvId);
        const edu = (cv && Array.isArray(cv.education)) ? cv.education : [];
        if (!edu.length) {
            body.textContent = 'No education entries parsed.';
            return;
        }
        body.classList.remove('is-empty');
        body.innerHTML = edu.map((e) => {
            const degree = e.degree || 'Degree';
            const inst = [e.institution, e.year].filter(Boolean).join(' · ');
            return '<div class="edu-item"><div class="edu-degree">' + esc(degree) + '</div>' +
                (inst ? '<div class="edu-inst">' + esc(inst) + '</div>' : '') + '</div>';
        }).join('');
    }

    async function renderExperience(cvId) {
        const body = $('#pf-experience .pf-body');
        if (!body) return;
        body.classList.add('is-empty');
        body.textContent = 'Loading…';
        const cv = await fetchCvDetail(cvId);
        const exp = (cv && Array.isArray(cv.experience)) ? cv.experience : [];
        if (!exp.length) {
            body.textContent = 'No experience entries parsed.';
            return;
        }
        body.classList.remove('is-empty');
        body.innerHTML = exp.map((e) => {
            const dates = e.start_date
                ? (e.start_date + ' – ' + (e.end_date || 'Present'))
                : '';
            return '<div class="exp-item">' +
                '<div class="exp-head">' +
                    '<span class="exp-title">' + esc(e.title || 'Role') + '</span>' +
                    (dates ? '<span class="exp-dates">' + esc(dates) + '</span>' : '') +
                '</div>' +
                (e.company ? '<div class="exp-company">' + esc(e.company) + '</div>' : '') +
                (e.description ? '<div class="exp-desc">' + esc(e.description) + '</div>' : '') +
            '</div>';
        }).join('');
    }

    function renderReadiness() {
        const body = $('#pf-readiness-body');
        const tips = $('#pf-tips');
        if (!body || !tips) return;
        const hasContact = !!$('#pf-contact .contact-row');
        const skillCount = $$('#pf-skills .skill-tag').length;
        const hasEdu = $$('#pf-education .edu-item').length > 0;
        const hasExp = $$('#pf-experience .exp-item').length > 0;

        const items = [
            { ok: hasContact, text: 'Contact details detected' },
            { ok: skillCount >= 4, text: 'Skills extracted (' + skillCount + ' found)' },
            { ok: hasEdu, text: 'Education history detected' },
            { ok: hasExp, text: 'Work experience detected' },
        ];
        tips.innerHTML = items.map((it) =>
            '<li class="tip ' + (it.ok ? 'good' : 'warn') + '">' +
            '<span class="tip-ico">' + (it.ok ? '✓' : '!') + '</span>' +
            '<span>' + esc(it.text) + '</span></li>'
        ).join('');
        body.textContent = hasContact && skillCount && hasEdu && hasExp
            ? 'Your profile is complete — the matcher can score every job accurately.'
            : 'Upload a richer CV to improve match accuracy.';
    }

    /* ---------- jobs ---------- */
    const jobsList = $('#jobs-list');
    const jobsLoading = $('#jobs-loading');
    const jobsEmpty = $('#jobs-empty');
    const jobsError = $('#jobs-error');
    const jobSearch = $('#job-search');
    const jobSort = $('#job-sort');
    const chipRow = $('#job-filters');

    if (jobSearch) {
        jobSearch.addEventListener('input', debounce(() => {
            state.search = jobSearch.value.trim().toLowerCase();
            renderJobs();
        }, 160));
    }
    if (jobSort) {
        jobSort.addEventListener('change', () => {
            state.sort = jobSort.value;
            renderJobs();
        });
    }
    if (chipRow) {
        chipRow.addEventListener('click', (e) => {
            const chip = e.target.closest('.chip');
            if (!chip) return;
            $$('.chip', chipRow).forEach((c) => c.classList.remove('active'));
            chip.classList.add('active');
            state.filter = chip.dataset.filter;
            renderJobs();
        });
    }

    async function loadJobs(force) {
        if (!state.activeCvId) {
            state.recs = [];
            if (jobsEmpty) jobsEmpty.hidden = true;
            if (jobsError) jobsError.hidden = true;
            renderJobs();
            return;
        }
        if (state.jobsLoaded && !force) {
            renderJobs();
            return;
        }
        if (jobsLoading) jobsLoading.hidden = false;
        if (jobsError) jobsError.hidden = true;
        if (jobsEmpty) jobsEmpty.hidden = true;
        try {
            const data = await api('/matches/recommendations/' + state.activeCvId + '?limit=100&min_score=0');
            state.recs = (data.data || []).filter((r) => r && r.job);
            state.jobsLoaded = true;
            renderJobs();
            renderTopMatches();
            updateStatsAndHero();
        } catch (err) {
            console.error(err);
            state.recs = [];
            if (jobsError) {
                jobsError.textContent = err.message || 'Error loading recommendations.';
                jobsError.hidden = false;
            }
            renderJobs();
        } finally {
            if (jobsLoading) jobsLoading.hidden = true;
        }
    }

    function getFilteredRecs() {
        let list = state.recs.slice();
        if (state.search) {
            list = list.filter((r) => {
                const hay = [
                    r.job.title, r.job.company, r.job.location, r.job.skills,
                    (r.match.strengths || []).join(' '),
                ].join(' ').toLowerCase();
                return hay.indexOf(state.search) !== -1;
            });
        }
        if (state.filter === 'remote') list = list.filter((r) => r.job.remote);
        if (state.filter === 'visa') list = list.filter((r) => r.job.visa_sponsorship);
        if (state.filter === '80+') list = list.filter((r) => r.match.score >= 80);
        if (state.filter === '60+') list = list.filter((r) => r.match.score >= 60);
        if (state.sort === 'score_desc') list.sort((a, b) => b.match.score - a.match.score);
        if (state.sort === 'score_asc') list.sort((a, b) => a.match.score - b.match.score);
        if (state.sort === 'date_desc') list.sort((a, b) => new Date(b.job.posted_date || 0) - new Date(a.job.posted_date || 0));
        if (state.sort === 'date_asc') list.sort((a, b) => new Date(a.job.posted_date || 0) - new Date(b.job.posted_date || 0));
        return list;
    }

    function renderJobs() {
        if (!jobsList) return;
        if (!state.activeCvId) {
            setText('#jobs-count', 0);
            jobsList.innerHTML = '<div class="state-block" style="grid-column:1/-1">' +
                '<div class="state-ico">📤</div>' +
                '<p>Upload a CV first — then the engine scores every job for you.</p></div>';
            return;
        }
        const list = getFilteredRecs();
        setText('#jobs-count', list.length);
        if (!list.length) {
            if (jobsEmpty) jobsEmpty.hidden = false;
            jobsList.innerHTML = '';
            return;
        }
        if (jobsEmpty) jobsEmpty.hidden = true;

        jobsList.innerHTML = list.map((rec) => {
            const tone = scoreTone(rec.match.score);
            const skills = (rec.match.strengths || []).slice(0, 4);
            const meta = [];
            if (rec.job.location && rec.job.location !== 'Remote') meta.push(rec.job.location);
            if (rec.job.remote) meta.push('Remote');
            if (rec.job.visa_sponsorship) meta.push('Visa ✓');
            if (rec.job.source && rec.job.source !== 'manual') meta.push('⟳ ' + rec.job.source);
            if (rec.job.posted_date) meta.push(fmtDate(rec.job.posted_date));
            return '<article class="job-card" data-job-id="' + rec.job.id + '" tabindex="0" role="button" aria-label="Open details for ' + esc(rec.job.title) + '">' +
                '<div class="jc-head">' +
                    '<div class="company-badge sm">' + esc(initials(rec.job.company || rec.job.title)) + '</div>' +
                    '<div class="jc-title-wrap">' +
                        '<div class="jc-title">' + esc(rec.job.title) + '</div>' +
                        '<div class="jc-company">' + esc(rec.job.company || 'Unknown company') + '</div>' +
                    '</div>' +
                    '<span class="jc-badge ' + tone + '">' + rec.match.score + '%</span>' +
                '</div>' +
                '<div class="jc-progress"><i style="width:' + rec.match.score + '%"></i></div>' +
                '<div class="jc-skills">' +
                    (skills.length
                        ? skills.map((s) => '<span class="skill-mini">' + esc(s) + '</span>').join('')
                        : '<span class="skill-mini none">no direct skill hits</span>') +
                '</div>' +
                '<div class="jc-foot">' +
                    '<span class="jc-meta-tag">' + esc(meta.join(' · ')) + '</span>' +
                    '<span class="jc-link">Details</span>' +
                    '<button class="jc-apply" data-job-id="' + rec.job.id + '">Apply</button>' +
                '</div>' +
            '</article>';
        }).join('');

        $$('.job-card', jobsList).forEach((card) => {
            card.addEventListener('click', () => openJobModal(Number(card.dataset.jobId)));
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openJobModal(Number(card.dataset.jobId));
                }
            });
        });

        $$('.jc-apply', jobsList).forEach((btn) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                applyToJob(Number(btn.dataset.jobId));
            });
        });
    }

    /* ---------- job modal ---------- */
    const modal = $('#job-modal');
    let modalJobId = null;

    function openJobModal(jobId) {
        const rec = state.recs.find((r) => r.job.id === jobId);
        if (!rec || !modal) {
            toast('Job details unavailable', 'error');
            return;
        }
        modalJobId = jobId;

        setText('#jm-title', rec.job.title || 'Untitled role');
        setText('#jm-company', [rec.job.company, rec.job.location].filter(Boolean).join(' · ') || '—');
        setText('#jm-badge', initials(rec.job.company || rec.job.title));
        setText('#jm-score', rec.match.score + '%');
        const ringEl = $('#jm-score');
        if (ringEl) {
            const ring = ringEl.closest('.ring');
            if (ring) ring.style.setProperty('--p', rec.match.score);
        }

        const meta = [];
        if (rec.job.employment_type) meta.push(rec.job.employment_type);
        if (rec.job.experience_level) meta.push(rec.job.experience_level);
        if (rec.job.remote) meta.push('Remote');
        if (rec.job.visa_sponsorship) meta.push('Visa sponsorship');
        if (rec.job.relocation_support) meta.push('Relocation support');
        if (rec.job.salary) meta.push(rec.job.salary);
        if (rec.job.posted_date) meta.push('Posted ' + fmtDate(rec.job.posted_date));
        $('#jm-meta').innerHTML = meta.map((m) => '<span class="meta-tag">' + esc(m) + '</span>').join('');

        const strengths = rec.match.strengths || [];
        const gaps = rec.match.gaps || [];
        $('#jm-strengths').innerHTML = strengths.length
            ? strengths.map((s) => '<span class="skill-tag">' + esc(s) + '</span>').join('')
            : '<span class="none">No direct skill hits — check gaps & explanation</span>';
        $('#jm-gaps').innerHTML = gaps.length
            ? gaps.map((s) => '<span class="skill-tag">' + esc(s) + '</span>').join('')
            : '<span class="none">No gaps detected 🎉</span>';

        setText('#jm-explanation', rec.match.explanation || '—');
        const desc = rec.job.description || '';
        setText('#jm-desc', desc.length > 800 ? desc.slice(0, 800) + '…' : desc);
        $('#jm-desc').parentElement.hidden = !desc;

        modal.classList.add('open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        const focusTarget = $('#jm-apply');
        if (focusTarget) focusTarget.focus();
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        modalJobId = null;
    }

    if (modal) {
        $$('[data-close-modal]', modal).forEach((el) => el.addEventListener('click', closeModal));
    }

    /* ---------- in-app confirm dialog (replaces native confirm) ---------- */
    const confirmModal = $('#confirm-modal');
    let confirmResolve = null;

    function askConfirm(title, msg, okLabel) {
        return new Promise((resolve) => {
            if (!confirmModal) { resolve(window.confirm(msg)); return; }
            confirmResolve = resolve;
            const t = $('#confirm-title');
            const m = $('#confirm-msg');
            const ok = $('#confirm-ok');
            if (t) t.textContent = title || 'Are you sure?';
            if (m) m.textContent = msg || 'This action cannot be undone.';
            if (ok) ok.textContent = okLabel || 'Confirm';
            confirmModal.classList.add('open');
            confirmModal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden';
            if (ok) ok.focus();
        });
    }

    function settleConfirm(result) {
        if (!confirmModal || confirmResolve === null) return;
        const resolve = confirmResolve;
        confirmResolve = null;
        confirmModal.classList.remove('open');
        confirmModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        resolve(result);
    }

    if (confirmModal) {
        $$('[data-confirm-cancel]', confirmModal).forEach((el) => el.addEventListener('click', () => settleConfirm(false)));
        const okBtn = $('#confirm-ok');
        if (okBtn) okBtn.addEventListener('click', () => settleConfirm(true));
    }

    const jmSave = $('#jm-save');
    if (jmSave) {
        jmSave.addEventListener('click', () => {
            if (modalJobId == null) return;
            const rec = state.recs.find((r) => r.job.id === modalJobId);
            toast(rec ? 'Saved "' + rec.job.title + '" (local list)' : 'Job saved', 'success');
        });
    }

    const jmApply = $('#jm-apply');
    if (jmApply) {
        jmApply.addEventListener('click', () => {
            if (modalJobId != null) applyToJob(modalJobId);
        });
    }

    /* ---------- applications ---------- */
    function requireActiveCv() {
        const cv = state.cvs.find((c) => c.id === state.activeCvId);
        if (!cv) {
            toast('Upload (or select) a CV first', 'error');
            return null;
        }
        return cv;
    }

    function jobTitleOf(jobId) {
        const rec = state.recs.find((r) => r.job.id === jobId);
        return rec ? rec.job.title : 'the job';
    }

    async function applyToJob(jobId) {
        const cv = requireActiveCv();
        if (!cv) return;
        const alreadyApplied = state.applications.some(
            (a) => a.job_id === jobId && a.cv_id === cv.id
        );
        if (alreadyApplied) {
            toast('You already applied to this job with this CV', 'info');
            return;
        }
        try {
            await api('/applications/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cv_id: cv.id, job_id: jobId }),
            });
            closeModal();
            toast('Application sent to "' + jobTitleOf(jobId) + '" 🎉', 'success');
            await loadApplications();
            if (!$('#applications').classList.contains('active')) {
                setTimeout(() => setSection('applications'), 450);
            }
        } catch (err) {
            if (err.status === 400 && /invalid/i.test(err.message)) {
                toast('Could not apply — invalid job or CV', 'error');
            } else {
                toast(err.message || 'Could not apply', 'error');
            }
        }
    }

    async function loadApplications() {
        const loading = $('#applications-loading');
        const empty = $('#applications-empty');
        const error = $('#applications-error');
        try {
            if (loading) loading.hidden = false;
            if (error) error.hidden = true;
            const data = await api('/applications/');
            state.applications = data.data || [];
            if (empty) empty.hidden = state.applications.length > 0;
            renderKanban();
            updateStatsAndHero();
        } catch (err) {
            console.error(err);
            if (error) {
                error.textContent = err.message || 'Error loading applications';
                error.hidden = false;
            }
        } finally {
            if (loading) loading.hidden = true;
        }
    }

    function renderKanban() {
        /* follow-up nudges: applied >14 days, interviewing >10 days */
        const FOLLOWUP_DAYS = { applied: 14, interview: 10 };
        function followUpNudge(app, statusKey) {
            const minDays = FOLLOWUP_DAYS[statusKey];
            if (!minDays) return null;
            const ts = app.applied_at ? Date.parse(app.applied_at) : NaN;
            if (Number.isNaN(ts)) return null;
            const days = Math.floor((Date.now() - ts) / 86400000);
            if (days < minDays) return null;
            return days + ' days — send a follow-up';
        }

        const cols = { applied: [], interview: [], offer: [], rejected: [] };
        state.applications.forEach((a) => {
            const raw = (a.status || 'applied').toLowerCase();
            const key = ['applied', 'interview', 'offer', 'rejected'].indexOf(raw) !== -1 ? raw : 'applied';
            cols[key].push(a);
        });

        ['applied', 'interview', 'offer', 'rejected'].forEach((statusKey) => {
            const body = $('[data-kbody="' + statusKey + '"]');
            const count = $('#k-' + statusKey);
            if (count) count.textContent = cols[statusKey].length;
            if (!body) return;
            if (!cols[statusKey].length) {
                body.innerHTML = '<div class="kempty">Drag cards here</div>';
                return;
            }
            body.innerHTML = cols[statusKey].map((a) => {
                const job = a.job || {};
                const nudge = followUpNudge(a, statusKey);
                return '<article class="app-card' + (nudge ? ' needs-followup' : '') + '" draggable="true" data-app-id="' + a.id + '">' +
                    '<div class="ac-head">' +
                        '<div>' +
                            '<div class="ac-title">' + esc(job.title || ('Application #' + a.id)) + '</div>' +
                            '<div class="ac-company">' + esc(job.company || '—') + '</div>' +
                        '</div>' +
                        '<span class="ac-status ' + statusKey + '">' + statusKey + '</span>' +
                    '</div>' +
                    (nudge ? '<div class="ac-nudge" title="Applications this old often need a polite follow-up email">⏰ ' + nudge + '</div>' : '') +
                    '<div class="ac-foot">' +
                        '<span class="ac-cv" title="' + esc((a.cv && a.cv.filename) || '') + '">' +
                            esc((a.cv && a.cv.filename) || '') +
                        '</span>' +
                        '<button class="ac-remove" title="Withdraw application" aria-label="Withdraw application">' +
                            '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>' +
                        '</button>' +
                    '</div>' +
                '</article>';
            }).join('');
        });

        $$('.app-card').forEach((card) => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.dataset.appId);
                card.classList.add('dragging');
            });
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
        });

        $$('.ac-remove').forEach((btn) => {
            btn.addEventListener('click', async (e) => {
                const card = e.currentTarget.closest('.app-card');
                const appId = Number(card.dataset.appId);
                const ok = await askConfirm('Withdraw application?', 'This will permanently remove the application from your board.', 'Withdraw');
                if (!ok) return;
                deleteApplication(appId);
            });
        });
    }

    async function deleteApplication(appId) {
        try {
            await api('/applications/' + appId, { method: 'DELETE' });
            state.applications = state.applications.filter((a) => a.id !== appId);
            renderKanban();
            updateStatsAndHero();
            toast('Application withdrawn', 'success');
        } catch (err) {
            toast(err.message || 'Could not withdraw application', 'error');
        }
    }

    /* Kanban column DnD — bind ONCE (columns are persistent DOM;
       binding inside renderKanban() stacked duplicate drop listeners). */
    function initKanbanDnd() {
        $$('.kcol').forEach((col) => {
            col.addEventListener('dragover', (e) => {
                e.preventDefault();
                col.classList.add('drag-over');
            });
            col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
            col.addEventListener('drop', async (e) => {
                e.preventDefault();
                col.classList.remove('drag-over');
                const appId = Number(e.dataTransfer.getData('text/plain'));
                const targetStatus = col.dataset.status;
                const app = state.applications.find((a) => a.id === appId);
                if (!app || app.status === targetStatus) return;
                try {
                    await api('/applications/' + appId, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: targetStatus }),
                    });
                    app.status = targetStatus;
                    renderKanban();
                    toast('Moved to ' + targetStatus, 'success');
                } catch (err) {
                    toast(err.message || 'Could not update status', 'error');
                    renderKanban();
                }
            });
        });
    }

    /* ---------- live job sync (shared by topbar + settings) ---------- */
    async function runSyncJobs(btn) {
        if (!btn || btn.disabled) return;
        btn.disabled = true;
        const label = btn.querySelector('span');
        const old = label ? label.textContent : '';
        if (label) label.textContent = 'Syncing…';
        try {
            const res = await api('/sync/jobs', { method: 'POST' });
            const s = res.data || {};
            let msg = 'Synced ' + (s.created || 0) + ' new jobs · ' + (s.total_jobs || 0) + ' total · ' + (s.matches_scored || 0) + ' rescored';
            const failures = Object.entries(s.sources || {}).filter(([, v]) => String(v).indexOf('FAILED') !== -1);
            if (failures.length) {
                toast('⚠ ' + msg + ' — source problems: ' + failures.map(([k, v]) => k + ' ' + v).join(' | '), 'info');
            } else {
                toast(msg, 'success');
            }
            state.jobsLoaded = false;
            await loadJobs(true);
            announceHighMatches(await fetchHighMatches());
        } catch (err) {
            toast(err.message || 'Sync failed — check your connection', 'error');
        } finally {
            btn.disabled = false;
            if (label) label.textContent = old;
        }
    }
    const syncBtn = $('#sync-btn');
    if (syncBtn) syncBtn.addEventListener('click', () => runSyncJobs(syncBtn));
    const settingsSyncBtn = $('#settings-sync-btn');
    if (settingsSyncBtn) settingsSyncBtn.addEventListener('click', () => runSyncJobs(settingsSyncBtn));

    /* ---------- high-match alerts + welcome-back high matches ---------- */
    const HIGH_MATCH_KEY = 'jobapply_seen_high_matches';
    const badge = $('#high-match-pill');
    const badgeCount = $('#high-match-count');
    if (badge) {
        badge.addEventListener('click', () => {
            // use the threshold the badge is actually showing (80+ or 60+)
            const lbl = $('#high-match-label');
            const filter = lbl && lbl.textContent.indexOf('60') !== -1 ? '60+' : '80+';
            state.filter = filter;
            $$('.chip', $('#job-filters') || document).forEach((c) =>
                c.classList.toggle('active', c.dataset.filter === filter)
            );
            setSection('jobs');
            renderJobs();
        });
    }

    function seenHighMatchIds() {
        try { return JSON.parse(localStorage.getItem(HIGH_MATCH_KEY) || '[]'); } catch (e) { return []; }
    }

    function markHighMatchesSeen(list) {
        try {
            const seen = new Set(seenHighMatchIds());
            list.forEach((m) => seen.add(String(m.job_id)));
            localStorage.setItem(HIGH_MATCH_KEY, JSON.stringify(Array.from(seen).slice(-200)));
        } catch (e) { /* private mode etc. — alerts just repeat, fine */ }
    }

    async function announceHighMatches(highMatches, opts) {
        if (!highMatches.length) return;
        const options = opts || {};
        const seen = new Set(seenHighMatchIds());
        const fresh = highMatches.filter((m) => !seen.has(String(m.job_id)));
        if (options.toastOnFresh !== false && fresh.length) {
            const top = fresh[0];
            const label = fresh.length === 1
                ? '⭐ ' + top.score + '% match: ' + (top.title || 'a role') + ' at ' + (top.company || '—')
                : '⭐ ' + fresh.length + ' jobs scored ' + top.score + '%+ — top: ' + (top.title || 'a role');
            toast(label, 'success', 7000);
        }
        const cnt = $('#high-match-count');
        const lbl = $('#high-match-label');
        if (cnt) cnt.textContent = String(highMatches.length);
        if (lbl) lbl.textContent = (highMatches[0].score >= 80 ? '80%+' : '60%+');
        badge.hidden = false;
        if (!options.keepUnseen) markHighMatchesSeen(highMatches);
    }

    async function fetchHighMatches() {
        if (!state.activeCvId) return [];
        // prefer 80%+ matches; fall back to 60%+ so the badge stays useful
        let recs = await api('/matches/recommendations/' + state.activeCvId + '?limit=100&min_score=80');
        let highs = (recs.data || []).filter((r) => r && r.job);
        if (!highs.length) {
            recs = await api('/matches/recommendations/' + state.activeCvId + '?limit=100&min_score=60');
            highs = (recs.data || []).filter((r) => r && r.job);
        }
        return highs.map((r) => ({
            job_id: r.job.id, title: r.job.title, company: r.job.company,
            location: r.job.location, score: r.match.score, url: r.job.url,
        }));
    }

    async function checkFreshHighMatchesOnLoad() {
        try {
            const mapped = await fetchHighMatches();
            announceHighMatches(mapped, { toastOnFresh: false, keepUnseen: true });
        } catch (err) { /* silent — badge is a nice-to-have */ }
    }

    /* ---------- PWA install + offline indicator ---------- */
    let deferredPrompt = null;
    const installBtn = $('#install-btn');
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (installBtn) installBtn.hidden = false;
    });
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            try {
                const choice = await deferredPrompt.userChoice;
                if (choice && choice.outcome === 'accepted') toast('App installed — find it in your Start menu / home screen', 'success');
            } catch (_) { /* user dismissed */ }
            deferredPrompt = null;
            installBtn.hidden = true;
        });
    }
    window.addEventListener('appinstalled', () => {
        if (installBtn) installBtn.hidden = true;
        toast('JobApply AI installed', 'success');
    });

    const offlineBanner = $('#offline-banner');
    function updateOnlineState() {
        if (offlineBanner) offlineBanner.hidden = navigator.onLine;
    }
    window.addEventListener('online', () => { updateOnlineState(); toast('Back online — you can sync jobs again', 'info'); });
    window.addEventListener('offline', updateOnlineState);
    updateOnlineState();

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(() => { /* offline shell stays unavailable, app still works */ });
        });
    }

    /* ---------- settings ---------- */
    async function loadSettings() {
        try {
            const res = await api('/sync/status');
            const s = res.data || {};
            const src = s.by_source || {};
            const items = [
                [s.total_jobs || 0, 'jobs in DB'],
                [src.arbeitnow || 0, 'from Arbeitnow'],
                [src.remotive || 0, 'from Remotive'],
                [s.parsed_cvs || 0, 'parsed CVs'],
                [s.cached_matches || 0, 'cached scores'],
                [src.manual || 0, 'manual entries'],
            ];
            const host = $('#settings-stats');
            if (host) {
                host.innerHTML = items.map(([v, l]) =>
                    '<div class="ss-item"><div class="ss-value">' + esc(String(v)) + '</div><div class="ss-label">' + esc(l) + '</div></div>'
                ).join('');
            }
            const last = s.last_sync;
            if (last && last.sources) {
                const fails = Object.entries(last.sources).filter(([, v]) => String(v).indexOf('FAILED') !== -1);
                if (fails.length) toast('⚠ Last sync had source problems: ' + fails.map(([k, v]) => k + ' ' + v).join(' | '), 'info');
            }
        } catch (err) {
            const host = $('#settings-stats');
            if (host) host.textContent = 'Could not load stats: ' + err.message;
        }
    }

    const resetBtn = $('#reset-data-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            const ok = await askConfirm(
                'Delete everything?',
                'All CVs, jobs, match scores and applications will be permanently removed from the database. This cannot be undone.',
                'Yes, delete everything'
            );
            if (!ok) return;
            resetBtn.disabled = true;
            try {
                const res = await api('/sync/reset', { method: 'DELETE' });
                const d = res.data || {};
                const del = d.deleted || {};
                toast('Wiped ' + (del.cvs || 0) + ' CVs · ' + (del.jobs || 0) + ' jobs · ' + (del.matches || 0) + ' scores · ' + (del.applications || 0) + ' applications', 'success');
                state.cvs = [];
                state.applications = [];
                state.recs = [];
                state.activeCvId = null;
                state.jobsLoaded = false;
                await loadCVs();
                await loadJobs(true);
                renderKanban();
                loadSettings();
            } catch (err) {
                toast(err.message || 'Reset failed', 'error');
            } finally {
                resetBtn.disabled = false;
            }
        });
    }

    /* ---------- user display name (sidebar footer) ---------- */
    function readUserCookie() {
        const m = document.cookie.match(/(?:^|; )jobapply_user=([^;]*)/);
        return m ? decodeURIComponent(m[1]) : '';
    }
    function renderUser() {
        const name = (localStorage.getItem('jobapply_display_name') || readUserCookie() || 'Guest').trim() || 'Guest';
        const nameEl = $('#user-name'), av = $('#user-avatar');
        if (!nameEl) return;
        nameEl.textContent = name;
        av.textContent = name.charAt(0).toUpperCase();
        av.style.background = name === 'Guest' ? '' : 'linear-gradient(150deg, var(--gold), var(--gold-strong))';
        /* topbar greeting */
        const chip = $('#welcome-chip');
        if (chip) {
            if (name !== 'Guest') {
                const first = name.split(/\s+/)[0];
                const hour = new Date().getHours();
                const time = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
                chip.textContent = `${time}, ${first} 👋`;
                chip.hidden = false;
            } else {
                chip.hidden = true;
            }
        }
    }
    const userBlock = $('#side-user');
    const nameEl = $('#user-name');
    $('#user-edit-btn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        nameEl.contentEditable = 'true';
        nameEl.focus();
        document.getSelection().selectAllChildren(nameEl);
    });
    userBlock?.addEventListener('click', async (e) => {
        if (e.target.closest('#user-edit-btn') || nameEl.isContentEditable) return;
        nameEl.contentEditable = 'true';
        nameEl.focus();
        document.getSelection().selectAllChildren(nameEl);
    });
    $('#logout-btn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const ok = await askConfirm('Sign out?', 'You will need your password to sign back in on this device.', 'Yes, sign out');
        if (ok) window.location.href = '/auth/logout';
    });
    function commitName() {
        if (!nameEl.isContentEditable) return;
        nameEl.contentEditable = 'false';
        let v = nameEl.textContent.replace(/\s+/g, ' ').trim().slice(0, 40);
        if (!v) v = 'Guest';
        nameEl.textContent = v;
        localStorage.setItem('jobapply_display_name', v);
        document.cookie = 'jobapply_user=; Max-Age=0; path=/';   /* cookie is only a default; local edit wins */
        renderUser();
        const chip = $('#welcome-chip');
        if (chip && v !== 'Guest') {
            chip.hidden = false;
        }
    }
    nameEl?.addEventListener('blur', commitName);
    nameEl?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); nameEl.blur(); }
        if (e.key === 'Escape') { renderUser(); nameEl.contentEditable = 'false'; }
    });

    /* ---------- boot ---------- */
    (async function boot() {
        initKanbanDnd();
        renderUser();
        await loadCVs();
        await loadApplications();
        await loadJobs(false);
        checkFreshHighMatchesOnLoad();
        // Deep links from PWA shortcuts (?section=jobs|applications|profile)
        const params = new URLSearchParams(location.search);
        const target = params.get('section');
        if (target && ['dashboard', 'profile', 'jobs', 'applications', 'settings'].includes(target)) {
            setSection(target);
        }
    })();
});
