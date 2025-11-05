using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.IdentityModel.Tokens;
using WebApp.Abstractions.Services;
using WebApp.Data.Enums;
using WebApp.Endpoints;
using WebApp.Endpoints.RailwayCisterns;
using WebApp.Services;
using WebApp.Services.Authentication;

namespace WebApp.Extensions;

public static class ApiExtensions
{
    public static void AddMappedEndpoints(this IEndpointRouteBuilder app)
    {
        app.MapVersionEndpoints();
        app.MapUsersEndpoints();

        app.MapSavedFilterEndpoints();
        app.MapFilterTypeEndpoints();

        // Railway cisterns endpoints
        app.MapRailwayCisternEndpoints();
        app.MapRepairTypeEndpoints();
        app.MapManufacturerEndpoints();
        app.MapWagonModelEndpoints();
        app.MapWagonTypeEndpoints();
        app.MapRegistrarEndpoints();
        app.MapOwnerEndpoints();
        app.MapAffiliationEndpoints();
        app.MapMilageCisternEndpoints();
        app.MapLocationEndpoints();
        app.MapDepotEndpoints();
        app.MapRailwayCisternFilterEndpoints();
        
        // Part related endpoints
        app.MapPartStatusEndpoints();
        app.MapPartTypeEndpoints();
        app.MapStampNumberEndpoints();
        app.MapPartsEndpoints();
        app.MapPartFilterEndpoints();
        app.MapEquipmentTypeEndpoints();
        app.MapPartEquipmentEndpoints();
        
        // New endpoints
        app.MapStationEndpoints();
        app.MapDocumentEndpoints();
        app.MapVesselEndpoints();
    }

    public static void AddApiAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var jwtOptions = configuration.GetSection(nameof(JwtOptions)).Get<JwtOptions>();

        services
            .AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultSignInScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(JwtBearerDefaults.AuthenticationScheme, options =>
            {
                options.RequireHttpsMetadata = true;
                options.SaveToken = true;

                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtOptions!.SecretKey))
                };
            });

        services.AddScoped<IPermissionService, PermissionService>();
        services.AddSingleton<IAuthorizationHandler, PermissionAuthorizationHandler>();
    }

    public static IEndpointConventionBuilder RequirePermissions<TBuilder>(
        this TBuilder builder, params Permission[] permissions)
            where TBuilder : IEndpointConventionBuilder
    {
        return builder
            .RequireAuthorization(pb =>
                pb.AddRequirements(new PermissionRequirement(permissions)));
    }
}