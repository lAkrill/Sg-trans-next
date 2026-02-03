using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class PartStatusConfiguration : IEntityTypeConfiguration<PartStatus>
{
    public void Configure(EntityTypeBuilder<PartStatus> entity)
    {
        entity.ToTable("PartStatus");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.Name).HasColumnName("Name").IsRequired().HasColumnType("text");
        entity.Property(e => e.Code).HasColumnName("Code").IsRequired();
    }
}