using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inchain.Api.Migrations
{
    /// <inheritdoc />
    public partial class FixRemoveApprovalRouteStepOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ApprovalRoutes_DocumentTypeId_StepOrder",
                table: "ApprovalRoutes");

            migrationBuilder.DropColumn(
                name: "StepOrder",
                table: "ApprovalRoutes");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "StepOrder",
                table: "ApprovalRoutes",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_ApprovalRoutes_DocumentTypeId_StepOrder",
                table: "ApprovalRoutes",
                columns: new[] { "DocumentTypeId", "StepOrder" });
        }
    }
}
