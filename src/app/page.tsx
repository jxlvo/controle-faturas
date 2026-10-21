'use client';

import { useState, useEffect } from 'react';
import { sumInCents, formatCents } from '@/lib/money';

type Expense = {
  id: string;
  title: string;
  amount: number;
  responsible: string;
  invoiceMonth: string;
  isInstallment: boolean;
};

export default function DashboardPage() {
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);
  const [loadedMonth, setLoadedMonth] = useState<string>(''); // mês a que `monthExpenses` pertence
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  // Controles de visualização
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<'Julinho' | 'Fabiana'>('Julinho');
  const [isLoading, setIsLoading] = useState(true); // só a primeira carga da tela
  const [loadError, setLoadError] = useState(false);

  // 1) Ao abrir a tela, busca só a lista de meses que existem no banco (ex: ['2026-08', '2026-07'])
  useEffect(() => {
    fetch('/api/expenses/months')
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao buscar meses');
        return res.json();
      })
      .then((months: string[]) => {
        setAvailableMonths(months);

        if (months.length === 0) {
          setIsLoading(false);
          return;
        }

        // Seleciona o mês atual por padrão (fuso de São Paulo). Se não houver fatura
        // nesse mês, usa a mais próxima anterior.
        const currentMonth = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
        })
          .format(new Date())
          .slice(0, 7); // ex: "2026-10"

        // `months` está em ordem decrescente, então o primeiro <= mês atual é o mais próximo
        // anterior. Se só existirem meses futuros, pega o mais próximo deles (o último da lista).
        setSelectedMonth(months.find((m) => m <= currentMonth) ?? months[months.length - 1]);
      })
      .catch((error) => {
        // Evita ficar preso em "Carregando fatura..." quando o banco não responde
        console.error(error);
        setLoadError(true);
        setIsLoading(false);
      });
  }, []);

  // 2) Sempre que o mês selecionado muda, busca só as compras daquele mês
  useEffect(() => {
    if (!selectedMonth) return;

    let cancelled = false; // ignora respostas de um mês que já não está selecionado

    fetch(`/api/expenses?month=${selectedMonth}`)
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao buscar faturas');
        return res.json();
      })
      .then((data: Expense[]) => {
        if (cancelled) return;
        setMonthExpenses(data);
        setLoadedMonth(selectedMonth);
        setIsLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        setLoadError(true);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  // Enquanto o mês escolhido ainda não chegou do servidor
  const isMonthLoading = selectedMonth !== '' && loadedMonth !== selectedMonth;

  // Filtra as despesas do mês carregado pela Pessoa Selecionada
  const displayExpenses = isMonthLoading
    ? []
    : monthExpenses.filter((e) => e.responsible === selectedPerson);

  // Soma o total exato daquela pessoa naquele mês (em centavos, sem erro de ponto flutuante)
  const totalCents = sumInCents(displayExpenses.map((item) => item.amount));

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando fatura...</div>;
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-center p-8">
        Não foi possível carregar as faturas. Tente novamente em instantes.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans">
      <div className="max-w-3xl mx-auto">
        
        <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Resumo da Fatura</h1>

        {/* Controles de Filtro (Mês e Pessoa) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-6 justify-between items-center">
          
          <div className="flex flex-col w-full md:w-1/3">
            <label className="text-sm text-gray-500 font-medium mb-2">Mês da Fatura</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableMonths.length === 0 && <option>Sem faturas</option>}
              {availableMonths.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          <div className="flex w-full md:w-auto bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setSelectedPerson('Julinho')}
              className={`flex-1 md:w-32 py-2 text-sm font-bold rounded-md transition-all ${
                selectedPerson === 'Julinho' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Julinho
            </button>
            <button
              onClick={() => setSelectedPerson('Fabiana')}
              className={`flex-1 md:w-32 py-2 text-sm font-bold rounded-md transition-all ${
                selectedPerson === 'Fabiana' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Fabiana
            </button>
          </div>
        </div>

        {/* Card do Total */}
        <div className={`p-8 rounded-xl shadow-md mb-8 text-center text-white ${
          selectedPerson === 'Julinho' ? 'bg-blue-600' : 'bg-purple-600'
        }`}>
          <h2 className="text-lg font-medium opacity-90 mb-1">Total a pagar em {selectedMonth}</h2>
          <p className="text-5xl font-bold">
            {isMonthLoading ? '...' : `R$ ${formatCents(totalCents)}`}
          </p>
        </div>

        {/* Tabela de Detalhes da Pessoa */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50">
            <h3 className="text-gray-700 font-bold">Compras de {selectedPerson} na fatura {selectedMonth}</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-gray-400 text-sm border-b border-gray-100">
                  <th className="p-4 font-medium">Descrição do Item</th>
                  <th className="p-4 font-medium text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {displayExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="p-8 text-center text-gray-400">
                      {isMonthLoading ? 'Carregando fatura...' : `Nenhuma despesa para ${selectedPerson} neste mês.`}
                    </td>
                  </tr>
                ) : (
                  displayExpenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50 border-b border-gray-50 last:border-0 transition">
                      <td className="p-4 text-gray-800 font-medium">
                        {expense.title}
                        {expense.isInstallment && (
                          <span className="ml-3 text-[10px] uppercase tracking-wider bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                            Parcela Futura
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-gray-700 whitespace-nowrap">
                        R$ {expense.amount.toFixed(2).replace('.', ',')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}