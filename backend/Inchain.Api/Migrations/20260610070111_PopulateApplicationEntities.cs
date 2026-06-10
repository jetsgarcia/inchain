using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Inchain.Api.Migrations
{
    /// <inheritdoc />
    public partial class PopulateApplicationEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                IF NOT EXISTS (SELECT 1 FROM [AspNetRoles] WHERE [NormalizedName] = N'ADMIN')
                BEGIN
                    INSERT INTO [AspNetRoles] ([Id], [ConcurrencyStamp], [Name], [NormalizedName])
                    VALUES (N'8d5e5484-60a9-4a3d-8e65-dc4f13d3b59a', N'0e8182a9-76a5-4a27-b3b8-662d901fb3f6', N'Admin', N'ADMIN')
                END
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                """
                DELETE FROM [AspNetRoles]
                WHERE [Id] = N'8d5e5484-60a9-4a3d-8e65-dc4f13d3b59a'
                    AND [NormalizedName] = N'ADMIN'
                """);
        }
    }
}
