"use client";

import { useMemo, useState } from "react";
import { Eye, Inbox, Loader2, Mail, MailOpen, Paperclip, Send } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { filesApi } from "@/api/files";
import { useAllUsers, useCurrentUser, useMessagesByUser, useUpdateMessage } from "@/hooks";
import { MessageStatus, type MessageDTO } from "@/types/messages";

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("ru-RU");
};

const formatReadingDateForApi = (date = new Date()) => {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const getMessageStatusLabel = (status: number) => {
  switch (status) {
    case MessageStatus.Unread:
      return "Не прочитано";
    case MessageStatus.Read:
      return "Прочитано";
    default:
      return `Статус ${status}`;
  }
};

const getMessagePriorityLabel = (priority: number) => {
  switch (priority) {
    case 0:
      return "Обычный";
    case 1:
      return "Высокий";
    case 2:
      return "Срочный";
    default:
      return `Приоритет ${priority}`;
  }
};

const UserMessageCard = () => {
  const { data: user } = useCurrentUser();
  const userId = user?.userId;
  const { data: messages = [], isLoading, error } = useMessagesByUser(userId);
  const { data: users = [] } = useAllUsers();
  const updateMessageMutation = useUpdateMessage();
  const [selectedMessage, setSelectedMessage] = useState<MessageDTO | null>(null);
  const [selectedMessageType, setSelectedMessageType] = useState<"received" | "sent">("received");
  const [isViewingFile, setIsViewingFile] = useState(false);

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((item) => {
      const fullName = [item.lastName, item.firstName, item.patronymic].filter(Boolean).join(" ");
      map.set(item.id, fullName || item.email);
    });
    return map;
  }, [users]);

  const getUserName = (id: string) => userNameById.get(id) || id;

  const { receivedMessages, sentMessages, unreadReceivedCount } = useMemo(() => {
    if (!userId) {
      return {
        receivedMessages: [] as MessageDTO[],
        sentMessages: [] as MessageDTO[],
        unreadReceivedCount: 0,
      };
    }

    const received = messages
      .filter((message) => message.toUserId === userId)
      .sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());

    const sent = messages
      .filter((message) => message.fromUserId === userId)
      .sort((a, b) => new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime());

    return {
      receivedMessages: received,
      sentMessages: sent,
      unreadReceivedCount: received.filter((message) => message.status === MessageStatus.Unread).length,
    };
  }, [messages, userId]);

  const openMessage = async (message: MessageDTO, type: "received" | "sent") => {
    setSelectedMessageType(type);

    const shouldMarkAsRead =
      type === "received" && message.status === MessageStatus.Unread;

    if (!shouldMarkAsRead) {
      setSelectedMessage(message);
      return;
    }

    const readingDate = formatReadingDateForApi();
    const updatedMessage: MessageDTO = {
      ...message,
      status: MessageStatus.Read,
      readingDate,
    };

    setSelectedMessage(updatedMessage);

    try {
      await updateMessageMutation.mutateAsync({
        id: message.id,
        data: {
          readingDate,
          status: MessageStatus.Read,
        },
      });
    } catch {
      setSelectedMessage(message);
    }
  };

  const handleViewAttachment = async () => {
    if (!selectedMessage?.fileName) return;

    setIsViewingFile(true);
    try {
      const blob = await filesApi.download(selectedMessage.fileName, selectedMessage.filePath);
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch {
      // silently ignore; UI stays on the dialog
    } finally {
      setIsViewingFile(false);
    }
  };

  const renderMessageList = (items: MessageDTO[], type: "received" | "sent") => {
    if (items.length === 0) {
      return (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          {type === "received" ? "Нет входящих сообщений" : "Нет отправленных сообщений"}
        </div>
      );
    }

    return (
      <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
        {items.map((message) => {
          const isUnread = message.status === MessageStatus.Unread;
          const hasAttachment = Boolean(message.fileName || message.filePath);
          const counterpartId = type === "received" ? message.fromUserId : message.toUserId;
          const counterpartLabel = type === "received" ? "От" : "Кому";
          const StatusIcon = isUnread ? Mail : MailOpen;

          return (
            <div
              key={message.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                isUnread && type === "received"
                  ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40"
                  : "bg-background"
              }`}
            >
              <div className="flex shrink-0 items-center gap-1.5">
                <StatusIcon
                  className={`h-4 w-4 ${isUnread ? "text-blue-600" : "text-muted-foreground"}`}
                  aria-label={getMessageStatusLabel(message.status)}
                />
                {hasAttachment && (
                  <Paperclip className="h-4 w-4 text-muted-foreground" aria-label="Есть вложение" />
                )}
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden text-sm">
                <span className="shrink-0 font-medium whitespace-nowrap">
                  {formatDateTime(message.creationDate)}
                </span>
                <span className="min-w-0 truncate">
                  <span className="text-muted-foreground">{counterpartLabel}:</span>{" "}
                  {getUserName(counterpartId)}
                </span>
                <Badge variant="outline" className="shrink-0">
                  {getMessagePriorityLabel(message.priority)}
                </Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => openMessage(message, type)}
              >
                <Eye className="mr-2 h-4 w-4" />
                Прочитать
              </Button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="rounded-lg bg-blue-500 p-3">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <span>Управление сообщениями пользователя</span>
          {unreadReceivedCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadReceivedCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="py-6 text-center text-sm text-red-600">
            Не удалось загрузить сообщения
          </div>
        ) : (
          <Tabs defaultValue="received" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="received" className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Принятые
                {unreadReceivedCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {unreadReceivedCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sent" className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Отправленные
                <Badge variant="secondary" className="ml-1">
                  {sentMessages.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="received" className="mt-4">
              {renderMessageList(receivedMessages, "received")}
            </TabsContent>
            <TabsContent value="sent" className="mt-4">
              {renderMessageList(sentMessages, "sent")}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>

      <Dialog
        open={!!selectedMessage}
        onOpenChange={(open) => {
          if (!open) setSelectedMessage(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Сообщение</DialogTitle>
            <DialogDescription>
              {selectedMessageType === "received" ? "Входящее сообщение" : "Отправленное сообщение"}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Дата и время</p>
                  <p className="text-sm font-medium">{formatDateTime(selectedMessage.creationDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Дата прочтения</p>
                  <p className="text-sm font-medium">
                    {selectedMessage.status === MessageStatus.Unread
                      ? "—"
                      : formatDateTime(selectedMessage.readingDate)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">От</p>
                  <p className="text-sm font-medium">{getUserName(selectedMessage.fromUserId)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Кому</p>
                  <p className="text-sm font-medium">{getUserName(selectedMessage.toUserId)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Статус</p>
                  <Badge
                    variant={
                      selectedMessage.status === MessageStatus.Unread ? "default" : "secondary"
                    }
                  >
                    {getMessageStatusLabel(selectedMessage.status)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Приоритет</p>
                  <Badge variant="outline">
                    {getMessagePriorityLabel(selectedMessage.priority)}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted-foreground">Текст сообщения</p>
                <div className="rounded-md border bg-muted/30 p-3 text-sm whitespace-pre-wrap">
                  {selectedMessage.text}
                </div>
              </div>

              {selectedMessage.fileName && (
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Файл</p>
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">
                      {selectedMessage.fileName}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={handleViewAttachment}
                      disabled={isViewingFile}
                    >
                      {isViewingFile ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Загрузка...
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Посмотреть
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setSelectedMessage(null)}>
              Закрыть
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export { UserMessageCard };
export default UserMessageCard;
