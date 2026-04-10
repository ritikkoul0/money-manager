"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  const isLoginPage = pathname === '/login';
  
  if (isLoginPage || status === 'loading') {
    return <>{children}</>;
  }
  
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:ml-64">
        {children}
      </main>
    </div>
  );
}


