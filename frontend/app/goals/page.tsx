'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { financialApi } from '@/lib/api';
import { Goal, InvestmentEntry } from '@/lib/store';

type InvestmentOption = {
  id: string;
  name: string;
  amount: number;
};

const GOAL_STATUS_OPTIONS = ['Planned', 'Starting', 'Growing', 'On Track', 'Healthy', 'Optimal', 'Excellent'];

const GOAL_COLOR_PALETTE = [
  { colorFrom: '#f59e0b', colorTo: '#84cc16' },
  { colorFrom: '#fb7185', colorTo: '#f59e0b' },
  { colorFrom: '#38bdf8', colorTo: '#34d399' },
  { colorFrom: '#a78bfa', colorTo: '#22d3ee' },
  { colorFrom: '#f472b6', colorTo: '#fb7185' },
  { colorFrom: '#22c55e', colorTo: '#84cc16' },
];

const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
  const angleInRadians = (angleInDegrees * Math.PI) / 180;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const buildArc = (startAngle: number, endAngle: number, radius: number) => {
  const start = polarToCartesian(110, 110, radius, endAngle);
  const end = polarToCartesian(110, 110, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [investmentEntries, setInvestmentEntries] = useState<InvestmentEntry[]>([]);
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<Record<string, string>>({});
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [loadingInvestments, setLoadingInvestments] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [linkingGoalId, setLinkingGoalId] = useState<string | null>(null);
  const [unlinkingKey, setUnlinkingKey] = useState<string | null>(null);
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState('');
  const [newGoalStatus, setNewGoalStatus] = useState('Planned');

  const loadGoals = async () => {
    setLoadingGoals(true);
    try {
      const result = await financialApi.getGoals();
      setGoals(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Error loading goals:', error);
      setGoals([]);
    } finally {
      setLoadingGoals(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  useEffect(() => {
    const loadInvestments = async () => {
      setLoadingInvestments(true);
      try {
        const result = await financialApi.getRecentInvestmentEntries();
        setInvestmentEntries(result);
      } catch (error) {
        console.error('Error loading investments for goals:', error);
        setInvestmentEntries([]);
      } finally {
        setLoadingInvestments(false);
      }
    };

    loadInvestments();
  }, []);

  const investments = useMemo<InvestmentOption[]>(
    () =>
      (investmentEntries || []).map((entry) => ({
        id: entry.id,
        name: entry.investment_name || entry.description || 'Investment',
        amount: Number(entry.amount) || 0,
      })),
    [investmentEntries]
  );

  const linkedInvestmentIds = useMemo(
    () => (Array.isArray(goals) ? goals : []).flatMap((goal) => ((goal?.investments || []).map((investment) => investment.id))),
    [goals]
  );

  const getAvailableInvestments = (goalId: string) => {
    const currentGoal = goals.find((goal) => goal.id === goalId);
    const goalLinkedIds = (currentGoal?.investments || []).map((investment) => investment.id);

    return investments.filter(
      (investment) => !linkedInvestmentIds.includes(investment.id) || goalLinkedIds.includes(investment.id)
    );
  };

  const handleAddInvestment = async (goalId: string) => {
    const investmentId = selectedInvestmentId[goalId];
    if (!investmentId) {
      return;
    }

    try {
      setLinkingGoalId(goalId);
      await financialApi.linkInvestmentToGoal(goalId, investmentId);
      await loadGoals();
      setSelectedInvestmentId((current) => ({
        ...current,
        [goalId]: '',
      }));
    } catch (error) {
      console.error('Error linking investment to goal:', error);
    } finally {
      setLinkingGoalId(null);
    }
  };

  const handleRemoveInvestment = async (goalId: string, investmentId: string) => {
    try {
      setUnlinkingKey(`${goalId}:${investmentId}`);
      await financialApi.unlinkInvestmentFromGoal(goalId, investmentId);
      await loadGoals();
    } catch (error) {
      console.error('Error unlinking investment from goal:', error);
    } finally {
      setUnlinkingKey(null);
    }
  };

  const handleAddGoal = async () => {
    const trimmedName = newGoalName.trim();
    const parsedTarget = Number(newGoalTargetAmount);

    if (!trimmedName || !Number.isFinite(parsedTarget) || parsedTarget <= 0) {
      return;
    }

    const palette = GOAL_COLOR_PALETTE[goals.length % GOAL_COLOR_PALETTE.length];

    try {
      setSavingGoal(true);
      const createdGoal = await financialApi.createGoal({
        name: trimmedName,
        target_amount: parsedTarget,
        status: newGoalStatus,
        color_from: palette.colorFrom,
        color_to: palette.colorTo,
      });

      setGoals((current) => [createdGoal, ...current]);
      setNewGoalName('');
      setNewGoalTargetAmount('');
      setNewGoalStatus('Planned');
      setShowAddGoalForm(false);
    } catch (error) {
      console.error('Error creating goal:', error);
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1419] p-6 text-white">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-gray-500">Goals</p>
            <h1 className="mt-2 text-3xl font-semibold">Goal Meters</h1>
          </div>

          <button
            type="button"
            onClick={() => setShowAddGoalForm((current) => !current)}
            className="inline-flex items-center gap-2 self-start rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Goal
          </button>
        </div>

        {showAddGoalForm && (
          <div className="mb-6 rounded-[28px] border border-white/10 bg-[#1a1f2e] p-5 shadow-xl shadow-black/20">
            <p className="mb-4 text-sm font-semibold text-white">Create New Goal</p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <input
                type="text"
                value={newGoalName}
                onChange={(e) => setNewGoalName(e.target.value)}
                placeholder="Goal name"
                className="rounded-xl border border-white/10 bg-[#0f1419] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
              />

              <input
                type="number"
                min="1"
                step="0.01"
                value={newGoalTargetAmount}
                onChange={(e) => setNewGoalTargetAmount(e.target.value)}
                placeholder="Money goal amount"
                className="rounded-xl border border-white/10 bg-[#0f1419] px-4 py-3 text-sm text-white outline-none placeholder:text-gray-500"
              />

              <div className="relative">
                <select
                  value={newGoalStatus}
                  onChange={(e) => setNewGoalStatus(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-[#0f1419] px-4 py-3 pr-10 text-sm text-white outline-none"
                >
                  {GOAL_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              </div>

              <button
                type="button"
                onClick={handleAddGoal}
                disabled={savingGoal}
                className="rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-4 py-3 text-sm font-semibold text-[#111827] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingGoal ? 'Saving...' : 'Save Goal'}
              </button>
            </div>
          </div>
        )}

        {loadingGoals ? (
          <div className="rounded-[28px] border border-white/10 bg-[#1a1f2e] p-8 text-center text-sm text-gray-400">
            Loading goals...
          </div>
        ) : goals.length === 0 ? (
          <div className="rounded-[28px] border border-white/10 bg-[#1a1f2e] p-8 text-center text-sm text-gray-400">
            No goals found. Add a goal to get started.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {goals.map((goal) => {
              const linkedItems = goal.investments || [];
              const linkedTotal = linkedItems.reduce((sum, investment) => sum + Number(investment.amount || 0), 0);
              const progress = goal.target_amount > 0 ? Math.max(0, Math.min((linkedTotal / goal.target_amount) * 100, 100)) : 0;
              const activeArc = buildArc(180, 180 + (progress / 100) * 180, 82);
              const availableInvestments = getAvailableInvestments(goal.id);

              return (
                <div
                  key={goal.id}
                  className="rounded-[24px] border border-white/10 bg-[#1a1f2e] p-4 shadow-xl shadow-black/20"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold">{goal.name}</h2>
                      <p className="mt-1 text-sm text-gray-400">
                        Goal: ₹{Number(goal.target_amount).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.2em] text-gray-400">
                      {goal.status}
                    </span>
                  </div>

                  <div className="relative mx-auto h-[180px] w-[180px]">
                    <svg viewBox="0 0 220 140" className="absolute inset-0 h-full w-full overflow-visible scale-[0.82]">
                      <defs>
                        <linearGradient id={`goal-gradient-${goal.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor={goal.color_from} />
                          <stop offset="100%" stopColor={goal.color_to} />
                        </linearGradient>
                      </defs>

                      <path
                        d={buildArc(180, 360, 82)}
                        fill="none"
                        stroke="rgba(255,255,255,0.10)"
                        strokeWidth="18"
                        strokeLinecap="round"
                      />
                      <path
                        d={activeArc}
                        fill="none"
                        stroke={`url(#goal-gradient-${goal.id})`}
                        strokeWidth="18"
                        strokeLinecap="round"
                      />
                    </svg>

                    <div className="absolute inset-x-0 bottom-3 flex flex-col items-center justify-center text-center">
                      <p className="text-3xl font-semibold">{Math.round(progress)}%</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                        ₹{linkedTotal.toLocaleString('en-IN')} linked
                      </p>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>0%</span>
                    <span>100%</span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-white/10 bg-[#111827] p-3">
                    <p className="mb-3 text-xs uppercase tracking-[0.2em] text-gray-500">
                      Add Investment
                    </p>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <select
                          value={selectedInvestmentId[goal.id] || ''}
                          onChange={(e) =>
                            setSelectedInvestmentId((current) => ({
                              ...current,
                              [goal.id]: e.target.value,
                            }))
                          }
                          disabled={loadingInvestments || availableInvestments.length === 0 || linkingGoalId === goal.id}
                          className="w-full appearance-none rounded-xl border border-white/10 bg-[#0f1419] px-4 py-3 pr-10 text-sm text-white outline-none disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">
                            {loadingInvestments
                              ? 'Loading investments...'
                              : availableInvestments.length === 0
                                ? 'No unlinked investments'
                                : 'Select unlinked investment'}
                          </option>
                          {availableInvestments.map((investment) => (
                            <option key={investment.id} value={investment.id}>
                              {investment.name} - ₹{investment.amount.toLocaleString('en-IN')}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddInvestment(goal.id)}
                        disabled={loadingInvestments || !selectedInvestmentId[goal.id] || linkingGoalId === goal.id}
                        className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#111827] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {linkingGoalId === goal.id ? 'Adding...' : 'Add'}
                      </button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {linkedItems.length === 0 ? (
                        <p className="text-xs text-gray-500">No investment linked</p>
                      ) : (
                        linkedItems.map((investment) => {
                          const removeKey = `${goal.id}:${investment.id}`;
                          return (
                            <div
                              key={investment.id}
                              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0f1419] px-3 py-2 text-sm text-gray-300"
                            >
                              <span>
                                {(investment.investment_name || investment.description || 'Investment')} - ₹
                                {Number(investment.amount || 0).toLocaleString('en-IN')}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveInvestment(goal.id, investment.id)}
                                disabled={unlinkingKey === removeKey}
                                className="rounded-full p-1 text-gray-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Remove investment from goal"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })
                      )}
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


