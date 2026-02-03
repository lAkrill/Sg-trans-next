using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class OwnerConfiguration : IEntityTypeConfiguration<Owner>
{
    public void Configure(EntityTypeBuilder<Owner> entity)
    {
        entity.ToTable("Owners");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.Name).HasColumnName("Name").IsRequired().HasColumnType("text");
        entity.Property(e => e.UNP).HasColumnName("UNP").HasColumnType("text");
        entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt").HasColumnType("timestamp with time zone");
        entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt").HasColumnType("timestamp with time zone");
        entity.Property(e => e.CreatorId).HasColumnName("CreatorId").HasColumnType("text");
        entity.Property(e => e.ShortName).HasColumnName("ShortName").IsRequired().HasColumnType("text");
        entity.Property(e => e.Address).HasColumnName("Address").HasColumnType("text");
        entity.Property(e => e.TreatRepairs).HasColumnName("TreatRepairs").IsRequired();
    }
}