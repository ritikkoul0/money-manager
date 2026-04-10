'use client';

import { useEffect, useState } from 'react';
import { FinancialSummary } from '@/lib/store';
import { ChevronDown, TrendingDown, TrendingUp } from 'lucide-react';

interface FinancialBarCardProps {
  title: string;
  fetchData: (timeRange?: string) => Promise<FinancialSummary>;
  color: string;
  gradientFrom: string;
  gradientTo: string;
}

type TimeRange = 'day' | 'week' | 'month' | 'year';

export default function FinancialBarCard({
  title,
  fetchData,
  color,
  gradientFrom,
  gradientTo,
}: FinancialBarCardProps) {
  const [data, setData] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('day');
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const result = await fetchData(timeRange);
        setData(result);
      } catch (error) {
        console.error(`Error fetching ${title}:`, error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [fetchData, title, timeRange]);

  if (loading) {
    return (
      <div className="bg-[#1a1f2e] rounded-xl p-6 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-700 rounded w-1/2 mb-6"></div>
        <div className="mx-auto h-48 w-48 rounded-full bg-gray-700"></div>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <div className="h-20 bg-gray-700 rounded-xl"></div>
          <div className="h-20 bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800">
        <div className="text-center py-8">
          <p className="text-gray-400">Unable to load {title} data</p>
          <p className="text-sm text-gray-500 mt-2">Please check your database connection</p>
        </div>
      </div>
    );
  }

  const isPositive = data.percentage_change >= 0;

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: 'year', label: 'Year' },
  ];

  const getTimeRangeLabel = () => {
    return timeRangeOptions.find((opt) => opt.value === timeRange)?.label || 'Day';
  };

  const getTimeRangeDisplayLabel = () => {
    switch (timeRange) {
      case 'day':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      case 'year':
        return 'This Year';
      default:
        return 'Today';
    }
  };

  const chartData = data.chart_data ?? [];
  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((d) => d.amount), 1) : 1;
  const averageAmount =
    chartData.length > 0
      ? chartData.reduce((sum, point) => sum + point.amount, 0) / chartData.length
      : 0;
  const progressValue = Math.min((data.current_amount / maxValue) * 100, 100);

  const circumference = 2 * Math.PI * 54;
  const strokeOffset = circumference - (Math.max(progressValue, 4) / 100) * circumference;

  const getRangeMeta = () => {
    if (chartData.length === 0) {
      return { label: `No ${timeRange} data`, detail: 'Add entries to view progress' };
    }

    const firstDate = new Date(chartData[0].date);
    const lastDate = new Date(chartData[chartData.length - 1].date);

    switch (timeRange) {
      case 'day':
        return {
          label: 'Today',
          detail: firstDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        };
      case 'week':
        return {
          label: 'This Week',
          detail: `${firstDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })} - ${lastDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}`,
        };
      case 'month':
        return {
          label: 'This Month',
          detail: firstDate.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          }),
        };
      case 'year':
        return {
          label: 'This Year',
          detail: firstDate.getFullYear().toString(),
        };
      default:
        return {
          label: getTimeRangeDisplayLabel(),
          detail: '',
        };
    }
  };

  const rangeMeta = getRangeMeta();

  return (
    <div className="bg-[#1a1f2e] rounded-xl p-6 border border-gray-800">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">
            {title}
          </h3>
          <p className="text-3xl font-bold mt-2">
            ₹{data.current_amount.toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-300 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors uppercase"
          >
            <span>THIS {getTimeRangeLabel().toUpperCase()}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-32 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTimeRange(option.value);
                      setShowDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                      timeRange === option.value
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-300 hover:bg-gray-700/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r="54"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="14"
              fill="none"
            />
            <circle
              cx="70"
              cy="70"
              r="54"
              stroke={color}
              strokeWidth="14"
              strokeLinecap="round"
              fill="none"
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={strokeOffset}
              style={{ transition: 'stroke-dashoffset 0.5s ease' }}
            />
          </svg>

          <div className="absolute inset-6 rounded-full bg-[#111827] border border-white/5 flex flex-col items-center justify-center text-center px-4">
            <p className="text-4xl font-bold" style={{ color }}>
              {Math.round(progressValue)}%
            </p>
            <p className="text-sm text-gray-300 mt-1">{rangeMeta.label}</p>
            <p className="text-[11px] text-gray-500 mt-1">{rangeMeta.detail}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full mt-6">
          <div className="rounded-xl border border-gray-800 bg-[#151b28] p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Average</p>
            <p className="text-lg font-semibold mt-2">
              ₹{averageAmount.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-[#151b28] p-4">
            <p className="text-xs uppercase tracking-wider text-gray-500">Entries</p>
            <p className="text-lg font-semibold mt-2">{chartData.length}</p>
          </div>
        </div>

        {chartData.length > 0 && (
          <div className="w-full mt-5 space-y-2">
            {chartData.slice(-3).reverse().map((point, index) => (
              <div
                key={`${point.date}-${index}`}
                className="flex items-center justify-between rounded-lg bg-[#151b28] px-4 py-3 border border-gray-800"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    ₹{point.amount.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(point.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div
                  className="h-2.5 rounded-full"
                  style={{
                    width: `${Math.max((point.amount / maxValue) * 88, 16)}px`,
                    background: `linear-gradient(90deg, ${gradientFrom}, ${gradientTo})`,
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

