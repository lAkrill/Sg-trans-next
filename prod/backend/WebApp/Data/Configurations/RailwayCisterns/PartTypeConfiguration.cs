using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class PartTypeConfiguration : IEntityTypeConfiguration<PartType>
{
    public void Configure(EntityTypeBuilder<PartType> entity)
    {
        entity.ToTable("PartTypes");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.Name).HasColumnName("Name").IsRequired().HasColumnType("text");
        entity.Property(e => e.Code).HasColumnName("Code").IsRequired().HasDefaultValue(0);
        entity.Property(e => e.Weight).HasColumnName("Weight").IsRequired().HasColumnType("numeric").HasDefaultValue(0);
    }
}