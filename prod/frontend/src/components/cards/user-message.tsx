"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Inbox,
  Loader2,
  Mail,
  MailOpen,
  Paperclip,
  Search,
  Send,
  X,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/components/ui";
import { filesApi } from "@/api/files";
import {
  useAllUsers,
  useCreateMessage,
  useCurrentUser,
  useMessagesByUser,
  useUpdateMessage,
} from "@/hooks";
import { MessagePriority, MessageStatus, type MessageDTO } from "@/types/messages";

const ALLOWED_MESSAGE_FILE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".pdf"] as const;
const ALLOWED_MESSAGE_FILE_ACCEPT = ".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf";
const MAX_MESSAGE_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const isAllowedMessageFile = (file: File) => {
  const lowerName = file.name.toLowerCase();
  return ALLOWED_MESSAGE_FILE_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
};

const getSendErrorMessage = (err: unknown, fallback: string) => {
  if (!err || typeof err !== "object") return fallback;

  const axiosError = err as {
    message?: string;
    code?: string;
    response?: {
      status?: number;
      statusText?: string;
      data?: {
        message?: string;
        Message?: string;
        details?: string;
        Details?: string;
        title?: string;
        Title?: string;
      };
    };
  };

  const data = axiosError.response?.data;
  const serverMessage =
    data?.message || data?.Message || data?.details || data?.Details || data?.title || data?.Title;

  if (serverMessage) return serverMessage;

  const status = axiosError.response?.status;
  if (status) {
    const statusText = axiosError.response?.statusText;
    return statusText ? `Ошибка сервера (${status}: ${statusText})` : `Ошибка сервера (${status})`;
  }

  if (axiosError.code === "ERR_NETWORK" || axiosError.message === "Network Error") {
    return "Нет связи с сервером";
  }

  if (axiosError.message && axiosError.message !== "Network Error") {
    return axiosError.message;
  }

  return fallback;
};

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
    case MessageStatus.Archived:
      return "Архив";
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

const ARCHIVE_PAGE_SIZES = [5, 10, 25, 50] as const;

const matchesArchiveSearch = (
  message: MessageDTO,
  query: string,
  userId: string | undefined,
  getUserName: (id: string) => string
) => {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const directionLabel = message.toUserId === userId ? "входящее входящие от" : "исходящее исходящие кому";
  const haystack = [
    message.id,
    message.text,
    message.fromUserId,
    message.toUserId,
    getUserName(message.fromUserId),
    getUserName(message.toUserId),
    message.fileName,
    message.filePath,
    String(message.status),
    getMessageStatusLabel(message.status),
    String(message.priority),
    getMessagePriorityLabel(message.priority),
    message.creationDate,
    formatDateTime(message.creationDate),
    message.readingDate,
    formatDateTime(message.readingDate),
    directionLabel,
    "архив",
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token));
};

const getVisiblePages = (currentPage: number, totalPages: number) => {
  const delta = 2;
  const range: number[] = [];
  const rangeWithDots: (number | string)[] = [];

  for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
    range.push(i);
  }

  if (currentPage - delta > 2) {
    rangeWithDots.push(1, "...");
  } else {
    rangeWithDots.push(1);
  }

  rangeWithDots.push(...range);

  if (currentPage + delta < totalPages - 1) {
    rangeWithDots.push("...", totalPages);
  } else if (totalPages > 1) {
    rangeWithDots.push(totalPages);
  }

  return rangeWithDots;
};

const UserMessageCard = () => {
  const { data: user } = useCurrentUser();
  const userId = user?.userId;
  const { data: messages = [], isLoading, error } = useMessagesByUser(userId);
  const { data: users = [], isLoading: isLoadingUsers } = useAllUsers();
  const updateMessageMutation = useUpdateMessage();
  const createMessageMutation = useCreateMessage();
  const [selectedMessage, setSelectedMessage] = useState<MessageDTO | null>(null);
  const [selectedMessageType, setSelectedMessageType] = useState<"received" | "sent" | "archive">(
    "received"
  );
  const [isViewingFile, setIsViewingFile] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [recipientId, setRecipientId] = useState("");
  const [messageText, setMessageText] = useState("");
  const [messageFile, setMessageFile] = useState<File | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archivePage, setArchivePage] = useState(1);
  const [archivePageSize, setArchivePageSize] = useState(10);

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((item) => {
      const fullName = [item.lastName, item.firstName, item.patronymic].filter(Boolean).join(" ");
      map.set(item.id, fullName || item.email);
    });
    return map;
  }, [users]);

  const getUserName = (id: string) => userNameById.get(id) || id;

  const { receivedMessages, sentMessages, archivedMessages, unreadReceivedCount } = useMemo(() => {
    if (!userId) {
      return {
        receivedMessages: [] as MessageDTO[],
        sentMessages: [] as MessageDTO[],
        archivedMessages: [] as MessageDTO[],
        unreadReceivedCount: 0,
      };
    }

    const byDateDesc = (a: MessageDTO, b: MessageDTO) =>
      new Date(b.creationDate).getTime() - new Date(a.creationDate).getTime();

    const received = messages
      .filter(
        (message) =>
          message.toUserId === userId && message.status !== MessageStatus.Archived
      )
      .sort(byDateDesc);

    const sent = messages
      .filter(
        (message) =>
          message.fromUserId === userId && message.status !== MessageStatus.Archived
      )
      .sort(byDateDesc);

    const archived = messages
      .filter((message) => message.status === MessageStatus.Archived)
      .sort(byDateDesc);

    return {
      receivedMessages: received,
      sentMessages: sent,
      archivedMessages: archived,
      unreadReceivedCount: received.filter((message) => message.status === MessageStatus.Unread).length,
    };
  }, [messages, userId]);

  const filteredArchivedMessages = useMemo(
    () =>
      archivedMessages.filter((message) =>
        matchesArchiveSearch(message, archiveSearch, userId, getUserName)
      ),
    [archivedMessages, archiveSearch, userId, userNameById]
  );

  const archiveTotalItems = filteredArchivedMessages.length;
  const archiveTotalPages = Math.max(1, Math.ceil(archiveTotalItems / archivePageSize));
  const archiveStartItem = archiveTotalItems === 0 ? 0 : (archivePage - 1) * archivePageSize + 1;
  const archiveEndItem = Math.min(archivePage * archivePageSize, archiveTotalItems);
  const paginatedArchivedMessages = filteredArchivedMessages.slice(
    (archivePage - 1) * archivePageSize,
    archivePage * archivePageSize
  );
  const hasArchiveSearch = archiveSearch.trim().length > 0;

  useEffect(() => {
    setArchivePage(1);
  }, [archiveSearch, archivePageSize]);

  useEffect(() => {
    if (archivePage > archiveTotalPages) {
      setArchivePage(archiveTotalPages);
    }
  }, [archivePage, archiveTotalPages]);

  const openMessage = async (message: MessageDTO, type: "received" | "sent" | "archive") => {
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
          text: message.text,
          readingDate,
          status: MessageStatus.Read,
          priority: message.priority,
        },
      });
    } catch {
      setSelectedMessage(message);
    }
  };

  const handleArchiveMessage = async (message: MessageDTO) => {
    if (message.status !== MessageStatus.Read) return;

    try {
      await updateMessageMutation.mutateAsync({
        id: message.id,
        data: {
          text: message.text,
          readingDate: message.readingDate || formatReadingDateForApi(),
          status: MessageStatus.Archived,
          priority: message.priority,
        },
      });

      if (selectedMessage?.id === message.id) {
        setSelectedMessage(null);
      }
    } catch {
      // список обновится после инвалидации запроса
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

  const formatUserName = (item: {
    firstName?: string;
    lastName?: string;
    patronymic?: string;
    email: string;
  }) => {
    const fullName = [item.lastName, item.firstName, item.patronymic].filter(Boolean).join(" ");
    return fullName ? `${fullName} (${item.email})` : item.email;
  };

  const resetSendForm = () => {
    setRecipientId("");
    setMessageText("");
    setMessageFile(null);
    setSendError(null);
  };

  const handleSendDialogChange = (open: boolean) => {
    setSendDialogOpen(open);
    if (!open) {
      resetSendForm();
    }
  };

  const handleMessageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";

    if (!file) {
      setMessageFile(null);
      return;
    }

    if (!isAllowedMessageFile(file)) {
      setSendError("Допустимые форматы файла: PNG, JPG, JPEG, PDF");
      setMessageFile(null);
      return;
    }

    if (file.size > MAX_MESSAGE_FILE_SIZE_BYTES) {
      setSendError("Размер файла не должен превышать 10 МБ");
      setMessageFile(null);
      return;
    }

    setSendError(null);
    setMessageFile(file);
  };

  const handleSendSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSendError(null);

    if (!userId) {
      setSendError("Не удалось определить текущего пользователя");
      return;
    }

    if (!recipientId || !messageText.trim()) {
      return;
    }

    let step: "upload" | "message" = "message";

    try {
      let fileName: string | null = null;
      let filePath: string | null = null;

      if (messageFile) {
        step = "upload";
        const extension = messageFile.name.includes(".")
          ? messageFile.name.slice(messageFile.name.lastIndexOf(".")).toLowerCase()
          : "";
        const uniqueFileName = `${uuidv4()}${extension}`;
        const uploaded = await filesApi.upload(messageFile, {
          directory: "Message",
          fileName: uniqueFileName,
        });
        fileName = uploaded.fileName;
        filePath = "Message";
      }

      step = "message";
      await createMessageMutation.mutateAsync({
        text: messageText.trim(),
        fromUserId: userId,
        toUserId: recipientId,
        priority: MessagePriority.Normal,
        fileName,
        filePath,
      });

      handleSendDialogChange(false);
    } catch (err) {
      const fallback =
        step === "upload"
          ? "Не удалось загрузить файл. Попробуйте ещё раз."
          : "Не удалось отправить сообщение. Попробуйте ещё раз.";
      const details = getSendErrorMessage(err, fallback);
      setSendError(
        details === fallback
          ? fallback
          : `${step === "upload" ? "Ошибка загрузки файла" : "Ошибка отправки сообщения"}: ${details}`
      );
    }
  };

  const renderMessageList = (items: MessageDTO[], type: "received" | "sent" | "archive") => {
    if (items.length === 0) {
      const emptyLabel =
        type === "received"
          ? "Нет входящих сообщений"
          : type === "sent"
            ? "Нет отправленных сообщений"
            : "Нет архивных сообщений";

      return (
        <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
          {emptyLabel}
        </div>
      );
    }

    return (
      <div className={`${type === "archive" ? "" : "max-h-96 overflow-y-auto pr-1 "}space-y-2`}>
        {items.map((message) => {
          const isUnread = message.status === MessageStatus.Unread;
          const hasAttachment = Boolean(message.fileName || message.filePath);
          const direction =
            type === "archive"
              ? message.toUserId === userId
                ? "received"
                : "sent"
              : type;
          const counterpartId = direction === "received" ? message.fromUserId : message.toUserId;
          const counterpartLabel = direction === "received" ? "От" : "Кому";
          const DirectionIcon = direction === "received" ? ArrowRight : ArrowLeft;
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
                {type === "archive" ? (
                  <DirectionIcon
                    className="h-4 w-4 text-muted-foreground"
                    aria-label={direction === "received" ? "Входящее" : "Исходящее"}
                  />
                ) : (
                  <StatusIcon
                    className={`h-4 w-4 ${isUnread ? "text-blue-600" : "text-muted-foreground"}`}
                    aria-label={getMessageStatusLabel(message.status)}
                  />
                )}
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

              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => openMessage(message, type)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Прочитать
                </Button>
                {type !== "archive" && message.status === MessageStatus.Read && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => handleArchiveMessage(message)}
                    disabled={
                      updateMessageMutation.isPending &&
                      updateMessageMutation.variables?.id === message.id
                    }
                  >
                    {updateMessageMutation.isPending &&
                    updateMessageMutation.variables?.id === message.id &&
                    updateMessageMutation.variables?.data.status === MessageStatus.Archived ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Archive className="mr-2 h-4 w-4" />
                    )}
                    В архив
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 gap-4">
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
        <Button
          type="button"
          className="bg-blue-500 text-white hover:bg-blue-600"
          onClick={() => handleSendDialogChange(true)}
        >
          <Send className="mr-2 h-4 w-4" />
          Отправить сообщение
        </Button>
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
            <TabsList className="grid w-full grid-cols-3">
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
              <TabsTrigger value="archive" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Архив
                <Badge variant="secondary" className="ml-1">
                  {archivedMessages.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="received" className="mt-4">
              {renderMessageList(receivedMessages, "received")}
            </TabsContent>
            <TabsContent value="sent" className="mt-4">
              {renderMessageList(sentMessages, "sent")}
            </TabsContent>
            <TabsContent value="archive" className="mt-4 space-y-3">
              {archivedMessages.length === 0 ? (
                renderMessageList([], "archive")
              ) : (
                <>
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={archiveSearch}
                      onChange={(e) => setArchiveSearch(e.target.value)}
                      placeholder="Быстрый поиск по всем полям..."
                      className="pl-9 pr-9"
                    />
                    {archiveSearch && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0"
                        onClick={() => setArchiveSearch("")}
                        aria-label="Очистить поиск"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {hasArchiveSearch && (
                    <p className="text-sm text-muted-foreground">
                      Найдено: {archiveTotalItems} из {archivedMessages.length}
                    </p>
                  )}

                  {archiveTotalItems === 0 ? (
                    <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                      Ничего не найдено по запросу «{archiveSearch.trim()}»
                    </div>
                  ) : (
                    <>
                      {renderMessageList(paginatedArchivedMessages, "archive")}
                      <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            Показано {archiveStartItem}-{archiveEndItem} из {archiveTotalItems}
                          </p>
                          <select
                            value={archivePageSize}
                            onChange={(e) => setArchivePageSize(Number(e.target.value))}
                            className="rounded border border-input bg-background px-2 py-1 text-sm"
                          >
                            {ARCHIVE_PAGE_SIZES.map((size) => (
                              <option key={size} value={size}>
                                {size} на странице
                              </option>
                            ))}
                          </select>
                        </div>

                        {archiveTotalPages > 1 && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setArchivePage(1)}
                              disabled={archivePage === 1}
                              aria-label="Первая страница"
                            >
                              <ChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setArchivePage((page) => Math.max(1, page - 1))}
                              disabled={archivePage === 1}
                              aria-label="Предыдущая страница"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {getVisiblePages(archivePage, archiveTotalPages).map((page, index) => (
                              <Button
                                key={`${page}-${index}`}
                                variant={page === archivePage ? "default" : "outline"}
                                size="sm"
                                onClick={() => typeof page === "number" && setArchivePage(page)}
                                disabled={typeof page !== "number"}
                                className="min-w-[40px]"
                              >
                                {page}
                              </Button>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setArchivePage((page) => Math.min(archiveTotalPages, page + 1))
                              }
                              disabled={archivePage === archiveTotalPages}
                              aria-label="Следующая страница"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setArchivePage(archiveTotalPages)}
                              disabled={archivePage === archiveTotalPages}
                              aria-label="Последняя страница"
                            >
                              <ChevronsRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
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
              {selectedMessageType === "received"
                ? "Входящее сообщение"
                : selectedMessageType === "sent"
                  ? "Отправленное сообщение"
                  : "Архивное сообщение"}
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

      <Dialog open={sendDialogOpen} onOpenChange={handleSendDialogChange}>
        <DialogContent className="max-h-[85vh] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Отправить сообщение</DialogTitle>
            <DialogDescription>
              Укажите получателя и текст сообщения. При необходимости приложите файл.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSendSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user-message-recipient">Кому отправлять</Label>
              <Select value={recipientId} onValueChange={setRecipientId} required>
                <SelectTrigger id="user-message-recipient" className="w-full">
                  <SelectValue
                    placeholder={isLoadingUsers ? "Загрузка пользователей..." : "Выберите получателя"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {users.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {formatUserName(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-message-text">Сообщение</Label>
              <Textarea
                id="user-message-text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Введите текст сообщения..."
                rows={4}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-message-file">Файл</Label>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" asChild>
                  <label htmlFor="user-message-file" className="cursor-pointer">
                    <Paperclip className="mr-2 h-4 w-4" />
                    {messageFile ? "Заменить файл" : "Загрузить файл"}
                  </label>
                </Button>
                <Input
                  id="user-message-file"
                  type="file"
                  accept={ALLOWED_MESSAGE_FILE_ACCEPT}
                  className="hidden"
                  onChange={handleMessageFileChange}
                />
                <span className="text-xs text-muted-foreground">PNG, JPG, JPEG, PDF до 10 МБ</span>
              </div>
              {messageFile && (
                <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
                  <span className="truncate">{messageFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMessageFile(null)}
                    disabled={createMessageMutation.isPending}
                    aria-label="Удалить файл"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {sendError && <p className="text-sm text-red-600">{sendError}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSendDialogChange(false)}
                disabled={createMessageMutation.isPending}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={
                  createMessageMutation.isPending ||
                  !userId ||
                  !recipientId ||
                  !messageText.trim()
                }
              >
                {createMessageMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Отправка...
                  </>
                ) : (
                  "Отправить"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export { UserMessageCard };
export default UserMessageCard;
