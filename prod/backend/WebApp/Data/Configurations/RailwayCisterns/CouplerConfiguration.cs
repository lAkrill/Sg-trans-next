using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class CouplerConfiguration : IEntityTypeConfiguration<Coupler>
{
    public void Configure(EntityTypeBuilder<Coupler> entity)
    {
        entity.ToTable("Couplers");
        entity.HasKey(e => e.PartId);
            
        entity.HasOne(d => d.Part)
            .WithOne(p => p.Coupler)
            .HasForeignKey<Coupler>(d => d.PartId)
            .OnDelete(DeleteBehavior.Cascade);
        
        entity.HasKey(b => b.PartId);
    }
}