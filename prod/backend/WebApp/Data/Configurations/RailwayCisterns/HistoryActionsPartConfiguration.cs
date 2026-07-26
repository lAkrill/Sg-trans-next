using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class HistoryActionsPartConfiguration : IEntityTypeConfiguration<HistoryActionsPart>
{
    public void Configure(EntityTypeBuilder<HistoryActionsPart> entity)
    {
        entity.ToTable("HistoryActionsPart");

        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.PartId).HasColumnName("PartId").IsRequired();
        entity.Property(e => e.Date)
            .HasColumnName("date")
            .IsRequired()
            .HasColumnType("timestamp without time zone");
        entity.Property(e => e.CreatorId).HasColumnName("CreatorId").IsRequired();
        entity.Property(e => e.Note)
            .HasColumnName("Note")
            .IsRequired(false)
            .HasColumnType("text");

        entity.HasOne(d => d.Part)
            .WithMany(p => p.HistoryActionsParts)
            .HasForeignKey(d => d.PartId)
            .HasConstraintName("HistoryActionsPart_PartId_fkey")
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(d => d.Creator)
            .WithMany()
            .HasForeignKey(d => d.CreatorId)
            .HasConstraintName("HistoryActionsPart_CreatorId_fkey")
            .OnDelete(DeleteBehavior.NoAction);
    }
}
