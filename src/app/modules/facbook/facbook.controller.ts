import { Request, Response } from 'express';

import catchAsync from '../../utils/catchAsync';
import { FacbookServices } from './facbook.service';

const connect = catchAsync(async (req: Request, res: Response) => {
  const { accessToken } = req.body;
  const result = await FacbookServices.connect(req.user.userId, accessToken);
  res.json(result);
});

const getStatus = catchAsync(async (req: Request, res: Response) => {
  const status = await FacbookServices.getStatus(req.user.userId);
  res.json(status);
});

const disconnect = catchAsync(async (req: Request, res: Response) => {
  await FacbookServices.disconnect(req.user.userId);
  res.json({ success: true });
});

export const FacbookController = {
  connect,
  getStatus,
  disconnect,
};
