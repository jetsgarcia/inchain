using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inchain.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentRequestApprovedAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "ApprovedAt",
                table: "DocumentRequests",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovedAt",
                table: "DocumentRequests");
        }
    }
}
