using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebApp.Data.Entities.Users;

namespace WebApp.Data.Configurations;

public class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> builder)
    {
        builder.ToTable("Employees");
        builder.HasKey(e => e.Id);

        builder.Property(e => e.Id)
            .HasColumnName("Id")
            .IsRequired();

        builder.Property(e => e.LastName)
            .HasColumnName("LastName")
            .IsRequired()
            .HasColumnType("text");

        builder.Property(e => e.FirstName)
            .HasColumnName("FirstName")
            .IsRequired()
            .HasColumnType("text");

        builder.Property(e => e.Patronymic)
            .HasColumnName("Patronymic")
            .IsRequired()
            .HasColumnType("text");

        builder.Property(e => e.Initials)
            .HasColumnName("Initials")
            .IsRequired()
            .HasColumnType("text");

        builder.Property(e => e.Position)
            .HasColumnName("Position")
            .IsRequired()
            .HasColumnType("text");

        builder.Property(e => e.UpdatedAt)
            .HasColumnName("UpdatedAt")
            .HasColumnType("timestamp without time zone");

        builder.Property(e => e.CreatorId)
            .HasColumnName("CreatorId")
            .IsRequired();

        builder.HasOne(e => e.Creator)
            .WithMany()
            .HasForeignKey(e => e.CreatorId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
