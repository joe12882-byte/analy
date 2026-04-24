
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
  learning_tips?: string[];
  learning_tip?: string; // Nuevo modelo
  grammar_tags?: string[]; // Nuevo modelo
  grammar_tag?: string;
  difficulty: number | string; // 1 to 5 or 'beginner', 'intermediate'
  methodology_style?: string;
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
  uid?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  name?: string; // legacy support
  photoURL?: string;
  occupation?: string;
  email: string;
  registration_date?: string; // legacy support
  createdAt?: any;
  updatedAt?: any;
  role: 'student' | 'master' | 'user';
  support_code?: string;
  onboarded?: boolean;
  analyCalibrated?: boolean;
  conversations_count?: number;
  saved_objects_count?: number;
  last_login?: any;
}

// NUEVOS TIPOS: AR VISION
export interface ARBoundingBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface ARObject {
  label_en: string;
  label_es: string;
  phonetic_tactic: string;
  example_en: string;
  example_es: string;
  bbox: ARBoundingBox;
}

// NUEVOS TIPOS: ROLEPLAY
export interface RoleplayTurn {
  role: 'user' | 'anali';
  text: string;
}

export interface RoleplayResult {
  reply_en: string;
  reply_es: string;
  phonetic_tactic: string;
  emotion: string;
  push_back: string;
}

export interface RoleplayScore {
  clarity: number;
  politeness: number;
  confidence: number;
  accuracy: number;
}

export interface RoleplayGradeResult {
  scores: RoleplayScore;
  overall: number;
  strengths: string[];
  improvements: string[];
  corrected_examples: { user: string; better_en: string; phonetic_tactic: string; tip: string; }[];
  anali_reminder: string;
}

// NUEVOS TIPOS: SHADOW / PRONUNCIATION
export interface ShadowGradeResult {
  accuracy: number;
  fluency: number;
  overall: number;
  matched_words: string[];
  missed_words: string[];
  extra_words: string[];
  tips: string[];
  encouragement: string;
  anali_reminder: string;
}
