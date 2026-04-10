'use client';

import { useEffect, useMemo, useState } from 'react';
import { financialApi } from '@/lib/api';
import { InvestmentEntry } from '@/lib/store';
import { Landmark, TrendingUp, Plus, X, Trash2, Edit2 } from 'lucide-react';
import { format } from 'date-fns';

const DEFAULT_INVESTMENT_TYPES = [
  'Stocks',
  'Bonds',
  'Mutual Funds',
  'ETFs',
  'Cryptocurrency',
  'Real Estate',
  'Commodities',
  'Savings Account',
  'Fixed Deposit',
  'Other',
];

const getInitialFormData = () => ({
  amount: '',
  description: 'Stocks',
  investment_name: '',
  quantity: '',
  purchase_date: format(new Date(), 'yyyy-MM-dd'),
  notes: '',
  date: format(new Date(), 'yyyy-MM-dd'),
});

export default function InvestmentDetailsWidget() {
  const [entries, setEntries] = useState<InvestmentEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<InvestmentEntry | null>(null);
  const [customType, setCustomType] = useState('');
  const [formData, setFormData] = useState(getInitialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const result = await financialApi.getRecentInvestmentEntries();
      setEntries(result);
    } catch (error) {
      console.error('Error fetching recent investment entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, []);

  const investmentTypes = useMemo(() => {
    if (!entries || entries.length === 0) {
      return DEFAULT_INVESTMENT_TYPES;
    }
    
    const existingTypes = entries
      .map((entry) => entry?.description?.trim() || '')
      .filter(Boolean);

    return Array.from(new Set([...DEFAULT_INVESTMENT_TYPES, ...existingTypes]));
  }, [entries]);

  const resetForm = () => {
    setFormData(getInitialFormData());
    setCustomType('');
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const selectedType = formData.description === '__custom__'
      ? (customType.trim() || 'Other')
      : formData.description;

    try {
      const payload = {
        amount: parseFloat(formData.amount),
        description: selectedType,
        investment_name: formData.investment_name,
        quantity: parseFloat(formData.quantity),
        purchase_date: formData.purchase_date,
        notes: formData.notes,
        date: formData.date,
      };

      if (editingEntry) {
        await financialApi.updateInvestmentEntry(editingEntry.id, payload);
      } else {
        await financialApi.createInvestmentEntry(payload);
      }

      resetForm();
      await loadEntries();
    } catch (error) {
      console.error('Error saving investment entry:', error);
      alert('Failed to save investment entry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (entry: InvestmentEntry) => {
    const existingType = (entry?.description || '').trim() || 'Other';
    const isDefaultType = DEFAULT_INVESTMENT_TYPES.includes(existingType);

    setEditingEntry(entry);
    setFormData({
      amount: entry.amount.toString(),
      description: isDefaultType ? existingType : '__custom__',
      investment_name: entry.investment_name || '',
      quantity: entry.quantity?.toString() || '',
      purchase_date: entry.purchase_date ? format(new Date(entry.purchase_date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      notes: entry.notes || '',
      date: entry.created_at ? format(new Date(entry.created_at), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    });
    setCustomType(isDefaultType ? '' : existingType);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this investment entry?')) {
      return;
    }

    setDeletingId(id);
    try {
      await financialApi.deleteInvestmentEntry(id);
      if (editingEntry?.id === id) {
        resetForm();
      }
      await loadEntries();
    } catch (error) {
      console.error('Error deleting investment entry:', error);
      alert('Failed to delete investment entry');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800 animate-pulse">
        <div className="h-5 bg-gray-700 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
          <div className="h-16 bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/20">
            <Landmark className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Investment Entries</h3>
            <p className="text-sm text-gray-400">Last 10 investment records</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setEditingEntry(null);
              setFormData(getInitialFormData());
              setCustomType('');
              setShowForm(true);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
        >
          {showForm ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Investment
            </>
          )}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-[#111827] rounded-lg border border-gray-800">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                Investment Type
              </label>
              <select
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              >
                {investmentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value="__custom__">Add new type...</option>
              </select>
            </div>

            {formData.description === '__custom__' && (
              <div>
                <label htmlFor="customType" className="block text-sm font-medium text-gray-300 mb-2">
                  New Investment Type
                </label>
                <input
                  type="text"
                  id="customType"
                  required
                  value={customType}
                  onChange={(e) => setCustomType(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="e.g. Gold, PPF, Startup Fund"
                />
              </div>
            )}

            <div>
              <label htmlFor="investment_name" className="block text-sm font-medium text-gray-300 mb-2">
                Investment Name
              </label>
              <input
                type="text"
                id="investment_name"
                required
                value={formData.investment_name}
                onChange={(e) => setFormData({ ...formData, investment_name: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Reliance, Bitcoin, SBI FD"
              />
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-300 mb-2">
                Invested Amount (₹)
              </label>
              <input
                type="number"
                id="amount"
                step="0.01"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-300 mb-2">
                Quantity
              </label>
              <input
                type="number"
                id="quantity"
                step="0.0001"
                min="0"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label htmlFor="purchase_date" className="block text-sm font-medium text-gray-300 mb-2">
                Purchase Date
              </label>
              <input
                type="date"
                id="purchase_date"
                required
                value={formData.purchase_date}
                onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
                Entry Date
              </label>
              <input
                type="date"
                id="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2 bg-[#1a1f2e] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                placeholder="Any notes about this investment"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 text-white rounded-lg transition-colors"
            >
              {submitting ? 'Saving...' : editingEntry ? 'Update Investment Entry' : 'Add Investment Entry'}
            </button>
          </div>
        </form>
      )}

      {!entries || entries.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>No investment entries found</p>
          <p className="text-sm mt-2">Recent investment activity will appear here</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-lg bg-[#111827] border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{entry.investment_name || entry?.description || 'Investment'}</h3>
                    <p className="text-sm text-gray-400">
                      {entry?.description || 'Investment Type'} • Qty: {entry.quantity ?? 0}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(entry)}
                    className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                    title="Edit investment"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    disabled={deletingId === entry.id}
                    className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors disabled:opacity-50"
                    title="Delete investment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-400 space-y-1">
                  <p>Purchase: {entry.purchase_date ? format(new Date(entry.purchase_date), 'MMM dd, yyyy') : '-'}</p>
                  <p>{format(new Date(entry.created_at), 'MMM dd, yyyy h:mm a')}</p>
                  {entry.notes && (
                    <p className="text-xs text-gray-500 mt-1 italic">{entry.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-400">
                    ₹{entry.amount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

