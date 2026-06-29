import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 exige inicializar a conexão através do Adapter
const connectionString = `${process.env.POSTGRES_URL}`;
const pool = new Pool({ connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { expense, currentInvoiceMonth, responsible } = body;
    const expensesToSave = [];
    
    // Procura o padrão de parcelamento (ex: "Parcela 1/3")
    const match = expense.title.match(/Parcela\s+(\d+)\/(\d+)/i);
    
    if (match) {
      let currentInstallment = parseInt(match[1]);
      const totalInstallments = parseInt(match[2]);
      const [year, month] = currentInvoiceMonth.split('-').map(Number);
      
      // Loop para criar a parcela atual e as futuras
      for (let i = 0; currentInstallment + i <= totalInstallments; i++) {
        let nextMonth = month + i;
        let nextYear = year;
        
        // Vira o ano se passar de dezembro
        if (nextMonth > 12) {
          nextYear += Math.floor((nextMonth - 1) / 12);
          nextMonth = ((nextMonth - 1) % 12) + 1;
        }
        
        const formattedNextMonth = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;
        
        // Ajusta o título para a parcela correta
        const nextTitle = i === 0 
          ? expense.title 
          : expense.title.replace(/Parcela\s+\d+\/\d+/i, `Parcela ${currentInstallment + i}/${totalInstallments}`);
        
        expensesToSave.push({
          purchaseDate: new Date(expense.date),
          title: nextTitle,
          amount: expense.amount,
          responsible: responsible,
          invoiceMonth: formattedNextMonth,
          isInstallment: true
        });
      }
    } else {
      // Compra normal (à vista)
      expensesToSave.push({
        purchaseDate: new Date(expense.date),
        title: expense.title,
        amount: expense.amount,
        responsible: responsible,
        invoiceMonth: currentInvoiceMonth,
        isInstallment: false
      });
    }

    // Salva o array de despesas geradas de uma só vez no SQLite
    await prisma.expense.createMany({ data: expensesToSave });

    return NextResponse.json({ success: true, saved: expensesToSave.length });
  } catch (error) {
    console.error("Erro na API:", error);
    return NextResponse.json({ error: 'Erro ao salvar despesa' }, { status: 500 });
  }
}
// Adicione isso no final do arquivo src/app/api/expenses/route.ts

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      // Traz as compras organizadas por mês de fatura
      orderBy: { invoiceMonth: 'desc' }
    });
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar faturas' }, { status: 500 });
  }
}