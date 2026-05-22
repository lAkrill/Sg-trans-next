import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Train } from 'lucide-react';

interface BasicInfoCardProps {
  number: string;
  serialNumber: string;
  buildDate: string;
  commissioningDate?: string;
  railwayCisternStatusName?: string;
}

export function BasicInfoCard({ number, serialNumber, buildDate, commissioningDate, railwayCisternStatusName }: BasicInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Train className="h-5 w-5" />
          Основные характеристики
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500">Номер</div>
            <div className="text-lg font-semibold">{number}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Серийный номер</div>
            <div className="text-lg">{serialNumber}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Дата постройки</div>
            <div className="text-lg">{new Date(buildDate).toLocaleDateString('ru-RU')}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Дата ввода в эксплуатацию</div>
            <div className="text-lg">
              {commissioningDate 
                ? new Date(commissioningDate).toLocaleDateString('ru-RU')
                : 'Не указана'
              }
            </div>
          </div>

        </div>
        <div>
            <div className="text-sm font-medium text-gray-500">Статус вагон-цистерны</div>
            <div className="text-lg">{railwayCisternStatusName || 'Не указан'}</div>
         </div>
      </CardContent>
    </Card>
  );
}
