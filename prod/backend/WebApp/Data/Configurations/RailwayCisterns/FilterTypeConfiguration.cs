using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class FilterTypeConfiguration : IEntityTypeConfiguration<FilterType>
{
    public void Configure(EntityTypeBuilder<FilterType> entity)
    {
        entity.ToTable("FilterTypes");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Name).IsRequired().HasColumnType("text");
    }
}