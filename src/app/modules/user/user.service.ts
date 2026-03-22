import prisma from '../../../db/db.config';
import bcrypt from 'bcryptjs';
import AppError from '../../errors/AppError';
import {
  LoginUserInput,
  RegisterUserInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '../../types/user.type';
import { generateToken } from '../../utils/generateToken';
import configs from '../../configs/index';
import { builderQuery } from '../../builders/prismaBuilderQuery';
import verifyToken from '../../utils/verifyToken';
import { sendEmail } from '../../utils/sendEmail';
import { sendOTPEmail } from '../../utils/email';
import generateOTP from '../../utils/generateOTP';
import { Profile, User } from '../../../../generated/prisma/client';

const registerUserIntoDB = async (user: RegisterUserInput) => {
  const hashedPassword = await bcrypt.hash(user.password, 10);
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const response = await prisma.user.create({
    data: {
      email: user.email,
      passwordHash: hashedPassword,
      emailVerificationOtp: otp,
      emailVerificationOtpExpiresAt: otpExpiry,
      ...(user.profile && {
        profile: {
          create: {
            ...user.profile,
          },
        },
      }),
    },
    select: {
      id: true,
      email: true,
      profile: true,
      createdAt: true,
    },
  });

  await sendOTPEmail(response.email, otp);

  return response;
};

const loginUserFromDB = async (user: LoginUserInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: user.email,
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      passwordHash: true,
    },
  });

  if (!existingUser) {
    throw new AppError(401, 'No found user with the provided email');
  }

  if (!existingUser.emailVerified) {
    throw new AppError(401, 'Please verify your email before logging in');
  }

  const isPasswordValid = await bcrypt.compare(
    user.password,
    existingUser.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const payload = {
    id: existingUser.id,
    email: existingUser.email,
    role: "user",
  };

  const accessToken = generateToken(
    payload,
    configs.jwtAccessSecret as string,
    configs.accessTokenExpiration as string,
  );

  const refreshToken = generateToken(
    payload,
    configs.jwtRefreshSecret as string,
    configs.refreshTokenExpiration as string,
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: existingUser.id,
      email: existingUser.email,
    },
  };
};

const refreshTokenToGetNewAccessToken = async (refreshToken: string) => {
  if (!refreshToken) {
    throw new AppError(401, 'Refresh token is required');
  }

  const payload = (await verifyToken(
    refreshToken,
    configs.jwtRefreshSecret as string,
  )) as Record<string, unknown>;

  const userId = payload.id as string;

  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  const newAccessToken = generateToken(
    {
      id: existingUser.id,
      email: existingUser.email,
      role: "user",
    },
    configs.jwtAccessSecret as string,
    configs.accessTokenExpiration as string,
  );

  return { accessToken: newAccessToken };
};

const forgetPasswordIntoDB = async (payload: { email: string }) => {
  const existingUser = await prisma.user.findUniqueOrThrow({
    where: {
      email: payload.email,
    },
    select: {
      id: true,
      email: true,
    },
  });

  const jwtPayload = {
    id: existingUser.id,
    email: existingUser.email,
    role: "user",
  };

  const resetToken = generateToken(
    jwtPayload,
    configs.jwtAccessSecret as string,
    configs.accessTokenExpiration as string,
  );

  const resetLink = `${configs.frontendBaseUrl}/reset-password?id=${existingUser.id}&token=${resetToken}`;

  sendEmail(resetLink, existingUser.email);

  return payload.email;
};

const resetPasswordIntoDB = async (payload: ResetPasswordInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      id: payload.id,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  if (!payload.token) {
    throw new AppError(400, 'Reset token is required');
  }

  const decoded = (await verifyToken(
    payload.token,
    configs.jwtAccessSecret as string,
  )) as Record<string, unknown>;

  if ((decoded.id as string) !== existingUser.id) {
    throw new AppError(401, 'Invalid or expired reset token');
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 10);

  await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      passwordHash: hashedPassword,
    },
  });
};

const resendEmailVerificationOtpIntoDB = async (payload: { email: string }) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      emailVerificationOtp: otp,
      emailVerificationOtpExpiresAt: otpExpiry,
    },
  });

  await sendOTPEmail(existingUser.email, otp);

  return {
    email: existingUser.email,
    message: 'OTP sent successfully',
  };
};

const verifyUserEmailIntoDB = async (payload: VerifyEmailInput) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      emailVerificationOtp: true,
      emailVerificationOtpExpiresAt: true,
    },
  });

  if (!existingUser) {
    throw new AppError(404, 'User not found');
  }

  if (existingUser.emailVerified) {
    return {
      email: existingUser.email,
      message: 'Email is already verified',
    };
  }

  if (!existingUser.emailVerificationOtp) {
    throw new AppError(
      400,
      'No verification OTP found. Please request a new OTP.',
    );
  }

  if (!existingUser.emailVerificationOtpExpiresAt) {
    throw new AppError(
      400,
      'Verification OTP has expired. Please request a new OTP.',
    );
  }

  if (existingUser.emailVerificationOtpExpiresAt.getTime() < Date.now()) {
    throw new AppError(
      400,
      'Verification OTP has expired. Please request a new OTP.',
    );
  }

  if (existingUser.emailVerificationOtp !== payload.otp) {
    throw new AppError(400, 'Invalid verification OTP');
  }

  await prisma.user.update({
    where: {
      id: existingUser.id,
    },
    data: {
      emailVerified: true,
      emailVerificationOtp: null,
      emailVerificationOtpExpiresAt: null,
    },
  });

  return {
    email: existingUser.email,
    message: 'Email verified successfully',
  };
};

const getAllUsersFromDB = async (query: Record<string, any>) => {
  const usersQuery = builderQuery({
    searchFields: ['email'],
    searchTerm: query.search || '',
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: 'desc' },
    page: parseInt(query.page) || 1,
    limit: parseInt(query.limit) || 10,
  });

  const totalItems = await prisma.user.count({
    where: usersQuery.where,
  });

  const users = await prisma.user.findMany({
    ...usersQuery,
    select: {
      id: true,
      email: true,
      profile: true,
      createdAt: true,
    },
  });

  return {
    meta: {
      totalItems,
      totalPages: Math.ceil(totalItems / usersQuery.take),
      currentPage: usersQuery.skip / usersQuery.take + 1,
    },
    data: users,
  };
};

const getUserByIdFromDB = async (id: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      profile: true,
      createdAt: true,
    },
  });
  return user;
};

const updateUserIntoDB = async (id: string, data: Partial<User>) => {
  const updatedUser = await prisma.user.update({
    where: {
      id,
    },
    data: data,
  });
  return updatedUser;
};

const updateProfileIntoDB = async (
  userId: string,
  profileData: Partial<Profile>,
) => {
  const updatedProfile = await prisma.profile.update({
    where: {
      userId,
    },
    data: profileData,
  });
  return updatedProfile;
};

const deleteUserFromDB = async (id: string) => {
  await prisma.user.delete({
    where: {
      id,
    },
  });
};

export const UserService = {
  registerUserIntoDB,
  loginUserFromDB,
  refreshTokenToGetNewAccessToken,
  forgetPasswordIntoDB,
  resetPasswordIntoDB,
  resendEmailVerificationOtpIntoDB,
  verifyUserEmailIntoDB,
  getAllUsersFromDB,
  getUserByIdFromDB,
  updateUserIntoDB,
  updateProfileIntoDB,
  deleteUserFromDB,
};
