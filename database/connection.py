from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from .models import Base

DATABASE_URL = "sqlite:///./jobapply.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Migration: add missing columns to existing tables and create missing tables
def migrate_database():
    inspector = inspect(engine)
    # Ensure cvs table exists and has required columns
    if not inspector.has_table("cvs"):
        # Table doesn't exist yet, let metadata.create_all handle it
        pass
    else:
        existing_columns = [col["name"] for col in inspector.get_columns("cvs")]
        required_columns = {
            "raw_text": "TEXT",
            "contact_info": "JSON",
            "education": "JSON",
            "experience": "JSON",
            "skills": "JSON"
        }

        with engine.connect() as conn:
            for col_name, col_type in required_columns.items():
                if col_name not in existing_columns:
                    try:
                        # SQLite doesn't support IF NOT EXISTS for ADD COLUMN, so we try and catch the error
                        conn.execute(text(f"ALTER TABLE cvs ADD COLUMN {col_name} {col_type}"))
                        conn.commit()
                    except Exception as e:
                        # Column might already exist or other error - ignore if it's about duplicate column
                        if "duplicate column name" not in str(e).lower():
                            print(f"Warning: Could not add column {col_name}: {e}")

    # Ensure jobs, applications, matches tables exist
    required_tables = {
        "jobs": """
            CREATE TABLE jobs (
                id INTEGER PRIMARY KEY,
                title TEXT NOT NULL,
                company TEXT,
                location TEXT,
                country TEXT,
                state TEXT,
                remote BOOLEAN DEFAULT 0,
                employment_type TEXT,
                salary TEXT,
                salary_min INTEGER,
                salary_max INTEGER,
                currency TEXT,
                description TEXT,
                requirements TEXT,
                preferred_requirements TEXT,
                skills TEXT,
                url TEXT,
                source TEXT,
                posted_date DATETIME,
                language_requirements TEXT,
                experience_level TEXT,
                visa_sponsorship BOOLEAN DEFAULT 0,
                relocation_support BOOLEAN DEFAULT 0,
                created_at DATETIME
            )
        """,
        "applications": """
            CREATE TABLE applications (
                id INTEGER PRIMARY KEY,
                cv_id INTEGER NOT NULL,
                job_id INTEGER NOT NULL,
                status TEXT DEFAULT 'applied',
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cv_id) REFERENCES cvs (id),
                FOREIGN KEY (job_id) REFERENCES jobs (id)
            )
        """,
        "matches": """
            CREATE TABLE matches (
                id INTEGER PRIMARY KEY,
                cv_id INTEGER NOT NULL,
                job_id INTEGER NOT NULL,
                score INTEGER,
                explanation TEXT,
                strengths JSON,
                gaps JSON,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cv_id) REFERENCES cvs (id),
                FOREIGN KEY (job_id) REFERENCES jobs (id)
            )
        """
    }

    with engine.connect() as conn:
        for table_name, create_sql in required_tables.items():
            if not inspector.has_table(table_name):
                try:
                    conn.execute(text(create_sql))
                    conn.commit()
                except Exception as e:
                    # Ignore if table already exists (race condition)
                    if "already exists" not in str(e).lower():
                        print(f"Warning: Could not create table {table_name}: {e}")
            else:
                # Table exists, check for missing columns and add them
                existing_columns = [col["name"] for col in inspector.get_columns(table_name)]
                if table_name == "matches":
                    # Check for strengths and gaps columns
                    if "strengths" not in existing_columns:
                        try:
                            conn.execute(text("ALTER TABLE matches ADD COLUMN strengths JSON"))
                            conn.commit()
                        except Exception as e:
                            if "duplicate column name" not in str(e).lower():
                                print(f"Warning: Could not add column strengths to matches: {e}")
                    if "gaps" not in existing_columns:
                        try:
                            conn.execute(text("ALTER TABLE matches ADD COLUMN gaps JSON"))
                            conn.commit()
                        except Exception as e:
                            if "duplicate column name" not in str(e).lower():
                                print(f"Warning: Could not add column gaps to matches: {e}")

# Run migration
migrate_database()