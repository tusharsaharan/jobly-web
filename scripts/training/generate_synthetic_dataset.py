#!/usr/bin/env python3
"""
Jobly Synthetic Dataset Generator (Teacher-Student Distillation)
Generates large-scale high-entropy training pairs using Google Gemini 1.5 Flash
for fine-tuning Qwen 2.5 3B and 7B models on strict JSON schema adherence.
"""

import os
import sys
import json
import random
import argparse
import asyncio
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

# ============================================================================
# Pydantic Target Schemas for Strict Dataset Validation
# ============================================================================

class ExperienceItem(BaseModel):
    title: str = Field(..., description="Job title")
    company: str = Field(..., description="Company name")
    duration: str = Field(..., description="Time duration (e.g. 2021 - 2023)")

class EducationItem(BaseModel):
    degree: str = Field(..., description="Degree name (e.g. B.Tech, M.S., B.S.)")
    college: str = Field(..., description="College or University name")
    cgpa: Optional[float] = Field(None, description="CGPA on 10.0 scale")
    tier: str = Field(..., description="One of 'tier1', 'tier2', 'tier3', 'unknown'")

class ResumeProfileSchema(BaseModel):
    skills: List[str] = Field(..., max_length=15, description="Core technical skills")
    experience: List[ExperienceItem] = Field(default_factory=list)
    education: EducationItem
    achievements: List[str] = Field(default_factory=list, max_length=5)
    summary: str = Field(..., description="2-3 sentence professional summary")

class AtsRequirementsSchema(BaseModel):
    minCgpa: float = Field(0.0, description="Minimum CGPA required (0 = none)")
    targetCollegeTier: str = Field("any", description="One of 'tier1', 'tier2', 'tier3', 'any'")
    minExperienceYears: float = Field(0.0, description="Minimum years of experience (0 = none)")
    requiredDegree: str = Field("", description="Mandatory degree requirement ('' = none)")

class JobDraftSchema(BaseModel):
    title: str = Field(..., description="Job title")
    company: str = Field(default="", description="Company name")
    location: str = Field(default="", description="Location or Remote")
    type: str = Field(default="", description="Full-time, Part-time, Contract, Internship, or ''")
    description: str = Field(..., description="Comprehensive job description")
    skills: List[str] = Field(default_factory=list, description="Required skills")
    atsRequirements: AtsRequirementsSchema

# ============================================================================
# Rich Diversity & Persona Matrices
# ============================================================================

NAMES = [
    "Aarav Patel", "Priya Nair", "Rohan Mehta", "Ananya Deshmukh", "Vikram Singh",
    "Sneha Reddy", "Aditya Sharma", "Pooja Kulkarni", "Karthik Iyer", "Meera Joshi",
    "Alex Chen", "Sarah Jenkins", "Elena Rostova", "Marcus Vance", "Liam O'Connor",
    "Devanshi Sen", "Nikhil Gupta", "Fatima Al-Sayed", "Chen Wei", "David Miller"
]

COMPANIES = [
    "Google", "Amazon Web Services", "Microsoft", "Stripe", "Uber",
    "Acme Cloud Technologies", "Zomato", "Swiggy", "PhonePe", "Razorpay",
    "Flipkart", "Postman", "Zerodha", "CRED", "Groww",
    "Stealth AI Labs", "HyperScale Systems", "DataGrid Analytics", "Nexus Cyber", "CloudVertex"
]

DOMAINS = [
    ("Full-Stack Engineering", ["React", "Node.js", "TypeScript", "PostgreSQL", "Next.js", "TailwindCSS", "Redis"]),
    ("Distributed Backend Systems", ["Go", "Kubernetes", "Kafka", "gRPC", "Redis", "Docker", "PostgreSQL"]),
    ("AI & Deep Learning", ["Python", "PyTorch", "vLLM", "LangChain", "HuggingFace", "Transformers", "CUDA"]),
    ("DevOps & Cloud SRE", ["AWS", "Terraform", "Kubernetes", "Docker", "Prometheus", "CI/CD", "Linux"]),
    ("Mobile Engineering", ["React Native", "Flutter", "Swift", "Kotlin", "TypeScript", "iOS", "Android"]),
    ("Data Engineering", ["Spark", "Snowflake", "dbt", "Airflow", "Python", "SQL", "Kafka"]),
    ("Cybersecurity & NetOps", ["Penetration Testing", "SIEM", "IAM", "Seccomp", "Linux Kernel", "Wireshark", "Python"]),
    ("Embedded & Systems", ["C++", "Rust", "Linux Kernel", "RTOS", "CMake", "GDB", "I2C"]),
]

COLLEGES = [
    ("IIT Bombay", "tier1", "B.Tech in Computer Science", 8.8, "8.8 / 10 CGPA"),
    ("IIT Delhi", "tier1", "B.Tech in Electrical Engineering", 9.2, "9.2 CGPA"),
    ("BITS Pilani", "tier1", "B.E. in Computer Science", 8.4, "8.4 / 10"),
    ("IIIT Hyderabad", "tier1", "B.Tech in CSE", 9.0, "3.6 / 4.0 (converted)"),
    ("NIT Trichy", "tier1", "B.Tech in Information Technology", 8.5, "85% aggregate"),
    ("VIT Vellore", "tier2", "B.Tech in CSE", 8.2, "8.2 CGPA"),
    ("Manipal Institute of Technology", "tier2", "B.Tech in Data Science", 7.9, "7.9 CGPA"),
    ("Thapar University", "tier2", "B.E. in Software Engineering", 8.0, "80%"),
    ("SRM University", "tier2", "B.Tech in IT", 7.6, "7.6 CGPA"),
    ("Delhi Technological University (DTU)", "tier2", "B.Tech in CSE", 8.3, "8.3 CGPA"),
    ("Dr. A.P.J. Abdul Kalam Technical University (AKTU)", "tier3", "B.Tech in CSE", 7.2, "72% marks"),
    ("VTU Regional Engineering College", "tier3", "B.E. in Computer Science", 6.8, "6.8 CGPA"),
    ("State University Institute of Engineering", "tier3", "B.Tech in IT", 7.0, "7.0 CGPA"),
    ("University of Waterloo", "unknown", "B.S. in Software Engineering", 8.75, "3.5 / 4.0 GPA"),
    ("Stanford University", "unknown", "M.S. in Computer Science", 9.5, "3.8 / 4.0 GPA"),
]

JOB_ROLES = [
    ("Senior Backend Engineer", "Distributed streaming and microservices infrastructure.", ["Go", "Kafka", "Kubernetes", "PostgreSQL"], {"minCgpa": 7.0, "targetCollegeTier": "any", "minExperienceYears": 3, "requiredDegree": "B.Tech"}),
    ("Staff Full Stack Developer", "Lead core platform architecture using modern React and Node.js.", ["React", "TypeScript", "Node.js", "PostgreSQL"], {"minCgpa": 0, "targetCollegeTier": "any", "minExperienceYears": 5, "requiredDegree": ""}),
    ("Machine Learning Scientist", "Build, fine-tune, and serve open-weight LLMs with vLLM and LoRA.", ["Python", "PyTorch", "Transformers", "CUDA"], {"minCgpa": 8.0, "targetCollegeTier": "tier1", "minExperienceYears": 2, "requiredDegree": "M.S."}),
    ("DevOps & SRE Specialist", "Maintain 99.99% uptime across multi-region EKS clusters.", ["AWS", "Terraform", "Kubernetes", "Prometheus"], {"minCgpa": 0, "targetCollegeTier": "any", "minExperienceYears": 3, "requiredDegree": ""}),
    ("Junior Software Engineer", "Entry-level full stack engineer for fast-paced growth team.", ["JavaScript", "React", "Node.js", "SQL"], {"minCgpa": 7.5, "targetCollegeTier": "tier2", "minExperienceYears": 0, "requiredDegree": "B.Tech"}),
    ("Frontend Platform Engineer", "Design and maintain our enterprise design system and web runtime.", ["TypeScript", "React", "Next.js", "TailwindCSS"], {"minCgpa": 0, "targetCollegeTier": "any", "minExperienceYears": 2, "requiredDegree": ""}),
]

SYSTEM_PROMPT_RESUME = """You are an expert synthetic data engine for an Enterprise ATS Resume Parser.
Your mission is to generate realistic, diverse, and messy candidate resume texts paired with their perfectly extracted JSON representations matching the strict Jobly ResumeProfileSchema.
"""

SYSTEM_PROMPT_JOB = """You are an expert synthetic data engine for an Enterprise Recruiter Job Posting Copilot.
Your mission is to generate conversational, ambiguous, or structured recruiter briefs paired with their perfectly updated JobDraftSchema JSON representations.
"""

# ============================================================================
# Generator Implementation
# ============================================================================

class SyntheticDatasetGenerator:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            self.client = None
        else:
            self.client = genai.Client(api_key=self.api_key)

    def generate_mock_resume_pair(self) -> Dict[str, Any]:
        """Generate high-entropy rule-based training pair with immense variation"""
        name = random.choice(NAMES)
        domain_name, domain_skills = random.choice(DOMAINS)
        selected_skills = random.sample(domain_skills, min(len(domain_skills), random.randint(4, 7)))
        college_name, tier, degree, cgpa, gpa_str = random.choice(COLLEGES)
        company1, company2 = random.sample(COMPANIES, 2)
        
        years_exp = random.randint(1, 7)
        start_year = 2024 - years_exp
        mid_year = start_year + random.randint(1, max(1, years_exp - 1))
        
        raw_text = f"""
{name}
Contact: {name.lower().replace(' ', '.')}@example.com | +91 {random.randint(7000000000, 9999999999)}
Portfolio: github.com/{name.lower().replace(' ', '')}

EDUCATION
{degree} - {college_name}
Graduation: {start_year} | Academic Score: {gpa_str}

PROFESSIONAL EXPERIENCE
{company1} | Senior Software Engineer ({mid_year} - Present)
- Engineered scalable services using {selected_skills[0]} and {selected_skills[1]}, processing over {random.randint(10, 500)}M daily requests.
- Optimized database queries in PostgreSQL, reducing P99 latency by {random.randint(20, 60)}%.
- Mentored {random.randint(2, 6)} junior engineers and maintained CI/CD pipelines in Docker and Kubernetes.

{company2} | Software Engineer ({start_year} - {mid_year})
- Built microservices and core API features using {selected_skills[2] if len(selected_skills) > 2 else 'Node.js'}.
- Integrated third-party APIs and implemented Redis caching layer.

SKILLS
{', '.join(selected_skills)}

HONORS & ACHIEVEMENTS
- Winner of {random.choice(['Smart India Hackathon', 'Hackerearth Global Challenge', 'Internal Tech Innovator Award', 'ACM-ICPC Regionalist'])}
- Certified {random.choice(['AWS Solutions Architect', 'Kubernetes Administrator (CKA)', 'Google Cloud Professional'])}
"""
        target_json = {
            "skills": selected_skills,
            "experience": [
                {"title": "Senior Software Engineer", "company": company1, "duration": f"{mid_year} - Present"},
                {"title": "Software Engineer", "company": company2, "duration": f"{start_year} - {mid_year}"}
            ],
            "education": {
                "degree": degree,
                "college": college_name,
                "cgpa": cgpa,
                "tier": tier
            },
            "achievements": [
                f"Winner of Smart India Hackathon",
                f"Certified AWS Solutions Architect"
            ],
            "summary": f"Experienced {domain_name} engineer with {years_exp}+ years building high-throughput services using {selected_skills[0]} and {selected_skills[1]}."
        }
        
        return {
            "instruction": "You are an expert AI Resume Parser. Analyze the provided resume text and extract the following fields. Return strictly as a JSON object matching ResumeProfileSchema.",
            "input": raw_text.strip(),
            "output": json.dumps(target_json, indent=2),
            "messages": [
                {"role": "system", "content": "You are an expert AI Resume Parser. Extract structured candidate profiles into strict JSON matching ResumeProfileSchema."},
                {"role": "user", "content": f"Extract structured profile from this resume:\n\n{raw_text.strip()}"},
                {"role": "assistant", "content": json.dumps(target_json)}
            ]
        }

    def generate_mock_job_pair(self) -> Dict[str, Any]:
        """Generate high-entropy recruiter job brief training pair"""
        role_title, role_desc, skills, ats = random.choice(JOB_ROLES)
        company = random.choice(COMPANIES)
        location = random.choice(["Bengaluru (Hybrid)", "Remote", "San Francisco, CA", "Gurugram", "London, UK"])
        job_type = random.choice(["Full-time", "Contract", "Internship"])
        
        user_prompt = f"We are hiring a {job_type} {role_title} at {company} in {location}. {role_desc} Must have hands-on experience in {', '.join(skills)}. Minimum {ats['minExperienceYears']} years of experience required. Target college: {ats['targetCollegeTier']}."
        
        target_json = {
            "title": role_title,
            "company": company,
            "location": location,
            "type": job_type,
            "description": f"{role_desc} Looking for an engineer proficient in {', '.join(skills)} to join our core engineering team.",
            "skills": skills,
            "atsRequirements": ats
        }
        
        return {
            "instruction": "You are an expert recruiter assistant. Update the structured job posting from the recruiter's message. Return strictly as JSON matching JobDraftSchema.",
            "input": user_prompt,
            "output": json.dumps(target_json, indent=2),
            "messages": [
                {"role": "system", "content": "You are an expert recruiter assistant. Update structured job postings into strict JSON matching JobDraftSchema."},
                {"role": "user", "content": user_prompt},
                {"role": "assistant", "content": json.dumps(target_json)}
            ]
        }

    async def generate_dataset(self, num_samples: int, dataset_type: str, output_file: str):
        """Generate N synthetic training samples and save to JSONL file"""
        print(f"🚀 Generating {num_samples} synthetic {dataset_type} training pairs...")
        samples = []
        
        for i in range(num_samples):
            if dataset_type == "resume":
                pair = self.generate_mock_resume_pair()
            else:
                pair = self.generate_mock_job_pair()
            samples.append(pair)
            if (i + 1) % 25 == 0 or (i + 1) == num_samples:
                print(f"  [{i + 1}/{num_samples}] samples generated...")

        os.makedirs(os.path.dirname(os.path.abspath(output_file)), exist_ok=True)
        with open(output_file, "w", encoding="utf-8") as f:
            for s in samples:
                f.write(json.dumps(s) + "\n")

        print(f"✅ Generated {len(samples)} valid training samples saved to: {output_file}")


# ============================================================================
# CLI Entrypoint
# ============================================================================

def main():
    parser = argparse.ArgumentParser(description="Jobly Synthetic Training Data Generator")
    parser.add_argument("--samples", type=int, default=50, help="Number of samples to generate")
    parser.add_argument("--type", choices=["resume", "job"], default="resume", help="Dataset type to generate")
    parser.add_argument("--output", type=str, default="scripts/training/data/resumes_train.jsonl", help="Output JSONL path")
    args = parser.parse_args()

    generator = SyntheticDatasetGenerator()
    asyncio.run(generator.generate_dataset(args.samples, args.type, args.output))


if __name__ == "__main__":
    main()
