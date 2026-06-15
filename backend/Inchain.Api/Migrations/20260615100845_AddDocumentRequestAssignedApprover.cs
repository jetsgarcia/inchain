using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inchain.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddDocumentRequestAssignedApprover : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AssignedApproverUserId",
                table: "DocumentRequests",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AssignedApproverUserId",
                table: "DocumentRequests");
        }
    }
}
