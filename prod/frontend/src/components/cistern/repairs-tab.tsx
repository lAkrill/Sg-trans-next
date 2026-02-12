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

  // Цепочка по убыванию даты (новые сверху); при равной дате сначала «выход», потом «приём»
  const repairsChain = useMemo(() => {
    const items: { type: 'in' | 'out'; date: string; data: RepairsIn | RepairsOut }[] = [];
    repairsIn?.forEach((r) => items.push({ type: 'in', date: r.dateIn, data: r }));
    repairsOut?.forEach((r) => items.push({ type: 'out', date: r.dateOut, data: r }));
    return items.sort((a, b) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      if (a.type === b.type) return 0;
      return a.type === 'out' ? -1 : 1;
    });
  }, [repairsIn, repairsOut]);

  // Пары (приём, выход), связанные по алгоритму: дата выхода − дата приёма = дни в ремонте
  const repairPairs = useMemo(() => {
    const pairs: { in: RepairsIn; out: RepairsOut }[] = [];
    const usedInIds = new Set<string>();
    repairsChain.forEach((item, index) => {
      if (item.type !== 'out') return;
      const precedingIn = repairsChain
        .slice(index + 1)
        .find((x) => x.type === 'in') as { type: 'in'; date: string; data: RepairsIn } | undefined;
      if (precedingIn) {
        pairs.push({ in: precedingIn.data, out: item.data as RepairsOut });
        usedInIds.add(precedingIn.data.id);
      }
    });
    const unpairedIns = (repairsIn ?? []).filter((r) => !usedInIds.has(r.id));
    return { pairs, unpairedIns: unpairedIns.sort((a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime()) };
  }, [repairsChain, repairsIn]);

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
          <div className="space-y-4">
            {!hasRepairs ? (
              <div className="text-center py-8 text-gray-500">
                <Wrench className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>История ремонтов пока не ведется</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Приём в ремонт</h4>
                  <h4 className="font-medium text-sm text-muted-foreground">Выпуск из ремонта</h4>
                </div>
                <div className="flex flex-col gap-5">
                  {repairPairs.pairs.map(({ in: inRec, out: r }) => {
                    const dateAdmission = inRec.dateIn;
                    const diffMs = new Date(r.dateOut).getTime() - new Date(dateAdmission).getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const daysInRepair = diffDays === 0 ? 1 : diffDays;
                    return (
                      <div key={`pair-${inRec.id}-${r.id}`} className="grid grid-cols-2 gap-4">
                        <div className="rounded-xl border border-rose-200/60 dark:border-rose-800/50 bg-rose-50/80 dark:bg-rose-950/30 p-4 shadow-sm space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{inRec.depotName}</span>
                            <span className="text-muted-foreground">
                              {new Date(inRec.dateIn).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <dl className="space-y-1 text-sm">
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Тип ремонта:</dt>
                              <dd>{inRec.repairType?.name ?? '—'}</dd>
                            </div>
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">№ документа (ВУ23):</dt>
                              <dd>{inRec.vU23 ?? '—'}</dd>
                            </div>
                            {inRec.defectName?.length ? (
                              <div className="flex gap-1">
                                <dt className="text-muted-foreground shrink-0">Дефекты:</dt>
                                <dd>{inRec.defectName.join(', ')}</dd>
                              </div>
                            ) : null}
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Дорога:</dt>
                              <dd>{inRec.roadName ?? '—'}</dd>
                            </div>
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Код адм. дороги:</dt>
                              <dd>{inRec.adminRoadCode ?? '—'}</dd>
                            </div>
                          </dl>
                        </div>
                        <div className="rounded-xl border border-green-200/60 dark:border-green-800/50 bg-green-50/80 dark:bg-green-950/30 p-4 shadow-sm space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{r.depotName}</span>
                            <span className="text-muted-foreground text-sm shrink-0">
                              {daysInRepair} {daysInRepair === 1 ? 'день' : daysInRepair < 5 ? 'дня' : 'дней'} в ремонте
                            </span>
                            <span className="text-muted-foreground">
                              {new Date(r.dateOut).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                          <dl className="space-y-1 text-sm">
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Тип ремонта:</dt>
                              <dd>{r.repairType?.name ?? '—'}</dd>
                            </div>
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Дата поступления:</dt>
                              <dd>{new Date(dateAdmission).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}</dd>
                            </div>
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Дата начала ремонта:</dt>
                              <dd>{new Date(r.dateIn).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}</dd>
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
                  })}
                  {repairPairs.unpairedIns.map((inRec) => (
                    <div key={`unpaired-${inRec.id}`} className="grid grid-cols-2 gap-4">
                      <div className="rounded-xl border border-rose-200/60 dark:border-rose-800/50 bg-rose-50/80 dark:bg-rose-950/30 p-4 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{inRec.depotName}</span>
                          <span className="text-muted-foreground">
                            {new Date(inRec.dateIn).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <dl className="space-y-1 text-sm">
                          <div className="flex gap-1">
                            <dt className="text-muted-foreground shrink-0">Тип ремонта:</dt>
                            <dd>{inRec.repairType?.name ?? '—'}</dd>
                          </div>
                          <div className="flex gap-1">
                            <dt className="text-muted-foreground shrink-0">№ документа (ВУ23):</dt>
                            <dd>{inRec.vU23 ?? '—'}</dd>
                          </div>
                          {inRec.defectName?.length ? (
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Дефекты:</dt>
                              <dd>{inRec.defectName.join(', ')}</dd>
                            </div>
                          ) : null}
                          <div className="flex gap-1">
                            <dt className="text-muted-foreground shrink-0">Дорога:</dt>
                            <dd>{inRec.roadName ?? '—'}</dd>
                          </div>
                          <div className="flex gap-1">
                            <dt className="text-muted-foreground shrink-0">Код адм. дороги:</dt>
                            <dd>{inRec.adminRoadCode ?? '—'}</dd>
                          </div>
                        </dl>
                      </div>
                      <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 dark:bg-muted/10 p-4 text-sm text-muted-foreground">
                        Ожидание выхода из ремонта
                      </div>
                    </div>
                  ))}
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