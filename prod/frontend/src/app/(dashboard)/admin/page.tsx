'use client';

import { useState } from 'react';
import Link from 'next/link';
import RoleGuard from '@/components/auth/role-guard';
import { useCurrentUser, useAllUsers, useAllRoles, useDeleteUser, useRegister, useUpdateUser, useResetPassword, useUpdateUserRoles } from '@/hooks';
import { Role, type GetAllUsersResponse } from '@/types/auth';
import { 
  Button, 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  Badge, 
  Alert, 
  AlertDescription, 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow, 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  Input, 
  Label 
} from '@/components/ui';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Users, UserPlus, Trash2, AlertCircle, Pencil, X } from 'lucide-react';

const registerSchema = z.object({
  email: z.email('Неверный формат email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().min(1, 'Фамилия обязательна'),
  patronymic: z.string().min(1, 'Отчество обязательно'),
  phoneNumber: z.string().min(1, 'Номер телефона обязателен'),
  roleIds: z.array(z.number()).min(1, 'Выберите хотя бы одну роль'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const editSchema = z.object({
  email: z.email('Неверный формат email'),
  firstName: z.string().min(1, 'Имя обязательно'),
  lastName: z.string().min(1, 'Фамилия обязательна'),
  patronymic: z.string().min(1, 'Отчество обязательно'),
  phoneNumber: z.string().min(1, 'Номер телефона обязателен'),
});

type EditFormData = z.infer<typeof editSchema>;

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
});

type PasswordFormData = z.infer<typeof passwordSchema>;

function AdminContent() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<GetAllUsersResponse | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isAddRoleDialogOpen, setIsAddRoleDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [editError, setEditError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [roleError, setRoleError] = useState<string>('');

  const { data: currentUser } = useCurrentUser();
  const { data: allUsers, isLoading: usersLoading } = useAllUsers();
  const { data: allRoles } = useAllRoles();
  const deleteUserMutation = useDeleteUser();
  const registerMutation = useRegister();
  const updateUserMutation = useUpdateUser();
  const resetPasswordMutation = useResetPassword();
  const updateUserRolesMutation = useUpdateUserRoles();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      roleIds: [],
    },
  });

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    formState: { errors: editErrors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const watchedRoleIds = watch('roleIds');
  const assignedRoleIds = new Set(editingUser?.roles.map((role) => role.id) ?? []);
  const availableRoles = (allRoles ?? []).filter((role) => !assignedRoleIds.has(role.id));
  const isSecondaryDialogOpen = isPasswordDialogOpen || isAddRoleDialogOpen;

  const handleRoleToggle = (roleId: number) => {
    const currentRoles = watchedRoleIds || [];
    const newRoles = currentRoles.includes(roleId)
      ? currentRoles.filter(id => id !== roleId)
      : [...currentRoles, roleId];
    setValue('roleIds', newRoles);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      await registerMutation.mutateAsync(data);
      reset();
      setIsCreateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании пользователя');
    }
  };

  const openEditDialog = (user: GetAllUsersResponse) => {
    setEditError('');
    resetEdit({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      patronymic: user.patronymic,
      phoneNumber: user.phoneNumber,
    });
    setEditingUser(user);
  };

  const onEditSubmit = async (data: EditFormData) => {
    if (!editingUser) return;

    try {
      setEditError('');
      await updateUserMutation.mutateAsync({
        userId: editingUser.id,
        data: {
          userId: editingUser.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          patronymic: data.patronymic,
          phoneNumber: data.phoneNumber,
        },
      });
      setEditingUser(null);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Произошла ошибка при сохранении пользователя');
    }
  };

  const openPasswordDialog = () => {
    setPasswordError('');
    resetPasswordForm({ newPassword: '' });
    setIsPasswordDialogOpen(true);
  };

  const closePasswordDialog = () => {
    setIsPasswordDialogOpen(false);
    setPasswordError('');
  };

  const closeAddRoleDialog = () => {
    setIsAddRoleDialogOpen(false);
    setSelectedRoleId(null);
  };

  const saveUserRoles = async (roleIds: number[]) => {
    if (!editingUser) return false;

    try {
      setRoleError('');
      await updateUserRolesMutation.mutateAsync({
        userId: editingUser.id,
        data: {
          userId: editingUser.id,
          roles: roleIds as Role[],
        },
      });
      const nextRoles = roleIds.map((id) => {
        const existing = editingUser.roles.find((role) => role.id === id);
        if (existing) return existing;
        const fromCatalog = allRoles?.find((role) => role.id === id);
        return { id, name: fromCatalog?.name ?? String(id) };
      });
      setEditingUser((prev) => (prev ? { ...prev, roles: nextRoles } : prev));
      return true;
    } catch (err) {
      setRoleError(err instanceof Error ? err.message : 'Произошла ошибка при изменении ролей');
      return false;
    }
  };

  const handleRemoveRole = (roleId: number) => {
    if (!editingUser || editingUser.roles.length <= 1) return;
    const roleIds = editingUser.roles.map((role) => role.id).filter((id) => id !== roleId);
    void saveUserRoles(roleIds);
  };

  const openAddRoleDialog = () => {
    setSelectedRoleId(null);
    setRoleError('');
    setIsAddRoleDialogOpen(true);
  };

  const handleAddRole = async () => {
    if (!editingUser || selectedRoleId == null) return;
    const roleIds = [...editingUser.roles.map((role) => role.id), selectedRoleId];
    const saved = await saveUserRoles(roleIds);
    if (saved) closeAddRoleDialog();
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!editingUser) return;

    try {
      setPasswordError('');
      await resetPasswordMutation.mutateAsync({
        userId: editingUser.id,
        data: {
          userId: editingUser.id,
          newPassword: data.newPassword,
        },
      });
      closePasswordDialog();
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Произошла ошибка при установке пароля');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (currentUser?.userId === userId) {
      setError('Нельзя удалить самого себя');
      return;
    }

    if (confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await deleteUserMutation.mutateAsync(userId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Произошла ошибка при удалении пользователя');
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Панель администратора
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Управление пользователями и системой
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Создать пользователя
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать нового пользователя</DialogTitle>
              <DialogDescription>
                Заполните форму для создания нового пользователя системы
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Имя</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    placeholder="Введите имя"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Фамилия</Label>
                  <Input
                    id="lastName"
                    {...register('lastName')}
                    placeholder="Введите фамилию"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              
              <div>
                <Label htmlFor="patronymic">Отчество</Label>
                <Input
                  id="patronymic"
                  {...register('patronymic')}
                  placeholder="Введите отчество"
                />
                {errors.patronymic && (
                  <p className="text-sm text-red-500 mt-1">{errors.patronymic.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="user@example.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phoneNumber">Номер телефона</Label>
                <Input
                  id="phoneNumber"
                  {...register('phoneNumber')}
                  placeholder="+7 (999) 123-45-67"
                />
                {errors.phoneNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Пароль</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  placeholder="Введите пароль"
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <Label>Роли</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {allRoles?.map((role) => (
                    <Badge
                      key={role.id}
                      variant={watchedRoleIds?.includes(role.id) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => handleRoleToggle(role.id)}
                    >
                      {role.name}
                    </Badge>
                  ))}
                </div>
                {errors.roleIds && (
                  <p className="text-sm text-red-500 mt-1">{errors.roleIds.message}</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={registerMutation.isPending}>
                  {registerMutation.isPending ? 'Создание...' : 'Создать'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allUsers?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Link href="/admin/roles" className="block">
          <Card className="h-full cursor-pointer transition-colors duration-200 hover:border-green-500 hover:ring-2 hover:ring-green-500/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активных ролей</CardTitle>
              <Badge className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allRoles?.length || 0}</div>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Текущий пользователь</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium">
              {currentUser?.firstName} {currentUser?.lastName}
            </div>
            <div className="text-xs text-muted-foreground">
              {currentUser?.email}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Пользователи системы
          </CardTitle>
          <CardDescription>
            Список всех зарегистрированных пользователей
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Загрузка пользователей...</div>
            </div>
          ) : !allUsers || allUsers.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Пользователи не найдены</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Имя</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Роли</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {user.patronymic}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phoneNumber}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                          <Badge key={role.id} variant="secondary">
                            {role.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                          aria-label="Редактировать"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        {currentUser?.userId !== user.id && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={deleteUserMutation.isPending}
                            aria-label="Удалить"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={editingUser !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
            setEditError('');
            setRoleError('');
            closePasswordDialog();
            closeAddRoleDialog();
          }
        }}
      >
        <DialogContent
          onInteractOutside={(event) => {
            if (isSecondaryDialogOpen) event.preventDefault();
          }}
          onEscapeKeyDown={(event) => {
            if (isSecondaryDialogOpen) event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>
              Измените данные пользователя и сохраните изменения
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-firstName">Имя</Label>
                <Input
                  id="edit-firstName"
                  {...registerEdit('firstName')}
                  placeholder="Введите имя"
                />
                {editErrors.firstName && (
                  <p className="text-sm text-red-500 mt-1">{editErrors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="edit-lastName">Фамилия</Label>
                <Input
                  id="edit-lastName"
                  {...registerEdit('lastName')}
                  placeholder="Введите фамилию"
                />
                {editErrors.lastName && (
                  <p className="text-sm text-red-500 mt-1">{editErrors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="edit-patronymic">Отчество</Label>
              <Input
                id="edit-patronymic"
                {...registerEdit('patronymic')}
                placeholder="Введите отчество"
              />
              {editErrors.patronymic && (
                <p className="text-sm text-red-500 mt-1">{editErrors.patronymic.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                {...registerEdit('email')}
                placeholder="user@example.com"
              />
              {editErrors.email && (
                <p className="text-sm text-red-500 mt-1">{editErrors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-phoneNumber">Номер телефона</Label>
              <Input
                id="edit-phoneNumber"
                {...registerEdit('phoneNumber')}
                placeholder="+7 (999) 123-45-67"
              />
              {editErrors.phoneNumber && (
                <p className="text-sm text-red-500 mt-1">{editErrors.phoneNumber.message}</p>
              )}
            </div>

            <div>
              <Label>Роли</Label>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {editingUser?.roles.map((role) => (
                  <span
                    key={role.id}
                    className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-2.5 py-1 text-sm font-medium text-white"
                  >
                    {role.name}
                    {(editingUser?.roles.length ?? 0) > 1 && (
                      <button
                        type="button"
                        className="rounded-sm p-0.5 hover:bg-green-700 disabled:opacity-50"
                        onClick={() => handleRemoveRole(role.id)}
                        disabled={updateUserRolesMutation.isPending}
                        aria-label={`Удалить роль ${role.name}`}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </span>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={openAddRoleDialog}
                  disabled={availableRoles.length === 0 || updateUserRolesMutation.isPending}
                >
                  Добавить роль
                </Button>
              </div>
              {roleError && !isAddRoleDialogOpen && (
                <p className="text-sm text-red-500 mt-2">{roleError}</p>
              )}
            </div>

            {editError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{editError}</AlertDescription>
              </Alert>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={openPasswordDialog}
              >
                Установить новый пароль
              </Button>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  Отмена
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending ? 'Сохранение...' : 'Сохранить'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isPasswordDialogOpen}
        onOpenChange={(open) => {
          if (!open) closePasswordDialog();
        }}
      >
        <DialogContent className="z-[60]">
          <DialogHeader>
            <DialogTitle>Установить новый пароль</DialogTitle>
            <DialogDescription>
              {editingUser
                ? `${editingUser.lastName} ${editingUser.firstName} ${editingUser.patronymic}`
                : 'Задайте новый пароль пользователя'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Новый пароль</Label>
              <Input
                id="newPassword"
                type="password"
                {...registerPassword('newPassword')}
                placeholder="Введите новый пароль"
                autoComplete="new-password"
              />
              {passwordErrors.newPassword && (
                <p className="text-sm text-red-500 mt-1">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            {passwordError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closePasswordDialog}>
                Отмена
              </Button>
              <Button type="submit" disabled={resetPasswordMutation.isPending}>
                {resetPasswordMutation.isPending ? 'Сохранение...' : 'Установить'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAddRoleDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeAddRoleDialog();
        }}
      >
        <DialogContent className="z-[60]">
          <DialogHeader>
            <DialogTitle>Добавить роль</DialogTitle>
            <DialogDescription>
              Выберите роль, которую нужно назначить пользователю
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {availableRoles.length === 0 ? (
              <p className="text-sm text-muted-foreground">Все роли уже назначены</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availableRoles.map((role) => (
                  <Badge
                    key={role.id}
                    variant={selectedRoleId === role.id ? 'default' : 'outline'}
                    className="cursor-pointer px-3 py-1"
                    onClick={() => setSelectedRoleId(role.id)}
                  >
                    {role.name}
                  </Badge>
                ))}
              </div>
            )}

            {roleError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{roleError}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeAddRoleDialog}>
                Отмена
              </Button>
              <Button
                type="button"
                onClick={handleAddRole}
                disabled={selectedRoleId == null || updateUserRolesMutation.isPending}
              >
                {updateUserRolesMutation.isPending ? 'Добавление...' : 'Добавить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AdminPage() {
  return (
    <RoleGuard requireAdmin>
      <AdminContent />
    </RoleGuard>
  );
}
