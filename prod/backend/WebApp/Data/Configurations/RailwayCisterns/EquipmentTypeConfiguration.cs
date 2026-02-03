using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class EquipmentTypeConfiguration : IEntityTypeConfiguration<EquipmentType>
{
    public void Configure(EntityTypeBuilder<EquipmentType> entity)
    {
        entity.ToTable("EquipmentType");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Name).IsRequired().HasColumnType("text");
        entity.Property(e => e.Code).IsRequired().HasDefaultValue(0);
            
        entity.HasOne(e => e.PartType)
            .WithMany()
            .HasForeignKey(e => e.PartTypeId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}