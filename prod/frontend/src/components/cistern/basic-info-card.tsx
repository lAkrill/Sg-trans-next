import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Train } from 'lucide-react';

interface BasicInfoCardProps {
  number: string;
  serialNumber: string;
  buildDate: string;
  commissioningDate?: string;
  railwayCisternStatusName?: string;
  serviceLifeYears?: number;
  extensionServiceLifeDate?: string;
}

function formatServiceEndDate(
  buildDate: string,
  serviceLifeYears?: number
): string {
  if (serviceLifeYears == null || Number.isNaN(serviceLifeYears)) {
    return 'Не указана';
  }

  const start = new Date(buildDate);
  if (Number.isNaN(start.getTime())) {
    return 'Не указана';
  }

  const end = new Date(start);
  end.setFullYear(end.getFullYear() + serviceLifeYears);
  return end.toLocaleDateString('ru-RU');
}

export function BasicInfoCard({
  number,
  serialNumber,
  buildDate,
  commissioningDate,
  railwayCisternStatusName,
  serviceLifeYears,
  extensionServiceLifeDate,
}: BasicInfoCardProps) {
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
          <div>
            <div className="text-sm font-medium text-gray-500">Дата продления срока эксплуатации</div>
            <div className="text-lg">
              {extensionServiceLifeDate
                ? new Date(extensionServiceLifeDate).toLocaleDateString('ru-RU')
                : 'Не указана'}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Статус вагон-цистерны</div>
            <div className="text-lg">{railwayCisternStatusName || 'Не указан'}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Дата конца срока эксплуатации</div>
            <div className="text-lg">
              {formatServiceEndDate(buildDate, serviceLifeYears)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
