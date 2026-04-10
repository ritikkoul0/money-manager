'use client';

import { useState } from 'react';
import BillManagement from '@/components/BillManagement';
import CompletedPayments from '@/components/CompletedPayments';

export default function BillsPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-[#0f1419] text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Bills</h1>
          <p className="text-sm text-gray-400 mt-2">Manage your recurring bills and completed payments</p>
        </div>

        <BillManagement key={`bills-${refreshKey}`} onBillPaid={handleRefresh} />
        
        <CompletedPayments key={`completed-${refreshKey}`} />
      </div>
    </div>
  );
}

