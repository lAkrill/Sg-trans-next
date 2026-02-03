using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class WagonTypeConfiguration : IEntityTypeConfiguration<WagonType>
{
    public void Configure(EntityTypeBuilder<WagonType> entity)
    {
        entity.ToTable("WagonTypes");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.Name).HasColumnName("Name").IsRequired().HasColumnType("text");
        entity.Property(e => e.Type).HasColumnName("Type").IsRequired().HasColumnType("text").HasDefaultValue("0"); // "0" as text default based on SQL
    }
}