// src/api/types.ts
export interface UserProfile {
  nickname: string;
  points: number;
  company?: string;
}

export interface EventItem {
  id: number;
  name: string;
  tags: string[];
  points: number;
  date: string;
  is_registered: boolean;
}

export interface EventDetail extends EventItem {
  description?: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  body?: string;
  created_at: string;
}