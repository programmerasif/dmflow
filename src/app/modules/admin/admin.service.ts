import prisma from '../../../db/db.config';
import bcrypt from 'bcryptjs';
import AppError from '../../errors/AppError';
import {
  LoginAdminInput,
  RegisterAdminInput,
  ResetAdminPasswordInput,
} from '../../types/admin.type';
import { generateToken } from '../../utils/generateToken';
import configs from '../../configs/index';
import { builderQuery } from '../../builders/prismaBuilderQuery';
import verifyToken from '../../utils/verifyToken';
import { sendEmail } from '../../utils/sendEmail';
import { Admin, AdminProfile } from '../../../../generated/prisma/client';

const registerAdminIntoDB = async (admin: RegisterAdminInput) => {
  const existingAdmin = await prisma.admin.findUnique({
    where: {
      email: admin.email,
    },
    select: {
      id: true,
    },
  });

  if (existingAdmin) {
    throw new AppError(409, 'Admin already exists with this email');
  }

  const hashedPassword = await bcrypt.hash(admin.password, 10);

  const response = await prisma.admin.create({
    data: {
      email: admin.email,
      passwordHash: hashedPassword,
      emailVerified: true,
      ...(admin.adminProfile && {
        adminProfile: {
          create: {
            ...admin.adminProfile,
          },
        },
      }),
    },
    select: {
      id: true,
      email: true,
      adminProfile: true,
      createdAt: true,
    },
  });

  return response;
};

const loginAdminFromDB = async (admin: LoginAdminInput) => {
  const existingAdmin = await prisma.admin.findUnique({
    where: {
      email: admin.email,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!existingAdmin) {
    throw new AppError(401, 'No found admin with the provided email');
  }

  const isPasswordValid = await bcrypt.compare(
    admin.password,
    existingAdmin.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError(401, 'Invalid email or password');
  }

  const payload = {
    id: existingAdmin.id,
    email: existingAdmin.email,
    role: 'admin',
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
    admin: {
      id: existingAdmin.id,
      email: existingAdmin.email,
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

  const adminId = payload.id as string;

  const existingAdmin = await prisma.admin.findUnique({
    where: {
      id: adminId,
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!existingAdmin) {
    throw new AppError(404, 'Admin not found');
  }

  const newAccessToken = generateToken(
    {
      id: existingAdmin.id,
      email: existingAdmin.email,
      role: 'admin',
    },
    configs.jwtAccessSecret as string,
    configs.accessTokenExpiration as string,
  );

  return { accessToken: newAccessToken };
};

const forgetPasswordIntoDB = async (payload: { email: string }) => {
  const existingAdmin = await prisma.admin.findUniqueOrThrow({
    where: {
      email: payload.email,
    },
    select: {
      id: true,
      email: true,
    },
  });

  const jwtPayload = {
    id: existingAdmin.id,
    email: existingAdmin.email,
    role: 'admin',
  };

  const resetToken = generateToken(
    jwtPayload,
    configs.jwtAccessSecret as string,
    configs.accessTokenExpiration as string,
  );

  const resetLink = `${configs.frontendBaseUrl}/admin/reset-password?id=${existingAdmin.id}&token=${resetToken}`;

  await sendEmail(resetLink, existingAdmin.email);

  return payload.email;
};

const resetPasswordIntoDB = async (payload: ResetAdminPasswordInput) => {
  const existingAdmin = await prisma.admin.findUnique({
    where: {
      id: payload.id,
    },
    select: {
      id: true,
      email: true,
      passwordHash: true,
    },
  });

  if (!existingAdmin) {
    throw new AppError(404, 'Admin not found');
  }

  if (!payload.token) {
    throw new AppError(400, 'Reset token is required');
  }

  const decoded = (await verifyToken(
    payload.token,
    configs.jwtAccessSecret as string,
  )) as Record<string, unknown>;

  if ((decoded.id as string) !== existingAdmin.id) {
    throw new AppError(401, 'Invalid or expired reset token');
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 10);

  await prisma.admin.update({
    where: {
      id: existingAdmin.id,
    },
    data: {
      passwordHash: hashedPassword,
    },
  });
};

const getAllAdminsFromDB = async (query: Record<string, any>) => {
  const adminsQuery = builderQuery({
    searchFields: ['email'],
    searchTerm: query.search || '',
    filter: query.filter ? JSON.parse(query.filter) : {},
    orderBy: query.orderBy ? JSON.parse(query.orderBy) : { createdAt: 'desc' },
    page: parseInt(query.page) || 1,
    limit: parseInt(query.limit) || 10,
  });

  const totalItems = await prisma.admin.count({
    where: adminsQuery.where,
  });

  const admins = await prisma.admin.findMany({
    ...adminsQuery,
    select: {
      id: true,
      email: true,
      emailVerified: true,
      adminProfile: true,
      createdAt: true,
    },
  });

  return {
    meta: {
      totalItems,
      totalPages: Math.ceil(totalItems / adminsQuery.take),
      currentPage: adminsQuery.skip / adminsQuery.take + 1,
    },
    data: admins,
  };
};

const getAdminByIdFromDB = async (id: string) => {
  const admin = await prisma.admin.findUniqueOrThrow({
    where: {
      id,
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      adminProfile: true,
      createdAt: true,
    },
  });

  return admin;
};

const updateAdminIntoDB = async (id: string, data: Partial<Admin>) => {
  const updatedAdmin = await prisma.admin.update({
    where: {
      id,
    },
    data,
  });

  return updatedAdmin;
};

const updateAdminProfileIntoDB = async (
  adminId: string,
  profileData: Partial<AdminProfile>,
) => {
  const updatedProfile = await prisma.adminProfile.update({
    where: {
      adminId,
    },
    data: profileData,
  });

  return updatedProfile;
};

const deleteAdminFromDB = async (id: string) => {
  await prisma.admin.delete({
    where: {
      id,
    },
  });
};

export const AdminService = {
  registerAdminIntoDB,
  loginAdminFromDB,
  refreshTokenToGetNewAccessToken,
  forgetPasswordIntoDB,
  resetPasswordIntoDB,
  getAllAdminsFromDB,
  getAdminByIdFromDB,
  updateAdminIntoDB,
  updateAdminProfileIntoDB,
  deleteAdminFromDB,
};
