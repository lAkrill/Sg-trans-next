import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Wrench, Calendar } from 'lucide-react';
import type { RailwayCisternDetailDTO } from "@/types/cisterns";
import { useState, useEffect, useCallback, useMemo } from "react";

import { CisternRepairs } from "@/api/repairs";
import type { RepairsIn, RepairsMatching, RepairsOut } from "@/api/repairs";


interface RepairsTabProps {
  cistern: RailwayCisternDetailDTO;
}

const MAINTENANCE_SCHEDULE_ROWS: {
  label: string;
  lastField: keyof RailwayCisternDetailDTO;
  planField: keyof RailwayCisternDetailDTO;
}[] = [
  { label: "Капитальный ремонт", lastField: "periodMajorRepair", planField: "planPeriodMajorRepair" },
  { label: "Периодическое испытание (ГИ)", lastField: "periodPeriodicTest", planField: "planPeriodPeriodicTest" },
  { label: "Промежуточное испытание (ИГ)", lastField: "periodIntermediateTest", planField: "planPeriodIntermediateTest" },
  { label: "Деповской ремонт", lastField: "periodDepotRepair", planField: "planPeriodDepotRepair" },
  { label: "Профремонт (ППР)", lastField: "periodPPRRepair", planField: "planPeriodPPRRepair" },
];

function formatCisternScheduleDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("ru-RU");
}

export function RepairsTab({ cistern }: RepairsTabProps) {

  const [repairsMatching, setRepairsMatching] = useState<RepairsMatching[] | null>(null);
  const [repairsIn, setRepairsIn] = useState<RepairsIn[] | null>(null);
  const [repairsOut, setRepairsOut] = useState<RepairsOut[] | null>(null);

  const loadData = useCallback(async () => {
    const [resMatching, resIn, resOut] = await Promise.all([

      CisternRepairs.getRepairsMatchingById(cistern.id),
      CisternRepairs.getAllRepairsNumIn(cistern.number),
      CisternRepairs.getAllRepairsNumOut(cistern.number),
    ]);
    
    setRepairsMatching(resMatching);
    setRepairsIn(resIn);
    setRepairsOut(resOut);
  }, [cistern.number, cistern.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const matchingList = repairsMatching ?? [];
  const matchedInIds = useMemo(
    () => new Set(matchingList.map((m) => m.repairInId)),
    [matchingList]
  );
  const matchedOutIds = useMemo(
    () => new Set(matchingList.map((m) => m.repairOutId)),
    [matchingList]
  );
  const unpairedIns = useMemo(
    () =>
      (repairsIn ?? []).filter((r) => !matchedInIds.has(r.id)).sort((a, b) => new Date(b.dateIn).getTime() - new Date(a.dateIn).getTime()),
    [repairsIn, matchedInIds]
  );
  const unpairedOuts = useMemo(
    () => (repairsOut ?? []).filter((r) => !matchedOutIds.has(r.id)),
    [repairsOut, matchedOutIds]
  );

  type RowItem =
    | { type: "pair"; sortDate: string; matching: RepairsMatching }
    | { type: "unpaired-in"; sortDate: string; inRec: RepairsIn }
    | { type: "unpaired-out"; sortDate: string; outRec: RepairsOut };

  // Сортировка: приоритет — дата постановки в ремонт; если её нет (несвязанный выход) — дата выхода из ремонта
  const sortedRows = useMemo(() => {
    const rows: RowItem[] = [
      ...matchingList.map((m) => ({ type: "pair" as const, sortDate: m.repairIn.dateIn, matching: m })),
      ...unpairedIns.map((inRec) => ({ type: "unpaired-in" as const, sortDate: inRec.dateIn, inRec })),
      ...unpairedOuts.map((outRec) => ({ type: "unpaired-out" as const, sortDate: outRec.dateOut, outRec })),
    ];
    return rows.sort((a, b) => new Date(b.sortDate).getTime() - new Date(a.sortDate).getTime());
  }, [matchingList, unpairedIns, unpairedOuts]);

  const hasRepairs = sortedRows.length > 0;

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
                  {sortedRows.map((row) => {
                    if (row.type === "unpaired-in") {
                      const inRec = row.inRec;
                      return (
                        <div key={`unpaired-in-${inRec.id}`} className="grid grid-cols-2 gap-4">
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
                                  <dd>
                                    {inRec.defectCode?.length ? `(${inRec.defectCode.join(', ')}) ` : ''}
                                    {inRec.defectName.join(', ')}</dd>
                                </div>
                              ) : null}
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Станция:</dt>
                              <dd>
                                {inRec.stationName
                                  ? `${inRec.stationName}${inRec.stationCode ? ` (${inRec.stationCode})` : ''}`
                                  : inRec.stationCode ?? '—'}
                              </dd>
                            </div>
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
                      );
                    }
                    if (row.type === "unpaired-out") {
                      const r = row.outRec;
                      const dateAdmission = r.dateIn;
                      const diffMs = new Date(r.dateOut).getTime() - new Date(dateAdmission).getTime();
                      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                      const daysInRepair = diffDays === 0 ? 1 : diffDays;
                      return (
                        <div key={`unpaired-out-${r.id}`} className="grid grid-cols-2 gap-4">
                          <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-amber-300/50 dark:border-amber-600/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
                            Пропущена запись о приёме в ремонт
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
                                  <dd>
                                    {r.modernCode?.length ? `(${r.modernCode.join(', ')}) ` : ''}
                                    {r.modernName.join(', ')}
                                  </dd>
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
                    }
                    const m = row.matching;
                    const inRec = m.repairIn;
                    const r = m.repairOut;
                    const dateAdmission = inRec.dateIn;
                    const diffMs = new Date(r.dateOut).getTime() - new Date(dateAdmission).getTime();
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    const daysInRepair = diffDays === 0 ? 1 : diffDays;
                    return (
                      <div key={m.id} className="grid grid-cols-2 gap-4">
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
                                <dd>
                                  {inRec.defectCode?.length ? `(${inRec.defectCode.join(', ')}) ` : ''}
                                  {inRec.defectName.join(', ')}
                                </dd>
                              </div>
                            ) : null}
                            <div className="flex gap-1">
                              <dt className="text-muted-foreground shrink-0">Станция:</dt>
                              <dd>
                                {inRec.stationName
                                  ? `${inRec.stationName}${inRec.stationCode ? ` (${inRec.stationCode})` : ''}`
                                  : inRec.stationCode ?? '—'}
                              </dd>
                            </div>
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
                                <dd>
                                  {r.modernCode?.length ? `(${r.modernCode.join(', ')}) ` : ''}
                                  {r.modernName.join(', ')}
                                  </dd>
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
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="min-w-0">
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                Последний (факт)
              </h4>
              <dl className="space-y-3 text-sm">
                {MAINTENANCE_SCHEDULE_ROWS.map(({ label, lastField }) => (
                  <div
                    key={lastField}
                    className="flex flex-col gap-0.5 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                  >
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium tabular-nums">
                      {formatCisternScheduleDate(cistern[lastField] as string | undefined)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="min-w-0">
              <h4 className="mb-3 text-sm font-medium text-muted-foreground">
                Плановый срок
              </h4>
              <dl className="space-y-3 text-sm">
                {MAINTENANCE_SCHEDULE_ROWS.map(({ label, planField }) => (
                  <div
                    key={planField}
                    className="flex flex-col gap-0.5 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
                  >
                    <dt className="text-muted-foreground"> &nbsp;</dt>
                    <dd className="font-medium tabular-nums">
                      {formatCisternScheduleDate(cistern[planField] as string | undefined)}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="min-w-0">
          <dl className="space-y-3 text-sm">
          <div className="flex flex-col gap-0.5 border-b border-border/60 pb-3 last:border-b-0 last:pb-0">
           <dt className="text-muted-foreground">Покраска</dt>
                    <dd className="font-medium tabular-nums">
                      {formatCisternScheduleDate(cistern.periodPaintRepair as string | undefined)}
                    </dd>
                    </div>
            </dl>
            </div>
            </div>
          
        </CardContent>
      </Card>
    </div>
  );
}
