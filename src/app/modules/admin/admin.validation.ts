import z from 'zod';

const adminRegisterValidation = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email({ message: 'Invalid email address' }),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, { message: 'Password must be at least 6 characters long' })
      .max(20, { message: 'Password must be at most 20 characters long' }),
    adminProfile: z
      .object({
        displayName: z.string().optional(),
        avatarUrl: z.string().optional(),
      })
      .optional(),
  }),
});

const adminLoginValidation = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email({ message: 'Invalid email address' }),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, { message: 'Password must be at least 6 characters long' })
      .max(20, { message: 'Password must be at most 20 characters long' }),
  }),
});

const forgotPasswordValidation = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email({ message: 'Invalid email address' }),
  }),
});

const resetPasswordValidation = z.object({
  body: z.object({
    id: z.string({ required_error: 'Admin id is required' }).min(1),
    token: z.string({ required_error: 'Reset token is required' }).min(1),
    newPassword: z
      .string({ required_error: 'New password is required' })
      .min(6, { message: 'Password must be at least 6 characters long' })
      .max(20, { message: 'Password must be at most 20 characters long' }),
  }),
});

const refreshTokenValidation = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export const AdminValidation = {
  adminRegisterValidation,
  adminLoginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  refreshTokenValidation,
};
