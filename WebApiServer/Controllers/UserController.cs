using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json.Linq;
using System.IdentityModel.Tokens.Jwt;
using System.Net.NetworkInformation;
using System.Security.Claims;
using System.Text;
using WebApiServer.Data;
using WebApiServer.DTOs;
using WebApiServer.Models;
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
            if (registerForm.PASSWORD != registerForm.PASSWORD2) return BadRequest(new { message = "Heslá sa nezhodujú" });
            
            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == registerForm.EMAIL);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Emailová adresa je už registrovaná." });
            }
            var oldToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            var userToken = _userService.GenerateJwtToken(registerForm.EMAIL);

            if (!string.IsNullOrEmpty(oldToken))
            {
                await _userService.MoveHostProjectsToUser(oldToken, userToken, registerForm.EMAIL);
            }

            var passwordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(registerForm.PASSWORD);

            var newUser = new User
            {
                UserEmail = registerForm.EMAIL,
                PasswordHash = passwordHash
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            return Ok(new {TOKEN = userToken, EMAIL = newUser.UserEmail});
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginUser)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == loginUser.EMAIL);
            if (user == null)
            {
                return Unauthorized(new { message = "Nesprávne údaje." });
            }

            if (!BCrypt.Net.BCrypt.EnhancedVerify(loginUser.PASSWORD, user.PasswordHash))
            {
                return Unauthorized(new { message = "Nesprávne údaje." });
            }

            var oldToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            var userToken = _userService.GenerateJwtToken(loginUser.EMAIL);

            if (!string.IsNullOrEmpty(oldToken))
            {
                await _userService.MoveHostProjectsToUser(oldToken, userToken, loginUser.EMAIL);
            }

            return Ok(new { TOKEN = userToken, EMAIL = loginUser.EMAIL });
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized(new { message = "Neplatné prihlásenie" });
            var allLoadedData = await _context.Users.Select(x => x.UserEmail).ToListAsync();

            return Ok(allLoadedData);
        }
    }
}
