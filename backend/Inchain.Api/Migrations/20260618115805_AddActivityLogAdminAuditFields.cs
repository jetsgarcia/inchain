using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inchain.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddActivityLogAdminAuditFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActionType",
                table: "ActivityLogs",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "ActivityLogs",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PerformedByUserId",
                table: "ActivityLogs",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetEntityId",
                table: "ActivityLogs",
                type: "nvarchar(450)",
                maxLength: 450,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetEntityType",
                table: "ActivityLogs",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ActivityLogs_PerformedByUserId",
                table: "ActivityLogs",
                column: "PerformedByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_ActivityLogs_AspNetUsers_PerformedByUserId",
                table: "ActivityLogs",
                column: "PerformedByUserId",
                principalTable: "AspNetUsers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ActivityLogs_AspNetUsers_PerformedByUserId",
                table: "ActivityLogs");

            migrationBuilder.DropIndex(
                name: "IX_ActivityLogs_PerformedByUserId",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "ActionType",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "PerformedByUserId",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "TargetEntityId",
                table: "ActivityLogs");

            migrationBuilder.DropColumn(
                name: "TargetEntityType",
                table: "ActivityLogs");
        }
    }
}
