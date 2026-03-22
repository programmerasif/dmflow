import axios from 'axios';
import AppError from '../../errors/AppError';
import prisma from '../../../db/db.config';

const connectGmail = async (userId: string, code: string) => {
  try {
    // 1. Exchange code for access token
    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    });

    const accessToken = tokenRes.data.access_token;
    const refreshToken = tokenRes.data.refresh_token;

    // 2. Get user info
    const userRes = await axios.get(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const email = userRes.data.email;
    const googleId = userRes.data.id;

    // 3. Save to DB using Prisma
    const connectedAccount = await prisma.connectedAccounts.create({
      data: {
        userId,
        accounts: {
          create: {
            name: 'GMAIL',
            accessToken,
            refreshToken: refreshToken || null,
          },
        },
      },
      include: {
        accounts: true,
      },
    });

    return {
      email,
      platformId: googleId,
      accountId: connectedAccount.id,
    };
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error_description ||
      error.response?.data?.error ||
      error.message ||
      'Failed to connect Gmail';
    throw new AppError(400, errorMessage);
  }
};

export const GmailService = {
  connectGmail,
};