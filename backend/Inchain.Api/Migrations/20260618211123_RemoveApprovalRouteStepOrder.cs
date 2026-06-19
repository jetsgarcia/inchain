using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inchain.Api.Migrations
{
    [Migration("20260618211123_RemoveApprovalRouteStepOrder")]
    public partial class RemoveApprovalRouteStepOrder : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
                defaultValue: 1);
        }
    }
}
