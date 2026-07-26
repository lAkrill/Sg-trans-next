using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class DocumentConfiguration : IEntityTypeConfiguration<Document>
{
    public void Configure(EntityTypeBuilder<Document> entity)
    {
        entity.ToTable("Documents");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Number).IsRequired().HasColumnType("text");
        entity.Property(e => e.Type);
        entity.Property(e => e.Date).IsRequired().HasColumnType("date");
        entity.Property(e => e.Author).IsRequired().HasColumnType("text");
        entity.Property(e => e.Price).HasColumnType("money");
        entity.Property(e => e.Note).HasColumnType("text");
        entity.Property(e => e.File).HasColumnType("text");

        // Связи с другими сущностями
        entity.HasMany(d => d.Parts)
            .WithOne(p => p.Document)
            .HasForeignKey(p => p.DocumentId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasMany(d => d.PartEquipments)
            .WithOne(pe => pe.Document)
            .HasForeignKey(pe => pe.DocumentId)
            .OnDelete(DeleteBehavior.NoAction);

        entity.HasMany(d => d.FitmentEquipments)
            .WithOne(fe => fe.Document)
            .HasForeignKey(fe => fe.DocumentId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}