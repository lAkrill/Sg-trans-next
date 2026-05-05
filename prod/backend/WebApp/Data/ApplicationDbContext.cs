using Microsoft.EntityFrameworkCore;
using WebApp.Data.Entities.RailwayCisterns;
using WebApp.Data.Entities.Users;

namespace WebApp.Data;

public class ApplicationDbContext(
    DbContextOptions<ApplicationDbContext> options,
    IServiceProvider serviceProvider) : DbContext(options)
{
    //Users
    public DbSet<User> Users { get; set; }
    public DbSet<RoleEntity> Roles { get; set; }
    public DbSet<RolePermission> RolePermissions { get; set; }

    //RailwayCisternsModels
    public DbSet<Affiliation> Affiliations { get; set; }
    public DbSet<Manufacturer> Manufacturers { get; set; }
    public DbSet<MilageCistern> MilageCisterns { get; set; }
    public DbSet<Owner> Owners { get; set; }
    public DbSet<RailwayCistern> RailwayCisterns { get; set; }
    public DbSet<SavedFilter> SavedFilters { get; set; }
    public DbSet<WagonType> WagonTypes { get; set; }
    public DbSet<WagonModel> WagonModels { get; set; }
    public DbSet<Registrar> Registrars { get; set; }
    public DbSet<Vessel> Vessels { get; set; }
    public DbSet<Depot> Depots { get; set; }
    public DbSet<Part> Parts { get; set; }
    public DbSet<WheelPair> WheelPairs { get; set; }
    public DbSet<SideFrame> SideFrames { get; set; }
    public DbSet<Bolster> Bolsters { get; set; }
    public DbSet<Coupler> Couplers { get; set; }
    public DbSet<ShockAbsorber> ShockAbsorbers { get; set; }
    public DbSet<Location> Locations { get; set; }
    public DbSet<PartInstallation> PartInstallations { get; set; }
    public DbSet<RepairType> RepairTypes { get; set; }
    public DbSet<PartStatus> PartStatuses { get; set; }
    public DbSet<PartType> PartTypes { get; set; }
    public DbSet<FilterType> FilterTypes { get; set; }
    public DbSet<StampNumber> StampNumbers { get; set; }
    public DbSet<EquipmentType> EquipmentTypes { get; set; }
    public DbSet<PartEquipment> PartEquipments { get; set; }
    public DbSet<Station> Stations { get; set; }
    public DbSet<Document> Documents { get; set; }
    public DbSet<Dislocation> Dislocations { get; set; }

    public DbSet<PersonalCisRepairPeriod> PersonalCisRepairPeriods { get; set; }
    
    public DbSet<AdminOwner> AdminOwners { get; set; }
    public DbSet<Defect> Defects { get; set; }
    public DbSet<Road> Roads { get; set; }
    public DbSet<Update> Updates { get; set; }
    
    
    public DbSet<RepairsIn> RepairsIns { get; set; }
    public DbSet<RepairsOut> RepairsOuts { get; set; }
    public DbSet<RepairsMatching> RepairsMatchings { get; set; }


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        var builder = modelBuilder.Entity<RolePermission>();

        builder.HasKey(r => new { r.RoleId, r.PermissionId });
    }
}

