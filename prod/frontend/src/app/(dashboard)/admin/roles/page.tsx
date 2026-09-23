'use client';

import Link from 'next/link';
import RoleGuard from '@/components/auth/role-guard';
import { useAllRoles } from '@/hooks';
import { Role } from '@/types/auth';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { ArrowLeft, Edit, Shield, Trash2 } from 'lucide-react';

function RolesContent() {
  const { data: allRoles, isLoading, error } = useAllRoles();

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Роли пользователей
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Роли
          </CardTitle>
          <CardDescription>
            Список ролей, доступных в системе
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Загрузка ролей...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-red-500">
                {error instanceof Error ? error.message : 'Не удалось загрузить роли'}
              </div>
            </div>
          ) : !allRoles || allRoles.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Роли не найдены</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">Номер</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead className="text-right">Действие</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell>{role.id}</TableCell>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="text-right">
                      {role.id !== Role.Admin && (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" title="Права доступа" aria-label="Права доступа">
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" title="Редактировать" aria-label="Редактировать">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" title="Удалить" aria-label="Удалить">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RolesPage() {
  return (
    <RoleGuard requireAdmin>
      <RolesContent />
    </RoleGuard>
  );
}
