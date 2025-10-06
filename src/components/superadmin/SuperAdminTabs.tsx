import React from 'react';
import { Building2, Crown, Calendar, Users } from 'lucide-react';

interface SuperAdminTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function SuperAdminTabs({ activeTab, onTabChange }: SuperAdminTabsProps) {
  const tabs = [
    { id: 'empresas', label: 'Empresas', icon: Building2 },
    { id: 'planes', label: 'Planes', icon: Crown },
    { id: 'suscripciones', label: 'Suscripciones', icon: Calendar },
    { id: 'usuarios', label: 'Usuarios', icon: Users }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex space-x-8 px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}