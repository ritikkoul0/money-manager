'use client';

interface BalanceCardProps {
  balance: number;
}

export default function BalanceCard({ balance }: BalanceCardProps) {
  return (
    <div className="bg-dark-card rounded-xl p-6 hover:bg-dark-hover transition-colors">
      <h3 className="text-sm text-gray-400 mb-2">Available Balance</h3>
      <p className="text-4xl font-bold text-primary-cyan">
        ₹{balance.toLocaleString()}
      </p>
    </div>
  );
}


