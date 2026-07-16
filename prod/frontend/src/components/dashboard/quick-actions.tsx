"use client";

import { Cog, Train, MapPin, Users, Wrench } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { useCurrentUser } from "@/api";
import { roleUtils } from "@/lib/permissions";
import Link from "next/link";

const QuickActions = () => {
  const { data: user } = useCurrentUser();

  const quickActions = [
    {
      title: "Вагоны",
      description: "Управление цистернами",
      icon: Train,
      href: "/cisterns",
      color: "bg-green-500",
    },
    {
      title: "Местоположения",
      description: "Отслеживание",
      icon: MapPin,
      href: "/locations",
      color: "bg-yellow-500",
    },
    {
      title: "Ремонты",
      description: "Сведения о ремонтах",
      icon: Wrench,
      href: "/repairs",
      color: "bg-purple-500",
    },
    {
      title: "Арматура",
      description: "Справочник арматуры",
      icon: Cog,
      href: "/directories/fitments",
      color: "bg-slate-500",
    },
  ];

  if (roleUtils.isAdmin(user)) {
    quickActions.push({
      title: "Пользователи",
      description: "Управление",
      icon: Users,
      href: "/admin",
      color: "bg-red-500",
    });
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Быстрые действия</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{action.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export { QuickActions };
export default QuickActions;
