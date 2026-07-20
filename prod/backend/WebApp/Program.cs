using Microsoft.OpenApi.Models;
using WebApp.Extensions;
using WebApp.Abstractions.Auth;
using WebApp.Data;
using WebApp.Endpoints.RailwayCisterns;
using WebApp.Services;
using WebApp.Services.Authentication;
using WebApp.Middlewares;


var builder = WebApplication.CreateBuilder(args);

var services = builder.Services;
var configuration = builder.Configuration;

services.AddApiAuthentication(configuration);


services.AddEndpointsApiExplorer();

// Добавляем CORS
services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AspireApp API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Заголовок авторизации JWT с использованием схемы Bearer. Пример: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            []
        }
    });
});

services.Configure<JwtOptions>(configuration.GetSection(nameof(JwtOptions)));
services.Configure<AuthorizationOptions>(configuration.GetSection(nameof(AuthorizationOptions)));

services.AddHttpContextAccessor();
services.AddScoped<ICurrentUserService, CurrentUserService>();
services.AddScoped<DocumentExportService>();

builder.Services.AddHttpClient("FastAPI", c => {
    c.BaseAddress = new Uri("http://127.0.0.1:8005/");
}).ConfigurePrimaryHttpMessageHandler(() => new HttpClientHandler
{
    UseProxy = false
});

services
    .AddPersistence(configuration)
    .AddApplication()
    .AddInfrastructure();

services.AddAuthorization();

builder.Services.AddProblemDetails();
services.AddTransient<GlobalExceptionHandlingMiddleware>();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "AspireApp API V1");
});

app.UseCors("AllowFrontend");

// Добавляем глобальную обработку ошибок
app.UseMiddleware<GlobalExceptionHandlingMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

// Log API actions (non-GET) for authenticated users
app.UseMiddleware<ActionLoggingMiddleware>();

app.AddMappedEndpoints();


app.Run();
