import { Profile } from '../../../generated/prisma/client';

export interface RegisterUserInput {
  email: string;
  password: string;
  profile?: Profile;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  id: string;
  token: string;
  newPassword: string;
}

export interface VerifyEmailInput {
  email: string;
  otp: string;
}
