using WebApp.Data.Entities.Messaging;

namespace WebApp.DTO.Messaging;

public static class MessageMapper
{
    public static MessageDTO ToMessageDTO(this Message m)
    {
        return new MessageDTO
        {
            Id = m.Id,
            CreationDate = m.CreationDate,
            ReadingDate = m.ReadingDate,
            Text = m.Text,
            FromUserId = m.FromUserId,
            ToUserId = m.ToUserId,
            Status = m.Status,
            FileName = m.FileName,
            FilePath = m.FilePath,
            Priority = m.Priority
        };
    }

    public static Message ToMessage(this CreateMessageDTO dto)
    {
        return new Message
        {
            Id = Guid.NewGuid(),
            CreationDate = DateTime.Now,
            ReadingDate = DateTime.Now,
            Text = dto.Text,
            FromUserId = dto.FromUserId,
            ToUserId = dto.ToUserId,
            Priority = dto.Priority,
            FileName = dto.FileName,
            FilePath = dto.FilePath,
            Status = 0
        };
    }

    public static void UpdateMessage(this Message message, UpdateMessageDTO dto)
    {
        if (dto.Text != null) message.Text = dto.Text;
        if (dto.ReadingDate.HasValue) message.ReadingDate = dto.ReadingDate.Value;
        message.Status = dto.Status;
        message.Priority = dto.Priority;
    }
}
