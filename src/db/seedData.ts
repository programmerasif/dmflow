import configs from '../app/configs/index';
import prisma from './db.config';
import bcryptjs from 'bcryptjs';

const seedData = async () => {
  try {
    const adminEmail = configs.adminEmail as string;
    const adminPassword = configs.adminPassword as string;
    const adminName = configs.adminName as string;

    if (!adminEmail || !adminPassword) {
      console.warn(
        'Skipping admin seed: ADMIN_EMAIL or ADMIN_PASSWORD is missing',
      );
      return;
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { email: adminEmail },
      select: { id: true },
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    const hashPassword = await bcryptjs.hash(adminPassword, 10);

    await prisma.admin.create({
      data: {
        email: adminEmail,
        passwordHash: hashPassword,
        adminProfile: {
          create: {
            displayName: adminName,
          },
        },
      },
    });

    console.log('Admin user seeded successfully');
  } catch (error) {
    console.error('Error seeding data:', error);
    // Continue server startup even if seeding fails
  }
};

export default seedData;
