from fastapi import FastAPI

app = FastAPI(title="JobApply AI API")


@app.get("/")
def root():
    return {"message": "JobApply AI API is running"}


@app.get("/health")
def health():
    return {"status": "ok"}
