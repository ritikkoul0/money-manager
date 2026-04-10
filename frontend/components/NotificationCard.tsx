'use client';

import { Bell } from 'lucide-react';

export default function NotificationCard() {
  return (
    <div className="bg-dark-card rounded-xl p-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-orange-500 p-2 rounded-lg">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-semibold mb-1">Notification</h3>
        </div>
      </div>
      <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
        <p className="text-sm text-orange-200">
          3 Bills are past Due. Pay soon to avoid late fees.
        </p>
      </div>
    </div>
  );
}


