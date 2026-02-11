"use client";

import { useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
} from "@/components/ui";
import { Import, Loader2, Wrench } from "lucide-react";
import { api } from "@/lib/api";

export default function RepairsPage() {
 

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Сведения о ремонтах</h1>
      </div>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Сведения о ремонтах
            </CardTitle>
            <CardDescription>Страница в разработке</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
  
          </CardContent>
        </Card>
  

     
    </div>
  );
}
