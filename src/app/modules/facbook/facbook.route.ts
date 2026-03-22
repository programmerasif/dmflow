import { Router } from 'express';
import { FacbookController } from './facbook.controller';
import { validateConnect } from './facbook.validation';

const router = Router();

// Protected
router.post('/connect', validateConnect, FacbookController.connect);
router.get('/status', FacbookController.getStatus);
router.delete('/disconnect', FacbookController.disconnect);

export const FacbookRoutes = router;
