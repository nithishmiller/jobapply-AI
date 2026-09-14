/* parser.js — in-browser CV parsing (PDF via pdf.js, DOCX via mammoth),
   then the same extraction pipeline the FastAPI backend used:
   contact info, skills, education, experience. */
(function () {
  'use strict';

  /* pdf.js worker from the same CDN as the library */
  if (window.pdfjsLib) {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  async function fileToText(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') {
      if (!window.pdfjsLib) throw new Error('PDF engine not loaded — check your connection.');
      const buf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
      const parts = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        parts.push(content.items.map(it => it.str).join(' '));
      }
      return parts.join('\n');
    }
    if (ext === 'docx') {
      if (!window.mammoth) throw new Error('DOCX engine not loaded — check your connection.');
      const buf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      return result.value || '';
    }
    throw new Error('Only PDF and DOCX files are supported.');
  }

  const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
  const PHONE_RE = /(?:\+49|0)[\s\-\/]?\d{2,5}[\s\-\/]?\d{3,}[\d\s\-]{0,12}/;

  function parseContact(text) {
    const contact = {};
    const email = text.match(EMAIL_RE);
    if (email) contact.email = email[0].toLowerCase();
    const phone = text.match(PHONE_RE);
    if (phone) contact.phone = phone[0].trim();

    /* name: first non-empty line that isn't an email/phone and has letters */
    const lines = text.split(/\n+/).map(l => l.trim()).filter(Boolean);
    for (const line of lines.slice(0, 6)) {
      if (EMAIL_RE.test(line) || /^[\d\s+\-()\/]+$/.test(line)) continue;
      const words = line.split(/\s+/);
      if (words.length >= 2 && words.length <= 5 && /^[A-Za-z\u00c0-\u024f.\s]+$/.test(line)) {
        contact.name = line;
        break;
      }
    }
    /* linkedin/github */
    const li = text.match(/(?:linkedin\.com\/in\/[A-Za-z0-9_-]+)/i);
    if (li) contact.linkedin = li[0];
    const gh = text.match(/(?:github\.com\/[A-Za-z0-9_-]+)/i);
    if (gh) contact.github = gh[0];
    return contact;
  }

  const DEGREE_RE = /(b\.?tech|bachelor|master|m\.?tech|mba|ph\.?d|doctorate|b\.?e\b|m\.?sc|b\.?sc|b\.?ca|m\.?ca|diploma|hsc|sslc|class (?:x|xii|10|12)|12th|10th)/i;

  function parseEducation(text) {
    const out = [];
    const lines = text.split(/\n+/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (DEGREE_RE.test(line)) {
        const ctx = [line, lines[i + 1] || '', lines[i + 2] || ''].join(' ').trim();
        const years = [...ctx.matchAll(/(19|20)\d{2}/g)].map(m => m[0]);
        out.push({
          degree: line.replace(/\s+/g, ' ').slice(0, 120),
          institution: (lines[i + 1] || '').replace(/\s+/g, ' ').slice(0, 120) || null,
          dates: years.length ? years.join(' – ') : null,
        });
        if (out.length >= 6) break;
      }
    }
    return out;
  }

  const EXP_HEAD = /(experience|employment|work history|professional|projects|internship)/i;
  const DATE_LINE = /((19|20)\d{2})\s*[-–—to]+\s*((19|20)\d{2}|present|current|now|heute)/i;

  function parseExperience(text) {
    const out = [];
    const lines = text.split(/\n+/);
    let inSection = false;
    let current = null;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (EXP_HEAD.test(line) && line.length < 60) { inSection = true; continue; }
      if (inSection && /^(education|skills|certification|languages|achievements|declaration)\b/i.test(line)) {
        inSection = false;
      }
      if (!inSection) continue;
      if (DATE_LINE.test(line) || /\b(19|20)\d{2}\b/.test(line)) {
        if (current) out.push(current);
        current = { title: line.slice(0, 120), dates: line.match(DATE_LINE) ? line.match(DATE_LINE)[0] : null };
      } else if (current && !current.description && line.length > 20) {
        current.description = line.slice(0, 200);
      }
      if (out.length >= 10) break;
    }
    if (current) out.push(current);
    return out;
  }

  /* projects section often the only "experience" a fresh grad has */
  function parseProjectsAsExperience(text) {
    const out = [];
    const lines = text.split(/\n+/);
    let inProj = false;
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (/^projects?\b/i.test(line) && line.length < 40) { inProj = true; continue; }
      if (inProj && /^(education|skills|certification|languages|experience|declaration)\b/i.test(line)) inProj = false;
      if (!inProj) continue;
      if (/\b(19|20)\d{2}\b/.test(line) || line.length > 25) {
        out.push({ title: line.slice(0, 120), dates: (line.match(/\b(19|20)\d{2}\b/g) || [null])[0], project: true });
      }
      if (out.length >= 8) break;
    }
    return out;
  }

  async function parseCvFile(file) {
    const text = await fileToText(file);
    const clean = text.replace(/[ \t\u00a0]+/g, ' ').trim();
    const experience = parseExperience(clean);
    const projects = parseProjectsAsExperience(clean);
    return {
      text: clean,
      contact_info: parseContact(clean),
      skills: window.JA.extractSkills(clean.slice(0, 20000)),
      education: parseEducation(clean),
      experience: experience.length ? experience : projects,
    };
  }

  window.JA = window.JA || {};
  window.JA.parseCvFile = parseCvFile;
})();
