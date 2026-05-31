import { userApi } from './user';
import { apiRequest } from './client';
import type {
  LoginRequest,
  SignupRequest,
  SignupResponse,
  UserInfoResponse,
} from './types';

export const authApi = {
  getProfile: userApi.getProfile,

  createSignupRequest: (payload: SignupRequest) =>
    apiRequest<SignupResponse>('/api/user/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  login: (payload: LoginRequest) =>
    apiRequest<UserInfoResponse>('/api/user/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
