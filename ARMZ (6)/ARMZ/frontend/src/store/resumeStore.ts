import { create } from 'zustand';

export interface ResumeData {
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    location: string;
    summary: string;
    title?: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
  targetRole: string;
  experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    location?: string;
  }>;
  education: Array<{
    id: string;
    school: string;
    degree: string;
    year: string;
    location?: string;
    description?: string;
  }>;
  skills: string[];
  projects: Array<{
    id: string;
    name: string;
    description: string;
    link?: string;
    technologies?: string[];
    outcomes?: string;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string;
    date: string;
    link?: string;
  }>;
  languages: Array<{
    id: string;
    name: string;
    level: string;
  }>;
  achievements: string[];
  tools: string[];
  aviationData?: {
    licenses: Array<{ id: string; name: string; number: string; expiry: string; issuer: string }>;
    ratings: Array<{ id: string; name: string; aircraftType: string }>;
    flightHours: {
      total: string;
      pic: string;
      sic: string;
      multiEngine: string;
      instrument: string;
      night: string;
      turbine: string;
      jet: string;
    };
    medical: {
      class: string;
      expiry: string;
    };
    aircraftTypes: string[];
  };
  template: string;
  themeColor: string;
  fontFamily: string;
  atsScore?: number;
  improvementSuggestions?: string[];
}

interface ResumeState {
  data: ResumeData;
  updatePersonalInfo: (info: Partial<ResumeData['personalInfo']>) => void;
  setTargetRole: (role: string) => void;
  addExperience: (exp: ResumeData['experience'][0]) => void;
  updateExperience: (id: string, exp: Partial<ResumeData['experience'][0]>) => void;
  removeExperience: (id: string) => void;
  addEducation: (edu: ResumeData['education'][0]) => void;
  updateEducation: (id: string, edu: Partial<ResumeData['education'][0]>) => void;
  removeEducation: (id: string) => void;
  addSkill: (skill: string) => void;
  removeSkill: (skill: string) => void;
  addProject: (project: ResumeData['projects'][0]) => void;
  updateProject: (id: string, project: Partial<ResumeData['projects'][0]>) => void;
  removeProject: (id: string) => void;
  addCertification: (cert: ResumeData['certifications'][0]) => void;
  updateCertification: (id: string, cert: Partial<ResumeData['certifications'][0]>) => void;
  removeCertification: (id: string) => void;
  addLanguage: (lang: ResumeData['languages'][0]) => void;
  updateLanguage: (id: string, lang: Partial<ResumeData['languages'][0]>) => void;
  removeLanguage: (id: string) => void;
  addAchievement: (achievement: string) => void;
  removeAchievement: (achievement: string) => void;
  addTool: (tool: string) => void;
  removeTool: (tool: string) => void;
  updateAviationData: (data: Partial<ResumeData['aviationData']>) => void;
  setTemplate: (template: string) => void;
  setThemeColor: (color: string) => void;
  setFontFamily: (font: string) => void;
  setAtsScore: (score: number) => void;
  setImprovementSuggestions: (suggestions: string[]) => void;
  setFullData: (data: ResumeData) => void;
}

const initialData: ResumeData = {
  personalInfo: {
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+91 98765 43210",
    location: "Mumbai, India",
    summary: "Experienced Captain with over 5,000 flight hours on Boeing 737 and Airbus A320. Committed to safety, precision, and passenger comfort.",
    title: "Airline Captain",
  },
  targetRole: "Senior Airline Captain",
  experience: [],
  education: [],
  skills: ["Flight Safety", "Crew Resource Management", "Instrument Rating", "Emergency Procedures"],
  projects: [],
  certifications: [],
  languages: [
    { id: '1', name: 'English', level: 'Fluent' },
    { id: '2', name: 'Hindi', level: 'Native' }
  ],
  achievements: [],
  tools: [],
  aviationData: {
    licenses: [
      { id: '1', name: 'ATPL', number: 'IND-123456', expiry: '2028-12-31', issuer: 'DGCA' }
    ],
    ratings: [
      { id: '1', name: 'Type Rating', aircraftType: 'Boeing 737-800' },
      { id: '2', name: 'Type Rating', aircraftType: 'Airbus A320' }
    ],
    flightHours: {
      total: "5200",
      pic: "3100",
      sic: "2100",
      multiEngine: "4800",
      instrument: "600",
      night: "1200",
      turbine: "5200",
      jet: "5200"
    },
    medical: {
      class: "Class 1",
      expiry: "2025-06-30"
    },
    aircraftTypes: ["B737", "A320", "C172"]
  },
  template: "modern",
  themeColor: "#2563eb",
  fontFamily: "Inter",
};

export const useResumeStore = create<ResumeState>((set) => ({
  data: initialData,
  updatePersonalInfo: (info) => 
    set((state) => ({ data: { ...state.data, personalInfo: { ...state.data.personalInfo, ...info } } })),
  addExperience: (exp) => 
    set((state) => ({ data: { ...state.data, experience: [...state.data.experience, exp] } })),
  updateExperience: (id, exp) =>
    set((state) => ({ 
      data: { 
        ...state.data, 
        experience: state.data.experience.map(e => e.id === id ? { ...e, ...exp } : e) 
      } 
    })),
  removeExperience: (id) => 
    set((state) => ({ data: { ...state.data, experience: state.data.experience.filter(e => e.id !== id) } })),
  addEducation: (edu) => 
    set((state) => ({ data: { ...state.data, education: [...state.data.education, edu] } })),
  updateEducation: (id, edu) =>
    set((state) => ({ 
      data: { 
        ...state.data, 
        education: state.data.education.map(e => e.id === id ? { ...e, ...edu } : e) 
      } 
    })),
  removeEducation: (id) => 
    set((state) => ({ data: { ...state.data, education: state.data.education.filter(e => e.id !== id) } })),
  addSkill: (skill) => 
    set((state) => ({ data: { ...state.data, skills: [...state.data.skills, skill] } })),
  removeSkill: (skill) => 
    set((state) => ({ data: { ...state.data, skills: state.data.skills.filter(s => s !== skill) } })),
  addProject: (project) => 
    set((state) => ({ data: { ...state.data, projects: [...state.data.projects, project] } })),
  updateProject: (id, project) =>
    set((state) => ({ 
      data: { 
        ...state.data, 
        projects: state.data.projects.map(p => p.id === id ? { ...p, ...project } : p) 
      } 
    })),
  removeProject: (id) => 
    set((state) => ({ data: { ...state.data, projects: state.data.projects.filter(p => p.id !== id) } })),
  addCertification: (cert) =>
    set((state) => ({ data: { ...state.data, certifications: [...state.data.certifications, cert] } })),
  updateCertification: (id, cert) =>
    set((state) => ({
      data: {
        ...state.data,
        certifications: state.data.certifications.map(c => c.id === id ? { ...c, ...cert } : c)
      }
    })),
  removeCertification: (id) =>
    set((state) => ({ data: { ...state.data, certifications: state.data.certifications.filter(c => c.id !== id) } })),
  addLanguage: (lang) =>
    set((state) => ({ data: { ...state.data, languages: [...state.data.languages, lang] } })),
  updateLanguage: (id, lang) =>
    set((state) => ({
      data: {
        ...state.data,
        languages: state.data.languages.map(l => l.id === id ? { ...l, ...lang } : l)
      }
    })),
  removeLanguage: (id) =>
    set((state) => ({ data: { ...state.data, languages: state.data.languages.filter(l => l.id !== id) } })),
  updateAviationData: (aviationData) =>
    set((state) => ({ 
      data: { 
        ...state.data, 
        aviationData: { ...state.data.aviationData, ...aviationData } as ResumeData['aviationData'] 
      } 
    })),
  setTargetRole: (role) =>
    set((state) => ({ data: { ...state.data, targetRole: role } })),
  addAchievement: (achievement) =>
    set((state) => ({ data: { ...state.data, achievements: [...state.data.achievements, achievement] } })),
  removeAchievement: (achievement) =>
    set((state) => ({ data: { ...state.data, achievements: state.data.achievements.filter(a => a !== achievement) } })),
  addTool: (tool) =>
    set((state) => ({ data: { ...state.data, tools: [...state.data.tools, tool] } })),
  removeTool: (tool) =>
    set((state) => ({ data: { ...state.data, tools: state.data.tools.filter(t => t !== tool) } })),
  setAtsScore: (score) =>
    set((state) => ({ data: { ...state.data, atsScore: score } })),
  setImprovementSuggestions: (suggestions) =>
    set((state) => ({ data: { ...state.data, improvementSuggestions: suggestions } })),
  setFullData: (data) =>
    set(() => ({ data })),
  setTemplate: (template) =>
    set((state) => ({ data: { ...state.data, template } })),
  setThemeColor: (themeColor) =>
    set((state) => ({ data: { ...state.data, themeColor } })),
  setFontFamily: (fontFamily) =>
    set((state) => ({ data: { ...state.data, fontFamily } })),
}));
