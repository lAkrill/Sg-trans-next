import { Button } from '@/components/ui';
import { ArrowLeft, FileText, Wrench, Train } from 'lucide-react';
import Link from 'next/link';

interface CisternHeaderProps {
  cisternId: string;
  cisternNumber: string;
  manufacturerName?: string;
  typeName?: string;
}

export function CisternHeader({ cisternId, cisternNumber, manufacturerName, typeName }: CisternHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/cisterns">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Train className="h-8 w-8" />
            Паспорт цистерны {cisternNumber}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {manufacturerName} • {typeName}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        {/* <Button variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Экспорт
        </Button> */}
        <Button>
          <Link href={`/cisterns/${cisternId}/edit`} className="flex items-center">
            <Wrench className="h-4 w-4 mr-2" />
            Редактировать
          </Link>
        </Button>
      </div>
    </div>
  );
}
