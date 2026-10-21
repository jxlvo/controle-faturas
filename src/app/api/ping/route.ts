import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Rota de "keep-alive": faz uma consulta mínima no banco para o Supabase (plano gratuito)
// não pausar o projeto por inatividade. É chamada todo dia pelo Vercel Cron (vercel.json).
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Erro no ping do banco:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
