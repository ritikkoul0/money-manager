'use client';

import { useEffect, useState } from 'react';
import { billApi } from '@/lib/api';
import { Bill } from '@/lib/store';
import { CheckCircle, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function CompletedPayments() {
  const [paidBills, setPaidBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPaidBills = async () => {
    setLoading(true);
    try {
      const result = await billApi.getPaidBills(10);
      setPaidBills(result);
    } catch (error) {
      console.error('Error fetching paid bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaidBills();
  }, []);

  if (loading) {
    return (
      <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  const totalPaid = (paidBills || []).reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Completed Payments</h2>
          <p className="text-sm text-gray-400 mt-1">Recently paid bills</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Total Paid</p>
          <p className="text-2xl font-bold text-green-400">₹{totalPaid.toFixed(2)}</p>
        </div>
      </div>

      {!paidBills || paidBills.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No completed payments yet</p>
          <p className="text-sm mt-2">Paid bills will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paidBills.map((bill) => (
            <div
              key={bill.id}
              className="p-4 rounded-lg border border-green-500/20 bg-green-500/5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <h4 className="font-semibold text-lg">{bill.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                      {bill.category}
                    </span>
                    {bill.recurrence !== 'none' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 capitalize">
                        {bill.recurrence}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Paid: {format(new Date(bill.updated_at), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      <span className="font-bold text-green-400 text-lg">
                        ₹{bill.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {bill.notes && (
                    <p className="text-sm text-gray-400 mt-2">{bill.notes}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

