using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public class FitmentEquipmentConfiguration : IEntityTypeConfiguration<FitmentEquipment>
{
    public void Configure(EntityTypeBuilder<FitmentEquipment> entity)
    {
        entity.ToTable("FitmentEquipments");
        entity.HasKey(e => e.Id);

        entity.Property(e => e.Operation).IsRequired();
        entity.Property(e => e.Date).HasColumnName("date").IsRequired().HasColumnType("date");
        entity.Property(e => e.DocumentId).IsRequired();
        entity.Property(e => e.AcceptUserId).IsRequired(false);
        entity.Property(e => e.InstallUserId).IsRequired(false);
        entity.Property(e => e.ApprovUserId).IsRequired(false);

        entity.HasOne(fe => fe.RailwayCistern)
            .WithMany()
            .HasForeignKey(fe => fe.RailwayCisternsId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(fe => fe.Fitment)
            .WithMany()
            .HasForeignKey(fe => fe.FitmentId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(fe => fe.JobUser)
            .WithMany()
            .HasForeignKey(fe => fe.JobUserId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(fe => fe.TestUser)
            .WithMany()
            .HasForeignKey(fe => fe.TestUserId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(fe => fe.AcceptUser)
            .WithMany()
            .HasForeignKey(fe => fe.AcceptUserId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(fe => fe.InstallUser)
            .WithMany()
            .HasForeignKey(fe => fe.InstallUserId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(fe => fe.ApprovUser)
            .WithMany()
            .HasForeignKey(fe => fe.ApprovUserId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(fe => fe.Depot)
            .WithMany()
            .HasForeignKey(fe => fe.DepoId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasOne(fe => fe.Document)
            .WithMany(d => d.FitmentEquipments)
            .HasForeignKey(fe => fe.DocumentId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}
