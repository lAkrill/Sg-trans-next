import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { HousePlus } from 'lucide-react';

interface AdditionalInfoCardProps {
  pripiska?: string;
  rent?: string;
  notes: string;
  updatedAt: string;
}

export function AdditionalInfoCard({ pripiska, rent, notes, updatedAt }: AdditionalInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HousePlus className="h-5 w-5" />
          Дополнительная информация
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <div className="text-sm font-medium text-gray-500">Приписка</div>
            <div className="text-lg">
              <Badge variant="outline">{pripiska || 'Не указано'}</Badge>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Аренда</div>
            <div className="text-lg">
              <Badge variant="outline">{rent || 'Не указано'}</Badge>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Дата последнего обновления</div>
            <div className="text-lg">{new Date(updatedAt).toLocaleDateString('ru-RU')}</div>
          </div>
        </div>
        <div>
            <div className="text-sm font-medium text-gray-500">Комментарий</div>
            <div className="text-lg">{notes || 'Не указано'}</div>
          </div>
      </CardContent>
    </Card>
  );
}
