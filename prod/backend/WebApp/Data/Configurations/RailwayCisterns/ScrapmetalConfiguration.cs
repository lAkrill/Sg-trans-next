using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public class ScrapmetalConfiguration : IEntityTypeConfiguration<Scrapmetal>
{
    public void Configure(EntityTypeBuilder<Scrapmetal> builder)
    {
        builder.ToTable("Scrapmetal");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Weight)
            .HasColumnType("numeric")
            .HasDefaultValue(0);

        builder.Property(x => x.Date)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(x => x.Code)
            .HasDefaultValue(0);

        builder.Property(x => x.Note)
            .HasColumnType("text");

        builder.Property(x => x.UpdatedAt)
            .HasColumnType("timestamp without time zone")
            .IsRequired();

        builder.HasOne(x => x.Part)
            .WithMany()
            .HasForeignKey(x => x.PartId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(x => x.Document)
            .WithMany()
            .HasForeignKey(x => x.DocumentId)
            .OnDelete(DeleteBehavior.NoAction);

        builder.HasOne(x => x.Creator)
            .WithMany()
            .HasForeignKey(x => x.CreatorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
