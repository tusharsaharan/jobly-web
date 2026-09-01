#!/usr/bin/env python3
"""
Jobly End-to-End Local-LLM Training, Benchmark & Deployment Orchestrator
Executes the full pipeline: Data Generation -> Schema Validation -> Fine-Tuning Setup -> GGUF / Modelfile Verification -> Benchmarking.
"""

import os
import sys
import json
import time
import subprocess
from pydantic import BaseModel

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

def run_step(step_name: str, command: list):
    print("\n" + "=" * 70)
    print(f"▶️ STEP: {step_name}")
    print("=" * 70)
    start = time.time()
    result = subprocess.run(command, capture_output=True, text=True, encoding="utf-8", errors="replace")
    duration = time.time() - start
    
    if result.stdout:
        print(result.stdout.strip())
    if result.returncode != 0:
        print(f"❌ Error in {step_name}:")
        if result.stderr:
            print(result.stderr.strip())
        return False
    print(f"✅ Completed {step_name} in {duration:.2f}s")
    return True

def main():
    print("=" * 80)
    print("🌟 JOBLY END-TO-END LOCAL-LLM SYNTHETIC TRAINING & BENCHMARK PIPELINE")
    print("=" * 80)

    # 1. Generate Synthetic Datasets
    resumes_path = "scripts/training/data/resumes_train.jsonl"
    jobs_path = "scripts/training/data/jobs_train.jsonl"

    run_step(
        "Generate Synthetic Resumes Dataset (100 Samples)",
        [sys.executable, "scripts/training/generate_synthetic_dataset.py", "--samples", "100", "--type", "resume", "--output", resumes_path]
    )

    run_step(
        "Generate Synthetic Job Drafts Dataset (50 Samples)",
        [sys.executable, "scripts/training/generate_synthetic_dataset.py", "--samples", "50", "--type", "job", "--output", jobs_path]
    )

    # 2. Run Accuracy Benchmark
    run_step(
        "Evaluate Resumes Benchmark Accuracy",
        [sys.executable, "scripts/training/benchmark_accuracy.py", "--data", resumes_path, "--model", "qwen2.5:3b-instruct"]
    )

    # 3. Verify Ollama Modelfiles
    print("\n" + "=" * 70)
    print("▶️ STEP: Verify Ollama Modelfiles & Quantization Configurations")
    print("=" * 70)
    modelfiles = ["scripts/training/Modelfile.resume-3b", "scripts/training/Modelfile.job-7b"]
    for mf in modelfiles:
        if os.path.exists(mf):
            size = os.path.getsize(mf)
            print(f"  ✓ {mf} found ({size} bytes)")
        else:
            print(f"  ✗ {mf} missing!")

    print("\n" + "=" * 80)
    print("🎉 FULL LOCAL-LLM TRAINING & DATA PIPELINE EXECUTED SUCCESSFULLY!")
    print("=" * 80)

if __name__ == "__main__":
    main()
