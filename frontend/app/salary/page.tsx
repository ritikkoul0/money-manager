'use client';

import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, Calendar, DollarSign, Percent, ArrowUp, ArrowDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { financialApi } from '@/lib/api';
import { SalaryEntry } from '@/lib/store';

const PAYMENT_TYPES = ['yearly', 'bi-yearly', 'quarterly', 'one-time'];

export default function SalaryPage() {
  const [salaryEntries, setSalaryEntries] = useState<SalaryEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SalaryEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: '',
    company_name: '',
    payment_date: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [entries, statsData] = await Promise.all([
        financialApi.getSalaryEntries(),
        financialApi.getSalaryStats(),
      ]);
      setSalaryEntries(entries);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading salary data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateIncrement = (currentAmount: number, previousAmount: number) => {
    if (!previousAmount || previousAmount === 0) return null;
    const increment = ((currentAmount - previousAmount) / previousAmount) * 100;
    return increment;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (!formData.company_name || !formData.payment_date || isNaN(amount) || amount <= 0) {
      return;
    }

    // Auto-generate notes based on increment
    let notes = '';
    if (!editingEntry && salaryEntries && salaryEntries.length > 0) {
      const lastSalary = salaryEntries[0].amount;
      const increment = calculateIncrement(amount, lastSalary);
      if (increment !== null) {
        if (increment > 0) {
          notes = `Salary increased by ${increment.toFixed(2)}%`;
        } else if (increment < 0) {
          notes = `Salary decreased by ${Math.abs(increment).toFixed(2)}%`;
        }
      }
    }

    setSaving(true);
    try {
      if (editingEntry) {
        await financialApi.updateSalaryEntry(editingEntry.id, {
          amount,
          company_name: formData.company_name,
          payment_date: formData.payment_date,
          payment_type: 'yearly',
          notes: editingEntry.notes,
        });
      } else {
        await financialApi.createSalaryEntry({
          amount,
          company_name: formData.company_name,
          payment_date: formData.payment_date,
          payment_type: 'yearly',
          notes,
        });
      }
      
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving salary entry:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (entry: SalaryEntry) => {
    setEditingEntry(entry);
    setFormData({
      amount: entry.amount.toString(),
      company_name: entry.company_name,
      payment_date: entry.payment_date.split('T')[0],
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this salary entry?')) {
      return;
    }

    setDeleting(id);
    try {
      await financialApi.deleteSalaryEntry(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting salary entry:', error);
    } finally {
      setDeleting(null);
    }
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      company_name: '',
      payment_date: '',
    });
    setEditingEntry(null);
    setShowAddForm(false);
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Calculate average increment percentage
  const calculateAverageIncrement = () => {
    if (!salaryEntries || salaryEntries.length < 2) return null;
    
    let totalIncrement = 0;
    let incrementCount = 0;
    
    for (let i = 0; i < salaryEntries.length - 1; i++) {
      const current = salaryEntries[i].amount;
      const previous = salaryEntries[i + 1].amount;
      const increment = calculateIncrement(current, previous);
      
      if (increment !== null) {
        totalIncrement += increment;
        incrementCount++;
      }
    }
    
    return incrementCount > 0 ? totalIncrement / incrementCount : null;
  };

  const averageIncrement = calculateAverageIncrement();

  return (
    <div className="min-h-screen bg-[#0f1419] p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Salary Tracking</p>
            <h1 className="mt-2 text-3xl font-semibold">Salary Increment Tracker</h1>
          </div>

          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 self-start rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add CTC
          </button>
        </div>

        {/* Line Charts */}
        <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Salary Growth Chart */}
          <div className="rounded-[28px] border border-white/10 bg-[#1a1f2e] p-6">
            <h3 className="mb-4 text-lg font-semibold">Salary Growth Over Time</h3>
            {salaryEntries && salaryEntries.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={[...salaryEntries].reverse().map(entry => ({
                  date: new Date(entry.payment_date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
                  salary: entry.amount,
                  company: entry.company_name,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1f2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Salary']}
                  />
                  <Line
                    type="monotone"
                    dataKey="salary"
                    stroke="#10b981"
                    strokeWidth={3}
                    dot={{ fill: '#10b981', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
                No data available. Add salary entries to see the chart.
              </div>
            )}
          </div>

          {/* Increment Percentage Chart */}
          <div className="rounded-[28px] border border-white/10 bg-[#1a1f2e] p-6">
            <h3 className="mb-4 text-lg font-semibold">Increment Percentage Trend</h3>
            {salaryEntries && salaryEntries.length > 1 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salaryEntries.slice(0, -1).reverse().map((entry, index) => {
                  const reversedEntries = [...salaryEntries].reverse();
                  const previousEntry = reversedEntries[index];
                  const increment = calculateIncrement(entry.amount, previousEntry.amount);
                  return {
                    date: new Date(entry.payment_date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
                    increment: increment || 0,
                  };
                })}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(value) => `${value.toFixed(0)}%`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1f2e',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                    formatter={(value: number) => [`${value.toFixed(2)}%`, 'Increment']}
                  />
                  <Line
                    type="monotone"
                    dataKey="increment"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-sm text-gray-400">
                Add at least 2 salary entries to see increment trends.
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-[#1a1f2e] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-500/10 p-3">
                <DollarSign className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Current CTC</p>
                <p className="text-2xl font-semibold">
                  {salaryEntries && salaryEntries.length > 0 ? formatCurrency(salaryEntries[0].amount) : '₹0'}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#1a1f2e] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-purple-500/10 p-3">
                <TrendingUp className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Entries</p>
                <p className="text-2xl font-semibold">{stats?.entry_count || 0}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#1a1f2e] p-6">
            <div className="flex items-center gap-3">
              <div className={`rounded-full p-3 ${averageIncrement && averageIncrement > 0 ? 'bg-green-500/10' : 'bg-gray-500/10'}`}>
                <Percent className={`h-6 w-6 ${averageIncrement && averageIncrement > 0 ? 'text-green-500' : 'text-gray-500'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-400">Avg Increment</p>
                <p className="text-2xl font-semibold">
                  {averageIncrement !== null ? `${averageIncrement.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <div className="mb-6 rounded-[28px] border border-white/10 bg-[#1a1f2e] p-6 shadow-xl shadow-black/20">
            <h2 className="mb-4 text-lg font-semibold">
              {editingEntry ? 'Edit CTC' : 'Add New CTC'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm text-gray-400">CTC Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="500000"
                    className="w-full rounded-xl border border-white/10 bg-[#0f1419] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">Company Name</label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                    placeholder="Company Name"
                    className="w-full rounded-xl border border-white/10 bg-[#0f1419] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm text-gray-400">Effective Date</label>
                  <input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-[#0f1419] px-4 py-3 text-sm text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-6 py-3 text-sm font-semibold text-[#111827] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingEntry ? 'Update CTC' : 'Add CTC'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold transition hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Salary History with Increment Tracking */}
        {loading ? (
          <div className="rounded-[28px] border border-white/10 bg-[#1a1f2e] p-8 text-center text-sm text-gray-400">
            Loading salary history...
          </div>
        ) : !salaryEntries || salaryEntries.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-[#1a1f2e] p-8 text-center text-sm text-gray-400">
            No salary entries found. Add your first entry to start tracking increments.
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold mb-4">Salary History & Increments</h2>
            {salaryEntries && salaryEntries.map((entry, index) => {
              const previousEntry = salaryEntries[index + 1];
              const increment = previousEntry ? calculateIncrement(entry.amount, previousEntry.amount) : null;
              const isPositive = increment !== null && increment > 0;
              const isNegative = increment !== null && increment < 0;

              return (
                <div
                  key={entry.id}
                  className="rounded-[24px] border border-white/10 bg-[#1a1f2e] p-6 transition hover:border-white/20"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold">{entry.company_name}</h3>
                        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
                          {entry.payment_type}
                        </span>
                        {increment !== null && (
                          <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
                            isPositive ? 'bg-green-500/10 text-green-500' : 
                            isNegative ? 'bg-red-500/10 text-red-500' : 
                            'bg-gray-500/10 text-gray-500'
                          }`}>
                            {isPositive ? <ArrowUp className="h-3 w-3" /> : isNegative ? <ArrowDown className="h-3 w-3" /> : null}
                            {increment > 0 ? '+' : ''}{increment.toFixed(2)}% increment
                          </span>
                        )}
                      </div>
                      
                      <div className="mb-3 flex items-center gap-4 text-sm text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(entry.payment_date)}
                        </span>
                        <span className="text-2xl font-semibold text-white">
                          {formatCurrency(entry.amount)}
                        </span>
                        {previousEntry && (
                          <span className="text-sm text-gray-500">
                            (from {formatCurrency(previousEntry.amount)})
                          </span>
                        )}
                      </div>

                      {entry.notes && (
                        <p className="text-sm text-gray-400 bg-white/5 rounded-lg px-3 py-2 mt-2">
                          {entry.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                        aria-label="Edit entry"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        disabled={deleting === entry.id}
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Delete entry"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


