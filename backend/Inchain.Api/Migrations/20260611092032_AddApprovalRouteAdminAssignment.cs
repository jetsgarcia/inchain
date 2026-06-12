using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inchain.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddApprovalRouteAdminAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ApprovalRoutes_DocumentTypeId_StepOrder",
                table: "ApprovalRoutes");

            migrationBuilder.AddColumn<string>(
                name: "CreatedByUserId",
                table: "ApprovalRoutes",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "ApprovalRoutes",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UpdatedByUserId",
                table: "ApprovalRoutes",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.Sql("""
                IF NOT EXISTS (SELECT 1 FROM [AspNetRoles] WHERE [NormalizedName] = N'APPROVER')
                BEGIN
                    INSERT INTO [AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName])
                    VALUES (N'a7f6e19d-ff44-4b8e-bd1d-3d9f3fc2b1c4', N'a2c9e6f8-6d2d-4355-b22f-773f01d191a8', N'Approver', N'APPROVER');
                END

                IF NOT EXISTS (SELECT 1 FROM [AspNetRoles] WHERE [NormalizedName] = N'REQUESTER')
                BEGIN
                    INSERT INTO [AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName])
                    VALUES (N'c36af7e8-1714-46ef-999d-c9db9d92b730', N'ef76052c-8d70-44d1-928f-0951ffcd7e23', N'Requester', N'REQUESTER');
                END
                """);

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalRoutes_DocumentTypeId",
                table: "ApprovalRoutes",
                column: "DocumentTypeId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ApprovalRoutes_DocumentTypeId",
                table: "ApprovalRoutes");

            migrationBuilder.DropColumn(
                name: "CreatedByUserId",
                table: "ApprovalRoutes");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "ApprovalRoutes");

            migrationBuilder.DropColumn(
                name: "UpdatedByUserId",
                table: "ApprovalRoutes");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalRoutes_DocumentTypeId_StepOrder",
                table: "ApprovalRoutes",
                columns: new[] { "DocumentTypeId", "StepOrder" },
                unique: true);
        }
    }
}
