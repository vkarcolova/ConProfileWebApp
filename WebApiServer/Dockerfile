# Použitie ASP.NET 8.0 runtime pre finálny kontajner
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER app
WORKDIR /app
EXPOSE 3000

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["WebApiServer.csproj", "."]

RUN dotnet restore "./WebApiServer.csproj"

COPY . . 
WORKDIR "/src/."
RUN dotnet build "./WebApiServer.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./WebApiServer.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS ef
RUN dotnet tool install --global dotnet-ef

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

COPY --from=ef /root/.dotnet/tools /root/.dotnet/tools
ENV PATH="${PATH}:/root/.dotnet/tools"

ENTRYPOINT ["dotnet", "WebApiServer.dll"]
