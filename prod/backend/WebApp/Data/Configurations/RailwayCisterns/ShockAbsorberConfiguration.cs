using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class ShockAbsorberConfiguration : IEntityTypeConfiguration<ShockAbsorber>
{
    public void Configure(EntityTypeBuilder<ShockAbsorber> entity)
    {
        entity.ToTable("ShockAbsorbers");
        entity.HasKey(e => e.PartId);
            
        entity.Property(e => e.Model).HasColumnType("text");
        entity.Property(e => e.ManufacturerCode).HasColumnType("text");
            
        entity.HasOne(d => d.Part)
            .WithOne(p => p.ShockAbsorber)
            .HasForeignKey<ShockAbsorber>(d => d.PartId)
            .OnDelete(DeleteBehavior.Cascade);
        
        entity.HasKey(b => b.PartId);
    }
}