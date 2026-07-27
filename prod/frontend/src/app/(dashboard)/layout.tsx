"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import AuthGuard from "@/components/auth/auth-guard";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <AuthGuard>
      <div className="dashboard-shell flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <div className="dashboard-print-chrome contents">
          <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />
        </div>

        {/* Main content */}
        <div className="dashboard-shell-main flex flex-1 flex-col overflow-hidden lg:ml-0">
          <div className="dashboard-print-chrome contents">
            <Header onToggleSidebar={toggleSidebar} />
          </div>

          {/* Page content */}
          <main className="dashboard-shell-content flex-1 overflow-y-auto p-4 lg:p-6">
            <div className="mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
