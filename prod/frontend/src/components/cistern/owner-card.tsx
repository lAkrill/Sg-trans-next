import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { User } from 'lucide-react';

interface OwnerCardProps {
  ownerName?: string;
  affiliationValue?: string;
  registrationNumber: string;
  registrationDate: string;
  registrarName?: string;
  reRegistrationDate?: string;
  reRegistrationNextDate?: string;
} 

export function OwnerCard({ 
  ownerName, 
  affiliationValue, 
  registrationNumber, 
  registrationDate, 
  registrarName,
  reRegistrationDate,
  reRegistrationNextDate
}: OwnerCardProps) : React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Собственник и регистрация
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium text-gray-500">Собственник</div>
          <div className="text-lg">{ownerName || 'Не указано'}</div>
        </div>
        <div>
          <div className="text-sm font-medium text-gray-500">Принадлежность</div>
          <div className="text-lg">{affiliationValue || 'Не указано'}</div>
        </div>
        </div> 
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500">Дата регистрации</div>
            <div className="text-lg">{new Date(registrationDate).toLocaleDateString('ru-RU') || 'Не указано'}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Регистрационный номер</div>
            <div className="text-lg">{registrationNumber || 'Не указан'}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Регистратор</div>
            <div className="text-lg">{registrarName || 'Не указан'}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500">Дата последней перерегистрации</div>
            <div className="text-lg">
              {reRegistrationDate
                ? new Date(reRegistrationDate).toLocaleDateString('ru-RU')
                : 'Не указано'}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Дата следующей перерегистрации</div>
            <div className="text-lg">
              {reRegistrationNextDate
                ? new Date(reRegistrationNextDate).toLocaleDateString('ru-RU')
                : 'Не указано'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
