'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, Button, Tabs, TabsContent, TabsList, TabsTrigger, Skeleton } from '@/components/ui';
import { ArrowLeft, Train, MapPin, History, FileText, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useCistern } from '@/hooks';
import { PartEquipmentList } from '@/components/part-equipment-list';
import { 
  CisternHeader, 
  GeneralInfoTab, 
  LocationTab, 
  HistoryTab, 
  RepairsTab 
} from '@/components/cistern';

export default function CisternPassportPage() {
  const params = useParams();
  const cisternId = params.id as string;
  const [activeTab, setActiveTab] = useState('general');

  const { data: cistern, isLoading, error } = useCistern(cisternId);

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/cisterns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              Ошибка загрузки данных: {error instanceof Error ? error.message : 'Неизвестная ошибка'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/cisterns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!cistern) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/cisterns">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-gray-600">
              Цистерна не найдена
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <CisternHeader
        cisternId={cistern.id}
        cisternNumber={cistern.number}
        manufacturerName={cistern.manufacturer?.name}
        typeName={cistern.type?.name}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Train className="h-4 w-4" />
            Основная информация
          </TabsTrigger>
          <TabsTrigger value="location" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Местоположения
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Журнал изменений
          </TabsTrigger>
          <TabsTrigger value="components" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Лист комплектации
          </TabsTrigger>
          <TabsTrigger value="repairs" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            История ремонтов
          </TabsTrigger>
        </TabsList>

        {/* General Information Tab */}
        <TabsContent value="general">
          <GeneralInfoTab cistern={cistern} />
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location">
          <LocationTab CicternNumber={cistern.number} />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <HistoryTab />
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components">
          <PartEquipmentList cisternId={cisternId} />
        </TabsContent>

        {/* Repairs Tab */}
        <TabsContent value="repairs">
          <RepairsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
