import { Router } from 'express';
import validation from '../../middlewares/validation';
import { UserValidation } from './user.validation';
import { UserController } from './user.controller';
import auth from '../../middlewares/authorization';

const router = Router();

router.post(
  '/signup',
  validation(UserValidation.userRegisterValidation),
  UserController.registerUser,
);

router.post(
  '/login',
  validation(UserValidation.userLoginValidation),
  UserController.loginUser,
);

router.post(
  '/refresh-token',
  validation(UserValidation.refreshTokenValidation),
  UserController.refreshToken,
);

router.post(
  '/forget-password',
  validation(UserValidation.forgotPasswordValidation),
  UserController.forgetPassword,
);

router.post(
  '/reset-password',
  validation(UserValidation.resetPasswordValidation),
  UserController.resetPassword,
);

router.post(
  '/verify-email',
  validation(UserValidation.verifyUserEmailValidation),
  UserController.verifyUserEmail,
);

router.post(
  '/verify-email/send-otp',
  validation(UserValidation.resendVerificationOtpValidation),
  UserController.resendVerificationOtp,
);

router.get('/', auth('admin'), UserController.getAllUsers);

router.get('/:id', auth('admin', 'user'), UserController.getUserById);

router.put('/:id', auth('admin', 'user'), UserController.updateUser);

router.put('/profile/:id', auth('user'), UserController.updateProfile);

router.delete('/:id', auth('admin'), UserController.deleteUser);

export const UserRoutes = router;
