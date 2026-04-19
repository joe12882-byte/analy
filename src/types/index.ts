
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

export interface UserProfile {
  id: string;
  name: string;
  occupation: string;
  email: string;
  registration_date: string;
  role: 'user' | 'master';
  onboarded: boolean;
  analyCalibrated: boolean;
}
