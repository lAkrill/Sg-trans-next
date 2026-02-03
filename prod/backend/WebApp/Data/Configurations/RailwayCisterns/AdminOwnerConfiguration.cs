using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.RailwayCisterns;

namespace WebApp.Data.Configurations.RailwayCisterns;

public partial class AdminOwnerConfiguration : IEntityTypeConfiguration<AdminOwner>
{
    public void Configure(EntityTypeBuilder<AdminOwner> entity)
    {
        entity.ToTable("AdminOwner");
        
        entity.HasKey(e=>e.Id);
        
        entity.Property(e=>e.Id).HasColumnName("Id").
            IsRequired();
        entity.Property(e=>e.Name).HasColumnName("Name")
            .HasColumnType("text");
    }
}