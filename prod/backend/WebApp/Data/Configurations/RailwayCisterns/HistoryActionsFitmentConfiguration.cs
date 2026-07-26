using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class HistoryActionsFitmentConfiguration : IEntityTypeConfiguration<HistoryActionsFitment>
{
    public void Configure(EntityTypeBuilder<HistoryActionsFitment> entity)
    {
        entity.ToTable("HistoryActionsFitment");

        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.FitmentId).HasColumnName("FitmentId").IsRequired();
        entity.Property(e => e.Date)
            .HasColumnName("date")
            .IsRequired()
            .HasColumnType("timestamp without time zone");
        entity.Property(e => e.CreatorId).HasColumnName("CreatorId").IsRequired();
        entity.Property(e => e.Note)
            .HasColumnName("Note")
            .IsRequired(false)
            .HasColumnType("text");

        entity.HasOne(d => d.Fitment)
            .WithMany(p => p.HistoryActionsFitments)
            .HasForeignKey(d => d.FitmentId)
            .HasConstraintName("HistoryActionsFitment_FitmentId_fkey")
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(d => d.Creator)
            .WithMany()
            .HasForeignKey(d => d.CreatorId)
            .HasConstraintName("HistoryActionsFitment_CreatorId_fkey")
            .OnDelete(DeleteBehavior.NoAction);
    }
}
