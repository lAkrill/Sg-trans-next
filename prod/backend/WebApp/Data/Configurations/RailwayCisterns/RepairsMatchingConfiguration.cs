using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class RepairsMatchingConfiguration : IEntityTypeConfiguration<RepairsMatching>
{
    public void Configure(EntityTypeBuilder<RepairsMatching> entity)
    {
        entity.ToTable("RepairsMatching");
        
        entity.HasKey(e => e.Id);
        
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.CisternId).HasColumnName("CisternId").IsRequired();
        entity.Property(e => e.RepairInId).HasColumnName("RepairInId").IsRequired();
        entity.Property(e => e.RepairOutId).HasColumnName("RepairOutId").IsRequired();
        entity.Property(e => e.DateTime).HasColumnName("DateTime").IsRequired()
            .HasColumnType("timestamp without time zone");
        
        entity.HasOne(e => e.Cistern)
            .WithMany()
            .HasForeignKey(e => e.CisternId)
            .OnDelete(DeleteBehavior.NoAction);
        
        entity.HasOne(e => e.RepairIn)
            .WithMany()
            .HasForeignKey(e => e.RepairInId)
            .OnDelete(DeleteBehavior.NoAction);
        
        entity.HasOne(e => e.RepairOut)
            .WithMany()
            .HasForeignKey(e => e.RepairOutId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
