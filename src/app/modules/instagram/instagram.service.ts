import prisma from '../../../db/db.config';
import configs from '../../configs';

const connect = async (userId: string, code: string) => {
  const params = new URLSearchParams();
  params.append('client_id', configs?.instagramAppId || '');
  params.append('client_secret', configs?.instagramAppSecret || '');
  params.append('grant_type', 'authorization_code');
  params.append(
    'redirect_uri',
    `https://dmflow-seven.vercel.app/instagram/callback`,
  );
  params.append('code', code);

  const shortTokenRes = await fetch(
    'https://api.instagram.com/oauth/access_token',
    {
      method: 'POST',
      body: params,
    },
  );

  const shortTokenData = await shortTokenRes.json();

  console.log('Short token response:', shortTokenData);

  // Check for errors
  if (shortTokenData.error_type || shortTokenData.error) {
    throw new Error(
      `Failed to exchange code for token: ${
        shortTokenData.error_message ||
        shortTokenData.error_description ||
        'Failed to exchange code for token'
      }`,
    );
  }

  const shortLivedToken = shortTokenData.access_token;
  // const userId = shortTokenData.user_id;

  // STEP 2 - Exchange for long-lived token
  const longTokenRes = await fetch(
    `https://graph.instagram.com/access_token` +
      `?grant_type=ig_exchange_token` +
      `&client_secret=${configs?.instagramAppSecret || ''}` +
      `&access_token=${shortLivedToken}`,
  );

  const longTokenData = await longTokenRes.json();

  console.log('Long token response:', longTokenData);

  if (longTokenData.error) {
    throw new Error(
      `Failed to exchange for long-lived token: ${longTokenData.error.message || 'Unknown error'}`,
    );
  }

  const longLivedToken = longTokenData.access_token;
  const expiresIn = longTokenData.expires_in; // ~5183944 seconds = 60 days
  // fetch user profile to get username and profile picture
  const profileRes = await fetch(
    `https://graph.instagram.com/v19.0/me` +
      `?fields=id,username,name,profile_picture_url` +
      `&access_token=${longLivedToken}`,
  );
  const profile = await profileRes.json();

  console.log('Profile response:', profile);

  if (profile.error) {
    throw new Error(
      `Failed to fetch Instagram profile: ${profile.error.message || 'Unknown error'}`,
    );
  }

  //   const account = {
  //     accessToken: longLivedToken,
  //     tokenType: 'long_lived',
  //     expiresIn: expiresIn,
  //     userId: userId,
  //     username: profile.username || 'unknown',
  //     name: profile.name || '',
  //     profilePicture: profile.profile_picture_url || '',
  //   }

  let connectedAccount = await prisma.connectedAccounts.findFirst({
    where: { userId },
  });

  if (!connectedAccount) {
    connectedAccount = await prisma.connectedAccounts.create({
      data: { userId },
    });
  }

  // Check if Instagram account already exists
  const existingAccount = await prisma.account.findFirst({
    where: {
      connectedAccountId: connectedAccount.id,
      name: 'INSTAGRAM',
    },
  });

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        accessToken: longLivedToken,
        lastSyncAt: new Date(),
        expiresIn: expiresIn,
      },
    });
  } else {
    await prisma.account.create({
      data: {
        name: 'INSTAGRAM',
        accessToken: longLivedToken,
        expiresIn: expiresIn,
        username: profile.username || '',
        connectedAccountId: connectedAccount.id,
      },
    });
  }

  return { success: true };
};

const getStatus = async (userId: string) => {
  const connectedAccount = await prisma.connectedAccounts.findFirst({
    where: { userId },
    include: {
      accounts: {
        where: { name: 'INSTAGRAM' },
      },
    },
  });

  const instagramAccount = connectedAccount?.accounts?.[0];

  if (!instagramAccount) {
    return { connected: false };
  }

  return {
    connected: true,
    username: instagramAccount.username,
  };
};

const disconnect = async (userId: string) => {
  const connectedAccount = await prisma.connectedAccounts.findFirst({
    where: { userId },
    include: {
      accounts: {
        where: { name: 'INSTAGRAM' },
      },
    },
  });

  if (!connectedAccount?.accounts?.[0]) {
    throw new Error('No Instagram account connected');
  }

  await prisma.account.delete({
    where: { id: connectedAccount.accounts[0].id },
  });

  return { success: true };
};

export const InstagramServices = {
  connect,
  getStatus,
  disconnect,
};
