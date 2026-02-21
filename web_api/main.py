from fastapi import FastAPI, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import subprocess
import uuid
import os
import re

app = FastAPI(title="Archive.org Downloader API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Since it's personal use local network
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DownloadRequest(BaseModel):
    url: str
    email: str
    password: str

# Dictionary to hold job status and details
jobs = {}

# Directory for downloaded PDFs
DOWNLOAD_DIR = "../downloads"
os.makedirs(DOWNLOAD_DIR, exist_ok=True)

def run_download_script(job_id: str, email: str, password: str, url: str):
    jobs[job_id] = {"status": "running", "output": "", "file": None}
    try:
        command = [
            "python", "../archive-org-downloader.py",
            "-e", email,
            "-p", password,
            "-u", url,
            "-d", DOWNLOAD_DIR
        ]
        # Run the script and capture output
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1, universal_newlines=True)
        
        output_lines = []
        for line in process.stdout:
            output_lines.append(line)
            jobs[job_id]["output"] = "".join(output_lines[-20:]) # Keep last 20 lines for logs
            
            # Check for the PDF saved log
            match = re.search(r'\[\+\] PDF saved as "(.*?)"', line)
            if match:
                jobs[job_id]["file"] = match.group(1)

        process.wait()
        
        if process.returncode == 0:
            jobs[job_id]["status"] = "completed"
        else:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["output"] = f"Process failed with code {process.returncode}. Log: {''.join(output_lines[-10:])}"
            
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["output"] = str(e)


@app.post("/api/download")
async def start_download(req: DownloadRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    background_tasks.add_task(run_download_script, job_id, req.email, req.password, req.url)
    return {"job_id": job_id, "status": "started"}

@app.get("/api/status/{job_id}")
async def check_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    return jobs[job_id]

@app.get("/api/files/{filename}")
async def get_file(filename: str):
    file_path = os.path.join(DOWNLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path, filename=filename, media_type="application/pdf")
