import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Wrench, Calendar } from 'lucide-react';
import { CisternMilages } from "@/api/milages";
import type { CisternMilage } from "@/api/milages";
import { useState, useEffect, useCallback, useMemo } from "react";

import { CisternRepairs } from "@/api/repairs";
import type { RepairsIn, RepairsOut } from "@/api/repairs";

// Определяем тип пропсов
type LocationTabProps = {
  CicternNumber: string; // или другой тип, например объект
};

export function RepairsTab({CicternNumber}:LocationTabProps) {

  const [milage, setMilage] = useState<CisternMilage | null>(null);
  const [repairsIn, setRepairsIn] = useState<RepairsIn[] | null>(null);
  const [repairsOut, setRepairsOut] = useState<RepairsOut[] | null>(null);

  // Объединённый хронологический список: приём — слева, выпуск — справа, цепочкой
  const repairsChain = useMemo(() => {
    const items: { type: 'in' | 'out'; date: string; data: RepairsIn | RepairsOut }[] = [];
    repairsIn?.forEach((r) => items.push({ type: 'in', date: r.dateIn, data: r }));
    repairsOut?.forEach((r) => items.push({ type: 'out', date: r.dateOut, data: r }));
    return items.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      if (a.type === b.type) return 0;
      // При одинаковых датах «выход из ремонта» должен быть выше «приёма в ремонт»
      return a.type === 'out' ? -1 : 1;
    });
  }, [repairsIn, repairsOut]);
  const hasRepairs = repairsChain.length > 0;

  const handleCisternSelect = useCallback(async () => {
    const res3 = await CisternMilages.getLastMilage( CicternNumber);
    const res1 = await CisternRepairs.getAllRepairsIn(CicternNumber);
    const res2 = await CisternRepairs.getAllRepairsOut(CicternNumber);
    setMilage(res3);
    setRepairsIn(res1);
    setRepairsOut(res2);
    
  }, []);


   useEffect(() => {
     handleCisternSelect(); // вызываем при монтировании
  
    }, [handleCisternSelect]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            История ремонтов
          </CardTitle>
          <CardDescription>
            Записи о проведенных ремонтах и техническом обслуживании
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {!hasRepairs ? (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>История ремонтов пока не ведется</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <h4 className="font-medium text-sm text-muted-foreground">Приём в ремонт</h4>
                  <h4 className="font-medium text-sm text-muted-foreground">Выпуск из ремонта</h4>
                </div>
                <div className="flex flex-col gap-2">
                  {repairsChain.map((item, index) =>
                    item.type === 'in' ? (
                      <div key={`in-${item.data.id}`} className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg border p-3 text-base bg-rose-50 dark:bg-rose-950/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{(item.data as RepairsIn).depotName}</span>
                            <span className="text-muted-foreground">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>
                          <dl className="space-y-1 text-sm">
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Тип ремонта:</dt>
                              <dd>{(item.data as RepairsIn).repairType?.name ?? '—'}</dd>
                            </div>
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">№ документа (ВУ23):</dt>
                              <dd>{(item.data as RepairsIn).vU23 ?? '—'}</dd>
                            </div>
                            {(item.data as RepairsIn).defectName?.length ? (
                              <div className="flex gap-1">
                                <dt className="text-muted-foreground shrink-0">Дефекты:</dt>
                                <dd>{(item.data as RepairsIn).defectName.join(', ')}</dd>
                              </div>
                            ) : null}
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Дорога:</dt>
                              <dd>{(item.data as RepairsIn).roadName ?? '—'}</dd>
                            </div>
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Код адм. дороги:</dt>
                              <dd>{(item.data as RepairsIn).adminRoadCode ?? '—'}</dd>
                            </div>
                          </dl>
                        </div>
                        <div />
                      </div>
                    ) : (() => {
                      const r = item.data as RepairsOut;
                      const precedingIn = repairsChain
                        .slice(index + 1)
                        .find((x) => x.type === 'in') as { type: 'in'; date: string; data: RepairsIn } | undefined;
                      const dateAdmission = precedingIn ? precedingIn.data.dateIn : r.dateIn;
                      const diffMs = new Date(r.dateOut).getTime() - new Date(dateAdmission).getTime();
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      const daysInRepair = diffDays === 0 ? 1 : diffDays;
                      return (
                      <div key={`out-${item.data.id}`} className="grid grid-cols-2 gap-2">
                        <div />
                        <div className="rounded-lg border p-3 text-base bg-green-50 dark:bg-green-950/30 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{r.depotName}</span>
                            <span className="text-muted-foreground text-sm shrink-0">
                              {daysInRepair} {daysInRepair === 1 ? 'день' : daysInRepair < 5 ? 'дня' : 'дней'} в ремонте
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(item.date).toLocaleDateString()}
                            </span>
                          </div>
                          <dl className="space-y-1 text-sm">
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Тип ремонта:</dt>
                              <dd>{r.repairType?.name ?? '—'}</dd>
                            </div>
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Дата поступления:</dt>
                              <dd>{new Date(dateAdmission).toLocaleDateString()}</dd>
                            </div>
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Дата начала ремонта:</dt>
                              <dd>{new Date(r.dateIn).toLocaleDateString()}</dd>
                            </div>
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">№ документа (ВУ36):</dt>
                              <dd>{r.vU36 ?? '—'}</dd>
                            </div>
                            {r.modernName?.length ? (
                              <div className="flex gap-1">
                                <dt className="text-muted-foreground shrink-0">Модернизации:</dt>
                                <dd>{r.modernName.join(', ')}</dd>
                              </div>
                            ) : null}
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Дорога:</dt>
                              <dd>{r.roadName ?? '—'}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    );
                    })()
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Плановое обслуживание
          </CardTitle>
          <CardDescription>
            График предстоящих технических осмотров и ремонтов
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
             Дата планируемого ремонта: <b>{new Date(milage?.repairDate ?? "").toLocaleDateString()}</b>
            {/* <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" /> */}
            
          </div>
        </CardContent>
      </Card>
    </div>
  );
}