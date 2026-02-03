using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.DTO.RailwayCisterns;

public class RoadDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string ShortName { get; set; } = null!;
}

public class CreateRoadDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string ShortName { get; set; } = null!;
}

public class UpdateRoadDTO
{
    public int Id { get; set; }
    public string Name { get; set; } = null!;
    public string ShortName { get; set; } = null!;
}

public static class RoadDtoMapper
{
    public static RoadDTO ToRoadDTO(this Road road)
    {
        return new RoadDTO
        {
            Id = road.Id,
            Name = road.Name,
            ShortName = road.ShortName
        };
    }

    public static Road ToRoad(this CreateRoadDTO createRoadDTO)
    {
        return new Road
        {
            Id = createRoadDTO.Id,
            Name = createRoadDTO.Name,
            ShortName = createRoadDTO.ShortName
        };
    }

    public static void UpdateRoad(this Road road, UpdateRoadDTO roadDTO)
    {
        road.Id = roadDTO.Id;
        road.Name = roadDTO.Name;
        road.ShortName = roadDTO.ShortName;
    }
}