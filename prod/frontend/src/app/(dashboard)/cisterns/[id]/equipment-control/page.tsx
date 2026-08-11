"use client";

import { useParams } from "next/navigation";
import { PartEquipmentListControl } from "@/components/part-equipment-list-control";

export default function CisternEquipmentControlPage() {
  const params = useParams();
  const cisternId = params.id as string;

  return <PartEquipmentListControl cisternId={cisternId} />;
}
