import { Router } from 'express';
import validation from '../../middlewares/validation';
import { GmailValidation } from './gmail.validation';
import { GmailController } from './gmail.controller';

const router = Router();

router.post(
  '/connect',
  validation(GmailValidation.gmailConnectValidation),
  GmailController.connectGmail,
);

export const GmailRoutes = router;