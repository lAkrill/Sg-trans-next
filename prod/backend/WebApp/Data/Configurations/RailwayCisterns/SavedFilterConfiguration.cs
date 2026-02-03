using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class SavedFilterConfiguration : IEntityTypeConfiguration<SavedFilter>
{
    public void Configure(EntityTypeBuilder<SavedFilter> entity)
    {
        entity.ToTable("SavedFilters");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Name).IsRequired().HasColumnType("text");
        entity.Property(e => e.FilterJson).IsRequired().HasColumnType("text");
        entity.Property(e => e.SortFieldsJson).IsRequired().HasColumnType("text");
        entity.Property(e => e.SelectedColumnsJson).IsRequired().HasColumnType("text"); // Добавлено
        entity.Property(e => e.UserId).IsRequired();
        entity.Property(e => e.FilterTypeId).IsRequired();
        entity.Property(e => e.CreatedAt).IsRequired().HasColumnType("timestamp with time zone");
        entity.Property(e => e.UpdatedAt).IsRequired().HasColumnType("timestamp with time zone");

        entity.HasOne(d => d.User)
            .WithMany()
            .HasForeignKey(d => d.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        entity.HasOne(d => d.FilterType)
            .WithMany(p => p.SavedFilters)
            .HasForeignKey(d => d.FilterTypeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}