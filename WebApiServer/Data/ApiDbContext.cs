using Microsoft.EntityFrameworkCore;
using WebApiServer.Models;

namespace WebApiServer.Data;

public class ApiDbContext : DbContext {
    public ApiDbContext(DbContextOptions<ApiDbContext> options)
        :base(options)
    {}

    public DbSet<LoadedData> LoadedDatas { get; set; }
    public DbSet<LoadedFile> LoadedFiles { get; set; }
    public DbSet<LoadedFolder> LoadedFolders { get; set; }
    public DbSet<ProfileData> ProfileDatas { get; set; }
    public DbSet<Project> Projects { get; set; }
    public DbSet<Factors> Factors { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<DataBankFolder> DataBankFolders { get; set; }
    public DbSet<DataBankFile> DataBankFiles { get; set; }
}