import { Router } from 'express';
import { TModuleRoute } from '../types/moduleRoute.type';
import { XRoutes } from '../modules/x/x.route';
import { UserRoutes } from '../modules/user/user.routes';
import { GmailRoutes } from '../modules/gmail/gmail.route';
import { AdminRoutes } from '../modules/admin/admin.routes';
import { InstagramRoutes } from '../modules/instagram/instagram.route';

const router = Router();

const moduleRoutes: TModuleRoute[] = [
  {
    path: '/x',
    route: XRoutes,
  },
  {
    path: '/admins',
    route: AdminRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,
  },
  {
    path: '/instagram',
    route: InstagramRoutes,
  },
  {
    path: '/gmail',
    route: GmailRoutes
  }
];
moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
