using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public class FitmentTypeConfiguration : IEntityTypeConfiguration<FitmentType>
{
    public void Configure(EntityTypeBuilder<FitmentType> builder)
    {
        builder.HasKey(ft => ft.Id);

        builder.Property(ft => ft.Name)
            .IsRequired();

        builder.Property(ft => ft.Code)
            .IsRequired()
            .HasDefaultValue(0);

        builder.Property(ft => ft.UpdatedAt)
            .IsRequired();

        // Foreign Keys
        builder.HasOne(ft => ft.Creator)
            .WithMany()
            .HasForeignKey(ft => ft.CreatorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
