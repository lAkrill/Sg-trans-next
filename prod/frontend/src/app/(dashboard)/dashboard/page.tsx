import { Card, CardContent, Button } from "@/components/ui";
import Link from "next/link";
import { Settings } from "lucide-react";
import QuickActions from "@/components/dashboard/quick-actions";

import UserMessageCard from "@/components/cards/user-message";

export default function DashboardPage() {

  return (
    <div className="space-y-7">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Панель управления</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Добро пожаловать в систему управления SG Trans</p>
      </div>

      {/* Quick actions */}
      <QuickActions />

      {/* Settings shortcut */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between max-lg:flex-col">
            <div className="flex items-center space-x-4">
              <div className="p-3 rounded-lg bg-gray-500">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Настройки</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Настройка системы и пользовательских предпочтений
                </p>
              </div>
            </div>
            <Link href="/settings">
              <Button variant="outline">Перейти к настройкам</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* User info card */}
      <UserMessageCard />
    </div>
  );
}
