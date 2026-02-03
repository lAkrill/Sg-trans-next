using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class SideFrameConfiguration : IEntityTypeConfiguration<SideFrame>
{
    public void Configure(EntityTypeBuilder<SideFrame> entity)
    {
        entity.ToTable("SideFrames");
        entity.HasKey(e => e.PartId);
            
        entity.HasOne(d => d.Part)
            .WithOne(p => p.SideFrame)
            .HasForeignKey<SideFrame>(d => d.PartId)
            .OnDelete(DeleteBehavior.Cascade);
        
        entity.HasKey(s => s.PartId);
    }
}