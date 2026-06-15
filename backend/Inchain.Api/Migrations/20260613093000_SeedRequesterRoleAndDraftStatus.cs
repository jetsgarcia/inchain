using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inchain.Api.Migrations
{
    /// <inheritdoc />
    public partial class SeedRequesterRoleAndDraftStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF NOT EXISTS (SELECT 1 FROM [AspNetRoles] WHERE [NormalizedName] = N'APPROVER')
                BEGIN
                    INSERT INTO [AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName])
                    VALUES (N'a7f6e19d-ff44-4b8e-bd1d-3d9f3fc2b1c4', N'a2c9e6f8-6d2d-4355-b22f-773f01d191a8', N'Approver', N'APPROVER')
                END

                IF NOT EXISTS (SELECT 1 FROM [AspNetRoles] WHERE [NormalizedName] = N'REQUESTER')
                BEGIN
                    INSERT INTO [AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName])
                    VALUES (N'c36af7e8-1714-46ef-999d-c9db9d92b730', N'ef76052c-8d70-44d1-928f-0951ffcd7e23', N'Requester', N'REQUESTER')
                END

                IF NOT EXISTS (SELECT 1 FROM [RequestStatuses] WHERE [Name] = N'Draft')
                BEGIN
                    INSERT INTO [RequestStatuses] ([Name], [Description])
                    VALUES (N'Draft', N'Document request has been saved as a draft.')
                END

                IF NOT EXISTS (SELECT 1 FROM [RequestStatuses] WHERE [Name] = N'PendingApproval')
                BEGIN
                    INSERT INTO [RequestStatuses] ([Name], [Description])
                    VALUES (N'PendingApproval', N'Document request is pending approval.')
                END

                IF NOT EXISTS (SELECT 1 FROM [RequestStatuses] WHERE [Name] = N'Approved')
                BEGIN
                    INSERT INTO [RequestStatuses] ([Name], [Description])
                    VALUES (N'Approved', N'Document request has been approved.')
                END

                IF NOT EXISTS (SELECT 1 FROM [RequestStatuses] WHERE [Name] = N'Rejected')
                BEGIN
                    INSERT INTO [RequestStatuses] ([Name], [Description])
                    VALUES (N'Rejected', N'Document request has been rejected.')
                END

                IF NOT EXISTS (SELECT 1 FROM [RequestStatuses] WHERE [Name] = N'Cancelled')
                BEGIN
                    INSERT INTO [RequestStatuses] ([Name], [Description])
                    VALUES (N'Cancelled', N'Document request has been cancelled.')
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM [RequestStatuses]
                WHERE [Name] IN (
                    N'Draft',
                    N'PendingApproval',
                    N'Approved',
                    N'Rejected',
                    N'Cancelled'
                )

                DELETE FROM [AspNetRoles]
                WHERE [Id] IN (
                    N'a7f6e19d-ff44-4b8e-bd1d-3d9f3fc2b1c4',
                    N'c36af7e8-1714-46ef-999d-c9db9d92b730'
                )
                """);
        }
    }
}
