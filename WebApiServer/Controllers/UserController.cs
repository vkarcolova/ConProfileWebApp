using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Net.NetworkInformation;
using System.Security.Claims;
using System.Text;
using WebApiServer.Data;
using WebApiServer.Services;

namespace WebApiServer.Controllers
{
    public class UserController : Controller
    {

        private readonly ApiDbContext _context;
        private readonly IUserService _userService;

        public UserController(ApiDbContext context, IUserService userService)
        {
            _context = context;
            _userService = userService;
        }

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            if(user == null) return BadRequest();
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == user.UserEmail);
            if (existingUser != null)
            {
                return BadRequest("Email is already registered.");
            }

            var passwordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(user.PasswordHash);

            var newUser = new User
            {
                UserEmail = user.UserEmail,
                PasswordHash = passwordHash
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok("User registered successfully.");
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] User loginUser)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == loginUser.UserEmail);
            if (user == null)
            {
                return Unauthorized("Invalid credentials.");
            }

            if (!BCrypt.Net.BCrypt.Verify(loginUser.PasswordHash, user.PasswordHash))
            {
                return Unauthorized("Invalid credentials.");
            }

            var tokenString = _userService.GenerateJwtToken();

            return Ok(new { Token = tokenString });
        }
    }
}
