import { AdminProfile } from '../../../generated/prisma/client';

export interface RegisterAdminInput {
  email: string;
  password: string;
  adminProfile?: AdminProfile;
}

export interface LoginAdminInput {
  email: string;
  password: string;
}

export interface ResetAdminPasswordInput {
  id: string;
  token: string;
  newPassword: string;
}
