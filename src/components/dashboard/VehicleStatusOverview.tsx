import React from 'react';

interface VehicleStatusOverviewProps {
  totalVehicles: number;
  availableVehicles: number;
}

export function VehicleStatusOverview({ totalVehicles, availableVehicles }: VehicleStatusOverviewProps) {
  const rentedVehicles = totalVehicles - availableVehicles;
  const availablePercentage = totalVehicles > 0 ? (availableVehicles / totalVehicles) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Vehículos</h3>
      <div className="flex items-center space-x-6 mb-4">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">
            Disponibles: {availableVehicles}
          </span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">
            Rentados: {rentedVehicles}
          </span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-sm text-gray-600">
            Total: {totalVehicles}
          </span>
        </div>
      </div>
      
      {totalVehicles > 0 && (
        <div>
          <div className="bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${availablePercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {Math.round(availablePercentage)}% disponible
          </p>
        </div>
      )}
    </div>
  );
}