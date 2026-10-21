import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Cliente do Prisma compartilhado entre as rotas da API (/api/expenses e /api/ping).

function createPrismaClient() {
  // 1. Pegamos a URL do banco e usamos a classe URL do JS para interpretá-la
  const rawUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || '';
  const url = new URL(rawUrl);

  // 2. Removemos cirurgicamente qualquer parâmetro da Vercel (ex: ?sslmode=require) que esteja causando conflito
  url.search = '';
  const cleanConnectionString = url.toString();

  // 3. Agora sim, aplicamos nossa regra e criamos a conexão sem o bloqueio de certificado
  const pool = new Pool({
    connectionString: cleanConnectionString,
    ssl: { rejectUnauthorized: false },
  });

  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

// Reaproveita o cliente entre recarregamentos do `next dev`, evitando abrir conexões a mais
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
