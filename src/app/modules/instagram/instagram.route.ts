import { Router } from 'express';
import { InstagramController } from './instagram.controller';
import auth from '../../middlewares/authorization';
// import { validateConnect } from './instagram.validation';

const router = Router();

// Protected
router.post('/connect', auth(),InstagramController.connect);
router.get('/status', auth(),InstagramController.getStatus);
router.delete('/disconnect', auth(), InstagramController.disconnect);

export const InstagramRoutes = router;
