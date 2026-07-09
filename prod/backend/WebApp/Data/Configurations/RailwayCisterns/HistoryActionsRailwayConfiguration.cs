using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class HistoryActionsRailwayConfiguration : IEntityTypeConfiguration<HistoryActionsRailway>
{
    public void Configure(EntityTypeBuilder<HistoryActionsRailway> entity)
    {
        entity.ToTable("HistoryActionsRailway");

        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.CisternId).HasColumnName("CisternId").IsRequired();
        entity.Property(e => e.Date)
            .HasColumnName("date")
            .IsRequired()
            .HasColumnType("timestamp without time zone");
        entity.Property(e => e.CreatorId).HasColumnName("CreatorId").IsRequired();
        entity.Property(e => e.Note)
            .HasColumnName("Note")
            .IsRequired()
            .HasColumnType("text");

        entity.HasOne(d => d.Cistern)
            .WithMany(p => p.HistoryActionsRailways)
            .HasForeignKey(d => d.CisternId)
            .HasConstraintName("HistoryActionsRailway_CisternId_fkey")
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(d => d.Creator)
            .WithMany()
            .HasForeignKey(d => d.CreatorId)
            .HasConstraintName("HistoryActionsRailway_CreatorId_fkey")
            .OnDelete(DeleteBehavior.NoAction);
    }
}
