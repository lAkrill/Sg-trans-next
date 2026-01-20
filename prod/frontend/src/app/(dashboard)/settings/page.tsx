"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Switch,
  Label,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { Bell, Shield, Moon, Globe, Database, Save, Sun, Monitor } from "lucide-react";
import { useTheme } from "next-themes";
import { useVersion } from "@/hooks";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { data: version } = useVersion();

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Настройки</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Управление настройками системы и пользовательскими предпочтениями
        </p>
      </div>

      {/* Settings Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Внешний вид
            </CardTitle>
            <CardDescription>Настройки темы и отображения интерфейса</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Тема интерфейса</Label>
                <p className="text-sm text-muted-foreground">Выберите тему оформления интерфейса</p>
              </div>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-32">
                  <div className="flex items-center gap-2">
                    <SelectValue placeholder="Выберите тему" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">
                    <div className="flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      Светлая
                    </div>
                  </SelectItem>
                  <SelectItem value="dark">
                    <div className="flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      Темная
                    </div>
                  </SelectItem>
                  <SelectItem value="system">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Системная
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Компактный режим</Label>
                <p className="text-sm text-muted-foreground">Уменьшить отступы и размеры элементов</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Уведомления
            </CardTitle>
            <CardDescription>Настройки уведомлений и оповещений</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email уведомления</Label>
                <p className="text-sm text-muted-foreground">Получать уведомления на email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Браузерные уведомления</Label>
                <p className="text-sm text-muted-foreground">Показывать уведомления в браузере</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Звуковые уведомления</Label>
                <p className="text-sm text-muted-foreground">Воспроизводить звуки при уведомлениях</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Безопасность
            </CardTitle>
            <CardDescription>Настройки безопасности и доступа</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Двухфакторная аутентификация</Label>
                <p className="text-sm text-muted-foreground">Дополнительная защита учетной записи</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Автоматический выход</Label>
                <p className="text-sm text-muted-foreground">Выход при неактивности (30 мин)</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Сменить пароль</Label>
              <Button variant="outline" size="sm">
                Изменить пароль
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Региональные настройки
            </CardTitle>
            <CardDescription>Язык, часовой пояс и форматы</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Язык интерфейса</Label>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Русский
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Часовой пояс</Label>
              <Button variant="outline" size="sm" className="w-full justify-start">
                Europe/Moscow (UTC+3)
              </Button>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Формат даты</Label>
              <Button variant="outline" size="sm" className="w-full justify-start">
                ДД.ММ.ГГГГ
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Системные настройки
            </CardTitle>
            <CardDescription>Настройки системы и обслуживания</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Очистка кэша</Label>
                <Button variant="outline" size="sm" className="w-full">
                  Очистить кэш
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Экспорт данных</Label>
                <Button variant="outline" size="sm" className="w-full">
                  Экспортировать
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Резервная копия</Label>
                <Button variant="outline" size="sm" className="w-full">
                  Создать бэкап
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Save Button */}
      <div className="flex w-full justify-between items-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          <span>Версия:</span> {version?.frontend} (клиент), {version?.backend} (сервер)
        </div>
        <Button className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Сохранить настройки
        </Button>
      </div>
    </div>
  );
}
