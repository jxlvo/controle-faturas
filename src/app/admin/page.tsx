'use client';

import { useState } from 'react';
import Papa from 'papaparse';

type Expense = {
  date: string;
  title: string;
  amount: number;
};

export default function AdminPage() {
  const [expensesQueue, setExpensesQueue] = useState<Expense[]>([]);
  const [invoiceMonth, setInvoiceMonth] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Extrai o mês do nome do arquivo (ex: Nubank_2026-07-01.csv -> 2026-07)
    const match = file.name.match(/_(\d{4}-\d{2})/);
    if (match) setInvoiceMonth(match[1]);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validExpenses = results.data
          .map((row: any) => ({
            date: row.date,
            title: row.title,
            amount: parseFloat(row.amount.replace(',', '.')),
          }))
          .filter((exp) => exp.amount > 0 && !isNaN(exp.amount)); // Ignora pagamentos da fatura

        setExpensesQueue(validExpenses);
      },
    });
  };

  const handleClassify = async (responsible: string) => {
    if (expensesQueue.length === 0) return;
    setIsProcessing(true);

    const currentExpense = expensesQueue[0];

    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expense: currentExpense,
          currentInvoiceMonth: invoiceMonth || '2026-07',
          responsible,
        }),
      });

      if (response.ok) {
        // Remove o item classificado e passa para o próximo da fila
        setExpensesQueue((prev) => prev.slice(1));
      } else {
        alert('Erro ao salvar no banco de dados.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentExpense = expensesQueue[0];

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Classificação de Fatura</h1>

      {expensesQueue.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <label className="block text-gray-700 font-medium mb-4">
            Faça upload do CSV do Nubank
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <p className="text-sm text-gray-500 mb-2">
            Faltam: <strong>{expensesQueue.length}</strong> itens
          </p>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">{currentExpense.title}</h2>
          <p className="text-gray-500 mb-6">{currentExpense.date}</p>
          <p className="text-4xl font-bold text-red-500 mb-8">
            R$ {currentExpense.amount.toFixed(2).replace('.', ',')}
          </p>

          <p className="text-gray-700 mb-4">De quem é essa compra?</p>
          
          <div className="flex gap-4">
            <button
              onClick={() => handleClassify('Julinho')}
              disabled={isProcessing}
              className="flex-1 bg-blue-600 text-white py-3 rounded-md font-bold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              Julinho
            </button>
            <button
              onClick={() => handleClassify('Fabiana')}
              disabled={isProcessing}
              className="flex-1 bg-purple-600 text-white py-3 rounded-md font-bold hover:bg-purple-700 disabled:opacity-50 transition"
            >
              Fabiana
            </button>
          </div>
        </div>
      )}
    </div>
  );
}