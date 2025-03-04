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
                PasswordHash = passwordHash,
                Role = "user"
            };

            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();
            return Ok(new { TOKEN = userToken, EMAIL = newUser.UserEmail });
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
    }
}
