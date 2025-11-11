import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Ship } from 'lucide-react';
import { VesselListDTO } from '@/types/vessels';

interface VesselCardProps {
  vessels: VesselListDTO[];
}

export function VesselCard({ vessels }: VesselCardProps) {
  if (!vessels || vessels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Сосуды
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 dark:text-gray-400">Сосудов не найдено</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ship className="h-5 w-5" />
          Сосуды ({vessels.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vessels.map((vessel, index) => (
            <div
              key={vessel.id}
              className={`p-4 border rounded-lg ${
                index !== vessels.length - 1
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Серийный номер
                  </div>
                  <div className="text-lg font-semibold">{vessel.serialNumber}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Дата постройки
                  </div>
                  <div className="text-lg">
                    {new Date(vessel.buildDate).toLocaleDateString('ru-RU')}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Производитель
                  </div>
                  <div className="text-lg">{vessel.manufacturer}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Модель вагона
                  </div>
                  <div className="text-lg">{vessel.wagonModelId}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Давление (атм)
                  </div>
                  <div className="text-lg">{vessel.pressure}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Объём (л)
                  </div>
                  <div className="text-lg">{vessel.capacity}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
