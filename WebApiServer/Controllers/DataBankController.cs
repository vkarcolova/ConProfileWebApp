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
    public class DataBankController : ControllerBase
    {

        private readonly ApiDbContext _context;
        private readonly IUserService _userService;

        public DataBankController(ApiDbContext context, IUserService userService)
        {
            _context = context;
            _userService = userService;
        }

        [HttpPost("UploadExcelToDatabank")]
        public async Task<IActionResult> UploadExcelToDatabank([FromBody] ExcelDatabankDTO excelFile)
        {
            if (excelFile == null || string.IsNullOrEmpty(excelFile.Content))
                return BadRequest("Neplatné dáta súboru.");

            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (string.IsNullOrEmpty(userEmail) || !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized("Neplatné prihlásenie.");

            try
            {
                var fileBytes = Convert.FromBase64String(excelFile.Content);

                var newFile = new DataBankFile
                {
                    FileName = excelFile.FileName,
                    Type = excelFile.Type,
                    Size = excelFile.Size,
                    Content = fileBytes,
                    UploadedBy = excelFile.UploadedBy,
                    UploadedAt = excelFile.UploadedAt
                };

                _context.DataBankFiles.Add(newFile);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Súbor bol úspešne uložený!", fileId = newFile.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Interná chyba servera: {ex.Message}");
            }
        }


        [HttpPost("UploadFolderToDatabank")]
        public async Task<IActionResult> UploadFolderToDatabank([FromBody] DatabankFolderDTO folder)
        {
            if (folder == null || folder.Files.Count == 0)
                return BadRequest("Neplatné dáta súboru.");

            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (string.IsNullOrEmpty(userEmail) || !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized("Neplatné prihlásenie.");

            try
            {

                int idFolder = 1;
                if (_context.DataBankFolders.Count() >= 1)
                {
                    idFolder = _context.DataBankFolders.OrderByDescending(obj => obj.Id)
                     .FirstOrDefault().Id + 1;
                }
                foreach (var file in folder.Files)
                {
                    var fileBytes = Convert.FromBase64String(file.Content);

                    var newFile = new DataBankFile
                    {
                        FileName = file.FileName,
                        Type = file.Type,
                        Size = file.Size,
                        Content = fileBytes,
                        FolderId = idFolder,
                        UploadedBy = file.UploadedBy,
                        UploadedAt = file.UploadedAt
                    };

                    _context.DataBankFiles.Add(newFile);
                }

                var newFolder = new DataBankFolder
                {
                    FolderName = folder.FolderName,
                    Id = idFolder,
                    CreatedAt = folder.CreatedAt
                };
                _context.DataBankFolders.Add(newFolder);
               
                await _context.SaveChangesAsync();

                return Ok(new { message = "Súbor bol úspešne uložený!", folder = newFolder.Id });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Interná chyba servera: {ex.Message}");
            }
        }


    }
}
