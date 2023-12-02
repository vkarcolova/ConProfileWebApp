using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace WebApiServer.Migrations
{
    /// <inheritdoc />
    public partial class initialmigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LoadedDatas",
                columns: table => new
                {
                    IdData = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdFileData = table.Column<int>(type: "integer", nullable: false),
                    Excitation = table.Column<double>(type: "double precision", nullable: false),
                    Intensity = table.Column<double>(type: "double precision", nullable: false),
                    MultipliedIntensity = table.Column<double>(type: "double precision", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoadedDatas", x => x.IdData);
                });

            migrationBuilder.CreateTable(
                name: "LoadedFiles",
                columns: table => new
                {
                    IdFile = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdFolder = table.Column<int>(type: "integer", nullable: false),
                    Spectrum = table.Column<int>(type: "integer", nullable: false),
                    Factor = table.Column<int>(type: "integer", nullable: true),
                    FileName = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoadedFiles", x => x.IdFile);
                });

            migrationBuilder.CreateTable(
                name: "LoadedFolders",
                columns: table => new
                {
                    IdFolder = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdProject = table.Column<int>(type: "integer", nullable: false),
                    FolderName = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LoadedFolders", x => x.IdFolder);
                });

            migrationBuilder.CreateTable(
                name: "ProfileDatas",
                columns: table => new
                {
                    IdProfileData = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    IdFolder = table.Column<int>(type: "integer", nullable: false),
                    Excitation = table.Column<double>(type: "double precision", nullable: false),
                    MaxIntensity = table.Column<double>(type: "double precision", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProfileDatas", x => x.IdProfileData);
                });

            migrationBuilder.CreateTable(
                name: "Projects",
                columns: table => new
                {
                    IdProject = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProjectName = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Projects", x => x.IdProject);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LoadedDatas");

            migrationBuilder.DropTable(
                name: "LoadedFiles");

            migrationBuilder.DropTable(
                name: "LoadedFolders");

            migrationBuilder.DropTable(
                name: "ProfileDatas");

            migrationBuilder.DropTable(
                name: "Projects");
        }
    }
}
