import { Request, Response } from 'express';

import catchAsync from '../../utils/catchAsync';
import { XServices } from './x.service';

const initiateAuth = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  
  const url = XServices.generateAuthUrl(userId);
  res.json({ url });
});

const handleCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state } = req.query as { code: string; state: string };

  try {
    const { username } = await XServices.handleCallback(code, state);
    const redirectUrl = `${process.env.FRONTEND_BASE_URL}/app/accounts?twitter=connected&username=${username}`;
    // console.log('Redirect URL:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (err: any) {
    console.error('X OAuth Error:', err.message, err.response?.data);
    const errorUrl = `${process.env.FRONTEND_BASE_URL}/app/accounts?error=twitter_failed`;
    console.log('Error Redirect URL:', errorUrl);
    res.redirect(errorUrl);
  }
});

const getStatus = catchAsync(async (req: Request, res: Response) => {
  const status = await XServices.getStatus(req.user.id);
  res.json(status);
});

const disconnect = catchAsync(async (req: Request, res: Response) => {
  await XServices.disconnect(req.user.id);
  res.json({ success: true });
});

export const XController = {
  initiateAuth,
  handleCallback,
  getStatus,
  disconnect,
};
