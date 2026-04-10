'use client';

import { useEffect, useState } from 'react';
import { billApi } from '@/lib/api';
import { Bill } from '@/lib/store';
import { Bell, Calendar, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const getNextRecurringDate = (dueDate: string, recurrence: Bill['recurrence']) => {
  const nextDate = new Date(dueDate);

  switch (recurrence) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      break;
  }

  return nextDate;
};

export default function BillNotifications() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBills = async () => {
    setLoading(true);
    try {
      const result = await billApi.getUpcomingBills(30); // Next 30 days
      setBills(result);
    } catch (error) {
      console.error('Error fetching upcoming bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const handleMarkAsPaid = async (billId: string) => {
    try {
      const bill = bills.find(b => b.id === billId);
      await billApi.markBillAsPaid(billId);
      await loadBills();
      
      if (bill && bill.recurrence !== 'none') {
        const nextDate = getNextRecurringDate(bill.due_date, bill.recurrence);
        alert(`Bill marked as paid! Next due date is ${format(nextDate, 'MMM dd, yyyy')}`);
      } else {
        alert('Bill marked as paid successfully!');
      }
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      alert('Failed to mark bill as paid');
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    return differenceInDays(new Date(dueDate), new Date());
  };

  const getUrgencyColor = (daysUntil: number) => {
    if (daysUntil < 0) return 'text-red-400';
    if (daysUntil <= 3) return 'text-orange-400';
    if (daysUntil <= 7) return 'text-yellow-400';
    return 'text-blue-400';
  };

  const getUrgencyBg = (daysUntil: number) => {
    if (daysUntil < 0) return 'bg-red-500/10 border-red-500/20';
    if (daysUntil <= 3) return 'bg-orange-500/10 border-orange-500/20';
    if (daysUntil <= 7) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-blue-500/10 border-blue-500/20';
  };

  if (loading) {
    return (
      <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <Bell className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Bill Reminders</h3>
          <p className="text-sm text-gray-400">Upcoming bills in next 30 days</p>
        </div>
      </div>

      {!bills || bills.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No upcoming bills</p>
          <p className="text-sm mt-2">Add bills from the Bills tab</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {bills.map((bill) => {
            const daysUntil = getDaysUntilDue(bill.due_date);
            const urgencyColor = getUrgencyColor(daysUntil);
            const urgencyBg = getUrgencyBg(daysUntil);

            return (
              <div
                key={bill.id}
                className={`p-4 rounded-lg border ${urgencyBg} group`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{bill.title}</h4>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                        {bill.category}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(bill.due_date), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        <span className="font-medium text-white">
                          ₹{bill.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className={`flex items-center gap-1 text-sm font-medium ${urgencyColor}`}>
                      {daysUntil < 0 ? (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>Overdue by {Math.abs(daysUntil)} days</span>
                        </>
                      ) : daysUntil === 0 ? (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>Due today</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-4 h-4" />
                          <span>Due in {daysUntil} {daysUntil === 1 ? 'day' : 'days'}</span>
                        </>
                      )}
                    </div>

                    {bill.notes && (
                      <p className="text-xs text-gray-500 mt-2">{bill.notes}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleMarkAsPaid(bill.id)}
                    className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Mark as paid"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

