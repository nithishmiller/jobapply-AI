import sys
import os
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from ai.matcher import compute_match, _extract_skill_set_from_cv, _extract_education_level, _extract_job_required_level
from database.models import CV, Job

# Create dummy CV and Job objects (instances of the ORM classes)
cv = CV()
cv.skills = ["Python", "Django", "PostgreSQL", "Git"]
cv.education = [
    {"degree": "Bachelor", "institution": "Test University", "year": "2020"},
    {"degree": "Master", "institution": "Test Uni", "year": "2022"}
]
cv.experience = [
    {"date": "2020-2022", "position": "Software Engineer", "company": "Test Corp", "description": "Developed web apps."},
    {"date": "2022-2024", "position": "Senior Engineer", "company": "Test Corp", "description": "Led team."}
]

job = Job()
job.skills = "Python, Django, AWS, Docker"
job.experience_level = "Mid"
job.requirements = "Experience with Python and Django"
job.preferred_requirements = "Experience with AWS"

print("Testing skill extraction from CV:")
skills_cv = _extract_skill_set_from_cv(cv)
print(f"CV skills: {skills_cv}")

print("Testing education level extraction:")
edu_level = _extract_education_level(cv)
print(f"CV education level: {edu_level} (0=no edu, 1=HS, 2=Bach, 3=Master, 4=PhD)")

print("Testing job required level extraction:")
job_level = _extract_job_required_level(job)
print(f"Job required level: {job_level} (1=entry,2=mid,3=senior)")

print("Computing match...")
score, explanation = compute_match(cv, job)
print(f"Match score: {score:.2f}")
print(f"Explanation: {explanation}")

# Expect a reasonable score > 0.5
if score > 0.3:
    print("Match logic appears to be working.")
else:
    print("Warning: match score is low; may need to adjust weights.")

# Test edge cases: empty CV
cv_empty = CV()
cv_empty.skills = []
cv_empty.education = []
cv_empty.experience = []
score_empty, expl_empty = compute_match(cv_empty, job)
print(f"Empty CV score: {score_empty:.2f}")
print(f"Explanation: {expl_empty}")

print("Match logic verification completed.")