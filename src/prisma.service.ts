import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    const pool = new Pool({
      connectionString: "postgresql://postgres.lydiqnfnbtjakovucxqc:Vinicius0506%23@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
      ssl: {
        rejectUnauthorized: false,
      },
    });
    
    const adapter = new PrismaPg(pool);
    
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }
}