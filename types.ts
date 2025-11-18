

export interface WorkExperience {
  jobTitle: string;
  company: string;
  startDate: string;
  endDate: string;
  responsibilities: string | string[]; // Allow for both string and array for flexibility
}

export interface Education {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationDate: string;
}

export interface Certification {
  name: string;
  issuingOrganization: string;
  date: string;
}

export interface Reference {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
}

export interface Project {
    title: string;
    date: string;
    description: string;
}

export interface AdditionalExperience {
    title: string;
    date: string;
    description: string;
}

export interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl?: string;
  summary: string;
  roleAppliedFor: string;
  profilePicture?: string | null;
  workExperience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications: Certification[];
  references: Reference[];
  projects: Project[];
  additionalExperience: AdditionalExperience[];
}

export type Template = 'professional' | 'creative' | 'elegant' | 'minimalist';

export interface QualificationMatch {
  userQualification: string;
  jobRequirement: string;
  explanation: string;
}

export interface KeywordGap {
    keyword: string;
    reason: string;
}

export interface KeywordGuideItem {
  keyword: string;
  guidance: string;
  resource: {
    title: string;
    type: 'Article' | 'Video' | 'Course';
    url: string;
  };
}

// Represents the AI-tailored resume content as structured data
export interface TailoredResumeData {
  fullName: string;
  jobTitle: string;
  contact: {
    email: string;
    phone: string;
    website?: string;
    address?: string;
    linkedinUrl?: string;
  };
  summary: string;
  workExperience: Array<{
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string;
    responsibilities: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    graduationDate: string;
  }>;
  skills: string[];
  certifications: Array<{
    name: string;
    issuingOrganization: string;
    date: string;
  }>;
  references: Array<{
    name: string;
    title: string;
    company: string;
    phone: string;
    email: string;
  }>;
  projects?: Array<{
    title: string;
    date: string;
    description: string;
  }>;
  additionalExperience?: Array<{
    title: string;
    date: string;
    description: string;
  }>;
  additionalInfo?: Array<{
    title: string;
    details: string;
  }>
}

export interface JobTitleMismatch {
    userTitle: string;
    suggestedTitle: string;
    reason: string;
}

export interface AnalysisResult {
  tailoredResume: TailoredResumeData;
  atsScore: number;
  atsScoreExplanation: string;
  qualificationMatches: QualificationMatch[];
  keywordGaps: KeywordGap[];
  keywordGuide: KeywordGuideItem[];
  jobTitleMismatch?: JobTitleMismatch | null;
}

export interface TemplateEntry {
  id: string;
  name: string;
  data: ProfileData;
}

export interface User {
  id: string;
  email: string;
  password?: string; // Plain text for simulation only
  role: 'Admin' | 'Client';
  profileData: ProfileData;
  templates?: TemplateEntry[];
  isVerified: boolean;
}