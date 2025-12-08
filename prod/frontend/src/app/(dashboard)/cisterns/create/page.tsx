'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  Button, 
  Input, 
  Label, 
  Textarea, 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui';
import { ArrowLeft, Train, Save, X } from 'lucide-react';
import Link from 'next/link';
import {
  useManufacturerOptions,
  useWagonTypeOptions,
  useWagonModelOptions,
  useAffiliationOptions,
  useOwnerOptions,
  useRegistrarOptions,
  useCreateCistern,
} from '@/hooks';
import type { CreateRailwayCisternDTO } from '@/types/cisterns';

export default function CreateCisternPage() {
  const router = useRouter();
  const createMutation = useCreateCistern();

  // Directory options
  const { data: manufacturerOptions = [], isLoading: loadingManufacturers } = useManufacturerOptions();
  const { data: wagonTypeOptions = [], isLoading: loadingWagonTypes } = useWagonTypeOptions();
  const { data: wagonModelOptions = [], isLoading: loadingWagonModels } = useWagonModelOptions();
  const { data: affiliationOptions = [], isLoading: loadingAffiliations } = useAffiliationOptions();
  const { data: ownerOptions = [], isLoading: loadingOwners } = useOwnerOptions();
  const { data: registrarOptions = [], isLoading: loadingRegistrars } = useRegistrarOptions();

  const [formData, setFormData] = useState<CreateRailwayCisternDTO>({
    number: '',
    manufacturerId: '',
    buildDate: new Date().toISOString().split('T')[0],
    tareWeight: 0,
    loadCapacity: 0,
    length: 0,
    axleCount: 4,
    volume: 0,
    fillingVolume: 0,
    initialTareWeight: 0,
    typeId: '',
    modelId: '',
    commissioningDate: new Date().toISOString().split('T')[0],
    serialNumber: '',
    registrationNumber: '',
    registrationDate: new Date().toISOString().split('T')[0],
    registrarId: '',
    notes: '',
    ownerId: '',
    techConditions: '',
    pripiska: '',
    reRegistrationDate: new Date().toISOString().split('T')[0],
    pressure: 0,
    testPressure: 0,
    rent: '',
    affiliationId: '',
    serviceLifeYears: 0,
    periodMajorRepair: '',
    periodPeriodicTest: '',
    periodIntermediateTest: '',
    periodDepotRepair: '',
    dangerClass: 0,
    substance: '',
    tareWeight2: 0,
    tareWeight3: 0,
  });  const handleInputChange = (field: keyof CreateRailwayCisternDTO, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validate required fields
      if (!formData.number || !formData.serialNumber || !formData.registrationNumber) {
        alert('Заполните все обязательные поля');
        return;
      }

      // Convert dates to strings if they exist
      const submitData: CreateRailwayCisternDTO = {
        ...formData,
        buildDate: formData.buildDate || new Date().toISOString().split('T')[0],
        registrationDate: formData.registrationDate || new Date().toISOString().split('T')[0],
        // Set required IDs - these should come from selects in a real implementation
        manufacturerId: formData.manufacturerId || '',
        typeId: formData.typeId || '',
        affiliationId: formData.affiliationId || '',
      } as CreateRailwayCisternDTO;

      await createMutation.mutateAsync(submitData);
      router.push('/cisterns');
    } catch (error) {
      console.error('Error creating cistern:', error);
      alert('Ошибка при создании цистерны');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/cisterns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Train className="h-8 w-8" />
              Добавить цистерну
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Создание новой записи о железнодорожной цистерне
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Основная информация</CardTitle>
              <CardDescription>Базовые данные о цистерне</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="number">Номер цистерны *</Label>
                <Input
                  id="number"
                  value={formData.number || ''}
                  onChange={(e) => handleInputChange('number', e.target.value)}
                  placeholder="Введите номер цистерны"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="serialNumber">Серийный номер *</Label>
                <Input
                  id="serialNumber"
                  value={formData.serialNumber || ''}
                  onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                  placeholder="Введите серийный номер"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buildDate">Дата постройки</Label>
                <Input
                  id="buildDate"
                  type="date"
                  value={formData.buildDate || ''}
                  onChange={(e) => handleInputChange('buildDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commissioningDate">Дата ввода в эксплуатацию</Label>
                <Input
                  id="commissioningDate"
                  type="date"
                  value={formData.commissioningDate || ''}
                  onChange={(e) => handleInputChange('commissioningDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Технические характеристики</CardTitle>
              <CardDescription>Технические параметры цистерны</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tareWeight">Тара (т)</Label>
                  <Input
                    id="tareWeight"
                    type="number"
                    step="0.1"
                    value={formData.tareWeight || ''}
                    onChange={(e) => handleInputChange('tareWeight', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="loadCapacity">Грузоподъемность (т)</Label>
                  <Input
                    id="loadCapacity"
                    type="number"
                    step="0.1"
                    value={formData.loadCapacity || ''}
                    onChange={(e) => handleInputChange('loadCapacity', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="length">Длина (мм)</Label>
                  <Input
                    id="length"
                    type="number"
                    value={formData.length || ''}
                    onChange={(e) => handleInputChange('length', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="axleCount">Количество осей</Label>
                  <Select 
                    value={formData.axleCount?.toString() || '4'} 
                    onValueChange={(value) => handleInputChange('axleCount', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="6">6</SelectItem>
                      <SelectItem value="8">8</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume">Объем (м³)</Label>
                  <Input
                    id="volume"
                    type="number"
                    step="0.1"
                    value={formData.volume || ''}
                    onChange={(e) => handleInputChange('volume', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fillingVolume">Объем налива (м³)</Label>
                  <Input
                    id="fillingVolume"
                    type="number"
                    step="0.1"
                    value={formData.fillingVolume || ''}
                    onChange={(e) => handleInputChange('fillingVolume', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registration Information */}
          <Card>
            <CardHeader>
              <CardTitle>Регистрационная информация</CardTitle>
              <CardDescription>Данные о регистрации цистерны</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registrationNumber">Регистрационный номер *</Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber || ''}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  placeholder="Введите регистрационный номер"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDate">Дата регистрации</Label>
                <Input
                  id="registrationDate"
                  type="date"
                  value={formData.registrationDate || ''}
                  onChange={(e) => handleInputChange('registrationDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reRegistrationDate">Дата перерегистрации</Label>
                <Input
                  id="reRegistrationDate"
                  type="date"
                  value={formData.reRegistrationDate || ''}
                  onChange={(e) => handleInputChange('reRegistrationDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Directory Information */}
          <Card>
            <CardHeader>
              <CardTitle>Справочная информация</CardTitle>
              <CardDescription>Производитель, тип, принадлежность и другие справочные данные</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturerId">Производитель *</Label>
                  <Select 
                    value={formData.manufacturerId} 
                    onValueChange={(value) => handleInputChange('manufacturerId', value)}
                    disabled={loadingManufacturers}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите производителя" />
                    </SelectTrigger>
                    <SelectContent>
                      {manufacturerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="typeId">Тип вагона *</Label>
                  <Select 
                    value={formData.typeId} 
                    onValueChange={(value) => handleInputChange('typeId', value)}
                    disabled={loadingWagonTypes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип вагона" />
                    </SelectTrigger>
                    <SelectContent>
                      {wagonTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modelId">Модель вагона</Label>
                  <Select 
                    value={formData.modelId || 'none'} 
                    onValueChange={(value) => handleInputChange('modelId', value === 'none' ? '' : value)}
                    disabled={loadingWagonModels}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите модель вагона" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не выбрано</SelectItem>
                      {wagonModelOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="affiliationId">Принадлежность *</Label>
                  <Select 
                    value={formData.affiliationId} 
                    onValueChange={(value) => handleInputChange('affiliationId', value)}
                    disabled={loadingAffiliations}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите принадлежность" />
                    </SelectTrigger>
                    <SelectContent>
                      {affiliationOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ownerId">Собственник</Label>
                  <Select 
                    value={formData.ownerId || 'none'} 
                    onValueChange={(value) => handleInputChange('ownerId', value === 'none' ? '' : value)}
                    disabled={loadingOwners}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите собственника" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не выбрано</SelectItem>
                      {ownerOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="registrarId">Регистратор</Label>
                  <Select 
                    value={formData.registrarId || 'none'} 
                    onValueChange={(value) => handleInputChange('registrarId', value === 'none' ? '' : value)}
                    disabled={loadingRegistrars}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите регистратора" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не выбрано</SelectItem>
                      {registrarOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety Information */}
          <Card>
            <CardHeader>
              <CardTitle>Информация о безопасности</CardTitle>
              <CardDescription>Данные о безопасности и перевозимых веществах</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dangerClass">Класс опасности</Label>
                  <Select 
                    value={formData.dangerClass?.toString() || '3'} 
                    onValueChange={(value) => handleInputChange('dangerClass', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Взрывчатые вещества</SelectItem>
                      <SelectItem value="2">2 - Газы</SelectItem>
                      <SelectItem value="3">3 - Легковоспламеняющиеся жидкости</SelectItem>
                      <SelectItem value="4">4 - Легковоспламеняющиеся твердые вещества</SelectItem>
                      <SelectItem value="5">5 - Окисляющие вещества</SelectItem>
                      <SelectItem value="6">6 - Ядовитые вещества</SelectItem>
                      <SelectItem value="7">7 - Радиоактивные материалы</SelectItem>
                      <SelectItem value="8">8 - Коррозионные вещества</SelectItem>
                      <SelectItem value="9">9 - Прочие опасные вещества</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="substance">Вещество</Label>
                  <Input
                    id="substance"
                    value={formData.substance || ''}
                    onChange={(e) => handleInputChange('substance', e.target.value)}
                    placeholder="Название перевозимого вещества"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pressure">Рабочее давление (МПа)</Label>
                  <Input
                    id="pressure"
                    type="number"
                    step="0.1"
                    value={formData.pressure || ''}
                    onChange={(e) => handleInputChange('pressure', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="testPressure">Испытательное давление (МПа)</Label>
                  <Input
                    id="testPressure"
                    type="number"
                    step="0.1"
                    value={formData.testPressure || ''}
                    onChange={(e) => handleInputChange('testPressure', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Дополнительная информация</CardTitle>
              <CardDescription>Дополнительные параметры и примечания</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serviceLifeYears">Срок службы (лет)</Label>
                  <Input
                    id="serviceLifeYears"
                    type="number"
                    value={formData.serviceLifeYears || ''}
                    onChange={(e) => handleInputChange('serviceLifeYears', parseInt(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tareWeight2">Тара 2 (т)</Label>
                  <Input
                    id="tareWeight2"
                    type="number"
                    step="0.1"
                    value={formData.tareWeight2 || ''}
                    onChange={(e) => handleInputChange('tareWeight2', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tareWeight3">Тара 3 (т)</Label>
                  <Input
                    id="tareWeight3"
                    type="number"
                    step="0.1"
                    value={formData.tareWeight3 || ''}
                    onChange={(e) => handleInputChange('tareWeight3', parseFloat(e.target.value) || 0)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initialTareWeight">Первоначальная тара (т)</Label>
                  <Input
                    id="initialTareWeight"
                    type="number"
                    step="0.1"
                    value={formData.initialTareWeight || ''}
                    onChange={(e) => handleInputChange('initialTareWeight', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Примечания</Label>
                <Textarea
                  id="notes"
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Дополнительные примечания..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Operational Information */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Информация об эксплуатации и ремонте</CardTitle>
              <CardDescription>Данные о техническом состоянии и сроках проверок</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="techConditions">Техническое состояние</Label>
                  <Input
                    id="techConditions"
                    value={formData.techConditions || ''}
                    onChange={(e) => handleInputChange('techConditions', e.target.value)}
                    placeholder="Описание технического состояния"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pripiska">Приписка</Label>
                  <Input
                    id="pripiska"
                    value={formData.pripiska || ''}
                    onChange={(e) => handleInputChange('pripiska', e.target.value)}
                    placeholder="Место приписки"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rent">Аренда</Label>
                  <Input
                    id="rent"
                    value={formData.rent || ''}
                    onChange={(e) => handleInputChange('rent', e.target.value)}
                    placeholder="Данные об аренде"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodMajorRepair">Дата планового капитального ремонта</Label>
                  <Input
                    id="periodMajorRepair"
                    type="date"
                    value={formData.periodMajorRepair || ''}
                    onChange={(e) => handleInputChange('periodMajorRepair', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodPeriodicTest">Дата плановой периодической проверки</Label>
                  <Input
                    id="periodPeriodicTest"
                    type="date"
                    value={formData.periodPeriodicTest || ''}
                    onChange={(e) => handleInputChange('periodPeriodicTest', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodIntermediateTest">Дата промежуточной проверки</Label>
                  <Input
                    id="periodIntermediateTest"
                    type="date"
                    value={formData.periodIntermediateTest || ''}
                    onChange={(e) => handleInputChange('periodIntermediateTest', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodDepotRepair">Дата планового пункто-ремонтного ремонта</Label>
                  <Input
                    id="periodDepotRepair"
                    type="date"
                    value={formData.periodDepotRepair || ''}
                    onChange={(e) => handleInputChange('periodDepotRepair', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4">
          <Link href="/cisterns">
            <Button type="button" variant="outline">
              <X className="h-4 w-4 mr-2" />
              Отмена
            </Button>
          </Link>
          <Button type="submit" disabled={createMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {createMutation.isPending ? 'Сохранение...' : 'Создать цистерну'}
          </Button>
        </div>
      </form>
    </div>
  );
}
