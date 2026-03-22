import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { AdminService } from './admin.service';

const isProduction = process.env.NODE_ENV === 'production';

const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ('none' as const) : ('lax' as const),
  path: '/',
};

const parseCookieValue = (cookieHeader: string | undefined, key: string) => {
  if (!cookieHeader) {
    return undefined;
  }

  const parts = cookieHeader.split(';').map((part) => part.trim());
  const found = parts.find((part) => part.startsWith(`${key}=`));

  if (!found) {
    return undefined;
  }

  return decodeURIComponent(found.split('=')[1] || '');
};

const registerAdmin = catchAsync(async (req, res) => {
  const admin = await AdminService.registerAdminIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Admin registered successfully',
    data: admin,
  });
});

const loginAdmin = catchAsync(async (req, res) => {
  const { accessToken, refreshToken } = await AdminService.loginAdminFromDB(
    req.body,
  );

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin logged in successfully',
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const cookieRefreshToken = parseCookieValue(
    req.headers.cookie,
    'refreshToken',
  );

  const { accessToken } = await AdminService.refreshTokenToGetNewAccessToken(
    req.body?.refreshToken || cookieRefreshToken,
  );

  res.cookie('accessToken', accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Access token refreshed successfully',
    data: {
      accessToken,
    },
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  await AdminService.forgetPasswordIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password reset link sent to email successfully',
  });
});

const resetPassword = catchAsync(async (req, res) => {
  await AdminService.resetPasswordIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password reset successfully',
  });
});

const getAllAdmins = catchAsync(async (req, res) => {
  const admins = await AdminService.getAllAdminsFromDB(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admins retrieved successfully',
    data: admins,
  });
});

const getAdminById = catchAsync(async (req, res) => {
  const admin = await AdminService.getAdminByIdFromDB(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin retrieved successfully',
    data: admin,
  });
});

const updateAdmin = catchAsync(async (req, res) => {
  const updatedAdmin = await AdminService.updateAdminIntoDB(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin updated successfully',
    data: updatedAdmin,
  });
});

const updateAdminProfile = catchAsync(async (req, res) => {
  const updatedProfile = await AdminService.updateAdminProfileIntoDB(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin profile updated successfully',
    data: updatedProfile,
  });
});

const deleteAdmin = catchAsync(async (req, res) => {
  await AdminService.deleteAdminFromDB(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Admin deleted successfully',
  });
});

export const AdminController = {
  registerAdmin,
  loginAdmin,
  refreshToken,
  forgetPassword,
  resetPassword,
  getAllAdmins,
  getAdminById,
  updateAdmin,
  updateAdminProfile,
  deleteAdmin,
};
