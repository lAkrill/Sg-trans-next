using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class PartConfiguration : IEntityTypeConfiguration<Part>
{
    public void Configure(EntityTypeBuilder<Part> entity)
    {
        entity.ToTable("Parts");
        entity.HasKey(e => e.Id);
            
        entity.Property(e => e.SerialNumber).HasColumnType("text");
        entity.Property(e => e.Notes).HasColumnType("text");
        entity.Property(e => e.CreatedAt).HasColumnType("timestamp with time zone");
        entity.Property(e => e.UpdatedAt).HasColumnType("timestamp with time zone");
        entity.Property(e => e.File).HasColumnType("text");
        entity.Property(e => e.Code);
        entity.Property(e => e.DocumentId);
        entity.Property(e => e.ServiceLifeYears).HasDefaultValue(0);
        entity.Property(e => e.ExtendedUntil).HasColumnType("date");
        entity.Property(e => e.Model).HasColumnType("text");

        entity.HasOne(d => d.Depot)
            .WithMany(p => p.Parts)
            .HasForeignKey(d => d.DepotId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(d => d.Status)
            .WithMany()
            .HasForeignKey(d => d.StatusId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(d => d.PartType)
            .WithMany()
            .HasForeignKey(d => d.PartTypeId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(d => d.StampNumber)
            .WithMany()
            .HasForeignKey(d => d.StampNumberId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(r => r.RailwayCistern)
            .WithMany()
            .HasForeignKey(r=>r.CurrentLocation)
            .OnDelete(DeleteBehavior.NoAction);
        
        entity.HasMany(p => p.PartInstallations)
            .WithOne(i => i.Part)
            .HasForeignKey(i => i.PartId);
    }
}