using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class PartEquipmentConfiguration : IEntityTypeConfiguration<PartEquipment>
{
    public void Configure(EntityTypeBuilder<PartEquipment> entity)
    {
        entity.ToTable("PartEquipments");
            entity.HasKey(e => e.Id);
            
            entity.Property(e => e.Operation).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.DefectsId).IsRequired().HasDefaultValue("0").HasColumnType("text");
            entity.Property(e => e.AdminOwnerId).HasColumnType("text");
            entity.Property(e => e.JobDate).HasColumnType("text");
            entity.Property(e => e.JobTypeId).IsRequired().HasDefaultValue("0").HasColumnType("text");
            entity.Property(e => e.ThicknessLeft).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.ThicknessRight).IsRequired().HasDefaultValue(0);
            entity.Property(e => e.TruckType);
            entity.Property(e => e.Notes).HasColumnType("text");
            entity.Property(e => e.DocumentId).IsRequired();
            entity.Property(e => e.DocumentDate).IsRequired().HasColumnType("date");
            
            // Связи с другими сущностями
            entity.HasOne(pe => pe.RailwayCistern)
                .WithMany()
                .HasForeignKey(pe => pe.RailwayCisternsId)
                .OnDelete(DeleteBehavior.NoAction);
                
            entity.HasOne(pe => pe.EquipmentType)
                .WithMany(et => et.PartEquipments)
                .HasForeignKey(pe => pe.EquipmentTypeId)
                .OnDelete(DeleteBehavior.NoAction);
                
            entity.HasOne(pe => pe.JobDepot)
                .WithMany()
                .HasForeignKey(pe => pe.JobDepotsId)
                .OnDelete(DeleteBehavior.NoAction);
                
            entity.HasOne(pe => pe.Depot)
                .WithMany()
                .HasForeignKey(pe => pe.DepotsId)
                .OnDelete(DeleteBehavior.NoAction);
                
            entity.HasOne(pe => pe.RepairType)
                .WithMany()
                .HasForeignKey(pe => pe.RepairTypesId)
                .OnDelete(DeleteBehavior.NoAction);

            // Связь с Part определена через Part.PartEquipments
            entity.HasOne(pe => pe.Part)
                .WithMany(p => p.PartEquipments)
                .HasForeignKey(pe => pe.PartsId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(pe => pe.Document)
                .WithMany(d => d.PartEquipments)
                .HasForeignKey(d => d.DocumentId)
                .OnDelete(DeleteBehavior.NoAction);
    }
}