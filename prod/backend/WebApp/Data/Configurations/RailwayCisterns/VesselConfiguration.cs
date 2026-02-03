using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class VesselConfiguration : IEntityTypeConfiguration<Vessel>
{
    public void Configure(EntityTypeBuilder<Vessel> entity)
    {
        entity.ToTable("Vessels");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.SerialNumber).HasColumnName("SerialNumber").IsRequired().HasColumnType("text");
        entity.Property(e => e.BuildDate).HasColumnName("BuildDate").IsRequired().HasColumnType("date");
        entity.Property(e => e.Manufacturer).HasColumnName("Manufacturer").IsRequired().HasColumnType("text");
        entity.Property(e => e.WagonModelId).HasColumnName("WagonModelId").IsRequired().HasColumnType("text");
        entity.Property(e => e.Pressure).HasColumnName("Pressure").IsRequired().HasColumnType("numeric");
        entity.Property(e => e.Capacity).HasColumnName("Capacity ").IsRequired().HasColumnType("numeric");

        entity.HasOne(e => e.RailwayCistern)
            .WithMany(r => r.Vessels)
            .HasForeignKey(e => e.RailwayCisternId)
            .HasConstraintName("Vessels_RailwayCisternId_fkey")
            .OnDelete(DeleteBehavior.NoAction);
    }
}