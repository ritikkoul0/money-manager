'use client';

interface NetWorthCardProps {
  netWorth: number;
}

export default function NetWorthCard({ netWorth }: NetWorthCardProps) {
  return (
    <div className="bg-gradient-primary rounded-xl p-6 hover:opacity-90 transition-opacity">
      <h3 className="text-sm text-white/80 mb-2">Total Net Worth</h3>
      <p className="text-4xl font-bold text-white">
        ₹{netWorth.toLocaleString()}
      </p>
    </div>
  );
}


