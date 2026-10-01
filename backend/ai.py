import os
import re
import json
import time
import logging
from dotenv import load_dotenv
from fastapi import HTTPException

logger = logging.getLogger("ai_resume_reviewer")

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))
load_dotenv()

try:
    # pyrefly: ignore [missing-import]
    from google import genai
    # pyrefly: ignore [missing-import]
    from google.genai import types
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False
    genai = None
    types = None
def get_shared_gemini_model() -> str:
    """
    Returns the central shared Gemini model configured in .env for evaluation workloads.
    Hierarchy: GEMINI_MODEL -> GEMINI_HR_EVALUATION_MODEL -> HR_EVALUATION_MODEL -> default.
    Changing GEMINI_MODEL (or GEMINI_HR_EVALUATION_MODEL) in .env automatically updates both
    Resume Reviewer and HR Interview without hardcoding.
    """
    return (
        os.getenv("GEMINI_MODEL")
        or os.getenv("GEMINI_HR_EVALUATION_MODEL")
        or os.getenv("HR_EVALUATION_MODEL")
        or "gemini-3.5-flash-lite"
    )

SUPPORTED_MODELS = [get_shared_gemini_model()]

def get_gemini_client():
    if not HAS_GENAI:
        raise HTTPException(
            status_code=500,
            detail="Google GenAI library is not installed on the backend server. Run 'pip install google-genai'."
        )
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY is not configured in environment variables on the backend server (Render.com). Please add GEMINI_API_KEY under Render Environment settings."
        )
    try:
        return genai.Client(api_key=api_key)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initialize Gemini Client: {str(e)}"
        )

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    """Extract clean plain text from PDF bytes using PyPDF/PyPDF2 or Gemini inline PDF parser."""
    # Try pypdf / PyPDF2
    try:
        import io
        import pypdf
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
        extracted = [page.extract_text() for page in reader.pages if page.extract_text()]
        if extracted:
            return "\n".join(extracted).strip()
    except Exception:
        pass

    try:
        import io
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(pdf_bytes))
        extracted = [page.extract_text() for page in reader.pages if page.extract_text()]
        if extracted:
            return "\n".join(extracted).strip()
    except Exception:
        pass

    # Gemini inline PDF parsing fallback
    try:
        client = get_gemini_client()
        contents = [
            types.Part.from_bytes(data=pdf_bytes, mime_type="application/pdf"),
            "Extract and clean all readable plain text from this resume PDF. Return ONLY the plain text of the resume."
        ]
        for model_name in SUPPORTED_MODELS:
            try:
                res = client.models.generate_content(model=model_name, contents=contents)
                if res and res.text:
                    return res.text.strip()
            except Exception:
                continue
    except Exception as e:
        print("Gemini PDF extraction warning:", e)

    # Basic regex text cleanup fallback
    try:
        import re
        raw = pdf_bytes.decode("latin1", errors="ignore")
        found = re.findall(r"\((.*?)\)", raw)
        if found and len(found) > 10:
            return " ".join([f for f in found if len(f) > 2])
    except Exception:
        pass

    return ""

def generate_gemini_json(client, contents, config=None):
    if not client:
        return None
    last_err = None
    for model_name in SUPPORTED_MODELS:
        for attempt in range(2):
            try:
                afc_disable = types.AutomaticFunctionCallingConfig(disable=True) if hasattr(types, "AutomaticFunctionCallingConfig") else None
                res_config = config or types.GenerateContentConfig(
                    response_mime_type="application/json",
                    automatic_function_calling=afc_disable
                )
                response = client.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=res_config
                )
                if response and response.text:
                    raw_text = response.text.strip()
                    if raw_text.startswith("```json"):
                        raw_text = raw_text[7:]
                    if raw_text.startswith("```"):
                        raw_text = raw_text[3:]
                    if raw_text.endswith("```"):
                        raw_text = raw_text[:-3]
                    return json.loads(raw_text.strip())
            except Exception as e:
                last_err = e
                err_str = str(e).lower()
                print(f"Gemini API error with model {model_name} (attempt {attempt+1}):", e)
                # Fallback retry without json mime-type enforcement if failed
                try:
                    retry_config = types.GenerateContentConfig(automatic_function_calling=afc_disable) if afc_disable else None
                    res_raw = client.models.generate_content(model=model_name, contents=contents, config=retry_config)
                    if res_raw and res_raw.text:
                        import re
                        match = re.search(r'\{.*\}', res_raw.text.strip(), re.DOTALL)
                        if match:
                            return json.loads(match.group(0))
                except Exception as e2:
                    print(f"Gemini raw fallback retry error with model {model_name}:", e2)

                if "429" in err_str or "quota" in err_str or "resource_exhausted" in err_str or "rate" in err_str:
                    time.sleep(1.5)
                    continue
                break

    if last_err:
        raise HTTPException(
            status_code=500,
            detail=f"Gemini AI API Error ({type(last_err).__name__}): {str(last_err)}. Please verify GEMINI_API_KEY in Render.com settings."
        )
    return None

def review_resume_with_gemini(resume_text: str, domain: str = "Software Engineering") -> dict:
    """
    Evaluates submitted resume strictly against the target domain using Gemini AI.
    ONE single request to the configured shared Gemini model.
    NO retries, NO fallback models, NO mock/sample data.
    Raises HTTPException(status_code=503, detail="AI review temporarily unavailable.") on failure.
    """
    client = get_gemini_client()
    model_name = get_shared_gemini_model()
    clean_domain = domain.strip() if domain and domain.strip() else "Software Engineering"

    prompt = f"""You are an expert technical recruiter and ATS evaluation specialist.
Evaluate the candidate's submitted resume strictly and exclusively against the target domain '{clean_domain}'.

Evaluation Requirements:
1. ATS Score (ats_score): An integer between 0 and 100 estimating how ATS-friendly and relevant the resume is for '{clean_domain}' (evaluating standard section organization, recognizable headings, readability, role/domain terminology, and ability for ATS parsers to identify key information).
2. Recruiter Assessment (recruiter_assessment): A concise, objective evaluation based ONLY on the actual resume text and selected domain.
3. Key Resume Strengths (strengths): A list of 2-5 actual strengths evidenced directly in the submitted resume text.
4. Recommended Recruiter Keywords (recommended_keywords): A list of 3-8 domain-specific keywords or skills relevant to '{clean_domain}' that the candidate should consider adding or strengthening if applicable. (Do not claim the candidate has these unless present in the resume).
5. AI Bullet Point Recommendations (bullet_recommendations): Up to 3 recommendations for weak or vague bullet points found in the submitted resume. For each:
   - "category": The improvement area (e.g. "Action & Impact", "Clarity & Detail", "Technical Scope").
   - "original": Exact or near-exact original bullet from the resume.
   - "revised": An improved professional revision. CRITICAL: Ground the revision ONLY in facts from the resume. Never invent projects, achievements, metrics, percentages, certifications, or experiences not present in the submitted resume.
   - "reason": A brief explanation of why the revision is stronger.

CRITICAL GROUNDING RULES:
- Evaluate ONLY the supplied resume text and target domain.
- Do NOT fabricate achievements, numbers, certifications, projects, or metrics.
- Return ONLY valid JSON adhering strictly to the schema below.

Target Domain:
\"\"\"
{clean_domain}
\"\"\"

Resume Text:
\"\"\"
{resume_text}
\"\"\""""

    schema: dict = {
        "type": "object",
        "properties": {
            "ats_score": {
                "type": "integer",
                "description": "0-100 ATS friendliness score"
            },
            "recruiter_assessment": {
                "type": "string",
                "description": "Concise objective recruiter assessment"
            },
            "strengths": {
                "type": "array",
                "items": {"type": "string"},
                "description": "List of actual candidate strengths from resume"
            },
            "recommended_keywords": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Recommended keywords for the target domain"
            },
            "bullet_recommendations": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "category": {"type": "string"},
                        "original": {"type": "string"},
                        "revised": {"type": "string"},
                        "reason": {"type": "string"}
                    },
                    "required": ["category", "original", "revised", "reason"]
                },
                "description": "Bullet point improvements"
            }
        },
        "required": ["ats_score", "recruiter_assessment", "strengths", "recommended_keywords", "bullet_recommendations"]
    }

    try:
        # EXACTLY ONE REQUEST. No retries, no second requests, no fallback model.
        afc_disable = types.AutomaticFunctionCallingConfig(disable=True) if hasattr(types, "AutomaticFunctionCallingConfig") else None
        res_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            automatic_function_calling=afc_disable
        )
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=res_config
        )
        if not response or not response.text:
            raise ValueError("Gemini returned empty response text")

        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        parsed = json.loads(raw_text.strip())
        if not isinstance(parsed, dict):
            raise ValueError("Response is not a valid JSON object")

        ats_score = parsed.get("ats_score")
        if ats_score is None:
            raise ValueError("Missing 'ats_score' in Gemini response")
        parsed["ats_score"] = max(0, min(100, int(round(float(ats_score)))))

        if not isinstance(parsed.get("recruiter_assessment"), str):
            raise ValueError("Invalid or missing 'recruiter_assessment' in Gemini response")

        if not isinstance(parsed.get("strengths"), list):
            parsed["strengths"] = []

        if not isinstance(parsed.get("recommended_keywords"), list):
            parsed["recommended_keywords"] = []

        raw_bullets = parsed.get("bullet_recommendations")
        if not isinstance(raw_bullets, list):
            parsed["bullet_recommendations"] = []
        else:
            valid_bullets = []
            for b in raw_bullets:
                if isinstance(b, dict) and "original" in b and "revised" in b:
                    valid_bullets.append({
                        "category": str(b.get("category", "Structure & Impact")),
                        "original": str(b.get("original", "")),
                        "revised": str(b.get("revised", "")),
                        "reason": str(b.get("reason", "Provides clearer phrasing."))
                    })
            parsed["bullet_recommendations"] = valid_bullets

        return parsed

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[review_resume_with_gemini] AI evaluation failed with model '{model_name}': {e}")
        raise HTTPException(
            status_code=503,
            detail="AI review temporarily unavailable."
        )


# Comprehensive catalog of industry technical and professional skills: { canonical: [aliases] }
TECHNICAL_SKILLS_CATALOG = {
    # Programming Languages
    "Python": ["python", "python3", "py"],
    "Java": ["java", "core java", "j2ee"],
    "C++": ["c++", "cpp"],
    "C#": ["c#", "csharp", "c-sharp"],
    "C": ["c language", "ansi c"],
    "JavaScript": ["javascript", "js", "ecmascript"],
    "TypeScript": ["typescript", "ts"],
    "Go": ["golang", "go language"],
    "Rust": ["rust", "rustlang"],
    "PHP": ["php"],
    "Ruby": ["ruby"],
    "Kotlin": ["kotlin"],
    "Swift": ["swift"],
    "SQL": ["sql", "structured query language", "pl/sql", "t-sql"],
    "HTML/CSS": ["html", "html5", "css", "css3"],
    "Bash": ["bash", "shell scripting", "shell script", "zsh"],

    # Web & Full Stack
    "React": ["react", "react.js", "reactjs"],
    "Next.js": ["next.js", "nextjs", "next js"],
    "Angular": ["angular", "angularjs", "angular.js"],
    "Vue.js": ["vue", "vue.js", "vuejs"],
    "Node.js": ["node.js", "nodejs", "node js"],
    "Express.js": ["express", "express.js", "expressjs"],
    "Django": ["django", "django rest framework", "drf"],
    "FastAPI": ["fastapi", "fast-api"],
    "Flask": ["flask"],
    "Spring Boot": ["spring boot", "springboot", "spring framework"],
    ".NET": [".net", "asp.net", "dotnet", ".net core"],
    "GraphQL": ["graphql"],
    "REST APIs": ["rest api", "rest apis", "restful", "restful api", "restful apis", "rest"],
    "Microservices": ["microservices", "microservice", "micro-services"],
    "Tailwind CSS": ["tailwind", "tailwind css", "tailwindcss"],
    "Redux": ["redux", "redux toolkit"],

    # Databases & Caching
    "PostgreSQL": ["postgresql", "postgres"],
    "MySQL": ["mysql"],
    "MongoDB": ["mongodb", "mongo"],
    "Redis": ["redis"],
    "SQLite": ["sqlite"],
    "Cassandra": ["cassandra"],
    "Elasticsearch": ["elasticsearch"],
    "Oracle": ["oracle db", "oracle database"],
    "Firebase": ["firebase", "firestore"],
    "Supabase": ["supabase"],

    # Cloud & DevOps
    "AWS": ["aws", "amazon web services", "ec2", "s3", "lambda"],
    "Azure": ["azure", "microsoft azure"],
    "Google Cloud": ["gcp", "google cloud", "google cloud platform"],
    "Docker": ["docker", "containerization", "containers"],
    "Kubernetes": ["kubernetes", "k8s"],
    "CI/CD": ["ci/cd", "ci-cd", "continuous integration", "continuous deployment"],
    "Jenkins": ["jenkins"],
    "GitHub Actions": ["github actions"],
    "Terraform": ["terraform"],
    "Linux": ["linux", "unix", "ubuntu"],
    "Git": ["git", "github", "gitlab"],

    # AI / ML / Data
    "Machine Learning": ["machine learning", "ml"],
    "Deep Learning": ["deep learning", "dl"],
    "Natural Language Processing": ["nlp", "natural language processing"],
    "Computer Vision": ["computer vision"],
    "PyTorch": ["pytorch"],
    "TensorFlow": ["tensorflow", "keras"],
    "Pandas": ["pandas"],
    "NumPy": ["numpy"],
    "Scikit-Learn": ["scikit-learn", "sklearn"],
    "Data Engineering": ["data engineering", "etl"],
    "Apache Spark": ["spark", "apache spark", "pyspark"],
    "Kafka": ["kafka", "apache kafka"],

    # CS Fundamentals & Methodologies
    "Data Structures & Algorithms": ["data structures", "algorithms", "dsa"],
    "System Design": ["system design", "distributed systems"],
    "Object-Oriented Programming": ["oop", "object oriented programming", "oops"],
    "Agile / Scrum": ["agile", "scrum", "kanban", "sprints"],
    "Unit Testing": ["unit testing", "test driven development", "tdd", "jest", "pytest", "junit"],
    "Web Security": ["cybersecurity", "security", "oauth", "jwt", "owasp"]
}


def extract_missing_skills(jd_text: str, resume_text: str) -> list:
    """
    Deterministically computes missing critical skills by scanning the actual Job Description
    and cross-referencing against the candidate's actual resume text.
    Skills clearly present in the resume are NEVER marked as missing.
    Zero mock/invented skills.
    """
    jd_lower = jd_text.lower()
    resume_lower = resume_text.lower()
    missing: list[str] = []

    def check_presence(term: str, target: str) -> bool:
        pattern = rf'(?<![\w#+.]){re.escape(term)}(?![\w#+.])'
        return bool(re.search(pattern, target))

    for canonical, aliases in TECHNICAL_SKILLS_CATALOG.items():
        # Check if the JD explicitly references this skill
        is_in_jd = any(check_presence(alias, jd_lower) for alias in aliases)
        if is_in_jd:
            # Check if candidate resume clearly contains the skill
            is_in_resume = any(check_presence(alias, resume_lower) for alias in aliases)
            if not is_in_resume:
                missing.append(canonical)

    return missing


def match_jd_with_gemini(*args, **kwargs) -> dict:
    """
    Matches candidate resume against a Job Description using the central shared Gemini model.
    Exactly ONE request. No retries, no fallback model, no fabricated data.
    The response provides ONLY:
      1. JD Match % (0-100)
      2. Alignment Summary
    Missing Critical Skills are computed deterministically by the backend.
    """
    # Accommodate both match_jd_with_gemini(jd_text, resume_text) and legacy signatures
    if len(args) >= 4:
        jd_text = str(args[2] or "").strip()
        resume_text = str(args[3] or "").strip()
    elif len(args) == 2:
        jd_text = str(args[0] or "").strip()
        resume_text = str(args[1] or "").strip()
    else:
        jd_text = str(kwargs.get("jd_text") or (args[0] if args else "")).strip()
        resume_text = str(kwargs.get("resume_text") or (args[1] if len(args) > 1 else "")).strip()

    if not resume_text:
        raise HTTPException(status_code=400, detail="Upload your resume to continue.")
    if not jd_text:
        raise HTTPException(status_code=400, detail="Job description is required.")

    # 1. Deterministic backend skill comparison
    missing_skills = extract_missing_skills(jd_text, resume_text)

    client = get_gemini_client()
    model_name = get_shared_gemini_model()

    missing_context = (
        f"Backend skill gap analysis indicates candidate appears to be missing: {', '.join(missing_skills)}."
        if missing_skills
        else "Backend skill analysis indicates candidate demonstrates the primary technical skills referenced in the job description."
    )

    prompt = f"""You are an expert technical hiring manager evaluating a candidate's resume against a Job Description.

Evaluation Requirements:
1. JD Match Percentage (jd_match_percentage): An integer from 0 to 100 representing how well the candidate's actual qualifications, experience, projects, tools, and technical scope align with the job description requirements.
2. Alignment Summary (alignment_summary): A concise, objective 2-3 sentence summary evaluating alignment, noting key areas of fit and specific technology/experience gaps.

Critical Grounding Rules:
- Base your evaluation STRICTLY and ONLY on the provided Resume and Job Description.
- Do NOT invent candidate experiences or JD requirements.
- Note: {missing_context}

Job Description:
\"\"\"
{jd_text}
\"\"\"

Candidate Resume Text:
\"\"\"
{resume_text}
\"\"\""""

    schema: dict = {
        "type": "object",
        "properties": {
            "jd_match_percentage": {
                "type": "integer",
                "description": "0 to 100 percentage match between candidate resume and job description"
            },
            "alignment_summary": {
                "type": "string",
                "description": "Concise 2-3 sentence objective assessment of candidate fit and gaps"
            }
        },
        "required": ["jd_match_percentage", "alignment_summary"]
    }

    try:
        # EXACTLY ONE REQUEST. No retries, no second requests, no fallback model.
        afc_disable = types.AutomaticFunctionCallingConfig(disable=True) if hasattr(types, "AutomaticFunctionCallingConfig") else None
        res_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            automatic_function_calling=afc_disable
        )
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
            config=res_config
        )
        if not response or not response.text:
            raise ValueError("Gemini returned empty response text")

        raw_text = response.text.strip()
        if raw_text.startswith("```json"):
            raw_text = raw_text[7:]
        if raw_text.startswith("```"):
            raw_text = raw_text[3:]
        if raw_text.endswith("```"):
            raw_text = raw_text[:-3]

        parsed = json.loads(raw_text.strip())
        if not isinstance(parsed, dict):
            raise ValueError("Response is not a valid JSON object")

        raw_score = parsed.get("jd_match_percentage")
        if raw_score is None:
            raw_score = parsed.get("matchPercentage")
        if raw_score is None:
            raise ValueError("Missing 'jd_match_percentage' in Gemini response")

        match_percentage = max(0, min(100, int(round(float(raw_score)))))
        alignment_summary = str(parsed.get("alignment_summary") or parsed.get("summary") or "").strip()
        if not alignment_summary:
            raise ValueError("Missing 'alignment_summary' in Gemini response")

        return {
            "matchPercentage": match_percentage,
            "jd_match_percentage": match_percentage,
            "summary": alignment_summary,
            "alignment_summary": alignment_summary,
            "missingSkills": missing_skills,
            "missing_skills": missing_skills
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[match_jd_with_gemini] JD Match failed with model '{model_name}': {e}")
        raise HTTPException(
            status_code=503,
            detail="JD evaluation temporarily unavailable."
        )

def enhance_bullet_with_gemini(bullet_text: str, target_role: str = "Software Engineer") -> dict:
    client = get_gemini_client()

    prompt = f"""Rewrite the following resume bullet point using the STAR (Situation, Task, Action, Result) method with strong action verbs for the role '{target_role}':

Original Bullet:
\"{bullet_text}\"

Return ONLY a valid JSON object matching this exact structure:
{{
  "original": "{bullet_text}",
  "enhanced": "Engineered high-performance module for {target_role}, accelerating throughput by 35% and cutting API latency by 120ms.",
  "explanation": "Applied STAR format with strong action verb and quantified outcome metrics.",
  "enhancedBullets": [
    "Spearheaded optimization of {bullet_text}, increasing overall processing speed by 40% and cutting latency by 120ms.",
    "Architected modular microservices for {bullet_text}, enabling seamless horizontal scaling across cloud deployments.",
    "Implemented robust state management for {bullet_text}, increasing overall test coverage to 92% across deployment builds."
  ]
}}"""

    result = generate_gemini_json(client, prompt)
    if result and isinstance(result, dict):
        if "enhanced" not in result and "enhancedBullets" in result and len(result["enhancedBullets"]) > 0:
            result["enhanced"] = result["enhancedBullets"][0]
        if "original" not in result:
            result["original"] = bullet_text
        if "explanation" not in result:
            result["explanation"] = "Applied STAR format with strong action verbs and quantified impact metrics."
        return result

    raise HTTPException(
        status_code=500,
        detail="Gemini AI failed to enhance bullet point."
    )


