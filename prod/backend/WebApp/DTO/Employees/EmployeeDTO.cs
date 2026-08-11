using WebApp.Data.Entities.Users;

namespace WebApp.DTO.Employees;

public class EmployeeDTO
{
    public Guid Id { get; set; }
    public string LastName { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string Patronymic { get; set; } = null!;
    public string Initials { get; set; } = null!;
    public string Position { get; set; } = null!;
    public DateTime? UpdatedAt { get; set; }
    public Guid CreatorId { get; set; }
}

public class CreateEmployeeDTO
{
    public string LastName { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string Patronymic { get; set; } = null!;
    public string Initials { get; set; } = null!;
    public string Position { get; set; } = null!;
}

public class UpdateEmployeeDTO
{
    public string LastName { get; set; } = null!;
    public string FirstName { get; set; } = null!;
    public string Patronymic { get; set; } = null!;
    public string Initials { get; set; } = null!;
    public string Position { get; set; } = null!;
}

public static class EmployeeDTOMapper
{
    public static EmployeeDTO ToEmployeeDTO(this Employee employee)
    {
        return new EmployeeDTO
        {
            Id = employee.Id,
            LastName = employee.LastName,
            FirstName = employee.FirstName,
            Patronymic = employee.Patronymic,
            Initials = employee.Initials,
            Position = employee.Position,
            UpdatedAt = employee.UpdatedAt,
            CreatorId = employee.CreatorId
        };
    }

    public static void UpdateEmployee(this Employee employee, UpdateEmployeeDTO dto)
    {
        employee.LastName = dto.LastName;
        employee.FirstName = dto.FirstName;
        employee.Patronymic = dto.Patronymic;
        employee.Initials = dto.Initials;
        employee.Position = dto.Position;
        employee.UpdatedAt = DateTime.Now;
    }
}
