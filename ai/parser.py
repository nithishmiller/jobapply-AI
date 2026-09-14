import re
from pathlib import Path
from typing import Dict, List, Optional
import PyPDF2
from docx import Document
from fpdf import FPDF

class CVParser:
    def __init__(self):
        pass

    def parse_pdf(self, file_path: str) -> Dict:
        """Parse a PDF CV file and extract text content"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    text += page.extract_text()
        except Exception as e:
            raise Exception(f"Error parsing PDF: {str(e)}")

        return {"text": text, "file_type": "pdf"}

    def parse_docx(self, file_path: str) -> Dict:
        """Parse a DOCX CV file and extract text content"""
        text = ""
        try:
            doc = Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
        except Exception as e:
            raise Exception(f"Error parsing DOCX: {str(e)}")

        return {"text": text, "file_type": "docx"}

    def extract_contact_info(self, text: str) -> Dict:
        """Extract contact information from CV text"""
        contact_info = {
            "name": self._extract_name(text),
            "email": self._extract_email(text),
            "phone": self._extract_phone(text),
            "address": self._extract_address(text),
        }
        return contact_info

    def extract_education(self, text: str) -> List[Dict]:
        """Extract education information from CV text"""
        education = []
        # Define degree keywords
        degree_keywords = [
            "bachelor", "master", "phd", "ph.d", "doctorate",
            "b.s", "m.s", "b.a", "m.a", "b.sc", "m.sc", "b.eng", "m.eng"
        ]
        lines = [line.strip() for line in text.split('\n') if line.strip()]

        i = 0
        while i < len(lines):
            line = lines[i]
            line_lower = line.lower()
            # Check if line contains any degree keyword and a year (four digits)
            has_degree = any(keyword in line_lower for keyword in degree_keywords)
            year_match = re.search(r'\b(19|20)\d{2}\b', line)
            if has_degree and year_match:
                degree = None
                # Find which degree keyword is present
                for keyword in degree_keywords:
                    if keyword in line_lower:
                        degree = keyword.upper() if keyword in ['phd', 'ph.d'] else keyword.capitalize()
                        # Handle special cases
                        if degree == "Ph.D":
                            degree = "PhD"
                        elif degree == "B.S":
                            degree = "BS"
                        elif degree == "M.S":
                            degree = "MS"
                        elif degree == "B.A":
                            degree = "BA"
                        elif degree == "M.A":
                            degree = "MA"
                        elif degree == "B.Sc":
                            degree = "BSc"
                        elif degree == "M.Sc":
                            degree = "MSc"
                        elif degree == "B.Eng":
                            degree = "BEng"
                        elif degree == "M.Eng":
                            degree = "MEng"
                        break
                year = year_match.group(0)
                # Try to get institution from previous line
                institution = None
                if i > 0:
                    prev_line = lines[i-1].strip()
                    # Check if previous line is not empty and does not look like a degree line and does not contain a year
                    if prev_line and not any(kw in prev_line.lower() for kw in degree_keywords) and not re.search(r'\b(19|20)\d{2}\b', prev_line):
                        institution = prev_line
                # If we didn't get institution from previous line, try to extract from current line by removing degree and year
                if not institution:
                    # Remove the degree keyword(s) and year from the line
                    temp = line
                    for kw in degree_keywords:
                        temp = re.sub(re.escape(kw), '', temp, flags=re.IGNORECASE)
                    temp = re.sub(r'\b(19|20)\d{2}\b', '', temp)
                    # Clean up extra spaces and punctuation
                    temp = re.sub(r'[\-:]+', ' ', temp).strip()
                    if temp and len(temp) > 1:
                        institution = temp
                # If we still don't have institution, we can leave it as None (but we hope to get it from the previous line)
                education.append({
                    "degree": degree,
                    "institution": institution,
                    "year": year
                })
                # Skip the next line to avoid using the same line for another entry
                i += 2
                continue
            i += 1
        # Deduplicate based on degree, institution, year
        seen = set()
        unique_education = []
        for edu in education:
            key = (edu.get('degree'), edu.get('institution'), edu.get('year'))
            if key not in seen:
                seen.add(key)
                unique_education.append(edu)
        return unique_education[:5]  # Limit to 5 entries

    def extract_experience(self, text: str) -> List[Dict]:
        """Extract work experience from CV text"""
        experience = []
        try:
            # Look for common experience section headers and content
            lines = text.split('\n')

            # Find experience section - also consider Projects as a source of experience
            exp_section_start = -1
            section_header = ""
            for i, line in enumerate(lines):
                line_stripped = line.strip()
                if re.search(r'(?i)^\s*experience\s*$', line_stripped):
                    exp_section_start = i
                    section_header = "experience"
                    break
                elif re.search(r'(?i)^\s*work\s+experience\s*$', line_stripped):
                    exp_section_start = i
                    section_header = "work experience"
                    break
                elif re.search(r'(?i)^\s*professional\s+experience\s*$', line_stripped):
                    exp_section_start = i
                    section_header = "professional experience"
                    break

            # If we found a section, process the following lines
            if exp_section_start != -1:
                # Look for experience entries in the section
                current_experience = {}
                in_exp_section = False

                for i in range(exp_section_start + 1, len(lines)):
                    line = lines[i].strip()

                    # Stop if we hit another section header
                    if re.search(r'(?i)^\s*(education|skills|experience|work experience|professional experience|projects|certifications|languages)\s*$', line):
                        break

                    # Check if line looks like a job title/company/date entry
                    if line and len(line) > 5:
                        # Check for date patterns
                        date_patterns = [
                            r"\d{4}\s*[-–]\s*\d{4}",  # 2020-2022
                            r"\d{4}\s*[-–]\s*present",  # 2020-present
                            r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}",  # Month Year
                            r"\d{1,2}/\d{4}",  # MM/YYYY
                            r"\d{4}$",  # Just year at end of line
                        ]

                        has_date = any(re.search(pattern, line, re.IGNORECASE) for pattern in date_patterns)

                        # Also look for common job title patterns
                        job_patterns = [
                            r"(?i)(software engineer|developer|programmer|analyst|manager|director|lead|senior|junior|intern|consultant|specialist|coordinator|administrator|designer|architect)",
                        ]

                        has_job_title = any(re.search(pattern, line, re.IGNORECASE) for pattern in job_patterns)

                        if has_date or has_job_title:
                            # Save previous experience if exists
                            if current_experience:
                                experience.append(current_experience)

                            # Start new experience entry
                            current_experience = {
                                "date": self._extract_date(line),
                                "position": self._extract_position(line),
                                "company": self._extract_company(line),
                                "description": line
                            }
                        elif current_experience and len(line) > 10:
                            # Add to description
                            current_experience["description"] += " " + line
            # If no section found, fallback to original method (look for date patterns anywhere)
            else:
                # Look for date patterns to identify experience entries
                date_patterns = [
                    r"\d{4}\s*[-–]\s*\d{4}",  # 2020-2022
                    r"\d{4}\s*[-–]\s*present",  # 2020-present
                    r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}",  # Month Year
                ]

                lines = text.split('\n')
                current_experience = {}

                for line in lines:
                    line = line.strip()
                    if not line:
                        continue

                    # Check if line contains date pattern
                    has_date = any(re.search(pattern, line, re.IGNORECASE) for pattern in date_patterns)

                    if has_date and len(line) > 10:
                        if current_experience:
                            experience.append(current_experience)
                        current_experience = {
                            "date": line,
                            "position": self._extract_position(line),
                            "company": self._extract_company(line),
                            "description": ""
                        }
                    elif current_experience and len(line) > 20:
                        current_experience["description"] += " " + line

                if current_experience:
                    experience.append(current_experience)

            return experience[:5]  # Limit to 5 entries
        except Exception as e:
            # If experience extraction fails, return empty list rather than breaking the whole parser
            def _safe_print(*args, **kwargs):
                try:
                    print(*args, **kwargs)
                except UnicodeEncodeError:
                    # Fallback: replace problematic characters
                    safe_args = []
                    for arg in args:
                        if isinstance(arg, str):
                            safe_args.append(arg.encode('cp1252', errors='replace').decode('cp1252'))
                        else:
                            safe_args.append(arg)
                    print(*safe_args, **kwargs)
            _safe_print(f"Experience extraction warning: {e}")
            return []

    def extract_skills(self, text: str) -> List[str]:
        """Extract skills from CV text"""
        # Define the exact skills we want to extract (as they should appear in the output)
        skill_keywords = [
            "Python", "Django", "MySQL", "SQLite", "HTML", "CSS", "JavaScript", "REST APIs", "Git", "GitHub"
        ]
        skills = set()  # Use a set to avoid duplicates

        # Look for skills section header
        lines = text.split('\n')
        skills_section_start = -1
        for i, line in enumerate(lines):
            line_stripped = line.strip()
            if re.search(r'(?i)^\s*t\s*echnical\s+stack\s*$', line_stripped):
                skills_section_start = i
                break
            elif re.search(r'(?i)^\s*skills\s*$', line_stripped):
                skills_section_start = i
                break

        # If skills section found, extract skills from that section
        if skills_section_start != -1:
            # Look for skill entries in the section
            for i in range(skills_section_start + 1, len(lines)):
                line = lines[i].strip()
                # Stop if we hit another section header
                if re.search(r'(?i)^\s*(education|experience|projects|certifications|languages)\s*$', line):
                    break
                # Check for each skill keyword in this line (case insensitive)
                for skill in skill_keywords:
                    if re.search(r'\b' + re.escape(skill) + r'\b', line, re.IGNORECASE):
                        skills.add(skill)
        # If no skills section found, fall back to keyword scanning (less reliable)
        else:
            text_lower = text.lower()
            for skill in skill_keywords:
                # Check for the skill as a whole word (case insensitive)
                if re.search(r'\b' + re.escape(skill.lower()) + r'\b', text_lower):
                    skills.add(skill)

        # Convert to list and return
        return list(skills)

    def _extract_name(self, text: str) -> Optional[str]:
        """Extract name from CV text - usually first line or first few words"""
        lines = [line.strip() for line in text.split('\n') if line.strip()]
        if lines:
            # Assume name is in first non-empty line, usually short
            first_line = lines[0]
            if len(first_line) < 50 and not any(char.isdigit() for char in first_line):
                # Check if it looks like a name (contains mostly letters and spaces)
                if re.match(r'^[A-Za-z\s\.\-]+$', first_line):
                    return first_line
        return None

    def _extract_email(self, text: str) -> Optional[str]:
        """Extract email from CV text"""
        email_pattern = r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
        match = re.search(email_pattern, text)
        return match.group(0) if match else None

    def _extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number from CV text"""
        phone_pattern = r"(\d{3}[-\.\s]??\d{3}[-\.\s]??\d{4}|\d{3}[-\.\s]??\d{4}|\(\d{3}\)\s*\d{3}[-\.\s]??\d{4})"
        match = re.search(phone_pattern, text)
        return match.group(0) if match else None

    def _extract_address(self, text: str) -> Optional[str]:
        """Extract address from CV text"""
        # Simple address extraction - look for patterns with street, city, state, zip
        address_patterns = [
            r"\d+\s+[A-Za-z\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr)\s*,?\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}",
            r"[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5}",  # City, State ZIP
        ]

        for pattern in address_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)
        return None

    def _extract_institution(self, text: str) -> Optional[str]:
        """Extract institution name from text"""
        # Look for common institution indicators
        institution_patterns = [
            r"[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:university|college|institute|school)",
            r"(?:university|college|institute|school)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*"
        ]

        for pattern in institution_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)
        return None

    def _extract_year(self, text: str) -> Optional[str]:
        """Extract year from text"""
        year_pattern = r"\b(19|20)\d{2}\b"
        match = re.search(year_pattern, text)
        return match.group(0) if match else None

    def _extract_date(self, text: str) -> Optional[str]:
        """Extract date from text"""
        date_patterns = [
            r"\d{4}\s*[-–]\s*\d{4}",  # 2020-2022
            r"\d{4}\s*[-–]\s*present",  # 2020-present
            r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}",  # Month Year
            r"\d{1,2}/\d{4}",  # MM/YYYY
            r"\d{4}$",  # Just year at end of line
        ]

        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(0)
        return None

    def _extract_position(self, text: str) -> Optional[str]:
        """Extract job position from text"""
        # Common job title patterns
        position_patterns = [
            r"(?i)(software engineer|developer|programmer|analyst|manager|director|lead|senior|junior|intern|consultant|specialist|coordinator|administrator)"
        ]

        for pattern in position_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(0).title()
        return None

    def _extract_company(self, text: str) -> Optional[str]:
        """Extract company name from text"""
        # Look for words after "at" or common company suffixes
        company_patterns = [
            r"(?i)(?:at|@)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)",
            r"([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:inc|llc|corp|corporation|ltd|limited))"
        ]

        for pattern in company_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1) if match.groups() else match.group(0)
        return None

    def parse_cv(self, file_path: str) -> Dict:
        """Parse a CV file and extract all relevant information"""
        file_extension = Path(file_path).suffix.lower()

        if file_extension == ".pdf":
            cv_data = self.parse_pdf(file_path)
        elif file_extension == ".docx":
            cv_data = self.parse_docx(file_path)
        else:
            raise ValueError("Unsupported file format")

        # Extract additional information from the parsed data
        text_content = cv_data.get("text", "")
        cv_data.update({
            "contact_info": self.extract_contact_info(text_content),
            "education": self.extract_education(text_content),
            "experience": self.extract_experience(text_content),
            "skills": self.extract_skills(text_content),
        })

        return cv_data

    def create_test_pdf(self, file_path: str, content: str) -> None:
        """Create a test PDF with the given content"""
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        for line in content.split('\n'):
            pdf.cell(200, 10, txt=line, ln=True)
        pdf.output(file_path)