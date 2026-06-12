using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Inchain.Api.Data;
using Inchain.Api.Features.Admin.ApprovalRoutes.Repositories;
using Inchain.Api.Features.Admin.ApprovalRoutes.Services;
using Inchain.Api.Features.Admin.DocumentTypes.Repositories;
using Inchain.Api.Features.Admin.DocumentTypes.Services;
using Inchain.Api.Features.Admin.Users.Repositories;
using Inchain.Api.Features.Admin.Users.Services;
using Inchain.Api.Features.Common;

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});
builder.Services.AddAuthorization();
builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<ApplicationRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();
builder.Services.AddControllers();

// Feature services
builder.Services.AddScoped<IApprovalRouteRepository, ApprovalRouteRepository>();
builder.Services.AddScoped<IApprovalRouteService, ApprovalRouteService>();
builder.Services.AddScoped<IDocumentTypeRepository, DocumentTypeRepository>();
builder.Services.AddScoped<IDocumentTypeService, DocumentTypeService>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

var app = builder.Build();

// HTTP request pipeline
app.MapIdentityApi<ApplicationUser>();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseMiddleware<DisabledUserMiddleware>();
app.UseAuthorization();

app.MapControllers();

app.Run();
