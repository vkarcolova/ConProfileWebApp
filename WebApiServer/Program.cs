using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using WebApiServer.Data;
using WebApiServer.Services;
var  AllowSpecificOrigins = "_AllowSpecificOrigins";

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IDataProcessService, DataProcessService>();
builder.Services.AddScoped<IUserService, UserService>();

builder.WebHost.UseUrls("http://0.0.0.0:3000");

builder.Services.AddCors(options =>
{
options.AddPolicy(name: AllowSpecificOrigins,
                      policy  =>
                      {
                          policy.WithOrigins("http://localhost:5000", "http://conprofile.fri.uniza.sk:5000", "https://conprofile.fri.uniza.sk")
                            .AllowAnyHeader()
                            .AllowAnyMethod(); 
                      });
});

// Konfigur�cia JWT
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuers = new[]
                    {
                        "http://localhost:3000",
                        "http://conprofile.fri.uniza.sk:3000",
                    },
                    ValidAudiences = new[]
                    {
                        "http://localhost:5000",
                        "http://conprofile.fri.uniza.sk:5000",
                        "https://conprofile.fri.uniza.sk"
                    },
                    NameClaimType = "email",

                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("L#9pD2m0oP7rW!4xN*1vL#9pD2m0oP7rW!4xN*1vL#9pD2m0oP7rW!4xN*1v"))
                };
            })
            ;

builder.Services.AddAuthorization();
builder.Services.AddAuthentication();



// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApiDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

try { 
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApiDbContext>();
        if (dbContext.Database.GetPendingMigrations().Any())
        {
            dbContext.Database.Migrate();
        }
    }
} catch {
    Console.WriteLine("No migrations.");
}

app.UseAuthentication();
app.UseAuthorization();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}


app.UseHttpsRedirection();
app.UseCors(AllowSpecificOrigins);
app.UseAuthorization();

app.MapControllers();

app.Run();
