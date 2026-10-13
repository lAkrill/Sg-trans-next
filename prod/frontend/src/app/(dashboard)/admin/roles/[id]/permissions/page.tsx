'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import RoleGuard from '@/components/auth/role-guard';
import { useAllRoles, usePermissionNames, useRolePermissions, useSaveRolePermissions } from '@/hooks';
import {
  ACCESS_COLUMNS,
  type AccessMap,
  accessMapsEqual,
  buildRoleAccessMap,
  columnAccessState,
  hasAccess,
  setAccessFlag,
} from '@/lib/access-flags';
import {
  Button,
  Card,
  CardContent,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui';
import { ArrowLeft } from 'lucide-react';

function PermissionCheckbox({
  checked,
  label,
  disabled,
  className,
  onCheckedChange,
}: {
  checked: boolean | 'indeterminate';
  label: string;
  disabled?: boolean;
  className?: string;
  onCheckedChange: (enabled: boolean) => void;
}) {
  return (
    <div className="flex justify-center">
      <Checkbox
        checked={checked}
        disabled={disabled}
        className={className}
        aria-label={label}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
    </div>
  );
}

function RolePermissionsContent() {
  const params = useParams<{ id: string }>();
  const roleId = Number(params.id);
  const roleIdIsValid = Number.isInteger(roleId) && roleId > 0;

  const { data: allRoles } = useAllRoles();
  const {
    data: permissionNames,
    isLoading: namesLoading,
    error: namesError,
  } = usePermissionNames();
  const {
    data: rolePermissions,
    isLoading: roleLoading,
    error: roleError,
  } = useRolePermissions(roleId);
  const saveMutation = useSaveRolePermissions(roleId);

  const roleName = allRoles?.find((role) => role.id === roleId)?.name;

  const savedAccess = useMemo(() => {
    if (!permissionNames || !rolePermissions) return {};
    const ids = new Set(permissionNames.map((permission) => permission.id));
    for (const setting of rolePermissions) ids.add(setting.permissionId);
    return buildRoleAccessMap([...ids], rolePermissions);
  }, [permissionNames, rolePermissions]);

  const rows = useMemo(() => {
    if (!permissionNames || !rolePermissions) return [];
    const knownIds = new Set(permissionNames.map((permission) => permission.id));
    const extras = rolePermissions
      .filter((setting) => !knownIds.has(setting.permissionId))
      .map((setting) => ({
        id: setting.permissionId,
        name: setting.permissionName,
        description: null,
      }));

    return [...permissionNames, ...extras].sort((left, right) =>
      (left.name ?? '').localeCompare(right.name ?? '', 'ru'),
    );
  }, [permissionNames, rolePermissions]);

  const [draft, setDraft] = useState<AccessMap>({});
  const [serverSnapshot, setServerSnapshot] = useState<AccessMap>({});
  const [appliedKey, setAppliedKey] = useState('');
  const isReady = roleIdIsValid && !namesLoading && !roleLoading && !namesError && !roleError;
  const savedKey = useMemo(() => JSON.stringify(savedAccess), [savedAccess]);

  if (isReady && appliedKey !== savedKey) {
    const previousSnapshot = serverSnapshot;
    setAppliedKey(savedKey);
    setServerSnapshot(savedAccess);
    setDraft((current) =>
      appliedKey === '' || accessMapsEqual(current, previousSnapshot) ? savedAccess : current,
    );
  }

  const accesses = rows.map((row) => draft[row.id] ?? 0);
  const isDirty = isReady && !accessMapsEqual(draft, serverSnapshot);

  const updateFlag = (permissionId: number, flag: number, enabled: boolean) => {
    setDraft((current) => ({
      ...current,
      [permissionId]: setAccessFlag(current[permissionId] ?? 0, flag, enabled),
    }));
  };

  const setColumnFlag = (flag: number, enabled: boolean) => {
    setDraft((current) => {
      const next = { ...current };
      for (const row of rows) {
        next[row.id] = setAccessFlag(next[row.id] ?? 0, flag, enabled);
      }
      return next;
    });
  };

  const handleSave = async () => {
    const existingIds = new Set(rolePermissions?.map((setting) => setting.permissionId) ?? []);
    const creates = [];
    const updates = [];

    for (const row of rows) {
      const nextAccess = draft[row.id] ?? 0;
      const previousAccess = savedAccess[row.id] ?? 0;
      if (nextAccess === previousAccess) continue;

      const payload = {
        roleId,
        permissionId: row.id,
        access: nextAccess,
      };

      if (existingIds.has(row.id)) {
        updates.push(payload);
      } else if (nextAccess !== 0) {
        creates.push(payload);
      }
    }

    try {
      await saveMutation.mutateAsync({ creates, updates });
      toast.success('Права доступа сохранены');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Не удалось сохранить права доступа');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/roles">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Права доступа</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {roleName ? `Роль «${roleName}»` : roleIdIsValid ? `Роль №${roleId}` : 'Роль не указана'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={!isDirty || saveMutation.isPending}
            onClick={() => setDraft(serverSnapshot)}
          >
            Сбросить
          </Button>
          <Button disabled={!isDirty || saveMutation.isPending || !roleIdIsValid} onClick={handleSave}>
            {saveMutation.isPending ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          {!roleIdIsValid ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-red-500">Некорректный идентификатор роли</div>
            </div>
          ) : namesLoading || roleLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Загрузка прав доступа...</div>
            </div>
          ) : namesError || roleError ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-red-500">
                {namesError instanceof Error
                  ? namesError.message
                  : roleError instanceof Error
                    ? roleError.message
                    : 'Не удалось загрузить права доступа'}
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Разрешения не найдены</div>
            </div>
          ) : (
            <Table className="border-separate border-spacing-0">
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-auto rounded-l-xl bg-gray-700 px-4 py-3 text-white">Разрешение</TableHead>
                  {ACCESS_COLUMNS.map((column, index) => (
                    <TableHead
                      key={column.flag}
                      className={`h-auto w-40 bg-gray-700 px-4 py-3 text-center text-white${
                        index === ACCESS_COLUMNS.length - 1 ? ' rounded-r-xl' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span>{column.label}</span>
                        <PermissionCheckbox
                          checked={columnAccessState(accesses, column.flag)}
                          label={`${column.label}: все разрешения`}
                          disabled={saveMutation.isPending}
                          className="border-white bg-white"
                          onCheckedChange={(enabled) => setColumnFlag(column.flag, enabled)}
                        />
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((permission, index) => {
                  const access = draft[permission.id] ?? 0;
                  const name = permission.name || `Разрешение ${permission.id}`;
                  return (
                    <TableRow
                      key={permission.id}
                      className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-100 dark:bg-gray-800'}
                    >
                      <TableCell className="font-medium" title={`Маска ${access}`}>
                        <div>{name}</div>
                        {permission.description ? (
                          <div className="mt-1 text-sm font-normal text-muted-foreground">
                            {permission.description}
                          </div>
                        ) : null}
                      </TableCell>
                      {ACCESS_COLUMNS.map((column) => (
                        <TableCell key={column.flag}>
                          <PermissionCheckbox
                            checked={hasAccess(access, column.flag)}
                            label={`${column.label}: ${name}`}
                            disabled={saveMutation.isPending}
                            onCheckedChange={(enabled) => updateFlag(permission.id, column.flag, enabled)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function RolePermissionsPage() {
  return (
    <RoleGuard requireAdmin>
      <RolePermissionsContent />
    </RoleGuard>
  );
}
