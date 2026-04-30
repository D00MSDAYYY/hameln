export interface UserProfile {
  nickname: string;
  points: number;
  role: string;
  company?: string;

}

export interface EventItem {
  id: number;
  name: string;
  tags: string[];
  points: number;
  date: string;
  is_registered: boolean;
  is_archived: boolean;
}

export interface EventDetail extends EventItem {
  description?: string | null;
  link?: string | null;
}

export interface NotificationItem {
  id: number;
  title: string;
  created_at: string;
  body?: string;
}