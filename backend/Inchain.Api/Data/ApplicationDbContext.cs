using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Inchain.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public DbSet<DocumentType> DocumentTypes => Set<DocumentType>();

    public ApplicationDbContext(DbContextOptions options) : base(options)
    {
    }

    protected ApplicationDbContext()
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<DocumentType>(entity =>
        {
            entity.HasIndex(documentType => documentType.Name).IsUnique();

            entity.Property(documentType => documentType.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(documentType => documentType.Description)
                .HasMaxLength(500);
        });
    }
}
