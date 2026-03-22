import { Router } from 'express';
import validation from '../../middlewares/validation';
import { AdminValidation } from './admin.validation';
import { AdminController } from './admin.controller';
import auth from '../../middlewares/authorization';

const router = Router();

router.post(
  '/signup',
  validation(AdminValidation.adminRegisterValidation),
  AdminController.registerAdmin,
);

router.post(
  '/login',
  validation(AdminValidation.adminLoginValidation),
  AdminController.loginAdmin,
);

router.post(
  '/refresh-token',
  validation(AdminValidation.refreshTokenValidation),
  AdminController.refreshToken,
);

router.post(
  '/forget-password',
  validation(AdminValidation.forgotPasswordValidation),
  AdminController.forgetPassword,
);

router.post(
  '/reset-password',
  validation(AdminValidation.resetPasswordValidation),
  AdminController.resetPassword,
);

router.get('/', auth('admin'), AdminController.getAllAdmins);

router.get('/:id', auth('admin'), AdminController.getAdminById);

router.put('/:id', auth('admin'), AdminController.updateAdmin);

router.put('/profile/:id', auth('admin'), AdminController.updateAdminProfile);

router.delete('/:id', auth('admin'), AdminController.deleteAdmin);

export const AdminRoutes = router;
