'use client';

import { useState, useEffect } from 'react';

type Expense = {
  id: string;
  title: string;
  amount: number;
  responsible: string;
  invoiceMonth: string;
  isInstallment: boolean;
};

export default function DashboardPage() {
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  
  // Controles de visualização
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<'Julinho' | 'Fabiana'>('Julinho');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Busca todos os dados do banco quando a tela carrega
    fetch('/api/expenses')
      .then((res) => res.json())
      .then((data: Expense[]) => {
        setAllExpenses(data);
        
        // Extrai apenas os meses únicos que existem no banco (ex: ['2026-07', '2026-08'])
        const months = Array.from(new Set(data.map((e) => e.invoiceMonth))).sort().reverse();
        setAvailableMonths(months);
        
        // Já deixa selecionado o mês mais recente por padrão
        if (months.length > 0) {
          setSelectedMonth(months[0]);
        }
        setIsLoading(false);
      });
  }, []);

  // Filtra as despesas cruzando o Mês Selecionado COM a Pessoa Selecionada
  const displayExpenses = allExpenses.filter(
    (e) => e.invoiceMonth === selectedMonth && e.responsible === selectedPerson
  );

  // Soma o total exato daquela pessoa naquele mês
  const totalAmount = displayExpenses.reduce((sum, item) => sum + item.amount, 0);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-500">Carregando fatura...</div>;
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
            R$ {totalAmount.toFixed(2).replace('.', ',')}
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
                      Nenhuma despesa para {selectedPerson} neste mês.
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