using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class UpdateConfiguration : IEntityTypeConfiguration<Update>
{
    public void Configure(EntityTypeBuilder<Update> entity)
    {
        entity.ToTable("Updates");

        entity.Property(e=>e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e=>e.Name).IsRequired()
            .HasColumnType("text");
    }
}