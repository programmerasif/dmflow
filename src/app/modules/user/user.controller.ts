import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { UserService } from './user.service';

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

const registerUser = catchAsync(async (req, res) => {
  const user = await UserService.registerUserIntoDB(req.body);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Account created. Verify your email with OTP.',
    data: user,
  });
});

const loginUser = catchAsync(async (req, res) => {
  const { accessToken, refreshToken } = await UserService.loginUserFromDB(
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
    message: 'User logged in successfully',
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

  const { accessToken } = await UserService.refreshTokenToGetNewAccessToken(
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
  await UserService.forgetPasswordIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password reset link sent to email successfully',
  });
});

const resetPassword = catchAsync(async (req, res) => {
  await UserService.resetPasswordIntoDB(req.body);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Password reset successfully',
  });
});

const verifyUserEmail = catchAsync(async (req, res) => {
  await UserService.verifyUserEmailIntoDB(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Email verified successfully',
  });
});

const resendVerificationOtp = catchAsync(async (req, res) => {
  await UserService.resendEmailVerificationOtpIntoDB(req.body);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'OTP sent successfully',
  });
});

const getAllUsers = catchAsync(async (req, res) => {
  const users = await UserService.getAllUsersFromDB(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Users retrieved successfully',
    data: users,
  });
});

const getUserById = catchAsync(async (req, res) => {
  const user = await UserService.getUserByIdFromDB(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User retrieved successfully',
    data: user,
  });
});

const updateUser = catchAsync(async (req, res) => {
  const updatedUser = await UserService.updateUserIntoDB(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User updated successfully',
    data: updatedUser,
  });
});

const updateProfile = catchAsync(async (req, res) => {
  const updatedProfile = await UserService.updateProfileIntoDB(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Profile updated successfully',
    data: updatedProfile,
  });
});

const deleteUser = catchAsync(async (req, res) => {
  await UserService.deleteUserFromDB(req.params.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'User deleted successfully',
  });
});

export const UserController = {
  registerUser,
  loginUser,
  refreshToken,
  forgetPassword,
  resetPassword,
  verifyUserEmail,
  resendVerificationOtp,
  getAllUsers,
  getUserById,
  updateUser,
  updateProfile,
  deleteUser,
};
