import prisma from '../../db/db.config';
import configs from '../configs/index';
import AppError from '../errors/AppError';
import catchAsync from '../utils/catchAsync';
import jwt, { JwtPayload } from 'jsonwebtoken';

const auth = (...roles: string[]) => {
  return catchAsync(async (req, res, next) => {
    const bearerToken = req.headers.authorization;
    const cookieToken = req.cookies?.accessToken;

    // get token from either source
    const token = bearerToken?.split(' ')[1] || cookieToken;

    if (!token) {
      return res.status(401).json({
        statusCode: 401,
        success: false,
        message: 'You are not authorized to access this route',
      });
    }

    const decoded = jwt.verify(
      token,
      configs.jwtAccessSecret as string,
    ) as JwtPayload;
    const { id, role } = decoded;

    if (!roles.includes(role)) {
      return res.status(403).json({
        statusCode: 403,
        success: false,
        message: 'You do not have permission to access this route',
      });
    }

    const user =
      role === 'admin'
        ? await prisma.admin.findUnique({ where: { id } })
        : await prisma.user.findUnique({ where: { id } });

    if (!user) throw new AppError(404, 'User not found');

    req.user = decoded;
    next();
  });
};

export default auth;