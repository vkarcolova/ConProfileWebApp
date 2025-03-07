using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json.Linq;
using System.IdentityModel.Tokens.Jwt;
using System.Net.NetworkInformation;
using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
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
            if (registerForm == null || string.IsNullOrWhiteSpace(registerForm.EMAIL) ||
                string.IsNullOrWhiteSpace(registerForm.PASSWORD2) || string.IsNullOrWhiteSpace(registerForm.PASSWORD))
            {
                return BadRequest("Registračný formulár nebol vyplnený.");
            }

            if (registerForm.PASSWORD != registerForm.PASSWORD2)
            {
                return BadRequest(new { message = "Heslá sa nezhodujú." });
            }

            if (!Regex.IsMatch(registerForm.PASSWORD, @"^(?=.*\d).{8,}$"))
            {
                return BadRequest(new { message = "Heslo musí mať aspoň 8 znakov a obsahovať aspoň jedno číslo." });
            }

            var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == registerForm.EMAIL);
            if (existingUser != null)
            {
                return BadRequest(new { message = "Emailová adresa je už registrovaná." });
            }

            string verificationToken = _userService.GenerateVerificationTokenForRegistration(registerForm.EMAIL, registerForm.PASSWORD);

            _userService.SendVerificationEmail(registerForm.EMAIL, verificationToken, true);

            return Ok(new { message = "Overovací e-mail bol odoslaný." });
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

        [HttpPost("ChangePassword")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDTO request)
        {
            var userEmail = Request.Headers["UserEmail"].ToString();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == userEmail);
            if (user == null)
            {
                return Unauthorized(new { message = "Nesprávne údaje." });
            }

            if (!BCrypt.Net.BCrypt.EnhancedVerify(request.OldPassword, user.PasswordHash)) return Unauthorized(new { message = "Zadané heslo bolo nesprávne." });

            if (request.OldPassword == request.NewPassword) return BadRequest(new { message = "Nové heslo nemôže byť rovnaké ako vaše pôvodné." });

            if (request.ConfirmPassword != request.NewPassword) return BadRequest(new { message = "Heslá sa nezhodujú." });

            if (!Regex.IsMatch(request.NewPassword, @"^(?=.*\d).{8,}$"))
            {
                return BadRequest(new { message = "Heslo musí mať aspoň 8 znakov a obsahovať aspoň jedno číslo." });
            }
            var passwordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(request.NewPassword);

            user.PasswordHash = passwordHash;
            _context.SaveChanges();

            return Ok();
        }

        [HttpPost("DeleteUser")]
        public async Task<IActionResult> DeleteUser([FromBody] DeleteUserDTO request)
        {
            var userEmail = Request.Headers["UserEmail"].ToString();

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == userEmail);
            if (user == null)
            {
                return Unauthorized(new { message = "Nesprávne údaje." });
            }

            if (!BCrypt.Net.BCrypt.EnhancedVerify(request.Password, user.PasswordHash)) return Unauthorized(new { message = "Zadané heslo bolo nesprávne." });
            List<Project> projects = _context.Projects.Where(x => x.CreatedBy == userEmail).ToList();
            foreach (var project in projects)
            {
                List<LoadedFolder> folders = _context.LoadedFolders.Where(folder => folder.IdProject == project.IdProject).ToList();
                foreach (LoadedFolder folder in folders)
                {
                    List<LoadedFile> files = _context.LoadedFiles.Where(file => file.IdFolder == folder.IdFolder).ToList();
                    foreach (LoadedFile file in files)
                    {
                        List<LoadedData> data = _context.LoadedDatas.Where(datas => datas.IdFile == file.IdFile).ToList();

                        _context.LoadedDatas.RemoveRange(data);
                    }
                    _context.LoadedFiles.RemoveRange(files);

                    List<ProfileData> profile = _context.ProfileDatas.Where(data => data.IdFolder == folder.IdFolder).ToList();
                    _context.ProfileDatas.RemoveRange(profile);
                }

                _context.LoadedFolders.RemoveRange(folders);


            }
            _context.Projects.RemoveRange(projects);

            if (request.DeleteDatabankData)
            {
                List<DataBankFolder> dataBankFolders = _context.DataBankFolders.Where(x => x.UploadedBy == userEmail).ToList();
                List<DataBankFile> dataBankFiles = _context.DataBankFiles.Where(x => x.UploadedBy == userEmail).ToList();
                _context.DataBankFiles.RemoveRange(dataBankFiles);
                _context.DataBankFolders.RemoveRange(dataBankFolders);
            }
            _context.Users.Remove(user);
            _context.SaveChanges();

            return Ok();
        }

        [HttpPost("DeleteUserByAdmin")]
        public async Task<IActionResult> DeleteUserByAdmin([FromBody] string userEmail)
        {
            var adminEmail = Request.Headers["UserEmail"].ToString();
            var admin = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == adminEmail);
            if (admin == null || admin.Role != "admin")
            {
                return Unauthorized(new { message = "Nemáte na túto akciu oprávnenie." });
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == userEmail);
            if (user == null)
            {
                return Unauthorized(new { message = "Nesprávne údaje." });
            }

            List<Project> projects = _context.Projects.Where(x => x.CreatedBy == userEmail).ToList();
            foreach (var project in projects)
            {
                List<LoadedFolder> folders = _context.LoadedFolders.Where(folder => folder.IdProject == project.IdProject).ToList();
                foreach (LoadedFolder folder in folders)
                {
                    List<LoadedFile> files = _context.LoadedFiles.Where(file => file.IdFolder == folder.IdFolder).ToList();
                    foreach (LoadedFile file in files)
                    {
                        List<LoadedData> data = _context.LoadedDatas.Where(datas => datas.IdFile == file.IdFile).ToList();

                        _context.LoadedDatas.RemoveRange(data);
                    }
                    _context.LoadedFiles.RemoveRange(files);

                    List<ProfileData> profile = _context.ProfileDatas.Where(data => data.IdFolder == folder.IdFolder).ToList();
                    _context.ProfileDatas.RemoveRange(profile);
                }

                _context.LoadedFolders.RemoveRange(folders);


            }
            _context.Projects.RemoveRange(projects);


            List<DataBankFolder> dataBankFolders = _context.DataBankFolders.Where(x => x.UploadedBy == userEmail).ToList();
            List<DataBankFile> dataBankFiles = _context.DataBankFiles.Where(x => x.UploadedBy == userEmail).ToList();
            _context.DataBankFiles.RemoveRange(dataBankFiles);
            _context.DataBankFolders.RemoveRange(dataBankFolders);

            _context.Users.Remove(user);
            _context.SaveChanges();

            return Ok();
        }

        //[HttpPost("ChangeUsersRoleByAdmin")]
        //public async Task<IActionResult> ChangeUsersRoleByAdmin([FromBody] UserDTO[] users)
        //{
        //    var adminEmail = Request.Headers["UserEmail"].ToString();
        //    var admin = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == adminEmail);
        //    if (admin == null || admin.Role != "admin")
        //    {
        //        return Unauthorized(new { message = "Nemáte na túto akciu oprávnenie." });
        //    }

        //    foreach (var user in users)
        //    {
        //        var tmp = _context.Users.Where(u => u.UserEmail == user.Email).FirstOrDefault();
        //        if (tmp != null || tmp.Role != user.Role)
        //        {
        //            tmp.Role = user.Role;
        //        }
        //    }
        //    _context.SaveChanges();

        //    return Ok();
        //}

        [HttpPost("ChangeUsersRoleByAdmin")]
        public async Task<IActionResult> ChangeUsersRoleByAdmin([FromBody] UserDTO user)
        {
            var adminEmail = Request.Headers["UserEmail"].ToString();
            var admin = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == adminEmail);
            if (admin == null || admin.Role != "admin")
            {
                return Unauthorized(new { message = "Nemáte na túto akciu oprávnenie." });
            }


            var tmp = _context.Users.Where(u => u.UserEmail == user.Email).FirstOrDefault();
            if (tmp != null || tmp.Role != user.Role)
            {
                tmp.Role = user.Role;
            }


            _context.SaveChanges();

            return Ok();
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

        [HttpGet("GetAllUsersForAdmin")]
        public async Task<IActionResult> GetAllUsersForAdmin()
        {
            var adminEmail = Request.Headers["UserEmail"].ToString();
            var admin = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == adminEmail);
            if (admin == null || admin.Role != "admin")
            {
                return Unauthorized(new { message = "Nemáte na túto akciu oprávnenie." });
            }

            List<UserAllDTO> allLoadedData = await _context.Users
                .Select(x => new UserAllDTO
                {
                    Email = x.UserEmail,
                    Role = x.Role
                })
                .ToListAsync();
            foreach (var user in allLoadedData)
            {
                string[] projects = _context.Projects.Where(x => x.CreatedBy == user.Email).Select(x => x.ProjectName).ToArray();
                List<string> databankUploads = [];
                databankUploads.AddRange(_context.DataBankFolders.Where(x => x.UploadedBy == user.Email).Select(x => x.FolderName).ToArray());
                databankUploads.AddRange(_context.DataBankFiles.Where(x => x.UploadedBy == user.Email && x.Type == "Excel").Select(x => x.FileName).ToArray());

                user.Projects = projects;
                user.DatabankUploads = databankUploads.ToArray();
            }

            return Ok(allLoadedData);
        }

        [HttpGet("VerifyEmail")]
        public async Task<IActionResult> VerifyEmail(string token)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes("eEAn4BSCzj5N0YMTmiPJfh6AMndC8XZp");

            try
            {
                var claimsPrincipal = tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true
                }, out SecurityToken validatedToken);

                var email = claimsPrincipal.FindFirst(ClaimTypes.Email)?.Value;
                var passwordHash = claimsPrincipal.FindFirst("PasswordHash")?.Value;

                if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(passwordHash))
                    return BadRequest("Token neobsahuje platné údaje.");

                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == email);
                if (existingUser != null)
                    return BadRequest("Účet už existuje.");



                var newUser = new User
                {
                    UserEmail = email,
                    PasswordHash = passwordHash,
                    Role = "user"
                };

                if (email == "conprofileverify@gmail.com")
                    newUser.Role = "admin";

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                return Ok("Účet bol úspešne vytvorený. Teraz sa môžete prihlásiť.");
            }
            catch
            {
                return BadRequest("Neplatný alebo expirovaný token.");
            }
        }

        [HttpPost("ForgotPassword")]
        public async Task<IActionResult> ForgotPassword([FromBody] string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == email);
            if (user == null)
            {
                return BadRequest("Používateľ s týmto e-mailom neexistuje.");
            }

            string resetToken = _userService.GenerateResetToken(email);
            _userService.SendVerificationEmail(email, resetToken, false);

            return Ok("Resetovací e-mail bol odoslaný.");
        }

        [HttpPost("ResetPassword")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDTO request)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes("jvmpbwDZzYUJEMwrSNp55TIK3w8iiYQQ");

            try
            {
                var claimsPrincipal = tokenHandler.ValidateToken(request.Token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true
                }, out SecurityToken validatedToken);

                var email = claimsPrincipal.FindFirst(ClaimTypes.Email)?.Value;

                if (string.IsNullOrEmpty(email))
                    return BadRequest("Token neobsahuje platné údaje.");

                var user = await _context.Users.FirstOrDefaultAsync(u => u.UserEmail == email);
                if (user == null)
                    return BadRequest("Používateľ neexistuje.");
                if (request.ConfirmPassword != request.NewPassword) return BadRequest(new { message = "Heslá sa nezhodujú." });

                if (!Regex.IsMatch(request.NewPassword, @"^(?=.*\d).{8,}$"))
                {
                    return BadRequest(new { message = "Heslo musí mať aspoň 8 znakov a obsahovať aspoň jedno číslo." });
                }
                var passwordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(request.NewPassword);

                user.PasswordHash = passwordHash;

                user.PasswordHash = BCrypt.Net.BCrypt.EnhancedHashPassword(request.NewPassword);
                await _context.SaveChangesAsync();

                return Ok("Heslo bolo úspešne zmenené.");
            }
            catch
            {
                return BadRequest("Neplatný alebo expirovaný token.");
            }
        }
    }


}
