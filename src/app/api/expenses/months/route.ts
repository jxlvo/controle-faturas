import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/expenses/months → lista dos meses de fatura que existem no banco (do mais recente ao mais antigo)
export async function GET() {
  try {
    const rows = await prisma.expense.findMany({
      select: { invoiceMonth: true },
      distinct: ['invoiceMonth'],
      orderBy: { invoiceMonth: 'desc' },
    });
    return NextResponse.json(rows.map((row: { invoiceMonth: string }) => row.invoiceMonth));
  } catch (error) {
    console.error('Erro ao buscar meses:', error);
    return NextResponse.json({ error: 'Erro ao buscar meses' }, { status: 500 });
  }
}
