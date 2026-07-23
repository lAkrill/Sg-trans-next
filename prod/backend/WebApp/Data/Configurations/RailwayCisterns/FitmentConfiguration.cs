using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public class FitmentConfiguration : IEntityTypeConfiguration<Fitment>
{
    public void Configure(EntityTypeBuilder<Fitment> builder)
    {
        builder.HasKey(f => f.Id);

        builder.Property(f => f.SerialNumber)
            .IsRequired();

        builder.Property(f => f.PassportNumber)
            .IsRequired()
            .HasDefaultValue("0");

        builder.Property(f => f.BuildDate)
            .IsRequired();

        builder.Property(f => f.LastRepairDate)
            .IsRequired(false);

        builder.Property(f => f.PeriodRep)
            .IsRequired()
            .HasDefaultValue(1);

        builder.Property(f => f.ServiceLifeYears)
            .IsRequired()
            .HasDefaultValue(30);

        builder.Property(f => f.Code)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(f => f.LocationDepoId)
            .IsRequired(false);

        builder.Property(f => f.LocationCisternId)
            .IsRequired(false);

        builder.Property(f => f.UpdatedAt)
            .HasColumnType("timestamp without time zone")
            .IsRequired();

        builder.Property(f => f.DepotId)
            .IsRequired()
            .HasColumnName("ManufacturerId");

        // Foreign Keys
        builder.HasOne(f => f.FitmentType)
            .WithMany(ft => ft.Fitments)
            .HasForeignKey(f => f.FitmentTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.Model)
            .WithMany(m => m.Fitments)
            .HasForeignKey(f => f.ModelId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.Depot)
            .WithMany()
            .HasForeignKey(f => f.DepotId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.LocationDepo)
            .WithMany()
            .HasForeignKey(f => f.LocationDepoId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.LocationCistern)
            .WithMany()
            .HasForeignKey(f => f.LocationCisternId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(f => f.Creator)
            .WithMany()
            .HasForeignKey(f => f.CreatorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
