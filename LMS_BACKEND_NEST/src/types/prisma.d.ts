import { PrismaClient } from '@prisma/client';

declare global {
  namespace PrismaJson {
    type PendingLibrarian = {
      id: string;
      name: string;
      email: string;
      password: string;
      metadata: any;
      isVerified: boolean;
      otp?: string | null;
      otpExpiry?: Date | null;
      createdAt: Date;
      updatedAt: Date;
      expiresAt: Date;
      status: string;
    }
  }
}

export type CustomPrismaClient = PrismaClient & {
  pendingLibrarian: {
    findUnique: (args: any) => Promise<PrismaJson.PendingLibrarian | null>;
    findMany: (args: any) => Promise<PrismaJson.PendingLibrarian[]>;
    create: (args: any) => Promise<PrismaJson.PendingLibrarian>;
    update: (args: any) => Promise<PrismaJson.PendingLibrarian>;
    delete: (args: any) => Promise<PrismaJson.PendingLibrarian>;
    deleteMany: (args: any) => Promise<{ count: number }>;
  };
};
