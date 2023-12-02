using Microsoft.EntityFrameworkCore;
using WebAPI.Models;

namespace WebAPI.Data;

public class ApiDbContext : DbContext {
    public ApiDbContext(DbContextOptions<ApiDbContext> options)
        :base(options)
    {}

    public DbSet<LoadedData> LoadedDatas { get; set; }

}