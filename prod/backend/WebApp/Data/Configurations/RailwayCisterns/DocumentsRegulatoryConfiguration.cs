using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public class DocumentsRegulatoryConfiguration : IEntityTypeConfiguration<DocumentsRegulatory>
{
    public void Configure(EntityTypeBuilder<DocumentsRegulatory> builder)
    {
        builder.ToTable("DocumentsRegulatory");
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasColumnType("text");

        builder.Property(x => x.Number)
            .HasColumnType("text");

        builder.Property(x => x.Date)
            .HasColumnType("date")
            .IsRequired();

        builder.Property(x => x.File)
            .HasColumnType("text");

        builder.Property(x => x.Url)
            .HasColumnType("text");

        builder.Property(x => x.UpdatedAt)
            .HasColumnType("timestamp without time zone")
            .IsRequired();

        builder.HasOne(x => x.Creator)
            .WithMany()
            .HasForeignKey(x => x.CreatorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
