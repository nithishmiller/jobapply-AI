"""Lightweight NLP utilities for real-world job data.

No heavy dependencies: curated skill vocabulary + synonym map +
IDF-friendly tokenization. Used by ai/sources.py (ingestion) and
ai/matcher.py (scoring).
"""
import html as _html
import re
from typing import List, Optional, Tuple

# --------------------------------------------------------------------------
# Skill vocabulary — matched with word boundaries inside job/CV text.
# Canonical keys are lowercase; display uses the canonical form.
# --------------------------------------------------------------------------
SKILL_VOCAB = [
    # Programming / markup
    "python", "java", "javascript", "typescript", "c#", "c++", "c", "go", "golang",
    "rust", "kotlin", "swift", "php", "ruby", "scala", "r", "matlab", "sql",
    "html", "css", "sass", "bash", "powershell", "vba",
    # Frameworks / libraries
    "react", "angular", "vue", "nextjs", "nuxtjs", "svelte", "nodejs", "express",
    "django", "flask", "fastapi", "spring", "spring boot", ".net", "asp.net",
    "laravel", "rails", "symfony", "flutter", "react native", "ionic",
    "tailwindcss", "bootstrap", "jquery",
    # Data / AI
    "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "keras",
    "machine learning", "deep learning", "nlp", "computer vision", "llm",
    "generative ai", "data analysis", "data engineering", "etl", "airflow",
    "spark", "hadoop", "kafka", "snowflake", "databricks", "power bi", "tableau",
    "looker", "excel", "data visualization", "statistics", "a/b testing",
    # Cloud / devops
    "aws", "azure", "google cloud", "docker", "kubernetes", "terraform",
    "ansible", "jenkins", "gitlab ci", "github actions", "ci/cd", "linux",
    "prometheus", "grafana", "elasticsearch", "microservices", "serverless",
    "rest api", "graphql", "grpc", "websocket", "nginx",
    # Databases
    "postgresql", "mysql", "mongodb", "redis", "sqlite", "oracle", "sql server",
    "dynamodb", "cassandra",
    # Engineering / CAD
    "autocad", "solidworks", "catia", "creo", "revit", "archicad", "etabs",
    "sap2000", "cad", "cam", "fea", "ansys", "plm", "siemens nx",
    # ERP / business systems
    "sap", "sap erp", "sap fi", "sap co", "sap mm", "sap sd", "sap hana",
    "sap abap", "salesforce", "servicenow", "dynamics 365", "odoo", "jira",
    "confluence", "sharepoint",
    # Business / marketing / finance
    "project management", "product management", "agile", "scrum", "kanban",
    "safe", "prince2", "pmp", "business analysis", "business intelligence",
    "seo", "sem", "google analytics", "content marketing", "copywriting",
    "social media marketing", "crm", "email marketing", "market research",
    "accounting", "controlling", "bookkeeping", "ifrs", "us gaap", "hgb",
    "financial analysis", "risk management", "compliance", "audit", "tax",
    "treasury", "m&a", "recruiting", "hr", "payroll", "labor law",
    "supply chain", "logistics", "procurement", "s&op", "lean", "six sigma",
    "quality management", "iso 9001", "customer service", "customer success",
    "sales", "key account management", "b2b sales", "negotiation",
    # Healthcare
    "nursing", "patient care", "medical coding", "clinical research", "gcp",
    "pharmacovigilance", "medical affairs", "physiotherapy",
    # Soft / languages
    # text-level aliases (canonicalized via SKILL_SYNONYMS below)
    "k8s", "postgres", "genai", "llms", "ml", "next.js", "node.js", "vue.js",
    "react.js", "dotnet", "csharp", "powerbi", "mssql",
    "communication", "leadership", "stakeholder management", "presentation",
    "problem solving", "teamwork", "time management", "german", "english",
    "french", "spanish", "italian", "dutch", "polish", "turkish", "arabic",
]

# Multi-word vocab must be matched before single words; longest first.
_VOCAB_SORTED = sorted(SKILL_VOCAB, key=len, reverse=True)

# Regex fragments: escape specials (c#, c++, .net, ci/cd, m&a, s&op ...)
_FRAGMENT = {s: re.escape(s) for s in _VOCAB_SORTED}


def _skill_pattern(skill: str) -> re.Pattern:
    frag = _FRAGMENT[skill]
    # Unicode-aware boundaries: \\w covers umlauts/accents (fü|r, P|räsentationen),
    # while # . / + - are excluded so c#, .net, ci/cd, m&a still match.
    return re.compile(r"(?<![\w#./+-])" + frag + r"(?![\w#&+])", re.IGNORECASE)


_PATTERNS = {s: _skill_pattern(s) for s in _VOCAB_SORTED}

# Context-aware overrides for skills whose bare names collide with
# everyday words ("go to market", "R&D", the retailer "C&A").
_PATTERNS["go"] = re.compile(
    r"(?<![\w#./+-])go(?=\s*[,;)·\]/]|\s*$|\s*\(|\s*\+|\b(lang|golang)\b)", re.IGNORECASE)
_PATTERNS["r"] = re.compile(r"(?<![\w#./+-])r(?![\w#&+])", re.IGNORECASE)
_PATTERNS["c"] = re.compile(r"(?<![\w#./+-])c(?![\w#&+])", re.IGNORECASE)
# ".NET" legitimately follows letters ("ASP.NET"); the dot is boundary enough.
_PATTERNS[".net"] = re.compile(r"\.net\b", re.IGNORECASE)

# --------------------------------------------------------------------------
# Synonym canonicalization (CV skills + job tags often use brand spellings)
# --------------------------------------------------------------------------
SKILL_SYNONYMS = {
    "js": "javascript", "reactjs": "react", "react.js": "react", "react.js?": "react",
    "vuejs": "vue", "vue.js": "vue", "angularjs": "angular", "angular.js": "angular",
    "node": "nodejs", "node.js": "nodejs", "ts": "typescript", "py": "python",
    "ml": "machine learning", "ai": "machine learning", "llms": "llm",
    "genai": "generative ai", "gen ai": "generative ai",
    "k8s": "kubernetes", "postgres": "postgresql", "postgre sql": "postgresql",
    "golang": "go", "rustlang": "rust", "ms sql": "sql server", "mssql": "sql server",
    "csharp": "c#", "cplusplus": "c++", "dotnet": ".net", "net": ".net",
    "springboot": "spring boot", "spring-boot": "spring boot",
    "tailwind": "tailwindcss", "next.js": "nextjs", "next js": "nextjs",
    "nuxt.js": "nuxtjs", "amazon web services": "aws",
    "google cloud platform": "google cloud", "gcp": "google cloud",
    "ci cd": "ci/cd", "cicd": "ci/cd", "continuous integration": "ci/cd",
    "ms excel": "excel", "microsoft excel": "excel", "ms office": "excel",
    "microsoft office": "excel", "office 365": "excel",
    "powerbi": "power bi", "ms project": "project management",
    "sf": "salesforce", "sfmc": "salesforce",
    "sap s/4hana": "sap hana", "s/4hana": "sap hana", "s4 hana": "sap hana",
    "abap": "sap abap", "sap sd/mm": "sap mm",
    "solid works": "solidworks", "siemens nx": "siemens nx", "nx": "siemens nx",
    "e-tabs": "etabs", "performance testing": "fea",
    "a/b tests": "a/b testing", "ab testing": "a/b testing",
    "search engine optimization": "seo", "google ads": "sem",
    "people management": "leadership", "team lead": "leadership",
    "deutsch": "german", "deutschkenntnisse": "german", "german language": "german",
    "business fluent german": "german", "englisch": "english",
    "verhandlungssicher": "german", " fluent in german": "german",
}


def canon_skill(skill: str) -> str:
    """Canonical form of a skill string ('ReactJS' -> 'react')."""
    s = (skill or "").strip().lower().rstrip(".")
    s = re.sub(r"\s+", " ", s)
    return SKILL_SYNONYMS.get(s, s)


# --------------------------------------------------------------------------
# Extraction
# --------------------------------------------------------------------------
def extract_skills(text: str, extra_tags: Optional[List[str]] = None) -> List[str]:
    """Detect canonical skills inside free text, optionally seeded by tags.

    Returns a de-duplicated, order-stable list of canonical skill names.
    """
    found: List[str] = []
    seen = set()

    def add(cand: str) -> None:
        c = canon_skill(cand)
        if c and c not in seen and c in _PATTERNS:
            seen.add(c)
            found.append(c)

    if extra_tags:
        for tag in extra_tags or []:
            add(tag)

    if text:
        low = text.lower()
        for skill in _VOCAB_SORTED:
            canon = canon_skill(skill)
            if canon in seen:
                continue
            # cheap substring pre-check before regex
            if skill in low and _PATTERNS[skill].search(low):
                seen.add(canon)
                found.append(canon)
    return found


# --------------------------------------------------------------------------
# Language / visa / level detection
# --------------------------------------------------------------------------
def detect_language_requirements(text: str) -> Optional[str]:
    t = (text or "").lower()
    reqs = []
    if re.search(r"\b(german|deutsch)\b", t):
        if re.search(r"(fluent|business|native|verhandlungssicher|c1|c2|b2\+?).*german|german.*(fluent|native|business|c1|c2)|deutsch.*\b(c1|c2|verhandlungssicher|flie|end)\w*", t) \
           or re.search(r"\bgerman\b.{0,30}\b(required|must|essential)\b", t):
            reqs.append("German (required)")
        else:
            reqs.append("German (mentioned)")
    if re.search(r"\benglish\b", t):
        reqs.append("English (mentioned)")
    return "; ".join(reqs) if reqs else None


def detect_visa_sponsorship(text: str) -> bool:
    return bool(re.search(
        r"visa (sponsorship|support)|sponsor(s|ing)? .{0,20}visa|visa.{0,15}sponsoring|"
        r"work (permit|authorization) support|blau[e]? karte|blue card.{0,30}(support|sponsorship)|"
        r"relocation.{0,40}visa",
        (text or "").lower()))


def detect_relocation_support(text: str) -> bool:
    return bool(re.search(
        r"relocation (package|support|assistance|benefit)|umzugs|relocation help|we help you (relocate|move)",
        (text or "").lower()))


def detect_experience_level(title: str, text: str) -> Optional[str]:
    t = ((title or "") + " " + (text or "")[:2000]).lower()
    if re.search(r"\b(senior|sr\.?|lead|principal|staff|head of|director|manager)\b", t):
        return "senior"
    if re.search(r"\b(junior|jr\.?|entry[- ]level|graduate|trainee|intern(ship)?|working student|praktikum|werksstudent)\b", t):
        return "entry"
    if re.search(r"\b(mid[- ]?level|medior)\b", t):
        return "mid"
    return None


# --------------------------------------------------------------------------
# Salary parsing  ("$120K - $150K", "€50.000 – €65.000", "USD 80,000/year")
# --------------------------------------------------------------------------
def parse_salary(raw: Optional[str]) -> Tuple[Optional[int], Optional[int], Optional[str]]:
    if not raw:
        return (None, None, None)
    s = str(raw)
    currency = "USD"
    if "€" in s or re.search(r"\beur\b", s, re.I):
        currency = "EUR"
    elif "£" in s or re.search(r"\bgbp\b", s, re.I):
        currency = "GBP"
    elif "$" in s or re.search(r"\busd\b", s, re.I):
        currency = "USD"

    # European thousands "50.000" -> 50000
    euro_style = currency in ("EUR", "GBP") and re.search(r"\d{1,3}\.\d{3}", s)
    norm = s.replace(".", "") if euro_style else s.replace(",", "")
    nums = []
    for m in re.finditer(r"(\d+(?:\.\d+)?)\s*([kK]?)", norm):
        val = float(m.group(1))
        if m.group(2).lower() == "k":
            val *= 1000
        if val >= 1000:  # salary-scale numbers only
            nums.append(int(val))
    if not nums:
        return (None, None, currency)
    lo = min(nums)
    hi = max(nums)
    if hi == lo:
        hi = None
    return (lo, hi, currency)


# --------------------------------------------------------------------------
# HTML -> readable text
# --------------------------------------------------------------------------
def html_to_text(h: Optional[str]) -> str:
    if not h:
        return ""
    t = re.sub(r"(?is)<(script|style)\b.*?>.*?</\1>", " ", h)
    t = re.sub(r"(?i)<\s*(br|/p|/div|/li|/h[1-6]|/tr|/ul|/ol)\s*/?>", "\n", t)
    t = re.sub(r"<[^>]+>", " ", t)
    t = _html.unescape(t)
    t = re.sub(r"[ \t\xa0]+", " ", t)
    t = re.sub(r"\n\s*\n+", "\n", t)
    return t.strip()
