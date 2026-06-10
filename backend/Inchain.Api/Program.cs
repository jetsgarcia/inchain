using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Inchain.Api.Data;
using Inchain.Api.Features.Admin.Users.Services;

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddAuthorization();
builder.Services
    .AddIdentityApiEndpoints<IdentityUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();
builder.Services.AddControllers();

// Feature services
builder.Services.AddScoped<IUserService, UserService>();

var app = builder.Build();

// HTTP request pipeline
app.MapIdentityApi<IdentityUser>();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
