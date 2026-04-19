
export interface Script {
  id: string;
  category: 'professional' | 'survival' | 'social';
  title: string;
  spanish: string;
  english: string;
  pronunciation: string;
  context: string;
}

export interface ToolInfo {
  name: string;
  usage: string;
  phrases: string[];
}

export interface CurationEntry {
  id: string;
  topic: string;
  content: string;
  sourceType: 'video' | 'text';
  category: string;
}

export interface LearningUnit {
  id?: string;
  profession_id: string; // Ej: 'barber', 'mechanic', 'general'
  category: 'professional' | 'survival' | 'social';
  phrase_en: string;
  phrase_es: string;
  phonetic_tactic: string;
  learning_tips: string[];
  grammar_tag: string;
  difficulty: number; // 1 to 5
}

export interface IntelSponge {
  id?: string;
  source_url: string;
  ai_pedagogy: string;
  suggested_tips: string[];
  status: 'pending' | 'approved';
  createdAt?: any;
}

export interface UserProfile {
  id?: string;
  displayName?: string;
  name?: string; // legacy support
  photoURL?: string;
  occupation?: string;
  email: string;
  registration_date?: string; // legacy support
  createdAt?: any;
  updatedAt?: any;
  role: 'user' | 'master';
  onboarded?: boolean;
  analyCalibrated?: boolean;
}
