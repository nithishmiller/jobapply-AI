from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class CV(Base):
    __tablename__ = "cvs"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="uploaded")

    # Parsed CV data
    raw_text = Column(Text, nullable=True)
    contact_info = Column(JSON, nullable=True)
    education = Column(JSON, nullable=True)
    experience = Column(JSON, nullable=True)
    skills = Column(JSON, nullable=True)

    # Relationships
    applications = relationship("Application", back_populates="cv")
    matches = relationship("Match", back_populates="cv")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    company = Column(String, nullable=True)
    location = Column(String, nullable=True)
    country = Column(String, nullable=True)
    state = Column(String, nullable=True)
    remote = Column(Boolean, default=False)
    employment_type = Column(String, nullable=True)   # e.g., full-time, part-time, contract
    salary = Column(String, nullable=True)           # original raw string if provided
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    currency = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)       # free‑text or JSON‑encoded list
    preferred_requirements = Column(Text, nullable=True)
    skills = Column(Text, nullable=True)             # comma‑separated or JSON list
    url = Column(String, nullable=True)
    source = Column(String, nullable=True)           # e.g., "manual", "LinkedIn", "API"
    posted_date = Column(DateTime, nullable=True)
    language_requirements = Column(Text, nullable=True)
    experience_level = Column(String, nullable=True) # entry, mid, senior, etc.
    visa_sponsorship = Column(Boolean, default=False)
    relocation_support = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships (optional, for ORM convenience)
    applications = relationship("Application", back_populates="job")
    matches = relationship("Match", back_populates="job")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    status = Column(String, default="applied")   # applied, interviewing, offered, rejected, withdrawn, etc.
    applied_at = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text, nullable=True)
    cover_letter_text = Column(Text, nullable=True)   # Generated cover letter text
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    cv = relationship("CV", back_populates="applications")
    job = relationship("Job", back_populates="applications")


class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    cv_id = Column(Integer, ForeignKey("cvs.id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    score = Column(Integer, nullable=True)        # 0‑100 or 0.0‑1.0 as preferred
    explanation = Column(Text, nullable=True)    # brief text why the score was given
    strengths = Column(JSON, nullable=True)       # list of matching skills
    gaps = Column(JSON, nullable=True)            # list of missing skills
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    cv = relationship("CV", back_populates="matches")
    job = relationship("Job", back_populates="matches")