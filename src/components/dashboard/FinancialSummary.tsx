import React from 'react';

interface FinancialSummaryProps {
  todayIncome: number;
  weeklyIncome: number;
  monthlyIncome: number;
  activeRentals: number;
  todayRentals: number;
  totalVehicles: number;
  availableVehicles: number;
}

export function FinancialSummary({ 
  todayIncome, 
  weeklyIncome, 
  monthlyIncome, 
  activeRentals, 
  todayRentals,
  totalVehicles,
  availableVehicles 
}: FinancialSummaryProps) {
  const occupancyRate = totalVehicles > 0 ? Math.round(((totalVehicles - availableVehicles) / totalVehicles) * 100) : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Financiero</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">${todayIncome.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Ingresos Hoy</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">${weeklyIncome.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Esta Semana</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-purple-600">${monthlyIncome.toFixed(2)}</p>
          <p className="text-sm text-gray-600">Este Mes</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p>Promedio diario: ${monthlyIncome > 0 ? (monthlyIncome / 30).toFixed(2) : '0.00'}</p>
            <p>Rentas activas: {activeRentals}</p>
          </div>
          <div>
            <p>Rentas hoy: {todayRentals}</p>
            <p>Tasa ocupación: {occupancyRate}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}