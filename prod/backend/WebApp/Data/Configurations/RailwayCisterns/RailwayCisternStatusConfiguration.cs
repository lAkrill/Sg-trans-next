using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class RailwayCisternStatusConfiguration : IEntityTypeConfiguration<RailwayCisternStatus>
{
    public void Configure(EntityTypeBuilder<RailwayCisternStatus> entity)
    {
        entity.ToTable("RailwayCisternStatus");
        
        entity.HasKey(x => x.Id);
        
        entity.Property(x => x.Id).HasColumnName("Id").IsRequired();
        entity.Property(x => x.Name).HasColumnName("Name").IsRequired()
            .HasColumnType("text");
        entity.Property(x=>x.UpdatedAt).HasColumnName("UpdatedAt").IsRequired()
            .HasColumnType("timestamp without time zone");
        entity.Property(x => x.CreatorId).HasColumnName("CreatorId").IsRequired();

        entity.HasOne(e => e.Creator)
            .WithMany()
            .HasForeignKey(e => e.CreatorId);
    }
}