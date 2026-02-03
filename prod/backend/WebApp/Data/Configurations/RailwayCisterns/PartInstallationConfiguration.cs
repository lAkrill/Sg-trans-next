using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class PartInstallationConfiguration : IEntityTypeConfiguration<PartInstallation>
{
    public void Configure(EntityTypeBuilder<PartInstallation> entity)
    {
        entity.HasOne(pi => pi.FromLocation)
            .WithMany(l => l.FromInstallations)
            .HasForeignKey(pi => pi.FromLocationId)
            .IsRequired(false);
        
        entity.HasOne(pi => pi.ToLocation)
            .WithMany(l => l.ToInstallations)
            .HasForeignKey(pi => pi.ToLocationId);
    }
}