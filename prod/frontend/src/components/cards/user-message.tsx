"use client";

import { Mail  } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge } from "@/components/ui";
import { useCurrentUser } from "@/api";

const UserMessageCard = () => {
  const { data: user } = useCurrentUser();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
        <div className="p-3 rounded-lg bg-blue-500">
                <Mail className="h-6 w-6 text-white" />
              </div>
 
          <span>Сообщения для пользователя</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
           <div className="flex items-center justify-center text-center max-lg:flex-col">

            Новых уведомлений нет
           </div>
      </CardContent>
    </Card>
  );
};

export { UserMessageCard };
export default UserMessageCard;
