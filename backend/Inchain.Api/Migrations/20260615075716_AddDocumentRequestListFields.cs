using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inchain.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentRequestListFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DocumentRequests_RequestedById",
                table: "DocumentRequests");

            migrationBuilder.AddColumn<bool>(
                name: "IsDeleted",
                table: "DocumentRequests",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "DocumentRequests",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_DocumentRequests_RequestedById_IsDeleted",
                table: "DocumentRequests",
                columns: new[] { "RequestedById", "IsDeleted" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_DocumentRequests_RequestedById_IsDeleted",
                table: "DocumentRequests");

            migrationBuilder.DropColumn(
                name: "IsDeleted",
                table: "DocumentRequests");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "DocumentRequests");

            migrationBuilder.CreateIndex(
                name: "IX_DocumentRequests_RequestedById",
                table: "DocumentRequests",
                column: "RequestedById");
        }
    }
}
