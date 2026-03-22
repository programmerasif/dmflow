import prisma from '../../../db/db.config';

const connect = async (userId: string, accessToken: string) => {
  // Find or create ConnectedAccounts for this user
  let connectedAccount = await prisma.connectedAccounts.findFirst({
    where: { userId },
  });

  if (!connectedAccount) {
    connectedAccount = await prisma.connectedAccounts.create({
      data: { userId },
    });
  }

  // Check if Facebook account already exists
  const existingAccount = await prisma.account.findFirst({
    where: {
      connectedAccountId: connectedAccount.id,
      name: 'FACEBOOK',
    },
  });

  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: {
        accessToken: accessToken,
        lastSyncAt: new Date(),
      },
    });
  } else {
    await prisma.account.create({
      data: {
        name: 'FACEBOOK',
        accessToken: accessToken,
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
        where: { name: 'FACEBOOK' },
      },
    },
  });

  const facebookAccount = connectedAccount?.accounts?.[0];

  if (!facebookAccount) {
    return { connected: false };
  }

  return {
    connected: true,
    username: facebookAccount.username,
  };
};

const disconnect = async (userId: string) => {
  const connectedAccount = await prisma.connectedAccounts.findFirst({
    where: { userId },
    include: {
      accounts: {
        where: { name: 'FACEBOOK' },
      },
    },
  });

  if (!connectedAccount?.accounts?.[0]) {
    throw new Error('No Facebook account connected');
  }

  await prisma.account.delete({
    where: { id: connectedAccount.accounts[0].id },
  });

  return { success: true };
};

export const FacbookServices = {
  connect,
  getStatus,
  disconnect,
};
