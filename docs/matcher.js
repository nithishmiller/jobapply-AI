/* matcher.js — JS port of ai/skills.py + ai/matcher.py (scoring logic v2).
   Same vocabulary, synonym canonicalization, Unicode-safe boundaries,
   IDF weighting and component weights as the FastAPI backend. */
(function () {
  'use strict';

  /* ---------------- Skill vocabulary (identical to backend) ---------------- */
  const SKILL_VOCAB = [
    'python', 'java', 'javascript', 'typescript', 'c#', 'c++', 'c', 'go', 'golang',
    'rust', 'kotlin', 'swift', 'php', 'ruby', 'scala', 'r', 'matlab', 'sql',
    'html', 'css', 'sass', 'bash', 'powershell', 'vba',
    'react', 'angular', 'vue', 'nextjs', 'nuxtjs', 'svelte', 'nodejs', 'express',
    'django', 'flask', 'fastapi', 'spring', 'spring boot', '.net', 'asp.net',
    'laravel', 'rails', 'symfony', 'flutter', 'react native', 'ionic',
    'tailwindcss', 'bootstrap', 'jquery',
    'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'keras',
    'machine learning', 'deep learning', 'nlp', 'computer vision', 'llm',
    'generative ai', 'data analysis', 'data engineering', 'etl', 'airflow',
    'spark', 'hadoop', 'kafka', 'snowflake', 'databricks', 'power bi', 'tableau',
    'looker', 'excel', 'data visualization', 'statistics', 'a/b testing',
    'aws', 'azure', 'google cloud', 'docker', 'kubernetes', 'terraform',
    'ansible', 'jenkins', 'gitlab ci', 'github actions', 'ci/cd', 'linux',
    'prometheus', 'grafana', 'elasticsearch', 'microservices', 'serverless',
    'rest api', 'graphql', 'grpc', 'websocket', 'nginx',
    'postgresql', 'mysql', 'mongodb', 'redis', 'sqlite', 'oracle', 'sql server',
    'dynamodb', 'cassandra',
    'autocad', 'solidworks', 'catia', 'creo', 'revit', 'archicad', 'etabs',
    'sap2000', 'cad', 'cam', 'fea', 'ansys', 'plm', 'siemens nx',
    'sap', 'sap erp', 'sap fi', 'sap co', 'sap mm', 'sap sd', 'sap hana',
    'sap abap', 'salesforce', 'servicenow', 'dynamics 365', 'odoo', 'jira',
    'confluence', 'sharepoint',
    'project management', 'product management', 'agile', 'scrum', 'kanban',
    'safe', 'prince2', 'pmp', 'business analysis', 'business intelligence',
    'seo', 'sem', 'google analytics', 'content marketing', 'copywriting',
    'social media marketing', 'crm', 'email marketing', 'market research',
    'accounting', 'controlling', 'bookkeeping', 'ifrs', 'us gaap', 'hgb',
    'financial analysis', 'risk management', 'compliance', 'audit', 'tax',
    'treasury', 'm&a', 'recruiting', 'hr', 'payroll', 'labor law',
    'supply chain', 'logistics', 'procurement', 's&op', 'lean', 'six sigma',
    'quality management', 'iso 9001', 'customer service', 'customer success',
    'sales', 'key account management', 'b2b sales', 'negotiation',
    'nursing', 'patient care', 'medical coding', 'clinical research', 'gcp',
    'pharmacovigilance', 'medical affairs', 'physiotherapy',
    'k8s', 'postgres', 'genai', 'llms', 'ml', 'next.js', 'node.js', 'vue.js',
    'react.js', 'dotnet', 'csharp', 'powerbi', 'mssql',
    'communication', 'leadership', 'stakeholder management', 'presentation',
    'problem solving', 'teamwork', 'time management', 'german', 'english',
    'french', 'spanish', 'italian', 'dutch', 'polish', 'turkish', 'arabic',
  ];
  const VOCAB_SORTED = [...SKILL_VOCAB].sort((a, b) => b.length - a.length);

  const SKILL_SYNONYMS = {
    'js': 'javascript', 'reactjs': 'react', 'react.js': 'react',
    'vuejs': 'vue', 'angularjs': 'angular', 'angular.js': 'angular',
    'node': 'nodejs', 'node.js': 'nodejs', 'ts': 'typescript', 'py': 'python',
    'ml': 'machine learning', 'ai': 'machine learning', 'llms': 'llm',
    'genai': 'generative ai', 'gen ai': 'generative ai',
    'k8s': 'kubernetes', 'postgres': 'postgresql', 'postgre sql': 'postgresql',
    'golang': 'go', 'rustlang': 'rust', 'ms sql': 'sql server', 'mssql': 'sql server',
    'csharp': 'c#', 'cplusplus': 'c++', 'dotnet': '.net', 'net': '.net',
    'springboot': 'spring boot', 'spring-boot': 'spring boot',
    'tailwind': 'tailwindcss', 'next.js': 'nextjs', 'next js': 'nextjs',
    'nuxt.js': 'nuxtjs', 'amazon web services': 'aws',
    'google cloud platform': 'google cloud', 'gcp': 'google cloud',
    'ci cd': 'ci/cd', 'cicd': 'ci/cd', 'continuous integration': 'ci/cd',
    'ms excel': 'excel', 'microsoft excel': 'excel', 'ms office': 'excel',
    'microsoft office': 'excel', 'office 365': 'excel',
    'powerbi': 'power bi', 'ms project': 'project management',
    'sf': 'salesforce', 'sfmc': 'salesforce',
    'sap s/4hana': 'sap hana', 's/4hana': 'sap hana', 's4 hana': 'sap hana',
    'abap': 'sap abap', 'sap sd/mm': 'sap mm',
    'solid works': 'solidworks', 'siemens nx': 'siemens nx', 'nx': 'siemens nx',
    'e-tabs': 'etabs', 'performance testing': 'fea',
    'a/b tests': 'a/b testing', 'ab testing': 'a/b testing',
    'search engine optimization': 'seo', 'google ads': 'sem',
    'people management': 'leadership', 'team lead': 'leadership',
    'deutsch': 'german', 'deutschkenntnisse': 'german', 'german language': 'german',
    'business fluent german': 'german', 'englisch': 'english',
    'verhandlungssicher': 'german', 'fluent in german': 'german',
  };

  function canonSkill(skill) {
    let s = (skill || '').trim().toLowerCase().replace(/\.+$/, '');
    s = s.replace(/\s+/g, ' ');
    return SKILL_SYNONYMS[s] || s;
  }

  /* Unicode-aware boundaries like the backend. Written WITHOUT lookbehind
     (capture-group boundary instead) so older iOS Safari also works.
     No /g flag: .test() must stay stateless across calls. */
  const LB = '(^|[^\\w#./+\u00c0-\u024f+-])';   // left boundary via capture
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const PATTERNS = {};
  for (const s of VOCAB_SORTED) {
    PATTERNS[s] = new RegExp(LB + esc(s) + '(?![\\w#&+])', 'i');
  }
  PATTERNS['go'] = new RegExp(LB + 'go(?=\\s*[,;)\u00b7\\]/]|\\s*$|\\s*\\(|\\s*\\+|\\b(lang|golang)\\b)', 'i');
  PATTERNS['r'] = new RegExp(LB + 'r(?![\\w#&+])', 'i');
  PATTERNS['c'] = new RegExp(LB + 'c(?![\\w#&+])', 'i');
  PATTERNS['.net'] = /\.net\b/i;
  PATTERNS['c#'] = /(^|[^\w./\u00c0-\u024f-])c#(?![\w&+])/i;
  PATTERNS['c++'] = /(^|[^\w./\u00c0-\u024f-])c\+\+(?![\w&+])/i;

  function extractSkills(text, extraTags) {
    const found = [];
    const seen = new Set();
    const add = (cand) => {
      const c = canonSkill(cand);
      if (c && !seen.has(c) && PATTERNS[c]) { seen.add(c); found.push(c); }
    };
    if (extraTags) extraTags.forEach(add);
    if (text) {
      const low = text.toLowerCase();
      for (const skill of VOCAB_SORTED) {
        const canon = canonSkill(skill);
        if (seen.has(canon)) continue;
        if (low.includes(skill) && PATTERNS[skill].test(low)) { seen.add(canon); found.push(canon); }
      }
    }
    return found;
  }

  /* ---------------- Language / level / visa detection ---------------- */
  function detectLanguageRequirements(text) {
    const t = (text || '').toLowerCase();
    const reqs = [];
    if (/\b(german|deutsch)\b/.test(t)) {
      const strong = /((fluent|business|native|verhandlungssicher|c1|c2|b2\+?).*german|german.*(fluent|native|business|c1|c2))/.test(t)
        || /\bgerman\b.{0,30}\b(required|must|essential)\b/.test(t);
      reqs.push(strong ? 'German (required)' : 'German (mentioned)');
    }
    if (/\benglish\b/.test(t)) reqs.push('English (mentioned)');
    return reqs.join('; ') || null;
  }
  const detectVisa = (t) => /visa (sponsorship|support)|sponsor(s|ing)? .{0,20}visa|visa.{0,15}sponsoring|work (permit|authorization) support|blau[e]? karte|blue card.{0,30}(support|sponsorship)|relocation.{0,40}visa/.test((t || '').toLowerCase());
  const detectRelocation = (t) => /relocation (package|support|assistance|benefit)|umzugs|relocation help|we help you (relocate|move)/.test((t || '').toLowerCase());
  function detectExperienceLevel(title, text) {
    const t = ((title || '') + ' ' + (text || '').slice(0, 2000)).toLowerCase();
    if (/\b(senior|sr\.?|lead|principal|staff|head of|director|manager)\b/.test(t)) return 'senior';
    if (/\b(junior|jr\.?|entry[- ]level|graduate|trainee|intern(ship)?|working student|praktikum|werksstudent)\b/.test(t)) return 'entry';
    if (/\b(mid[- ]?level|medior)\b/.test(t)) return 'mid';
    return null;
  }
  function parseSalary(raw) {
    if (!raw) return [null, null, null];
    const s = String(raw);
    let currency = 'USD';
    if (s.includes('\u20ac') || /\beur\b/i.test(s)) currency = 'EUR';
    else if (s.includes('\u00a3') || /\bgbp\b/i.test(s)) currency = 'GBP';
    const euroStyle = (currency === 'EUR' || currency === 'GBP') && /\d{1,3}\.\d{3}/.test(s);
    const norm = euroStyle ? s.replace(/\./g, '') : s.replace(/,/g, '');
    const nums = [];
    for (const m of norm.matchAll(/(\d+(?:\.\d+)?)\s*([kK]?)/g)) {
      let v = parseFloat(m[1]);
      if (m[2].toLowerCase() === 'k') v *= 1000;
      if (v >= 1000) nums.push(Math.round(v));
    }
    if (!nums.length) return [null, null, currency];
    const lo = Math.min(...nums), hi = Math.max(...nums);
    return [lo, hi === lo ? null : hi, currency];
  }

  /* ---------------- Matcher v2 ---------------- */
  const W_SKILLS = 0.45, W_EDU = 0.15, W_EXP = 0.15, W_KW = 0.15, W_FIT = 0.10;
  const CURRENT_YEAR = new Date().getFullYear();

  let IDF = {};
  let CORPUS = 0;
  function refreshIdf(jobs) {
    CORPUS = Math.max(jobs.length, 1);
    const df = {};
    for (const job of jobs) {
      const text = ((job.skills || '') + ' ' + (job.description || '')).toLowerCase();
      const seen = new Set();
      for (const s of extractSkills(text)) if (!seen.has(s)) { seen.add(s); df[s] = (df[s] || 0) + 1; }
    }
    IDF = {};
    for (const [s, c] of Object.entries(df)) IDF[s] = Math.log(1 + (CORPUS - c + 0.5) / (c + 0.5));
  }
  const idf = (s) => (s in IDF ? IDF[s] : Math.log(1 + CORPUS + 0.5));

  const EDU_LEVELS = {
    'phd': 4, 'ph.d': 4, 'doctorate': 4,
    'master': 3, 'm.a': 3, 'm.s': 3, 'm.sc': 3, 'm.eng': 3, 'mba': 3,
    'bachelor': 2, 'b.a': 2, 'b.s': 2, 'b.sc': 2, 'b.eng': 2,
    'high school': 1, 'secondary': 1, 'abitur': 1, 'ausbildung': 1,
    'apprenticeship': 1, 'vocational': 1,
  };
  function cvEduLevel(cv) {
    if (!cv.education || !Array.isArray(cv.education)) return 0;
    let best = 0;
    for (const edu of cv.education) {
      const degree = String(edu.degree || '').toLowerCase();
      for (const [key, lvl] of Object.entries(EDU_LEVELS)) {
        if (degree.includes(key)) { best = Math.max(best, lvl); break; }
      }
    }
    return best;
  }
  function cvYears(cv) {
    if (!cv.experience || !Array.isArray(cv.experience)) return 0;
    const years = [];
    for (const item of cv.experience) {
      const dates = ['dates', 'duration', 'period', 'start', 'end'].map(k => item[k] || '').join(' ');
      const found = [...dates.matchAll(/(19|20)\d{2}/g)].map(m => parseInt(m[0], 10));
      if (!found.length) continue;
      years.push(...found);
      if (/(present|heute|current|now|bis heute)/i.test(dates)) years.push(CURRENT_YEAR);
    }
    if (!years.length) return 0;
    return Math.max(0, Math.min(Math.max(...years) - Math.min(...years), 40));
  }
  function cvProjectYears(cv) {
    if (!cv.raw_text) return 0;
    const years = [...cv.raw_text.slice(0, 12000).matchAll(/\b(20[0-2]\d)\b/g)].map(m => parseInt(m[1], 10));
    if (!years.length) return 0;
    const span = Math.max(...years) - Math.min(...years);
    const recency = Math.max(0, CURRENT_YEAR - Math.max(...years));
    return Math.min(Math.max(span, recency <= 1 ? 1 : 0) + recency, 8);
  }
  const jobRequiredLevel = (job) => {
    const lvl = (job.experience_level || '').toLowerCase();
    if (/senior|lead/.test(lvl)) return 3;
    if (/mid/.test(lvl)) return 2;
    if (/entry|junior/.test(lvl)) return 1;
    return 0;
  };
  const cvHasGerman = (cv) => {
    const sk = cvSkillsOf(cv);
    if (sk.includes('german')) return true;
    return /\b(german|deutsch)\b/i.test((cv.raw_text || '').slice(0, 8000));
  };

  /* per-CV skill extraction cache */
  const cvSkillCache = new Map();
  function cvSkillsOf(cv) {
    const key = (cv.id || 0) + ':' + (cv.raw_text || '').length;
    if (cvSkillCache.has(key)) return cvSkillCache.get(key);
    let skills = (cv.skills && Array.isArray(cv.skills)) ? cv.skills.filter(s => typeof s === 'string').map(canonSkill) : [];
    if (!skills.length && cv.raw_text) skills = extractSkills(cv.raw_text.slice(0, 20000));
    skills = [...new Set(skills)];
    cvSkillCache.set(key, skills);
    return skills;
  }
  const jobSkillCache = new Map();
  function jobSkillsOf(job) {
    const key = (job.id || 0) + ':' + (job.description || '').length;
    if (jobSkillCache.has(key)) return jobSkillCache.get(key);
    const text = [job.skills, job.title, job.requirements, (job.description || '').slice(0, 4000)].filter(Boolean).join(' ');
    const skills = extractSkills(text);
    jobSkillCache.set(key, skills);
    return skills;
  }

  function computeMatch(cv, job) {
    const cvSkills = new Set(cvSkillsOf(cv));
    const jobSkills = jobSkillsOf(job);
    const jobSet = new Set(jobSkills);
    const notes = [];

    /* 1. weighted skill overlap */
    let strengths = [], gaps = [], skillScore = 0;
    if (jobSet.size) {
      const matched = [...cvSkills].filter(s => jobSet.has(s));
      const missing = [...jobSet].filter(s => !cvSkills.has(s));
      const jobWeight = [...jobSet].reduce((a, s) => a + idf(s), 0);
      const matchWeight = matched.reduce((a, s) => a + idf(s), 0);
      skillScore = W_SKILLS * (jobWeight ? matchWeight / jobWeight : 0);
      strengths = matched.sort((a, b) => idf(b) - idf(a));
      gaps = missing.sort((a, b) => idf(b) - idf(a)).slice(0, 8);
      if (matched.length) notes.push(`${matched.length}/${jobSet.size} key skills matched (${strengths.slice(0, 4).join(', ')})`);
      else notes.push('no required skills found in CV');
    } else {
      notes.push('job lists no explicit skills');
    }

    /* 2. education */
    const cvEdu = cvEduLevel(cv);
    const eduScore = W_EDU * (0.5 + 0.1 * cvEdu);
    notes.push('education requirement not specified');

    /* 3. experience */
    const years = Math.max(cvYears(cv), cvProjectYears(cv));
    const minYears = { 0: 0, 1: 0, 2: 2, 3: 5 }[jobRequiredLevel(job)] || 0;
    let expScore;
    if (minYears === 0) {
      expScore = W_EXP * (years > 0 ? 0.7 : 0.4);
      notes.push(years ? `~${years}y experience incl. projects` : 'no dated experience found');
    } else if (years >= minYears) {
      expScore = W_EXP;
      notes.push(`~${years}y experience (incl. projects) meets ${minYears}y+ expectation`);
    } else {
      expScore = W_EXP * Math.max(0.25, years / minYears);
      notes.push(`~${years}y vs ~${minYears}y expected`);
    }

    /* 4. keyword coverage */
    let kwScore = 0;
    if (cvSkills.size) {
      const desc = ((job.description || '') + ' ' + (job.requirements || '')).toLowerCase();
      const hits = [...cvSkills].filter(s => desc.includes(s)).length;
      kwScore = W_KW * (hits / cvSkills.size);
      notes.push(`${hits}/${cvSkills.size} CV skills appear in the posting`);
    }

    /* 5. practical fit */
    let fitScore = W_FIT;
    const lang = (job.language_requirements || '').toLowerCase();
    if (lang.includes('german (required)') && !cvHasGerman(cv)) { fitScore -= 0.07; notes.push('German required but not found in CV'); }
    if (job.visa_sponsorship) { fitScore += 0.03; notes.push('visa sponsorship available'); }
    if (job.relocation_support) { fitScore += 0.02; notes.push('relocation support offered'); }

    const score = Math.max(0, Math.min(1, skillScore + eduScore + expScore + kwScore + fitScore));
    return { score, explanation: notes.join('; '), strengths, gaps };
  }

  window.JA = window.JA || {};
  Object.assign(window.JA, {
    extractSkills, canonSkill, detectLanguageRequirements, detectVisa,
    detectRelocation, detectExperienceLevel, parseSalary, refreshIdf,
    computeMatch, cvSkillsOf, htmlToText: (h) => {
      if (!h) return '';
      return h
        .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<\s*(br|\/p|\/div|\/li|\/h[1-6]|\/tr|\/ul|\/ol)\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
        .replace(/[ \t\u00a0]+/g, ' ')
        .replace(/\n\s*\n+/g, '\n')
        .trim();
    },
  });
})();
