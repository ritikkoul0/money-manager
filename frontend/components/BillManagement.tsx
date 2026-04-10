'use client';

import { useEffect, useState } from 'react';
import { billApi } from '@/lib/api';
import { Bill } from '@/lib/store';
import { Plus, X, Calendar, DollarSign, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const BILL_CATEGORIES = [
  'Rent',
  'Utilities',
  'Internet',
  'Phone',
  'Insurance',
  'Subscription',
  'Loan Payment',
  'Credit Card',
  'Other',
];

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'One-time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'half-yearly', label: 'Half-Yearly' },
  { value: 'yearly', label: 'Yearly' },
];

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
    case 'half-yearly':
      nextDate.setMonth(nextDate.getMonth() + 6);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      break;
  }

  return nextDate;
};

interface BillManagementProps {
  onBillPaid?: () => void;
}

export default function BillManagement({ onBillPaid }: BillManagementProps = {}) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: 'Rent',
    due_date: format(new Date(), 'yyyy-MM-dd'),
    recurrence: 'none',
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const loadBills = async () => {
    setLoading(true);
    try {
      const result = await billApi.getBills();
      setBills(result);
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingBill) {
        await billApi.updateBill(editingBill.id, {
          title: formData.title,
          amount: parseFloat(formData.amount),
          category: formData.category,
          due_date: formData.due_date,
          recurrence: formData.recurrence as any,
          notes: formData.notes,
        });
      } else {
        await billApi.createBill({
          title: formData.title,
          amount: parseFloat(formData.amount),
          category: formData.category,
          due_date: formData.due_date,
          recurrence: formData.recurrence,
          notes: formData.notes,
        });
      }

      setFormData({
        title: '',
        amount: '',
        category: 'Rent',
        due_date: format(new Date(), 'yyyy-MM-dd'),
        recurrence: 'none',
        notes: '',
      });
      setShowForm(false);
      setEditingBill(null);
      await loadBills();
    } catch (error) {
      console.error('Error saving bill:', error);
      alert('Failed to save bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (bill: Bill) => {
    setEditingBill(bill);
    setFormData({
      title: bill.title,
      amount: bill.amount.toString(),
      category: bill.category,
      due_date: format(new Date(bill.due_date), 'yyyy-MM-dd'),
      recurrence: bill.recurrence,
      notes: bill.notes || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) {
      return;
    }

    try {
      await billApi.deleteBill(id);
      await loadBills();
    } catch (error) {
      console.error('Error deleting bill:', error);
      alert('Failed to delete bill');
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      const bill = bills.find(b => b.id === id);
      await billApi.markBillAsPaid(id);
      await loadBills();
      
      // Trigger parent refresh
      if (onBillPaid) {
        onBillPaid();
      }
      
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'overdue':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-24 bg-gray-700 rounded"></div>
          <div className="h-24 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">Bill Management</h2>
          <p className="text-sm text-gray-400 mt-1">Manage your recurring bills and payments</p>
        </div>
        <button
          onClick={() => {
            setEditingBill(null);
            setFormData({
              title: '',
              amount: '',
              category: 'Rent',
              due_date: format(new Date(), 'yyyy-MM-dd'),
              recurrence: 'none',
              notes: '',
            });
            setShowForm(!showForm);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Bill
            </>
          )}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-[#111827] rounded-lg border border-gray-800">
          <h3 className="text-lg font-semibold mb-4">
            {editingBill ? 'Edit Bill' : 'Add New Bill'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                Bill Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g., Monthly Rent"
              />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                Amount (₹) *
              </label>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {BILL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="due_date" className="block text-sm font-medium text-gray-300 mb-2">
                Due Date *
              </label>
              <input
                type="date"
                id="due_date"
                required
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="recurrence" className="block text-sm font-medium text-gray-300 mb-2">
                Recurrence
              </label>
              <select
                id="recurrence"
                value={formData.recurrence}
                onChange={(e) => setFormData({ ...formData, recurrence: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {RECURRENCE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <input
                type="text"
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Additional notes"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="mt-4 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {submitting ? 'Saving...' : editingBill ? 'Update Bill' : 'Add Bill'}
          </button>
        </form>
      )}

      {!bills || bills.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No bills added yet</p>
          <p className="text-sm mt-2">Click "Add Bill" to create your first bill reminder</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bills.map((bill) => (
            <div
              key={bill.id}
              className={`p-4 rounded-lg border ${getStatusColor(bill.status)} group`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-lg">{bill.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                      {bill.category}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300 capitalize">
                      {bill.recurrence}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm mb-2">
                    <div className="flex items-center gap-1 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>Due: {format(new Date(bill.due_date), 'MMM dd, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-bold text-white text-lg">
                        ₹{bill.amount.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {bill.notes && (
                    <p className="text-sm text-gray-400 mt-2">{bill.notes}</p>
                  )}

                  <div className="mt-2">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${getStatusColor(bill.status)}`}>
                      {bill.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {bill.status === 'pending' && (
                    <button
                      onClick={() => handleMarkAsPaid(bill.id)}
                      className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition-colors"
                      title="Mark as paid"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(bill)}
                    className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                    title="Edit bill"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(bill.id)}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Delete bill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

