using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Globalization;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Numerics;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json.Linq;
using WebApiServer.Data;
using WebApiServer.DTOs;
using WebApiServer.Models;
using static System.Net.Mime.MediaTypeNames;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace WebApiServer.Services
{
    public interface IUserService
    {
        public string GenerateJwtToken( string userEmail = null);
        public bool IsAuthorized(string userEmail, string userToken);

        public  Task<IActionResult> MoveHostProjectsToUser(string oldToken, string newToken, string userEmail);
    }

    public class UserService : IUserService
    {
        private readonly ApiDbContext _context;

        public UserService(ApiDbContext context)
        {
            _context = context;
        }

        public string GenerateJwtToken(string userEmail = null)
        {
            // Generovanie JWT tokenu bez identifikátora užívate¾a
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes("L#9pD2m0oP7rW!4xN*1vL#9pD2m0oP7rW!4xN*1vL#9pD2m0oP7rW!4xN*1v");
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Expires = DateTime.UtcNow.AddDays(30),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };


            if (userEmail != null)
            {
                var role = _context.Users.Where(x => x.UserEmail == userEmail).FirstOrDefault();
                tokenDescriptor.Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.Email, userEmail),
                    new Claim(ClaimTypes.Role, role.Role) 
                });
            }
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public bool IsAuthorized(string userEmail, string userToken)
        {

            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadToken(userToken) as JwtSecurityToken;

            var emailFromToken = jsonToken?.Claims.FirstOrDefault(c => c.Type == "email")?.Value;


            if (emailFromToken == null || emailFromToken != userEmail)
            {
                return false;
            }
            return true;

        }

        public async Task<IActionResult> MoveHostProjectsToUser(string oldToken, string newToken, string userEmail)
        {
            List<Project> projects = _context.Projects.Where(project => project.Token == oldToken || project.CreatedBy == userEmail).ToList();
            foreach(var project in projects)
            {
                project.Token = newToken;
                project.CreatedBy = userEmail;
            }
            await _context.SaveChangesAsync();
            return new OkResult();
        }

    }
}
