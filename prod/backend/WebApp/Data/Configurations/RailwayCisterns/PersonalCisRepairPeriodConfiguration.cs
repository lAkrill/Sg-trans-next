using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class PersonalCisRepairPeriodConfiguration : IEntityTypeConfiguration<PersonalCisRepairPeriod>
{
    public void Configure(EntityTypeBuilder<PersonalCisRepairPeriod> entity)
    {
        entity.ToTable("PersonalCisRepairPeriods");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.CisternId).HasColumnName("CisternId").IsRequired();
        entity.Property(e => e.CisternNum).HasColumnName("CisternNum").IsRequired().HasColumnType("text");
        entity.Property(e => e.MajorRep).HasColumnName("MajorRep").HasColumnType("integer");
        entity.Property(e => e.DepoRep).HasColumnName("DepoRep").HasColumnType("integer");
        entity.Property(e => e.IntermediateTest).HasColumnName("IntermediateTest").HasColumnType("integer");
        entity.Property(e => e.PeriodicTest).HasColumnName("PeriodicTest").HasColumnType("integer");
        entity.Property(e => e.PPRRep).HasColumnName("PPRRep").HasColumnType("integer");
        entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt").HasColumnType("timestamp without time zone");
        entity.Property(e => e.CreatorId).HasColumnName("CreatorId");

        entity.HasOne(e => e.Creator)
            .WithMany()
            .HasForeignKey(e => e.CreatorId);

        entity.HasOne(e => e.railwayCistern)
            .WithOne(e=>e.personalCisRepairPeriod)
            .HasForeignKey<PersonalCisRepairPeriod>(e => e.CisternId);
    }
}