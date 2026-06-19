using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class RailwayCisternConfiguration : IEntityTypeConfiguration<RailwayCistern>
{
    public void Configure(EntityTypeBuilder<RailwayCistern> entity)
    {
        entity.ToTable("RailwayCisterns");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.Number).HasColumnName("Number").IsRequired().HasColumnType("text");
        entity.Property(e => e.ManufacturerId).HasColumnName("ManufacturerId").IsRequired();
        entity.Property(e => e.BuildDate).HasColumnName("BuildDate").IsRequired().HasColumnType("date");
        entity.Property(e => e.TareWeight).HasColumnName("TareWeight").IsRequired().HasColumnType("numeric");
        entity.Property(e => e.LoadCapacity).HasColumnName("LoadCapacity").IsRequired().HasColumnType("numeric");
        entity.Property(e => e.Length).HasColumnName("Length").IsRequired();
        entity.Property(e => e.AxleCount).HasColumnName("AxleCount").IsRequired();
        entity.Property(e => e.Volume).HasColumnName("Volume").IsRequired().HasColumnType("numeric");
        entity.Property(e => e.FillingVolume).HasColumnName("FillingVolume").HasColumnType("numeric");
        entity.Property(e => e.InitialTareWeight).HasColumnName("InitialTareWeight").HasColumnType("numeric");
        entity.Property(e => e.TypeId).HasColumnName("TypeId").IsRequired();
        entity.Property(e => e.ModelId).HasColumnName("ModelId");
        entity.Property(e => e.CommissioningDate).HasColumnName("CommissioningDate").HasColumnType("date");
        entity.Property(e => e.SerialNumber).HasColumnName("SerialNumber").IsRequired().HasColumnType("text");
        entity.Property(e => e.RegistrationNumber).HasColumnName("RegistrationNumber").IsRequired()
            .HasColumnType("text");
        entity.Property(e => e.RegistrationDate).HasColumnName("RegistrationDate").IsRequired()
            .HasColumnType("date");
        entity.Property(e => e.RegistrarId).HasColumnName("RegistrarId");
        entity.Property(e => e.Notes).HasColumnName("Notes").HasColumnType("text");
        entity.Property(e => e.CreatedAt).HasColumnName("CreatedAt").IsRequired()
            .HasColumnType("timestamp with time zone");
        entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt").IsRequired()
            .HasColumnType("timestamp with time zone");
        entity.Property(e => e.CreatorId).HasColumnName("CreatorId").IsRequired().HasColumnType("text");
        entity.Property(e => e.OwnerId).HasColumnName("Ownerid"); // Matches SQL column name
        entity.Property(e => e.TechConditions).HasColumnName("TechСonditions") // С русской буквой С
            .HasColumnType("text"); // Matches SQL column name
        entity.Property(e => e.Pripiska).HasColumnName("Pripiska").HasColumnType("text");
        entity.Property(e => e.ReRegistrationDate).HasColumnName("ReRegistrationDate").HasColumnType("date");
        entity.Property(e => e.Pressure).HasColumnName("Pressure").IsRequired().HasColumnType("numeric");
        entity.Property(e => e.TestPressure).HasColumnName("TestPressure").IsRequired().HasColumnType("numeric")
            .HasDefaultValue(0);
        entity.Property(e => e.Rent).HasColumnName("Rent").HasColumnType("text");
        entity.Property(e => e.AffiliationId).HasColumnName("AffiliationId").IsRequired();
        entity.Property(e => e.ServiceLifeYears).HasColumnName("ServiceLifeYears").IsRequired().HasDefaultValue(40);
        entity.Property(e => e.PeriodMajorRepair).HasColumnName("PeriodMajorRepair").HasColumnType("date");
        entity.Property(e => e.PeriodPeriodicTest).HasColumnName("PeriodPeriodicTest").HasColumnType("date");
        entity.Property(e => e.PeriodIntermediateTest).HasColumnName("PeriodIntermediateTest")
            .HasColumnType("date");
        entity.Property(e => e.PeriodDepotRepair).HasColumnName("PeriodDepotRepair").HasColumnType("date");
        entity.Property(e => e.PeriodPPRRepair).HasColumnName("PeriodPPRRepair").HasColumnType("date");
        entity.Property(e => e.DangerClass).HasColumnName("DangerClass").IsRequired().HasDefaultValue(0);
        entity.Property(e => e.Substance).HasColumnName("Substance").IsRequired().HasColumnType("text")
            .HasDefaultValue("СУГ");
        entity.Property(e => e.TareWeight2).HasColumnName("TareWeight2").IsRequired().HasColumnType("numeric")
            .HasDefaultValue(0);
        entity.Property(e => e.TareWeight3).HasColumnName("TareWeight3").IsRequired().HasColumnType("numeric")
            .HasDefaultValue(0);
        entity.Property(e => e.PeriodPaintRepair).HasColumnName("PeriodPaintRepair").HasColumnType("timestamp without time zone");
        entity.Property(e => e.CisternStatusId).HasColumnName("CisternStatusId")
            .IsRequired();
        entity.Property(e=> e.ReRegistrationNextDate).HasColumnName("ReRegistrationNextDate").HasColumnType("date");
        entity.Property(e=> e.ExtensionServiceLifeDate).HasColumnName("ExtensionServiceLifeDate").HasColumnType("date");
        entity.Property(e => e.PeriodDetachRepair).HasColumnName("PeriodDetachRepair").HasColumnType("date");


        entity.HasOne(d => d.Affiliation)
            .WithMany(p => p.RailwayCisterns)
            .HasForeignKey(d => d.AffiliationId)
            .HasConstraintName("FK_RailwayCisterns_Affiliations_AffiliationId")
            .OnDelete(DeleteBehavior.NoAction); // ON DELETE NO ACTION

        entity.HasOne(d => d.Manufacturer)
            .WithMany(p => p.RailwayCisterns)
            .HasForeignKey(d => d.ManufacturerId)
            .HasConstraintName("FK_RailwayCisterns_Manufacturers_ManufacturerId")
            .OnDelete(DeleteBehavior.Cascade); // ON DELETE CASCADE

        entity.HasOne(d => d.Owner)
            .WithMany(p => p.RailwayCisterns)
            .HasForeignKey(d => d.OwnerId) // Corrected to OwnerId
            .HasConstraintName("FK_RailwayCisterns_Owners_Ownerid")
            .OnDelete(DeleteBehavior.NoAction); // ON DELETE NO ACTION

        entity.HasOne(d => d.Registrar)
            .WithMany(p => p.RailwayCisterns)
            .HasForeignKey(d => d.RegistrarId)
            .HasConstraintName("FK_RailwayCisterns_Registrars_RegistrarId")
            .OnDelete(DeleteBehavior.NoAction); // ON DELETE NO ACTION

        entity.HasOne(d => d.Model)
            .WithMany(p => p.RailwayCisterns)
            .HasForeignKey(d => d.ModelId)
            .HasConstraintName("FK_RailwayCisterns_WagonModels_ModelId")
            .OnDelete(DeleteBehavior.NoAction); // ON DELETE NO ACTION

        entity.HasOne(d => d.Type)
            .WithMany(p => p.RailwayCisterns)
            .HasForeignKey(d => d.TypeId)
            .HasConstraintName("FK_RailwayCisterns_WagonTypes_TypeId")
            .OnDelete(DeleteBehavior.Cascade); // ON DELETE CASCADE

        entity.HasMany(r => r.PartInstallations)
            .WithOne(p => p.Wagon)
            .HasForeignKey(p => p.WagonId)
            .IsRequired(false);

        entity.HasOne(r => r.RailwayCisternStatus)
            .WithMany()
            .HasForeignKey(r => r.CisternStatusId)
            .OnDelete(DeleteBehavior.NoAction);
    }
}