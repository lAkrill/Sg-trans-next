using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.Audit;

namespace WebApp.Data.Configurations.Audit;

public class ActionLogConfiguration : IEntityTypeConfiguration<ActionLog>
{
    public void Configure(EntityTypeBuilder<ActionLog> builder)
    {
        builder.HasKey(a => a.Id);

        builder.Property(a => a.DateTime).IsRequired()
            .HasColumnType("timestamp without time zone");
        builder.Property(a => a.IP).IsRequired(false);
        builder.Property(a => a.API).IsRequired();
        builder.Property(a => a.Note).IsRequired(false);

        builder.HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
