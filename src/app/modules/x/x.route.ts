import { Router } from 'express';
import { validateCallback } from './x.validation';
import { XController } from './x.controller';
import auth from '../../middlewares/authorization';

const router = Router();

// Protected — user must be logged in
router.get('/', auth('admin', 'user'), XController.initiateAuth);

// Public — Twitter redirects here
router.get('/callback', validateCallback, XController.handleCallback);

// Protected
router.get('/status', auth('admin', 'user'), XController.getStatus);
router.delete('/disconnect', auth('admin', 'user'),  XController.disconnect);

export const XRoutes = router;
