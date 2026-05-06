using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class WagonModelConfiguration : IEntityTypeConfiguration<WagonModel>
{
    public void Configure(EntityTypeBuilder<WagonModel> entity)
    {
        entity.ToTable("WagonModels");
        entity.HasKey(e => e.Id);
        entity.Property(e => e.Id).HasColumnName("Id").IsRequired();
        entity.Property(e => e.Name).HasColumnName("Name").IsRequired().HasColumnType("text");
        entity.Property(e => e.MajorRep).HasColumnName("MajorRep").IsRequired().HasColumnType("integer");
        entity.Property(e => e.DepoRep).HasColumnName("DepoRep").IsRequired().HasColumnType("integer");
        entity.Property(e => e.IntermediateTest).HasColumnName("IntermediateTest").HasColumnType("integer");
        entity.Property(e => e.PeriodicTest).HasColumnName("PeriodicTest").HasColumnType("integer");
        entity.Property(e => e.PPRRep).HasColumnName("PPRRep").HasColumnType("integer");
        entity.Property(e => e.UpdatedAt).HasColumnName("UpdatedAt").HasColumnType("timestamp without time zone");
        entity.Property(e => e.CreatorId).HasColumnName("CreatorId");

        entity.HasOne(e => e.Creator)
            .WithMany()
            .HasForeignKey(e => e.CreatorId);
    }
}