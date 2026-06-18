using Microsoft.EntityFrameworkCore;
using Inchain.Api.Features.Admin.ActivityLogs.Repositories;
using Inchain.Api.Features.Admin.ActivityLogs.Services;
using Inchain.Api.Data;
using Inchain.Api.Features.Admin.ApprovalRoutes.Repositories;
using Inchain.Api.Features.Admin.ApprovalRoutes.Services;
using Inchain.Api.Features.Admin.DocumentTypes.Repositories;
using Inchain.Api.Features.Admin.DocumentTypes.Services;
using Inchain.Api.Features.Admin.Users.Repositories;
using Inchain.Api.Features.Admin.Users.Services;
using Inchain.Api.Features.Common;
using Inchain.Api.Features.DocumentRequests.Repositories;
using Inchain.Api.Features.DocumentRequests.Services;
using Microsoft.AspNetCore.Http.Features;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"));
});

// CORS
if (builder.Environment.IsDevelopment())
{
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowReactApp", policy =>
        {
            policy
                .WithOrigins("http://localhost:5173")
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
    });
}

// Auth
builder.Services.AddAuthorization();

builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>()
    .AddRoles<ApplicationRole>()
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddControllers();

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 20 * 1024 * 1024;
    options.MultipartBoundaryLengthLimit = 1024;
    options.MultipartHeadersLengthLimit = 16 * 1024;
    options.ValueLengthLimit = 10 * 1024 * 1024;
});

// Feature repositories and services
builder.Services.AddScoped<IAdminActivityLogRepository, AdminActivityLogRepository>();
builder.Services.AddScoped<IAdminActivityLogService, AdminActivityLogService>();

builder.Services.AddScoped<IApprovalRouteRepository, ApprovalRouteRepository>();
builder.Services.AddScoped<IApprovalRouteService, ApprovalRouteService>();

builder.Services.AddScoped<IDocumentTypeRepository, DocumentTypeRepository>();
builder.Services.AddScoped<IDocumentTypeService, DocumentTypeService>();

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();

builder.Services.AddScoped<IDocumentRequestRepository, DocumentRequestRepository>();
builder.Services.AddScoped<IDocumentRequestService, DocumentRequestService>();

var app = builder.Build();

await ApplicationSeedData.EnsureSeedDataAsync(app.Services);

// HTTP request pipeline
app.UseHttpsRedirection();

if (app.Environment.IsDevelopment())
{
    app.UseCors("AllowReactApp");
}

app.UseAuthentication();
app.UseMiddleware<DisabledUserMiddleware>();
app.UseAuthorization();

app.MapIdentityApi<ApplicationUser>();
app.MapControllers();

app.Run();
