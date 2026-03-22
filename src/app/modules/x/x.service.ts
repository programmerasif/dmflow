import axios from 'axios';
import crypto from 'crypto';
import prisma from '../../../db/db.config';

// Temporary state store for OAuth flow
const stateStore = new Map<
  string,
  { userId: string; codeVerifier: string; expiresAt: number }
>();


  const generateAuthUrl = (userId: string): string => {
  
  const state = crypto.randomBytes(16).toString('hex');
  const codeVerifier = crypto.randomBytes(32).toString('hex');
  
  // Generate code_challenge by hashing codeVerifier with SHA256 and base64-url encoding
  const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  stateStore.set(state, {
    userId,
    codeVerifier,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.X_CLIENT_ID!,
    redirect_uri: process.env.X_CALLBACK_URL!,
    scope: 'dm.read dm.write tweet.read users.read offline.access',
    // scope: 'tweet.read users.read offline.access',
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `https://twitter.com/i/oauth2/authorize?${params}`;
};

const handleCallback = async (code: string, state: string) => {
  const stored = stateStore.get(state);

  if (!stored || Date.now() > stored.expiresAt) {
    throw new Error('Invalid or expired state');
  }

  const { userId, codeVerifier } = stored;
  stateStore.delete(state);

  // Exchange code for tokens
  const tokenRes = await axios.post(
    'https://api.twitter.com/2/oauth2/token',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.X_CALLBACK_URL!,
      code_verifier: codeVerifier,
    }),
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      auth: {
        username: process.env.X_CLIENT_ID!,
        password: process.env.X_CLIENT_SECRET!,
      },
    },
  );

  const { access_token, refresh_token, expires_in } = tokenRes.data;

  // Get Twitter user info
  const userRes = await axios.get('https://api.twitter.com/2/users/me', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const { username } = userRes.data.data;

  // Find or create ConnectedAccounts for this user
  let connectedAccount = await prisma.connectedAccounts.findFirst({
    where: { userId },
  });

  if (!connectedAccount) {
    connectedAccount = await prisma.connectedAccounts.create({
      data: { userId },
    });
  }

  // Check if Twitter account already exists
  const existingAccount = await prisma.account.findFirst({
    where: {
      connectedAccountId: connectedAccount.id,
      name: 'TWITTER',
    },
  });

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        username,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: new Date(Date.now() + expires_in * 1000),
        lastSyncAt: new Date(),
      },
    });
  } else {
    await prisma.account.create({
      data: {
        name: 'TWITTER',
        username,
        accessToken: access_token,
        refreshToken: refresh_token ?? null,
        expiresAt: new Date(Date.now() + expires_in * 1000),
        connectedAccountId: connectedAccount.id,
      },
    });
  }

  return { username };
};

const getStatus = async (userId: string) => {
  const connectedAccount = await prisma.connectedAccounts.findFirst({
    where: { userId },
    include: {
      accounts: {
        where: { name: 'TWITTER' },
      },
    },
  });

  const twitterAccount = connectedAccount?.accounts?.[0];

  if (!twitterAccount) {
    return { connected: false };
  }

  return {
    connected: true,
    username: twitterAccount.username,
  };
};

const disconnect = async (userId: string) => {
  const connectedAccount = await prisma.connectedAccounts.findFirst({
    where: { userId },
    include: {
      accounts: {
        where: { name: 'TWITTER' },
      },
    },
  });

  if (!connectedAccount?.accounts?.[0]) {
    throw new Error('No Twitter account connected');
  }

  await prisma.account.delete({
    where: { id: connectedAccount.accounts[0].id },
  });

  return { success: true };
};

export const XServices = {
  generateAuthUrl,
  handleCallback,
  getStatus,
  disconnect,
};
