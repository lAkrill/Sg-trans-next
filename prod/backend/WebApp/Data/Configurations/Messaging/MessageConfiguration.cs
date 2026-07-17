using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.Messaging;

namespace WebApp.Data.Configurations.Messaging;

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.HasKey(m => m.Id);

        builder.Property(m => m.CreationDate).IsRequired()
            .HasColumnType("timestamp without time zone");
        builder.Property(m => m.ReadingDate).IsRequired()
            .HasColumnType("timestamp without time zone");
        builder.Property(m => m.Text).IsRequired(false);
        builder.Property(m => m.FileName).IsRequired(false);
        builder.Property(m => m.FilePath).IsRequired(false);
        builder.Property(m => m.Priority).IsRequired().HasDefaultValue(0);

        // map property to DB column with typo
        builder.Property(m => m.Status)
            .HasColumnName("Satus")
            .IsRequired()
            .HasDefaultValue(0);

        builder.HasOne(m => m.FromUser)
            .WithMany()
            .HasForeignKey(m => m.FromUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(m => m.ToUser)
            .WithMany()
            .HasForeignKey(m => m.ToUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
