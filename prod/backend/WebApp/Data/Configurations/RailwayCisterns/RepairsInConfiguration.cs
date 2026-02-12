using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class RepairsInConfiguration : IEntityTypeConfiguration<RepairsIn>
{
    public void Configure(EntityTypeBuilder<RepairsIn> entity)
    {
        entity.ToTable("RepairsIn");
        
        entity.HasKey(x => x.Id);
        
        entity.Property(x => x.Id).HasColumnName("Id").IsRequired();
        entity.Property(x => x.CisternNumber).HasColumnName("CisternNumber").IsRequired()
            .HasColumnType("text");
        entity.Property(x => x.CisternId).HasColumnName("CisternId").IsRequired();
        entity.Property(x => x.TypeRepairId).HasColumnName("TypeRepairId").IsRequired();
        entity.Property(x => x.DepotName).HasColumnName("DepotName").IsRequired()
            .HasColumnType("text");
        entity.Property(x => x.DepotCode).HasColumnName("DepotCode").IsRequired()
            .HasColumnType("text");
        entity.Property(x => x.DepotId).HasColumnName("DepotId").IsRequired();
        entity.Property(x => x.VU23).HasColumnName("VU23").IsRequired()
            .HasColumnType("text");
        entity.Property(x=> x.RoadCode).HasColumnName("RoadCode").IsRequired()
            .HasColumnType("text");
        entity.Property(x=>x.RoadName).HasColumnName("RoadName").IsRequired()
            .HasColumnType("text");
        entity.Property(x => x.StationName).HasColumnName("StationName").IsRequired()
            .HasColumnType("text");
        entity.Property(x => x.StationCode).HasColumnName("StationCode").IsRequired()
            .HasColumnType("text");
        entity.Property(x => x.StationId).HasColumnName("StationId").IsRequired();
        entity.Property(x=>x.DateIn).HasColumnName("DateIn").IsRequired()
            .HasColumnType("timestamp without time zone");
        entity.Property(x=>x.DefectCode).HasColumnName("DefectCode").IsRequired()
            .HasColumnType("text[]");
        entity.Property(x=>x.DefectName).HasColumnName("DefectName").IsRequired()
            .HasColumnType("text[]");
        entity.Property(x => x.AdminRoadCode).HasColumnName("AdminRoadCode").IsRequired()
            .HasColumnType("text");
        
        entity.HasIndex(e => new { e.CisternNumber, e.VU23, e.DateIn }, "idx_unique_three_repairsin")
          .IsUnique();

        entity.HasOne(e => e.Cistern)
            .WithMany()
            .HasForeignKey(e => e.CisternId)
            .OnDelete(DeleteBehavior.NoAction);
        
        entity.HasOne(e=>e.Depot)
            .WithMany()
            .HasForeignKey(e => e.DepotId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(e => e.Station)
            .WithMany()
            .HasForeignKey(e => e.StationId)
            .OnDelete(DeleteBehavior.NoAction);
        
        entity.HasOne(e=>e.RepairType)
            .WithMany()
            .HasForeignKey(e => e.TypeRepairId)
            .OnDelete(DeleteBehavior.NoAction);

    }
}