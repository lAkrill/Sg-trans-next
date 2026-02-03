using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class BolsterConfiguration : IEntityTypeConfiguration<Bolster>
{
    public void Configure(EntityTypeBuilder<Bolster> entity)
    {
        entity.ToTable("Bolsters");
        entity.HasKey(e => e.PartId);
            
        entity.HasOne(d => d.Part)
            .WithOne(p => p.Bolster)
            .HasForeignKey<Bolster>(d => d.PartId)
            .OnDelete(DeleteBehavior.Cascade);
        
        entity.HasKey(b => b.PartId);
    }
}