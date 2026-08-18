export interface MessageDTO {
  id: string;
  creationDate: string;
  readingDate?: string | null;
  text: string;
  fromUserId: string;
  toUserId: string;
  status: number;
  fileName?: string | null;
  filePath?: string | null;
  priority: number;
}

export interface CreateMessageDTO {
  text: string;
  fromUserId: string;
  toUserId: string;
  priority: number;
  fileName?: string | null;
  filePath?: string | null;
}

export interface UpdateMessageDTO {
  text: string;
  readingDate: string;
  status: number;
  priority: number;
}

export enum MessageStatus {
  Unread = 0,
  Read = 1,
  Archived = 3,
}

export enum MessagePriority {
  Normal = 0,
  High = 1,
  Urgent = 2,
}

export const getMessageStatusLabel = (status: number) => {
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

export const getMessagePriorityLabel = (priority: number) => {
  switch (priority) {
    case MessagePriority.Normal:
      return "Обычный";
    case MessagePriority.High:
      return "Высокий";
    case MessagePriority.Urgent:
      return "Срочный";
    default:
      return `Приоритет ${priority}`;
  }
};
