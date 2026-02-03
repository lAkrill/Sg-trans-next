using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class DislocationConfiguration : IEntityTypeConfiguration<Dislocation>
{
    public void Configure(EntityTypeBuilder<Dislocation> entity)
    {
        entity.ToTable("Dislocations");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
            entity.Property(e => e.DateRas).HasColumnName("DateRas").IsRequired().HasColumnType("timestamp without time zone");
            entity.Property(e => e.DateOpr).HasColumnName("DateOpr").IsRequired().HasColumnType("timestamp without time zone");
            entity.Property(e => e.NumCistern).HasColumnName("NumCistern").IsRequired().HasColumnType("text");
            entity.Property(e => e.CisternId).HasColumnName("CisternId");
            entity.Property(e => e.StationOprId).HasColumnName("StationOprId");
            entity.Property(e => e.CodeStationOpr).HasColumnName("CodeStationOpr").IsRequired().HasColumnType("text");
            entity.Property(e => e.NameStationOpr).HasColumnName("NameStationOpr").IsRequired().HasColumnType("text");
            entity.Property(e => e.RoadDislocation).HasColumnName("RoadDislocation").HasColumnType("text");
            entity.Property(e => e.OperationShort).HasColumnName("OperationShort").IsRequired().HasColumnType("text");
            entity.Property(e => e.OperationNote).HasColumnName("OperationNote").HasColumnType("text");
            entity.Property(e => e.StationOutId).HasColumnName("StationOutId");
            entity.Property(e => e.CodeStationOut).HasColumnName("CodeStationOut").IsRequired().HasColumnType("text");
            entity.Property(e => e.NameStationOut).HasColumnName("NameStationOut").IsRequired().HasColumnType("text");
            entity.Property(e => e.StationEndId).HasColumnName("StationEndId");
            entity.Property(e => e.CodeStationEnd).HasColumnName("CodeStationEnd").IsRequired().HasColumnType("text");
            entity.Property(e => e.NameStationEnd).HasColumnName("NameStationEnd").IsRequired().HasColumnType("text");
            entity.Property(e => e.CodeShip).HasColumnName("CodeShip").HasColumnType("text");
            entity.Property(e => e.NameShip).HasColumnName("NameShip").HasColumnType("text");
            entity.Property(e => e.WeightShip).HasColumnName("WeightShip").HasColumnType("numeric");
            entity.Property(e => e.NumTrain).HasColumnName("NumTrain").HasColumnType("text");
            entity.Property(e => e.IndxTrain).HasColumnName("IndxTrain").HasColumnType("text");
            entity.Property(e => e.CodeConsignor).HasColumnName("CodeConsignor").HasColumnType("text");
            entity.Property(e => e.CodeConsignee).HasColumnName("CodeConsignee").HasColumnType("text");
            entity.Property(e => e.CodeWagonOwner).HasColumnName("CodeWagonOwner").IsRequired().HasColumnType("text");
            entity.Property(e => e.NumShipmen).HasColumnName("NumShipmen").HasColumnType("text");

            // Relationships
            entity.HasOne(d => d.RailwayCistern)
                .WithMany()
                .HasForeignKey(d => d.CisternId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(d => d.StationOpr)
                .WithMany()
                .HasForeignKey(d => d.StationOprId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(d => d.StationOut)
                .WithMany()
                .HasForeignKey(d => d.StationOutId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(d => d.StationEnd)
                .WithMany()
                .HasForeignKey(d => d.StationEndId)
                .OnDelete(DeleteBehavior.NoAction);

            // Unique index
            entity.HasIndex(d => new { d.DateRas, d.DateOpr, d.NumCistern })
                .IsUnique()
                .HasName("idx_unique_three_fields");
    }
}