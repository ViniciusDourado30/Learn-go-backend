import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: "postgresql://postgres.lydiqnfnbtjakovucxqc:Vinicius0506%23@aws-1-sa-east-1.pooler.supabase.com:5432/postgres",
  },
});