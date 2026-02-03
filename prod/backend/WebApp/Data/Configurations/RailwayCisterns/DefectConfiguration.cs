using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class DefectConfiguration : IEntityTypeConfiguration<Defect>
{
    public void Configure(EntityTypeBuilder<Defect> entity)
    {
        entity.ToTable("Defects");
        
        entity.HasKey(e => e.Id);
        
        entity.Property(e=>e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e=>e.Name).HasColumnName("Name").IsRequired()
            .HasColumnType("text");
        entity.Property(e=>e.ShortName).HasColumnName("ShortName").IsRequired()
            .HasColumnType("text");
        entity.Property(e=>e.Cause).HasColumnName("Сause").IsRequired()
            .HasColumnType("text");
    }
}