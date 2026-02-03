using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class RepairTypeConfiguration : IEntityTypeConfiguration<RepairType>
{
    public void Configure(EntityTypeBuilder<RepairType> entity)
    {
        entity.ToTable("RepairTypes");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.Name).HasColumnName("Name").IsRequired().HasColumnType("text");
        entity.Property(e => e.Code).HasColumnName("Code").IsRequired().HasColumnType("text");
        entity.Property(e => e.Description).HasColumnName("Description").HasColumnType("text");
        entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt").IsRequired().HasColumnType("timestamp with time zone");
        entity.Property(e=>e.ShortName).HasColumnName("ShortName").HasColumnType("text");
        entity.Property(e=>e.PortalName).HasColumnName("PortalName").HasColumnType("text");
        entity.Property(e=>e.OldCode).HasColumnName("OldCode");
    }
}