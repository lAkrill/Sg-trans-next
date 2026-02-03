using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class MilageCisternConfiguration : IEntityTypeConfiguration<MilageCistern>
{
    public void Configure(EntityTypeBuilder<MilageCistern> entity)
    {
        entity.ToTable("MilageCisterns");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.CisternId).HasColumnName("CisternId").IsRequired();
        entity.Property(e => e.Milage).HasColumnName("Milage").IsRequired();
        entity.Property(e => e.MilageNorm).HasColumnName("MilageNorm").IsRequired();
        entity.Property(e => e.RepairTypeId).HasColumnName("RepairTypeId").IsRequired();
        entity.Property(e => e.RepairDate).HasColumnName("RepairDate").IsRequired().HasColumnType("date");
        entity.Property(e => e.InputModeCode).HasColumnName("InputModeCode").IsRequired();
        entity.Property(e => e.InputDate).HasColumnName("InputDate").IsRequired().HasColumnType("date");
        entity.Property(e => e.CisternNumber).HasColumnName("CisternNumber").IsRequired().HasColumnType("text");

        entity.HasOne(d => d.Cistern)
            .WithMany(p => p.MilageCisterns)
            .HasForeignKey(d => d.CisternId)
            .HasConstraintName("FK_CisternId_RailwayCisterns_id")
            .OnDelete(DeleteBehavior.NoAction); // ON DELETE NO ACTION

        entity.HasOne(d => d.RepairType)
            .WithMany(p => p.MilageCisterns)
            .HasForeignKey(d => d.RepairTypeId)
            .HasConstraintName("FK_RepairTypeId_RepairTypes_id")
            .OnDelete(DeleteBehavior.NoAction); // ON DELETE NO ACTION
    }
}