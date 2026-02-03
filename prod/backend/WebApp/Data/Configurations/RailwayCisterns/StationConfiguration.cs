using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class StationConfiguration : IEntityTypeConfiguration<Station>
{
    public void Configure(EntityTypeBuilder<Station> entity)
    {
        entity.ToTable("Stations");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Name).IsRequired().HasColumnType("text");
        entity.Property(e => e.Code).IsRequired();
        entity.Property(e => e.OsmId).HasColumnType("text");
        entity.Property(e => e.UicRef);
        entity.Property(e => e.Lat).IsRequired();
        entity.Property(e => e.Lon).IsRequired();
        entity.Property(e => e.Iso3166).HasColumnType("text");
        entity.Property(e => e.Type).HasColumnType("text");
        entity.Property(e => e.Operator).HasColumnType("text");
        entity.Property(e => e.Country).HasColumnType("text");
        entity.Property(e => e.Region).HasColumnType("text");
        entity.Property(e => e.Division).HasColumnType("text");
        entity.Property(e => e.Railway).HasColumnType("text");
    }
}