using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Inchain.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, string>
{
    public DbSet<ActivityLog> ActivityLogs { get; set; } = null!;

    public DbSet<ApprovalAction> ApprovalActions { get; set; } = null!;

    public DbSet<ApprovalRoute> ApprovalRoutes { get; set; } = null!;

    public DbSet<DocumentType> DocumentTypes { get; set; } = null!;

    public DbSet<DocumentRequest> DocumentRequests { get; set; } = null!;

    public DbSet<RequestAttachment> RequestAttachments { get; set; } = null!;

    public DbSet<RequestStatus> RequestStatuses { get; set; } = null!;

    public ApplicationDbContext(DbContextOptions options) : base(options)
    {
    }

    protected ApplicationDbContext()
    {
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        ConfigureApplicationUser(builder);
        ConfigureApplicationRole(builder);
        ConfigureActivityLog(builder);
        ConfigureApprovalAction(builder);
        ConfigureApprovalRoute(builder);
        ConfigureDocumentType(builder);
        ConfigureDocumentRequest(builder);
        ConfigureRequestAttachment(builder);
        ConfigureRequestStatus(builder);
    }

    private static void ConfigureApplicationUser(ModelBuilder builder)
    {
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(user => user.FullName)
                .IsRequired();
        });
    }

    private static void ConfigureApplicationRole(ModelBuilder builder)
    {
        builder.Entity<ApplicationRole>(entity =>
        {
            entity.HasData(
                ApplicationRole.Admin,
                ApplicationRole.Approver,
                ApplicationRole.Requester);
        });
    }

    private static void ConfigureActivityLog(ModelBuilder builder)
    {
        builder.Entity<ActivityLog>(entity =>
        {
            entity.ToTable("ActivityLogs");

            entity.Property(activityLog => activityLog.Action)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(activityLog => activityLog.Details)
                .HasMaxLength(1000);

            entity.Property(activityLog => activityLog.CreatedAt)
                .IsRequired();

            entity.HasOne(activityLog => activityLog.DocumentRequest)
                .WithMany(documentRequest => documentRequest.ActivityLogs)
                .HasForeignKey(activityLog => activityLog.DocumentRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(activityLog => activityLog.User)
                .WithMany(user => user.ActivityLogs)
                .HasForeignKey(activityLog => activityLog.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureApprovalAction(ModelBuilder builder)
    {
        builder.Entity<ApprovalAction>(entity =>
        {
            entity.ToTable("ApprovalActions");

            entity.Property(approvalAction => approvalAction.Action)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(approvalAction => approvalAction.Comments)
                .HasMaxLength(1000);

            entity.Property(approvalAction => approvalAction.CreatedAt)
                .IsRequired();

            entity.HasOne(approvalAction => approvalAction.DocumentRequest)
                .WithMany(documentRequest => documentRequest.ApprovalActions)
                .HasForeignKey(approvalAction => approvalAction.DocumentRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(approvalAction => approvalAction.ApprovalRoute)
                .WithMany(approvalRoute => approvalRoute.ApprovalActions)
                .HasForeignKey(approvalAction => approvalAction.ApprovalRouteId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(approvalAction => approvalAction.Approver)
                .WithMany(user => user.ApprovalActions)
                .HasForeignKey(approvalAction => approvalAction.ApproverId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureApprovalRoute(ModelBuilder builder)
    {
        builder.Entity<ApprovalRoute>(entity =>
        {
            entity.ToTable("ApprovalRoutes");

            entity.HasIndex(approvalRoute => approvalRoute.DocumentTypeId)
                .IsUnique();

            entity.Property(approvalRoute => approvalRoute.StepOrder)
                .IsRequired();

            entity.Property(approvalRoute => approvalRoute.IsActive)
                .IsRequired();

            entity.Property(approvalRoute => approvalRoute.CreatedAt)
                .IsRequired();

            entity.Property(approvalRoute => approvalRoute.CreatedByUserId)
                .HasMaxLength(450)
                .IsRequired(false);

            entity.Property(approvalRoute => approvalRoute.UpdatedAt)
                .IsRequired(false);

            entity.Property(approvalRoute => approvalRoute.UpdatedByUserId)
                .HasMaxLength(450)
                .IsRequired(false);

            entity.HasOne(approvalRoute => approvalRoute.DocumentType)
                .WithMany(documentType => documentType.ApprovalRoutes)
                .HasForeignKey(approvalRoute => approvalRoute.DocumentTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(approvalRoute => approvalRoute.Approver)
                .WithMany(user => user.ApprovalRoutes)
                .HasForeignKey(approvalRoute => approvalRoute.ApproverId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureDocumentType(ModelBuilder builder)
    {
        builder.Entity<DocumentType>(entity =>
        {
            entity.ToTable("DocumentTypes");

            entity.HasIndex(documentType => documentType.Name).IsUnique();

            entity.Property(documentType => documentType.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(documentType => documentType.Description)
                .HasMaxLength(500);

            entity.Property(documentType => documentType.IsActive)
                .HasDefaultValue(true)
                .IsRequired();
        });
    }

    private static void ConfigureDocumentRequest(ModelBuilder builder)
    {
        builder.Entity<DocumentRequest>(entity =>
        {
            entity.ToTable("DocumentRequests");

            entity.Property(documentRequest => documentRequest.Title)
                .HasMaxLength(200)
                .IsRequired();

            entity.Property(documentRequest => documentRequest.Description)
                .HasMaxLength(1000);

            entity.Property(documentRequest => documentRequest.IsDeleted)
                .HasDefaultValue(false)
                .IsRequired();

            entity.Property(documentRequest => documentRequest.CreatedAt)
                .IsRequired();

            entity.Property(documentRequest => documentRequest.SubmittedAt)
                .IsRequired(false);

            entity.HasIndex(documentRequest => new
            {
                documentRequest.RequestedById,
                documentRequest.IsDeleted
            });

            entity.HasOne(documentRequest => documentRequest.DocumentType)
                .WithMany(documentType => documentType.DocumentRequests)
                .HasForeignKey(documentRequest => documentRequest.DocumentTypeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(documentRequest => documentRequest.RequestStatus)
                .WithMany(requestStatus => requestStatus.DocumentRequests)
                .HasForeignKey(documentRequest => documentRequest.RequestStatusId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(documentRequest => documentRequest.RequestedBy)
                .WithMany(user => user.DocumentRequests)
                .HasForeignKey(documentRequest => documentRequest.RequestedById)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureRequestAttachment(ModelBuilder builder)
    {
        builder.Entity<RequestAttachment>(entity =>
        {
            entity.ToTable("RequestAttachments");

            entity.Property(requestAttachment => requestAttachment.FileName)
                .HasMaxLength(255)
                .IsRequired();

            entity.Property(requestAttachment => requestAttachment.FilePath)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(requestAttachment => requestAttachment.ContentType)
                .HasMaxLength(100);

            entity.Property(requestAttachment => requestAttachment.FileSize)
                .IsRequired();

            entity.Property(requestAttachment => requestAttachment.IsCurrent)
                .HasDefaultValue(true)
                .IsRequired();

            entity.Property(requestAttachment => requestAttachment.UploadedAt)
                .IsRequired();

            entity.HasOne(requestAttachment => requestAttachment.DocumentRequest)
                .WithMany(documentRequest => documentRequest.RequestAttachments)
                .HasForeignKey(requestAttachment => requestAttachment.DocumentRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(requestAttachment => requestAttachment.UploadedBy)
                .WithMany(user => user.RequestAttachments)
                .HasForeignKey(requestAttachment => requestAttachment.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }

    private static void ConfigureRequestStatus(ModelBuilder builder)
    {
        builder.Entity<RequestStatus>(entity =>
        {
            entity.ToTable("RequestStatuses");

            entity.HasIndex(requestStatus => requestStatus.Name).IsUnique();

            entity.Property(requestStatus => requestStatus.Name)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(requestStatus => requestStatus.Description)
                .HasMaxLength(500);
        });
    }
}
