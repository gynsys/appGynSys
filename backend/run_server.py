#!/usr/bin/env python3
"""
Temporary script to run the server
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from app.main import app
import uvicorn

if __name__ == "__main__":
    print("Starting GynSys Backend Server...")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")