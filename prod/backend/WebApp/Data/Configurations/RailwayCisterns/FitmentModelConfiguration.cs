using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public class FitmentModelConfiguration : IEntityTypeConfiguration<FitmentModel>
{
    public void Configure(EntityTypeBuilder<FitmentModel> builder)
    {
        builder.HasKey(fm => fm.Id);

        builder.Property(fm => fm.Name)
            .IsRequired();

        builder.Property(fm => fm.UpdatedAt)
            .IsRequired()
            .HasColumnType("timestamp without time zone");

        // Foreign Keys
        builder.HasOne(fm => fm.Creator)
            .WithMany()
            .HasForeignKey(fm => fm.CreatorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
