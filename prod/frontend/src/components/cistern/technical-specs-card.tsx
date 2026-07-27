"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Gauge, Weight, Ruler } from "lucide-react";
import { ViewFileButton } from "@/components/view-file-button";

interface TechnicalSpecsCardProps {
  tareWeight: number;
  loadCapacity: number;
  length: number;
  axleCount: number;
  volume: number;
  fillingVolume?: number;
  fileRE?: string | null;
  fileTU?: string | null;
}

export function TechnicalSpecsCard({
  tareWeight,
  loadCapacity,
  length,
  axleCount,
  volume,
  fillingVolume,
  fileRE,
  fileTU,
}: TechnicalSpecsCardProps) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5" />
          Технические характеристики
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Weight className="h-4 w-4" />
              Тара, т
            </div>
            <div className="text-lg">{tareWeight}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Грузоподъемность, т</div>
            <div className="text-lg">{loadCapacity}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Ruler className="h-4 w-4" />
              Длина, мм
            </div>
            <div className="text-lg">{length}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Количество осей</div>
            <div className="text-lg">{axleCount}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Объем, м³</div>
            <div className="text-lg">{volume}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Объем налива, м³</div>
            <div className="text-lg">{fillingVolume || "Не указан"}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Руководство по эксплуатации</div>
            <div className="mt-1">
              <ViewFileButton value={fileRE} directory="WagonModels" label="Показать" />
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500">Технические условия</div>
            <div className="mt-1">
              <ViewFileButton value={fileTU} directory="WagonModels" label="Показать" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
