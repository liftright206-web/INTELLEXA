export enum GradeLevel {
  MiddleSchool = "Middle School (6-8)",
  HighSchool = "High School (9-10)",
  SeniorSecondary = "Senior Secondary (11-12)",
  EarlyCollege = "Early College"
}

export enum Subject {
  General = "General Study",
  Mathematics = "Mathematics",
  Science = "Science (Phy/Chem/Bio)",
  Commerce = "Commerce & Economics",
  ComputerScience = "Computer Science & AI",
  English = "English & Literature"
}

export type ChatMode = 'lite' | 'search' | 'complex';

export interface GroundingLink {
  uri: string;
  title: string;
}

export interface User {
  name: string;
  email: string;
  avatar?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: string[]; // base64 strings
  groundingLinks?: GroundingLink[];
  isThinking?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  grade: GradeLevel;
  subject: Subject;
  mode: ChatMode;
}

export interface ImageGenerationConfig {
  prompt: string;
  aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9";
  base64Source?: string; // For editing existing images
}