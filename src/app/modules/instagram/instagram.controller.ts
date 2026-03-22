import { Request, Response } from 'express';

import catchAsync from '../../utils/catchAsync';
import { InstagramServices } from './instagram.service';

const connect = catchAsync(async (req: Request, res: Response) => {
  const { code } = req.body;
  const result = await InstagramServices.connect(req.user.userId, code);
  res.json(result);
});

const getStatus = catchAsync(async (req: Request, res: Response) => {
  const status = await InstagramServices.getStatus(req.user.userId);
  res.json(status);
});

const disconnect = catchAsync(async (req: Request, res: Response) => {
  await InstagramServices.disconnect(req.user.userId);
  res.json({ success: true });
});

export const InstagramController = {
  connect,
  getStatus,
  disconnect,
};
