"use client";

import { Menu, LogOut } from "lucide-react";
import { useCurrentUser, useLogout } from "@/hooks";
import { 
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Avatar, 
  AvatarFallback 
} from "@/components/ui";
import { useRouter } from "next/navigation";
import { useVersion } from "@/hooks";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { data: user } = useCurrentUser();
  const logoutMutation = useLogout();
  const router = useRouter();
  const { data: version } = useVersion();

  const handleLogout = () => {
    logoutMutation.mutate();
    router.push("/login");
  };

  const getUserInitials = () => {
    if (!user) return "";
    return `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm dark:bg-gray-900 lg:px-6">
      {/* Mobile menu button */}
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="lg:hidden">
        <Menu className="h-5 w-5" />
      </Button>

      <div className="ml-auto flex items-center gap-4">
        <div className="text-right text-xs text-gray-500 dark:text-gray-400">
          <span>Версии приложений</span> <br /> {version?.frontend} (клиент), {version?.backend} (сервер)
        </div>
        {/* User menu */}
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">{getUserInitials()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex flex-col space-y-1 p-2">
              <p className="text-sm font-medium leading-none">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} disabled={logoutMutation.isPending} className="cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Выйти</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      </div>
    </header>
  );
}
