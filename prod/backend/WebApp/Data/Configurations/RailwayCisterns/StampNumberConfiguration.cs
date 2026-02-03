using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class StampNumberConfiguration : IEntityTypeConfiguration<StampNumber>
{
    public void Configure(EntityTypeBuilder<StampNumber> entity)
    {
        entity.ToTable("StampNumbers");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.Value).HasColumnName("Value").IsRequired().HasColumnType("text");
    }
}