﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json.Linq;
using System.IdentityModel.Tokens.Jwt;
using System.Net.NetworkInformation;
using System.Security.Claims;
using System.Text;
using WebApiServer.Data;
using WebApiServer.DTOs;
using WebApiServer.Services;

namespace WebApiServer.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class UserController : ControllerBase
    {

        private readonly ApiDbContext _context;
        private readonly IUserService _userService;

        public UserController(ApiDbContext context, IUserService userService)
        {
            _context = context;
            _userService = userService;
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterFormDTO registerForm)
        {

            if (registerForm == null || registerForm.EMAIL == "" || registerForm.PASSWORD2 == "" || registerForm.PASSWORD == "") return BadRequest("Registračný formulár nebol vyplnený");
            if (registerForm.PASSWORD != registerForm.PASSWORD2) return BadRequest("Heslá sa nezhodujú");
            
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == registerForm.EMAIL);
            if (existingUser != null)
            {
                return BadRequest("Emailová adresa je už registrovaná.");
            }

            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            string token = "";
            if (userToken == "")
                token = _userService.GenerateJwtToken();
            else token = userToken;

            var passwordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(registerForm.PASSWORD);

            var newUser = new User
            {
                UserEmail = registerForm.EMAIL,
                PasswordHash = passwordHash
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            return Ok(new {TOKEN = token, EMAIL = newUser.UserEmail});
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginUser)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == loginUser.EMAIL);
            if (user == null)
            {
                return Unauthorized("Nesprávne údaje.");
            }

            if (!BCrypt.Net.BCrypt.EnhancedVerify(loginUser.PASSWORD, user.PasswordHash))
            {
                return Unauthorized("Nesprávne údaje.");
            }

            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            string token = "";

            if (userToken == "" || userToken == null)
                token = _userService.GenerateJwtToken();
            else token = userToken;


            return Ok(new { TOKEN = token, EMAIL = loginUser.EMAIL });
        }
    }
}