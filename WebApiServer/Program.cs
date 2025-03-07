using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
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
                            .AllowAnyMethod()
                           .AllowCredentials()
                            .SetIsOriginAllowed(origin => true);
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
                        "https://conprofile.fri.uniza.sk:3000",
                        
                    },
                    ValidAudiences = new[]
                    {
                        "http://localhost:5000",
                        "http://conprofile.fri.uniza.sk:5000",
                        "https://conprofile.fri.uniza.sk"
                    },
                    NameClaimType = ClaimTypes.Email,
                    RoleClaimType = ClaimTypes.Role,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("L#9pD2m0oP7rW!4xN*1vL#9pD2m0oP7rW!4xN*1vL#9pD2m0oP7rW!4xN*1v"))
                };
            })
            ;


// Add services to the container.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApiDbContext>(options => options.UseNpgsql(connectionString));

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

//app.Use(async (context, next) =>
//{
//    if (context.Request.Method == "OPTIONS")
//    {
//        var origin = context.Request.Headers["Origin"].ToString();

//        var allowedOrigins = new[] { "http://localhost:5000", "https://conprofile.fri.uniza.sk" };

//        if (allowedOrigins.Contains(origin))
//            context.Response.Headers["Access-Control-Allow-Origin"] = origin;
//        else
//            context.Response.Headers["Access-Control-Allow-Origin"] = "null";
//        context.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
//        context.Response.Headers.Add("Access-Control-Allow-Headers", "Authorization, Content-Type, UserEmail");
//        context.Response.StatusCode = 204;
//        return;
//    }
//    await next();
//});
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
app.UseCors(AllowSpecificOrigins);
app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}



app.MapControllers();

app.Run();
