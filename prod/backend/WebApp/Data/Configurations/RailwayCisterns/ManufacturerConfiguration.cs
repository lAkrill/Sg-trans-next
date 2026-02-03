using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class ManufacturerConfiguration : IEntityTypeConfiguration<Manufacturer>
{
    public void Configure(EntityTypeBuilder<Manufacturer> entity)
    {
        entity.ToTable("Manufacturers");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.Name).HasColumnName("Name").IsRequired().HasColumnType("text");
        entity.Property(e => e.Country).HasColumnName("Country").IsRequired().HasColumnType("text");
        entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt").IsRequired()
            .HasColumnType("timestamp with time zone");
        entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt").IsRequired()
            .HasColumnType("timestamp with time zone");
        entity.Property(e => e.CreatorId).HasColumnName("CreatorId").IsRequired().HasColumnType("text");
        entity.Property(e => e.ShortName).HasColumnName("ShortName").HasColumnType("text");
        entity.Property(e => e.Code).HasColumnName("Code").IsRequired().HasDefaultValue(0);
    }
}