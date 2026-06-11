import { apiRequest } from './client';
import type {
  CompanySuggestionResponse,
  EventInfoResponse,
  NotificationInfoResponse,
  SettingsResponse,
  TagInfoResponse,
  UserInfoResponse,
} from './types';

export const userApi = {
  logout: () =>
    apiRequest<void>('/api/user/logout', {
      method: 'POST',
      parseAs: 'empty',
    }),

  getProfile: () => apiRequest<UserInfoResponse>('/api/user/profile'),

  updateProfile: (payload: Partial<UserInfoResponse>) =>
    apiRequest<UserInfoResponse>('/api/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getEvents: () => apiRequest<EventInfoResponse[]>('/api/user/events'),

  getEvent: (eventId: number) =>
    apiRequest<EventInfoResponse>(`/api/user/events/${eventId}`),

  registerEvent: (eventId: number) =>
    apiRequest<void>(`/api/user/events/${eventId}/register`, {
      method: 'POST',
      parseAs: 'empty',
    }),

  unregisterEvent: (eventId: number) =>
    apiRequest<void>(`/api/user/events/${eventId}/register`, {
      method: 'DELETE',
      parseAs: 'empty',
    }),

  getNotifications: () =>
    apiRequest<NotificationInfoResponse[]>('/api/user/notifications'),

  getSettings: () => apiRequest<SettingsResponse>('/api/user/settings'),

  updateSettings: (payload: SettingsResponse) =>
    apiRequest<SettingsResponse>('/api/user/settings', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  getTags: () => apiRequest<TagInfoResponse[]>('/api/user/tags'),

  suggestCompanies: (query: string) => {
    const params = new URLSearchParams({ q: query });

    return apiRequest<CompanySuggestionResponse[]>(
      `/api/companies/suggest?${params.toString()}`
    );
  },
};
