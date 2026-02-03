using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class WheelPairConfiguration : IEntityTypeConfiguration<WheelPair>
{
    public void Configure(EntityTypeBuilder<WheelPair> entity)
    {
        entity.ToTable("WheelPairs");
        entity.HasKey(e => e.PartId);
            
        entity.Property(e => e.ThicknessLeft).HasColumnType("numeric");
        entity.Property(e => e.ThicknessRight).HasColumnType("numeric");
        entity.Property(e => e.WheelType).HasColumnType("text");
            
        entity.HasOne(d => d.Part)
            .WithOne(p => p.WheelPair)
            .HasForeignKey<WheelPair>(d => d.PartId)
            .OnDelete(DeleteBehavior.Cascade);
        
        entity.HasKey(w => w.PartId);
    }
}