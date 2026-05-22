import { Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';
import { TriangleAlert } from 'lucide-react';

interface SafetyInfoCardProps {
  dangerClass: number;
  substance: string;
  pressure: number;
  testPressure: number;
}

export function SafetyInfoCard({ dangerClass, substance, pressure, testPressure }: SafetyInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TriangleAlert className="h-5 w-5" />
          Информация о безопасности
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500">Класс опасности</div>
            <div className="text-lg">
              <Badge variant="outline">{dangerClass}</Badge>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Вещество</div>
            <div className="text-lg">{substance}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Рабочее давление, МПа</div>
            <div className="text-lg">{pressure}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Испытательное давление, МПа</div>
            <div className="text-lg">{testPressure}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
