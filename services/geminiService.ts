import { GoogleGenAI, Type } from '@google/genai';
import { ProfileData, Template, AnalysisResult, TailoredResumeData } from '../types';

const getAI = () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const extractTextFromImage = async (
  imageData: { base64: string; mimeType: string }
): Promise<string> => {
  const ai = getAI();
  
  const prompt = `
    You are an intelligent HR assistant specializing in parsing job descriptions.
    From the provided image of a job description, identify and extract ONLY the following information:

    1.  **Job Role Title:** The main title of the position.
    2.  **Key Responsibilities:** The section describing the main duties and tasks. This section might have titles like "What You'll Do", "Job Duties", "Responsibilities", etc.
    3.  **Qualifications & Skills:** The section listing the required skills, experience, and qualifications. This section might have titles like "Requirements", "Who You Are", "Basic Qualifications", "Skills", etc.

    Combine the extracted information into a single block of text. Format the output cleanly with clear headings for each section. For example:

    **Job Title:**
    Senior Software Engineer

    **Key Responsibilities:**
    - Develop new user-facing features.
    - Build reusable code and libraries for future use.

    **Qualifications & Skills:**
    - 5+ years of professional software development experience.
    - Proficiency with JavaScript, React, and Node.js.

    Return ONLY the extracted text for these specific sections. Do not include any other text from the document or any extra commentary.
  `;

  const imagePart = {
    inlineData: {
      data: imageData.base64,
      mimeType: imageData.mimeType,
    },
  };

  const textPart = {
    text: prompt,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, textPart] },
  });

  return response.text;
};


export const generateResumeAndAnalysis = async (
  profileData: ProfileData,
  jobDescription: string,
  roleAppliedFor: string,
  template: Template
): Promise<AnalysisResult> => {

  const ai = getAI();

  const profileString = `
    Full Name: ${profileData.fullName}
    Email: ${profileData.email}
    Phone: ${profileData.phone}
    LinkedIn: ${profileData.linkedinUrl}
    Summary: ${profileData.summary}
    Has Profile Picture: ${profileData.profilePicture ? 'Yes' : 'No'}
    
    Work Experience:
    ${profileData.workExperience
      .map(
        (exp) => `
        - Job Title: ${exp.jobTitle}
          Company: ${exp.company}
          Dates: ${exp.startDate} - ${exp.endDate}
          Responsibilities: ${exp.responsibilities}
    `
      )
      .join('')}
      
    Projects:
    ${(profileData.projects || [])
      .map(
        (proj) => `
        - Title: ${proj.title}
          Date: ${proj.date}
          Description: ${proj.description}
        `
      ).join('')}
    
    Additional Experience:
    ${(profileData.additionalExperience || [])
      .map(
        (exp) => `
        - Title: ${exp.title}
          Date: ${exp.date}
          Description: ${exp.description}
        `
      ).join('')}

    Education:
    ${profileData.education
      .map(
        (edu) => `
        - Institution: ${edu.institution}
          Degree: ${edu.degree}
          Field of Study: ${edu.fieldOfStudy}
          Graduation Date: ${edu.graduationDate}
    `
      )
      .join('')}

    Skills: ${profileData.skills.join(', ')}

    Certifications:
    ${profileData.certifications
      .map(
        (cert) => `
        - Name: ${cert.name}
          Issuer: ${cert.issuingOrganization}
          Date: ${cert.date}
    `
      )
      .join('')}

    References:
    ${profileData.references
      .map(
        (ref) => `
        - Name: ${ref.name}
          Title: ${ref.title}
          Company: ${ref.company}
          Phone: ${ref.phone}
          Email: ${ref.email}
    `
      )
      .join('')}
  `;
  
  const prompt = `
    As an expert career coach and professional resume writer, your task is to help a job applicant tailor their resume for a specific job description.

    USER'S PROFILE:
    ---
    ${profileString}
    ---
    
    ROLE APPLIED FOR:
    ---
    ${roleAppliedFor}
    ---

    JOB DESCRIPTION:
    ---
    ${jobDescription}
    ---

    REQUEST:
    Based on the user's profile, the role they are applying for, and the job description, perform the following tasks and return the result in a single, valid JSON object that adheres to the provided schema.

    1.  **Job Title Analysis:**
        *   First, identify the official, primary job title directly stated in the JOB DESCRIPTION text.
        *   Compare this official title with the user-provided "ROLE APPLIED FOR".
        *   If they are significantly different (e.g., "Software Engineer" vs. "Senior Full Stack Developer"), create a 'jobTitleMismatch' object. In this object, include the 'userTitle' (what the user entered), the 'suggestedTitle' (the one from the job description), and a brief 'reason' explaining why the change is recommended (e.g., "To precisely match the title listed in the job posting for better ATS alignment.").
        *   If the titles are identical or very similar (e.g., "Senior Software Engineer" vs "Sr. Software Engineer"), the 'jobTitleMismatch' field should be null.

    2.  **Tailored Resume Content (JSON Object):** Generate the content for a complete, professional resume as a structured JSON object.
        *   **jobTitle:** CRITICAL: This field MUST be the exact string value from the "ROLE APPLIED FOR" section. Do not alter or invent a new title.
        *   **Summary:** Use the user's provided summary as the foundation. Refine and enhance it to align with both the "ROLE APPLIED FOR" and the job description, but retain the user's core message and tone. If the user's summary is empty, create a compelling one from scratch based on their experience and the target role.
        *   **Content Strategy:** The resume content must be tailored to highlight the user's most relevant skills and experiences for the job. Intelligently incorporate the user's Projects and Additional Experience sections where they add value. **Crucially, you must intelligently weave in important keywords from the job description that are missing from the user's profile.** Add these keywords *only* where they are contextually appropriate and logically fit within the user's existing work experience or skills section. For example, if a user is a web developer and the job requires "REST APIs", you could add it to their skills, or mention it in a project description. Do NOT add keywords that are completely unrelated to the user's career path (e.g., adding "culinary skills" to a software engineer's resume). The goal is to improve ATS compatibility without fabricating experience.
        *   **Format:** For each work experience entry, list responsibilities as an array of strings. Each string should be a single bullet point.
    3.  **ATS Score:** Provide an ATS (Applicant Traking System) compatibility score between 0 and 100, estimating how well the user's profile (including the improvements you made) matches the job description.
    4.  **ATS Score Explanation:** Give a brief, one-sentence explanation for the score.
    5.  **Qualification Matches:** Identify the top 5 strongest matches between the user's profile and the job description. For each match:
        *   **userQualification:** Quote the specific skill or experience *verbatim* from the user's profile (e.g., "Led the development of a new client-facing dashboard using React and TypeScript").
        *   **jobRequirement:** Quote the corresponding requirement *verbatim* from the job description (e.g., "Experience with React and TypeScript is required").
        *   **explanation:** Provide a concise, 1-2 sentence explanation detailing *how* the user's qualification fulfills the job requirement. Explain the connection clearly. For instance, "The user's direct experience leading a project with the exact technologies mentioned (React, TypeScript) demonstrates their proficiency and makes them a strong candidate for this role."
    6.  **Keyword Gaps:** Extract keywords and multi-word phrases from the job description that are missing from the user's profile.
        *   **CRITICAL RULE:** Extract terms *verbatim* from the job description. Do not invent, infer, or alter keywords.
        *   Treat multi-word phrases (e.g., "Project Management", "Agile Scrum") as single, indivisible keywords.
        *   Ignore generic stop words ("the", "is", "best", etc.) and focus on skill-related terms.
        *   After your enhancements, identify the top 5 *still* missing or underrepresented keywords from this extracted list. For each, explain why it's important for the role.
    7.  **Keyword Guide:** Based on the identified keyword gaps, create a guide. For 3-4 of the most important missing keywords, provide an item for each containing: the specific 'keyword' itself, a 1-sentence 'guidance' on why it's important and how to learn or incorporate it, and a 'resource' object containing a 'title', 'type' ('Article', 'Video', 'Course'), and a valid 'url'. This guide will help the user address their skill gaps directly.
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      tailoredResume: {
        type: Type.OBJECT,
        description: "Structured JSON object containing the full, tailored content of the resume.",
        properties: {
            fullName: { type: Type.STRING },
            jobTitle: { type: Type.STRING, description: "The professional title for the resume. This MUST be the exact value from the 'ROLE APPLIED FOR' input."},
            contact: {
                type: Type.OBJECT,
                properties: {
                    email: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    website: { type: Type.STRING },
                    address: { type: Type.STRING },
                    linkedinUrl: { type: Type.STRING },
                }
            },
            summary: { type: Type.STRING, description: "A professional summary tailored for the job description."},
            workExperience: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        jobTitle: { type: Type.STRING },
                        company: { type: Type.STRING },
                        startDate: { type: Type.STRING },
                        endDate: { type: Type.STRING },
                        responsibilities: { type: Type.ARRAY, items: { type: Type.STRING }},
                    },
                    required: ["jobTitle", "company", "startDate", "endDate", "responsibilities"],
                }
            },
            education: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        institution: { type: Type.STRING },
                        degree: { type: Type.STRING },
                        fieldOfStudy: { type: Type.STRING },
                        graduationDate: { type: Type.STRING },
                    },
                    required: ["institution", "degree", "graduationDate"],
                }
            },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            certifications: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        issuingOrganization: { type: Type.STRING },
                        date: { type: Type.STRING },
                    },
                    required: ["name"],
                }
            },
            references: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        title: { type: Type.STRING },
                        company: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        email: { type: Type.STRING },
                    },
                    required: ["name"],
                }
            },
            projects: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        date: { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ["title", "description"],
                }
            },
            additionalExperience: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        date: { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ["title", "description"],
                }
            },
            additionalInfo: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "e.g., Languages, Awards" },
                        details: { type: Type.STRING },
                    }
                }
            }
        },
        required: ["fullName", "jobTitle", "contact", "summary", "workExperience", "education", "skills"],
      },
      jobTitleMismatch: {
        type: Type.OBJECT,
        nullable: true,
        description: "Contains details of a job title mismatch if found. Null if titles align.",
        properties: {
          userTitle: { type: Type.STRING, description: "The title the user entered." },
          suggestedTitle: { type: Type.STRING, description: "The title extracted from the job description." },
          reason: { type: Type.STRING, description: "Why the change is recommended." },
        },
        required: ["userTitle", "suggestedTitle", "reason"],
      },
      atsScore: {
        type: Type.INTEGER,
        description: "An ATS compatibility score from 0 to 100.",
      },
      atsScoreExplanation: {
        type: Type.STRING,
        description: "A brief, one-sentence explanation for the score.",
      },
      qualificationMatches: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            userQualification: { type: Type.STRING, description: "A specific skill or experience from the user's profile." },
            jobRequirement: { type: Type.STRING, description: "The corresponding requirement from the job description." },
            explanation: { type: Type.STRING, description: "A brief explanation of why this is a good match." },
          },
           required: ["userQualification", "jobRequirement", "explanation"],
        },
      },
      keywordGaps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING },
            reason: { type: Type.STRING, description: "Why this keyword is important for the role." },
          },
          required: ["keyword", "reason"],
        },
      },
      keywordGuide: {
        type: Type.ARRAY,
        description: "A guide to help the user address missing keywords.",
        items: {
          type: Type.OBJECT,
          properties: {
            keyword: { type: Type.STRING, description: "The specific missing keyword." },
            guidance: { type: Type.STRING, description: "A 1-sentence guide for the keyword." },
            resource: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                type: { type: Type.STRING, description: "'Article', 'Video', or 'Course'" },
                url: { type: Type.STRING },
              },
              required: ["title", "type", "url"],
            },
          },
          required: ["keyword", "guidance", "resource"],
        },
      },
    },
    required: ["tailoredResume", "jobTitleMismatch", "atsScore", "atsScoreExplanation", "qualificationMatches", "keywordGaps", "keywordGuide"],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.3,
    },
  });

  const jsonText = response.text.trim();
  const result: AnalysisResult = JSON.parse(jsonText);
  // Ensure nested arrays are not undefined, which can happen if AI omits them
  if (!result.tailoredResume.certifications) result.tailoredResume.certifications = [];
  if (!result.tailoredResume.references) result.tailoredResume.references = [];
  if (!result.tailoredResume.projects) result.tailoredResume.projects = [];
  if (!result.tailoredResume.additionalExperience) result.tailoredResume.additionalExperience = [];
  return result;
};

export const integrateKeyword = async (
    resumeData: TailoredResumeData,
    keyword: string,
    targetSection: 'Summary' | 'Work Experience' | 'Skills'
): Promise<TailoredResumeData> => {
    const ai = getAI();
    const prompt = `
        You are a resume editing AI. Your task is to seamlessly integrate a given keyword into a specific section of a resume provided in JSON format.

        KEYWORD TO INTEGRATE:
        "${keyword}"

        TARGET SECTION:
        "${targetSection}"

        RESUME DATA (JSON):
        ---
        ${JSON.stringify(resumeData, null, 2)}
        ---

        RULES:
        1.  **Target the Correct Section:** You MUST add the keyword *only* within the specified TARGET SECTION.
        2.  **Natural Integration:**
            *   If the TARGET SECTION is 'Summary' or 'Work Experience', find the most logical place within that section to add the keyword. Modify existing text naturally to weave the keyword into a sentence or bullet point. Do not just list the keyword.
            *   If the TARGET SECTION is 'Skills', simply add the keyword to the 'skills' array. Do not add it if it already exists.
        3.  **Make minimal changes.** Modify only what is necessary to include the keyword.
        4.  **CRITICAL: You MUST return the complete, updated resume JSON object, conforming EXACTLY to the provided schema.** Any omitted sections or fields will be considered deleted. Preserve all original data that you are not actively modifying.
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            fullName: { type: Type.STRING },
            jobTitle: { type: Type.STRING },
            contact: {
                type: Type.OBJECT,
                properties: {
                    email: { type: Type.STRING },
                    phone: { type: Type.STRING },
                    website: { type: Type.STRING },
                    address: { type: Type.STRING },
                    linkedinUrl: { type: Type.STRING },
                }
            },
            summary: { type: Type.STRING },
            workExperience: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        jobTitle: { type: Type.STRING },
                        company: { type: Type.STRING },
                        startDate: { type: Type.STRING },
                        endDate: { type: Type.STRING },
                        responsibilities: { type: Type.ARRAY, items: { type: Type.STRING }},
                    },
                    required: ["jobTitle", "company", "startDate", "endDate", "responsibilities"],
                }
            },
            education: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        institution: { type: Type.STRING },
                        degree: { type: Type.STRING },
                        fieldOfStudy: { type: Type.STRING },
                        graduationDate: { type: Type.STRING },
                    },
                    required: ["institution", "degree", "graduationDate"],
                }
            },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            certifications: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        issuingOrganization: { type: Type.STRING },
                        date: { type: Type.STRING },
                    },
                    required: ["name"],
                }
            },
            references: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        title: { type: Type.STRING },
                        company: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        email: { type: Type.STRING },
                    },
                    required: ["name"],
                }
            },
            projects: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        date: { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ["title", "description"],
                }
            },
            additionalExperience: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        date: { type: Type.STRING },
                        description: { type: Type.STRING },
                    },
                    required: ["title", "description"],
                }
            },
            additionalInfo: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        details: { type: Type.STRING },
                    }
                }
            }
        },
        required: ["fullName", "jobTitle", "contact", "summary", "workExperience", "education", "skills"],
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.2,
        },
      });
    
      const jsonText = response.text.trim();
      const result: TailoredResumeData = JSON.parse(jsonText);
       // Ensure nested arrays are not undefined
      if (!result.certifications) result.certifications = [];
      if (!result.references) result.references = [];
      if (!result.projects) result.projects = [];
      if (!result.additionalExperience) result.additionalExperience = [];
      return result;
}

export const recalculateAtsScore = async (
    resumeData: TailoredResumeData,
    jobDescription: string
): Promise<{ atsScore: number; atsScoreExplanation: string }> => {
    const ai = getAI();
    const resumeText = JSON.stringify(resumeData);
    
    const prompt = `
        As an expert ATS analyst, your task is to provide an ATS compatibility score.
        - Analyze the following resume content and compare it against the job description.
        - Return a score between 0 and 100.
        - Provide a brief, one-sentence explanation for the score.

        RESUME CONTENT:
        ---
        ${resumeText}
        ---

        JOB DESCRIPTION:
        ---
        ${jobDescription}
        ---

        Return ONLY a valid JSON object with the keys "atsScore" and "atsScoreExplanation". For example:
        { "atsScore": 85, "atsScoreExplanation": "Excellent alignment of key skills and experience with the job requirements." }
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            atsScore: { type: Type.INTEGER },
            atsScoreExplanation: { type: Type.STRING },
        },
        required: ["atsScore", "atsScoreExplanation"],
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1,
        },
      });

    const jsonText = response.text.trim();
    const result: { atsScore: number; atsScoreExplanation: string } = JSON.parse(jsonText);
    return result;
};

export const parseLinkedInProfile = async (profileText: string): Promise<Partial<ProfileData>> => {
    const ai = getAI();
    const prompt = `
        You are an expert data extraction AI. Your task is to parse the raw text content from a user's LinkedIn profile (copied from a PDF) and extract their professional information into a structured JSON object.

        PROFILE TEXT:
        ---
        ${profileText}
        ---

        RULES:
        1.  Extract the user's full name, email, and phone number if available.
        2.  Extract their "Summary" or "About" section. If it's longer than 150 words, summarize it to be approximately 100 words, focusing on key professional achievements and skills.
        3.  **Work Experience:** For each job, extract the job title, company, start date, and end date. Dates often appear as "Month Year - Present" or "Month Year - Month Year". Extract these start and end dates accurately. Also, extract the responsibilities.
        4.  **Education:** For each entry, extract the institution, degree, and field of study. The dates for education are often a range (e.g., "(2017 - 2021)"). Extract this entire date range exactly as it appears and place it into the 'graduationDate' field.
        5.  **Skills:** Extract a list of their skills.
        6.  **Licenses & Certifications:** For each entry, extract the name, issuing organization, and the issue date if it's provided.
        7.  **Projects & References:** If there are sections for "Projects" or "References", extract their details. This is less common, so it's okay if they are not present.
        8.  If a piece of information is not present in the text, omit the corresponding key or leave its value as an empty string/array.
        9.  CRITICAL: Return ONLY a valid JSON object that adheres to the provided schema. Do not add any extra explanations or text outside the JSON.
    `;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            fullName: { type: Type.STRING },
            email: { type: Type.STRING },
            phone: { type: Type.STRING },
            summary: { type: Type.STRING, description: "The user's professional summary, summarized to ~100 words if it was originally longer." },
            workExperience: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        jobTitle: { type: Type.STRING },
                        company: { type: Type.STRING },
                        startDate: { type: Type.STRING },
                        endDate: { type: Type.STRING },
                        responsibilities: { type: Type.STRING, description: "A single block of text describing responsibilities." },
                    },
                    required: ["jobTitle", "company"],
                }
            },
            education: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        institution: { type: Type.STRING },
                        degree: { type: Type.STRING },
                        fieldOfStudy: { type: Type.STRING },
                        graduationDate: { type: Type.STRING },
                    },
                    required: ["institution", "degree"],
                }
            },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            certifications: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        issuingOrganization: { type: Type.STRING },
                        date: { type: Type.STRING },
                    },
                    required: ["name"],
                }
            },
             references: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        title: { type: Type.STRING },
                        company: { type: Type.STRING },
                        phone: { type: Type.STRING },
                        email: { type: Type.STRING },
                    },
                    required: ["name"],
                }
            },
        },
    };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.1,
        },
    });

    const jsonText = response.text.trim();
    const result: Partial<ProfileData> = JSON.parse(jsonText);
    return result;
}