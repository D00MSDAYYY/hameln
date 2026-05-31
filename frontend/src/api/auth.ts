import { userApi } from './user';
import { apiRequest } from './client';
import type {
  LoginCodeRequest,
  SignupRequest,
  SignupResponse,
  UserInfoResponse,
  VerifyCodeRequest,
} from './types';

export const authApi = {
  getProfile: userApi.getProfile,

  createSignupRequest: (payload: SignupRequest) =>
    apiRequest<SignupResponse>('/api/user/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  sendLoginCode: (payload: LoginCodeRequest) =>
    apiRequest<void>('/api/auth/send-code', {
      method: 'POST',
      body: JSON.stringify(payload),
      parseAs: 'empty',
    }),

  verifyLoginCode: (payload: VerifyCodeRequest) =>
    apiRequest<UserInfoResponse>('/api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
