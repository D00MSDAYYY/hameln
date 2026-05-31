import { apiRequest } from './client';
import type {
  EventInfoResponse,
  ReportRequest,
  SignupRequest,
  SignupRequestInfoResponse,
  SignupResponse,
  UserInfoResponse,
  UserRequest,
} from './types';

export const adminApi = {
  getEvents: () => apiRequest<EventInfoResponse[]>('/api/admin/events'),

  createEvent: (payload: Partial<EventInfoResponse>) =>
    apiRequest<EventInfoResponse>('/api/admin/events', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateEvent: (eventId: number, payload: Partial<EventInfoResponse>) =>
    apiRequest<EventInfoResponse>(`/api/admin/events/${eventId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteEvent: (eventId: number) =>
    apiRequest<void>(`/api/admin/events/${eventId}`, {
      method: 'DELETE',
      parseAs: 'empty',
    }),

  getEventAttendants: (eventId: number) =>
    apiRequest<UserInfoResponse[]>(`/api/admin/events/${eventId}/attendants`),

  updateEventAttendants: (eventId: number, attendantIds: number[]) =>
    apiRequest<void>(`/api/admin/events/${eventId}/attendants`, {
      method: 'PATCH',
      body: JSON.stringify(attendantIds),
      parseAs: 'empty',
    }),

  getUsers: () => apiRequest<UserInfoResponse[]>('/api/admin/users'),

  createUser: (payload: UserRequest) =>
    apiRequest<UserInfoResponse>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateUser: (userId: number, payload: UserRequest) =>
    apiRequest<UserInfoResponse>(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  deleteUser: (userId: number) =>
    apiRequest<void>(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      parseAs: 'empty',
    }),

  getSignupRequests: () =>
    apiRequest<SignupRequestInfoResponse[]>('/api/admin/signup_requests'),

  updateSignupRequest: (requestId: number, payload: SignupRequest) =>
    apiRequest<SignupRequestInfoResponse>(`/api/admin/signup_requests/${requestId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  approveSignupRequest: (requestId: number) =>
    apiRequest<SignupResponse>(`/api/admin/signup_requests/${requestId}/approve`, {
      method: 'POST',
    }),

  deleteSignupRequest: (requestId: number) =>
    apiRequest<SignupResponse>(`/api/admin/signup_requests/${requestId}`, {
      method: 'DELETE',
    }),

  searchUsers: (query: string) => {
    const params = new URLSearchParams({ q: query });

    return apiRequest<UserInfoResponse[]>(`/api/admin/search?${params.toString()}`);
  },

  downloadReport: ({ date_from, date_to }: ReportRequest) => {
    const params = new URLSearchParams({
      date_from,
      date_to,
    });

    return apiRequest<Blob>(`/api/admin/report?${params.toString()}`, {
      parseAs: 'blob',
    });
  },
};
