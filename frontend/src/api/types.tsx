/* tslint:disable */
/* eslint-disable */
/**
/* This file was automatically generated from pydantic models by running pydantic2ts.
/* Do not modify it by hand - just update the pydantic models and then re-run the script
*/

export type AppTheme = "dark" | "light";
export type Role = "admin" | "user" | "observer";

export interface EventInfoResponse {
  id?: number | null;
  title?: string | null;
  points?: number | null;
  date?: string | null;
  tags?: TagInfoResponse[] | null;
  description?: string | null;
  link?: string | null;
  is_archived?: boolean | null;
  is_registered?: boolean | null;
  created_at?: string | null;
}
export interface TagInfoResponse {
  id?: number | null;
  title?: string | null;
}
export interface LoginRequest {
  password: string;
}
export interface NotificationInfoResponse {
  id?: number | null;
  title?: string | null;
  body?: string | null;
  created_at?: string | null;
}
export interface SettingsResponse {
  app_theme?: AppTheme | null;
  days_to_notify?: number | null;
  do_notify?: boolean | null;
}
export interface UserInfoResponse {
  id?: number | null;
  nickname?: string | null;
  role?: Role | null;
  firstname?: string | null;
  middlename?: string | null;
  lastname?: string | null;
  points?: number | null;
  company?: string | null;
  password?: string | null;
  created_at?: string | null;
}
/**
 * Base class for Pydantic models supporting role-based field visibility.
 * (Class body unchanged)
 */
export interface VisibleFieldsModel {}
