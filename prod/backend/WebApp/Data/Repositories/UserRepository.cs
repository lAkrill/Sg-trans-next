using Microsoft.EntityFrameworkCore;
using WebApp.Data.Entities.Users;
using WebApp.DTO.Common;
using WebApp.Exceptions;

namespace WebApp.Data.Repositories;

public class UserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(User user)
    {
        if (!user.Roles.Any())
        {
            throw new ApiException("Пользователь должен иметь хотя бы одну роль", 400);
        }

        // Получаем ID ролей пользователя
        var roleIds = user.Roles.Select(r => r.Id).ToList();
        
        // Очищаем коллекцию ролей, так как мы получим их заново из базы
        user.Roles.Clear();
        
        // Получаем существующие роли из базы данных
        var existingRoles = await _context.Roles
            .Where(r => roleIds.Contains(r.Id))
            .ToListAsync();

        // Проверяем, что все запрошенные роли существуют
        if (existingRoles.Count != roleIds.Count)
        {
            throw new ApiException("Одна или несколько ролей не существуют", 400);
        }

        // Добавляем существующие роли пользователю
        foreach (var role in existingRoles)
        {
            user.Roles.Add(role);
        }

        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
    }

    public async Task<User> GetUserByEmailAsync(string email)
    {
        var userEntity = await _context.Users
            .AsNoTracking()
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Email == email) 
            ?? throw new ApiException($"Пользователь с email {email} не найден", 404);

        return userEntity;
    }

    public async Task<List<RolePermissionDTO>> GetUserPermissionsAsync(Guid userId, IEnumerable<string> tags)
    {
        var roleIds = _context.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .SelectMany(u => u.Roles)
            .Select(role => role.Id);

        var links =
            from link in _context.RolePermissions.AsNoTracking()
            join permission in _context.PermissionEntitys.AsNoTracking()
                on link.PermissionId equals permission.Id
            where roleIds.Contains(link.RoleId)
            select new { link, permission };

        if (tags is not null)
        {
            var tagList = tags.ToArray();
            links = links.Where(x => tagList.Contains(x.permission.Name));
        }

        return await links
            .Select(x => new RolePermissionDTO
            {
                RoleId = x.link.RoleId,
                PermissionId = x.link.PermissionId,
                PermissionName = x.permission.Name,
                Access = x.link.Access
            })
            .ToListAsync();
    }

    public async Task<User> GetUserByIdAsync(Guid userId)
    {
        var userEntity = await _context.Users
            .AsNoTracking()
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == userId) 
            ?? throw new ApiException($"Пользователь с ID {userId} не найден", 404);

        return userEntity;
    }

    public async Task<ICollection<User>> GetAllUsersAsync()
    {
        return await _context.Users
            .AsNoTracking()
            .Include(u => u.Roles)
            .ToListAsync();
    }

    public async Task<RoleEntity> GetRoleByIdAsync(int roleId)
    {
        return await _context.Roles
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == roleId) 
            ?? throw new ApiException($"Роль с ID {roleId} не найдена", 404);
    }

    public async Task<User> UpdateUserAsync(User user)
    {
        var userEntity = await _context.Users
            .Include(u => u.Roles)
            .FirstOrDefaultAsync(u => u.Id == user.Id)
            ?? throw new ApiException($"Пользователь с ID {user.Id} не найден", 404);

        userEntity.FirstName = user.FirstName;
        userEntity.LastName = user.LastName;
        userEntity.Patronymic = user.Patronymic;
        userEntity.PhoneNumber = user.PhoneNumber;
        userEntity.Email = user.Email;
        userEntity.PasswordHash = user.PasswordHash;
        userEntity.RefreshToken = user.RefreshToken;
        userEntity.RefreshTokenExpiry = user.RefreshTokenExpiry;
        userEntity.Roles.Clear();
        foreach (var role in user.Roles)
        {
            var existingRole = await _context.Roles.FindAsync(role.Id);
            if (existingRole != null)
            {
                userEntity.Roles.Add(existingRole);
            }
        }

        await _context.SaveChangesAsync();
        return userEntity;
    }

    public async Task DeleteUserAsync(User user)
    {
        var userEntity = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == user.Id)
            ?? throw new ApiException($"Пользователь с ID {user.Id} не найден", 404);
            
        _context.Users.Remove(userEntity);
        await _context.SaveChangesAsync();
    }

    public async Task<IEnumerable<RoleEntity>> GetAllRolesAsync()
    {
        return await _context.Roles
            .AsNoTracking()
            .OrderBy(r => r.Id)
            .ToListAsync();
    }

    public async Task<IEnumerable<RoleEntity>> GetRolesByIdsAsync(IEnumerable<int> roleIds)
    {
        return await _context.Roles
            .AsNoTracking()
            .Where(r => roleIds.Contains(r.Id))
            .ToListAsync();
    }
}