"use client";

import { BasicInfoCard } from "./basic-info-card";
import { TechnicalSpecsCard } from "./technical-specs-card";
import { ManufacturerCard } from "./manufacturer-card";
import { OwnerCard } from "./owner-card";
import { SafetyInfoCard } from "./safety-info-card";
import { VesselCard } from "./vessel-card";
import { ModelImageCard } from "./model-image-card";
import { AdditionalInfoCard } from "./additional-info-card";
import { useWagonModel } from "@/hooks";
import { cn } from "@/lib/utils";
import type { RailwayCisternDetailDTO } from "@/types/cisterns";

interface GeneralInfoTabProps {
  cistern: RailwayCisternDetailDTO;
}

export function GeneralInfoTab({ cistern }: GeneralInfoTabProps) {
  const { data: wagonModel } = useWagonModel(cistern.model?.id || "");
  const fileImage =
    typeof wagonModel?.fileImage === "string" && wagonModel.fileImage.trim()
      ? wagonModel.fileImage
      : null;
  const hasImage = Boolean(fileImage);

  return (
    <div className="space-y-6">
      <div className={cn("grid gap-6", hasImage ? "md:grid-cols-3" : "md:grid-cols-2")}>
        {fileImage && <ModelImageCard fileImage={fileImage} />}

        <BasicInfoCard
          number={cistern.number}
          serialNumber={cistern.serialNumber}
          buildDate={cistern.buildDate}
          commissioningDate={cistern.commissioningDate}
          railwayCisternStatusName={cistern.railwayCisternStatus?.name}
          serviceLifeYears={cistern.serviceLifeYears}
          extensionServiceLifeDate={cistern.extensionServiceLifeDate}
        />

        <TechnicalSpecsCard
          tareWeight={cistern.tareWeight}
          loadCapacity={cistern.loadCapacity}
          length={cistern.length}
          axleCount={cistern.axleCount}
          volume={cistern.volume}
          fillingVolume={cistern.fillingVolume}
          fileRE={wagonModel?.fileRE}
          fileTU={wagonModel?.fileTU}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
          reRegistrationDate={cistern.reRegistrationDate}
          reRegistrationNextDate={cistern.reRegistrationNextDate}
        />

        <AdditionalInfoCard
          pripiska={cistern.pripiska}
          rent={cistern.rent}
          notes={cistern.notes}
          updatedAt={cistern.updatedAt}
        />

        <SafetyInfoCard
          dangerClass={cistern.dangerClass}
          substance={cistern.substance}
          pressure={cistern.pressure}
          testPressure={cistern.testPressure}
        />
      </div>
    </div>
  );
}
