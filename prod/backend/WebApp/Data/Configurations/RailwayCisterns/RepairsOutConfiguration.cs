using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class RepairsOutConfiguration : IEntityTypeConfiguration<RepairsOut>
{
    public void Configure(EntityTypeBuilder<RepairsOut> entity)
    {
        entity.ToTable("RepairsOut");
        
        entity.HasKey(e => e.Id);
        
        entity.Property(e => e.Id).HasColumnName("Id");
        entity.Property(e=>e.CisternNumber).HasColumnName("CisternNumber").IsRequired()
            .HasColumnType("text");
        entity.Property(e => e.CisternId).HasColumnName("CisternId").IsRequired();
        entity.Property(e=>e.TypeRepairId).HasColumnName("TypeRepairId").IsRequired();
        entity.Property(e=> e.VU36).HasColumnName("VU36").IsRequired()
            .HasColumnType("text");
        entity.Property(e=>e.DepotName).HasColumnName("DepotName").IsRequired()
            .HasColumnType("text");
        entity.Property(e=>e.DepotCode).HasColumnName("DepotCode").IsRequired()
            .HasColumnType("text");
        entity.Property(e=>e.DepotId).HasColumnName("DepotId").IsRequired();
        entity.Property(e=>e.DateIn).HasColumnName("DateIn").IsRequired()
            .HasColumnType("date");
        entity.Property(e=>e.DateOut).HasColumnName("DateOut").IsRequired()
            .HasColumnType("date");
       entity.Property(e=>e.ModernCode).HasColumnName("ModernCode").IsRequired()
           .HasColumnType("text[]");
        entity.Property(e=>e.RoadCode).HasColumnName("RoadCode").IsRequired()
            .HasColumnType("text");
        entity.Property(e=>e.RoadName).HasColumnName("RoadName").IsRequired()
            .HasColumnType("text");
        entity.Property(e=>e.ModernName).HasColumnName("ModernName").IsRequired()
            .HasColumnType("text[]");
        
        entity.HasIndex(e=> new{e.CisternNumber,e.VU36, e.DateOut})
            .IsUnique();
        
        entity.HasOne(e=>e.Cistern)
            .WithMany()
            .HasForeignKey(e=>e.CisternId)
            .OnDelete(DeleteBehavior.NoAction);
        
        entity.HasOne(e=>e.Depot)
            .WithMany()
            .HasForeignKey(e=>e.DepotId)
            .OnDelete(DeleteBehavior.NoAction);
        
        entity.HasOne(e=>e.RepairType)
            .WithMany()
            .HasForeignKey(e=>e.TypeRepairId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}