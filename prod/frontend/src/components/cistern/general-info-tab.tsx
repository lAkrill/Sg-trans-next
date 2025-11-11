import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { BasicInfoCard } from './basic-info-card';
import { TechnicalSpecsCard } from './technical-specs-card';
import { ManufacturerCard } from './manufacturer-card';
import { OwnerCard } from './owner-card';
import { SafetyInfoCard } from './safety-info-card';
import { VesselCard } from './vessel-card';

import { RailwayCisternDetailDTO } from '@/types/cisterns';

interface GeneralInfoTabProps {
  cistern: RailwayCisternDetailDTO;
}

export function GeneralInfoTab({ cistern }: GeneralInfoTabProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <BasicInfoCard
        number={cistern.number}
        serialNumber={cistern.serialNumber}
        buildDate={cistern.buildDate}
        commissioningDate={cistern.commissioningDate}
      />

      <TechnicalSpecsCard
        tareWeight={cistern.tareWeight}
        loadCapacity={cistern.loadCapacity}
        length={cistern.length}
        axleCount={cistern.axleCount}
        volume={cistern.volume}
        fillingVolume={cistern.fillingVolume}
      />

      {cistern.vessels && cistern.vessels.length > 0 && (
        <VesselCard vessels={cistern.vessels} />
      )}

      <ManufacturerCard
        manufacturerName={cistern.manufacturer?.name}
        typeName={cistern.type?.name}
        modelName={cistern.model?.name}
      />

      <OwnerCard
        ownerName={cistern.owner?.name}
        affiliationValue={cistern.affiliation?.value}
        registrationNumber={cistern.registrationNumber}
        registrationDate={cistern.registrationDate}
        registrarName={cistern.registrar?.name}
      />

      <SafetyInfoCard
        dangerClass={cistern.dangerClass}
        substance={cistern.substance}
        pressure={cistern.pressure}
        testPressure={cistern.testPressure}
      />

      

      {cistern.notes && (
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Дополнительная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 dark:text-gray-300">{cistern.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
