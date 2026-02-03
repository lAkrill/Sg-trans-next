using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class UpdateDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
}

public class CreateUpdateDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
}

public class UpdateUpdateDTO
{
    public int id { get; set; }
    public string Name { get; set; } = null!;
}

public static class UpdateDTOMapper
{
    public static UpdateDTO ToUpdateDTO(this Update update)
    {
        return new UpdateDTO()
        {
            Id = update.Id,
            Name = update.Name
        };
    }

    public static Update ToUpdate(this CreateUpdateDTO createUpdateDTO)
    {
        return new Update()
        {
            Id = createUpdateDTO.Id,
            Name = createUpdateDTO.Name
        };
    }

    public static void UpdateUpdate(this Update update, UpdateUpdateDTO updateDTO)
    {
        update.Id = updateDTO.id;
        update.Name = updateDTO.Name;
    }
}