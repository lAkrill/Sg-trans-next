"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  X,
  Users,
  Settings,
  Database,
  ChevronDown,
  ChevronRight,
  Building2,
  Factory,
  User,
  Train,
  MapPin,
  Wrench,
  Activity,
  RotateCcw,
  FileText,
  Car,
  Cog,
  Droplet,
} from "lucide-react";
import { useCurrentUser, useVersion } from "@/hooks";
import { Role } from "@/types/auth";

interface SidebarItem {
  title: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: SidebarItem[];
  roles?: Role[];
}

const directoryItems: SidebarItem[] = [
  {
    title: "Принадлежность",
    href: "/directories/affiliations",
    icon: Building2,
  },
  {
    title: "Депо",
    href: "/directories/depots",
    icon: Factory,
  },
  {
    title: "Производители",
    href: "/directories/manufacturers",
    icon: Factory,
  },
  {
    title: "Собственники",
    href: "/directories/owners",
    icon: User,
  },
  {
    title: "Типы вагонов",
    href: "/directories/wagon-types",
    icon: Train,
  },
  {
    title: "Местоположения",
    href: "/directories/locations",
    icon: MapPin,
  },
  {
    title: "Типы деталей",
    href: "/directories/part-types",
    icon: Wrench,
  },
  {
    title: "Статусы деталей",
    href: "/directories/part-statuses",
    icon: Activity,
  },
  {
    title: "Типы ремонта",
    href: "/directories/repair-types",
    icon: RotateCcw,
  },
  {
    title: "Регистраторы",
    href: "/directories/registrars",
    icon: FileText,
  },
  {
    title: "Модели вагонов",
    href: "/directories/wagon-models",
    icon: Car,
  },
  {
    title: "Сосуды",
    href: "/directories/vessels",
    icon: Droplet,
  },
];

const sidebarItems: SidebarItem[] = [
  {
    title: "Главная",
    href: "/dashboard",
    icon: Activity,
  },
  {
    title: "Вагоны",
    href: "/cisterns",
    icon: Train,
  },
  {
    title: "Детали",
    href: "/directories/parts",
    icon: Cog,
  },
  {
    title: "Справочники",
    icon: Database,
    children: directoryItems,
  },
  {
    title: "Управление пользователями",
    href: "/admin",
    icon: Users,
    roles: [Role.Admin],
  },
  {
    title: "Настройки",
    href: "/settings",
    icon: Settings,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const { data: version } = useVersion();
  const [mounted, setMounted] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
    setExpandedItems(["Справочники"]);
  }, []);

  const toggleExpanded = (title: string) => {
    setExpandedItems((prev) => (prev.includes(title) ? prev.filter((item) => item !== title) : [...prev, title]));
  };

  const hasPermission = (roles?: Role[]) => {
    if (!roles || roles.length === 0) return true;
    if (!user?.roles) return false;
    return roles.some((role) => user.roles.some((userRole) => userRole.id === role));
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    if (!hasPermission(item.roles)) return null;

    // For cisterns, check if we're on any cistern-related page
    const isActive = item.href === pathname || (item.href === "/cisterns" && pathname.startsWith("/cisterns/"));
    const isExpanded = expandedItems.includes(item.title);
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      return (
        <div key={item.title} className="mb-1">
          <button
            onClick={() => toggleExpanded(item.title)}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
              "hover:bg-gray-100 dark:hover:bg-gray-800",
              level > 0 && "ml-4"
            )}
          >
            <div className="flex items-center">
              <item.icon className="mr-3 h-4 w-4" />
              <span>{item.title}</span>
            </div>
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {isExpanded && item.children && (
            <div className="mt-1 space-y-1">{item.children.map((child) => renderSidebarItem(child, level + 1))}</div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.title}
        href={item.href!}
        onClick={onToggle}
        className={cn(
          "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-gray-100 dark:hover:bg-gray-800",
          isActive ? "bg-primary text-primary-foreground hover:bg-primary/90" : "text-gray-700 dark:text-gray-300",
          level > 0 && "ml-8"
        )}
      >
        <item.icon className="mr-3 h-4 w-4" />
        <span>{item.title}</span>
      </Link>
    );
  };

  // Предотвращаем несоответствие гидратации
  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={onToggle} />}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed left-0 top-0 z-50 h-full w-full lg:w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out dark:bg-gray-900 lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="text-lg font-semibold text-gray-900 dark:text-white">
            СГ-Транс
          </Link>
          <button onClick={onToggle} className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">{sidebarItems.map((item) => renderSidebarItem(item))}</nav>

        {/* User info */}
        {user && (
          <div className="border-t p-4">
            <div className="flex items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.firstName} {user.lastName}
                </p>
                <div className="flex gap-1">
                  {user.roles.map((role) => (
                    <p className="text-sm font-medium text-gray-900 dark:text-white" key={role.id}>
                      {role.name}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
