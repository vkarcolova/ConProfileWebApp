using Accord.Math.Geometry;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json.Linq;
using System;
using System.Collections;
using System.Collections.Generic;
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
        public async Task<IActionResult> UploadExcelToDatabank([FromBody] DatabankFileDTO excelFile)
        {
            if (excelFile == null || excelFile.Content == null)
                return BadRequest(new { message = "Neplatné dáta súboru." });

            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (string.IsNullOrEmpty(userEmail) || !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized(new { message = "Neplatné prihlásenie" });

            try
            {
                var newFile = new DataBankFile
                {
                    FileName = excelFile.FileName,
                    Type = excelFile.Type,
                    Size = excelFile.Size,
                    Content = Convert.FromBase64String(excelFile.Content),
                    UploadedBy = excelFile.UploadedBy,
                    UploadedAt = excelFile.UploadedAt,
                    Public = false
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
                return Unauthorized(new { message = "Neplatné prihlásenie" });

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

                    var newFile = new DataBankFile
                    {
                        FileName = file.FileName,
                        Type = file.Type,
                        Size = file.Size,
                        Content = Convert.FromBase64String(file.Content),
                        FolderId = idFolder,
                        UploadedBy = file.UploadedBy,
                        Public = false,
                        UploadedAt = file.UploadedAt
                    };
                    _context.DataBankFiles.Add(newFile);
                }

                var newFolder = new DataBankFolder
                {
                    FolderName = folder.FolderName,
                    Id = idFolder,
                    CreatedAt = folder.CreatedAt,
                    UploadedBy = userEmail,
                    Public = false

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

        [HttpGet("GetAllDatabankData")] // ked je v rezime  prihlasenia  
        public ActionResult<List<DatabankFolderDTO>> GetAllDatabankData()
        {
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (string.IsNullOrEmpty(userEmail) || !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized(new { message = "Neplatné prihlásenie" });

            var folders = _context.DataBankFolders
                .Where(folder =>
                       folder.UploadedBy == userEmail
                    || folder.Public == true ||
                       _context.DatabankShareUsers.Any(fs =>
                           fs.UserId == userEmail &&
                           fs.ShareableType == ShareableType.Folder &&
                           fs.ShareableId == folder.Id))
                .ToList();
            List<DatabankFolderDTO> result = new List<DatabankFolderDTO>();
            foreach (var folder in folders)
            {
                List<DataBankFile> files = _context.DataBankFiles.Where(x => x.FolderId == folder.Id).ToList();
                List<string> shares = _context.DatabankShareUsers.Where(x => x.ShareableId == folder.Id && x.ShareableType == ShareableType.Folder).Select(x => x.UserId).ToList();
                List<DatabankFileDTO> resultFiles = new List<DatabankFileDTO>();
                foreach (var file in files)
                {
                    resultFiles.Add(new DatabankFileDTO
                    {
                        Id = file.Id,
                        FolderId = folder.Id,
                        FileName = file.FileName,
                        Content = "", //TODO zatial nejdem posielat aj obsahy
                        Size = file.Size,
                        Type = file.Type,
                        UploadedAt = file.UploadedAt,
                        UploadedBy = file.UploadedBy,
                        Public = file.Public
                    });
                }

                result.Add(new DatabankFolderDTO
                {
                    CreatedAt = folder.CreatedAt,
                    FolderName = folder.FolderName,
                    Id = folder.Id,
                    UploadedBy = folder.UploadedBy,
                    Public = folder.Public,
                    Files = resultFiles
                    ,
                    Shares = shares
                });
            }



            List<DataBankFile> excelFiles = _context.DataBankFiles.Where(x => (x.FolderId == null && x.Type == "Excel") &&
            (x.UploadedBy == userEmail
                    || x.Public == true ||
                       _context.DatabankShareUsers.Any(fs =>
                           fs.UserId == userEmail &&
                           fs.ShareableType == ShareableType.File &&
                           fs.ShareableId == x.Id)))
                .ToList();
            List<DatabankFileDTO> resultExcelFiles = new List<DatabankFileDTO>();
            foreach (var file in excelFiles)
            {
                List<string> shares = _context.DatabankShareUsers.Where(x => x.ShareableId == file.Id && x.ShareableType == ShareableType.File).Select(x => x.UserId).ToList();

                resultExcelFiles.Add(new DatabankFileDTO
                {
                    Id = file.Id,
                    FileName = file.FileName,
                    Content = "",
                    Size = file.Size,
                    Type = file.Type,
                    UploadedAt = file.UploadedAt,
                    UploadedBy = file.UploadedBy,
                    Shares = shares,
                    Public = file.Public,
                });
            }

            result.Add(new DatabankFolderDTO
            {
                CreatedAt = DateTime.Now,
                FolderName = "Dummy",
                Files = resultExcelFiles
            });

            if (result == null)
            {
                return NotFound();
            }
            else
            {
                return result;
            }
        }


        [HttpPost("GetExcelsForUpload")] // ked je v rezime  prihlasenia  
        public IActionResult GetExcelsForUpload(string[] ids)
        {
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (string.IsNullOrEmpty(userEmail) || !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized(new { message = "Neplatné prihlásenie" });


            List<int> excelFileIds = ids
                .Where(id => id.StartsWith("file"))
                .Select(id => int.Parse(id.Substring(4)))
                .ToList();


            var files = _context.DataBankFiles
                .Where(x => excelFileIds.Contains(x.Id) && x.Type == "Excel")
                  .Select(file => new
                  {
                      file.Id,
                      file.FileName,
                      ContentBase64 = Convert.ToBase64String(file.Content)
                  })
                .ToList();


            if (files == null)
            {
                return NotFound();
            }
            else
            {
                return Ok(files);
            }
        }
        [HttpDelete("DeleteDatabankObject/{id}")]
        public ActionResult DeleteDatabankObject(string id)
        {
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (string.IsNullOrEmpty(userEmail) || !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized(new { message = "Neplatné prihlásenie" });

            Regex regex = new Regex(@"^(?<prefix>[a-zA-Z]+)(?<number>\d+)$");
            Match match = regex.Match(id);

            if (match.Success)
            {
                string prefix = match.Groups["prefix"].Value;
                int idnumber = int.Parse(match.Groups["number"].Value);

                if (prefix == "folder")
                {
                    DataBankFolder dataBankFolder = _context.DataBankFolders.Where(folder => folder.Id == idnumber).FirstOrDefault();
                    List<DataBankFile> files = _context.DataBankFiles.Where(file => file.FolderId == idnumber).ToList();
                    if (files[0].UploadedBy != userEmail) return BadRequest();
                    _context.DataBankFiles.RemoveRange(files);
                    _context.DataBankFolders.Remove(dataBankFolder);
                    _context.SaveChanges();
                    return Ok();

                }
                else if (prefix == "file")
                {
                    DataBankFile file = _context.DataBankFiles.Where(file => file.Id == idnumber).FirstOrDefault();
                    if (file.UploadedBy != userEmail) return BadRequest();
                    _context.DataBankFiles.Remove(file);
                    _context.SaveChanges();
                    return Ok();
                }

            }

            return BadRequest();

        }


        [HttpPost("ChangeDatabankShareSettings")]
        public ActionResult ChangeDatabankShareSettings(ShareDatabankObjectDTO shareData)
        {
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (string.IsNullOrEmpty(userEmail) || !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized(new { message = "Neplatné prihlásenie" });
            if (shareData == null || string.IsNullOrEmpty(shareData.Id)) return BadRequest();


            Regex regex = new Regex(@"^(?<prefix>[a-zA-Z]+)(?<number>\d+)$");
            Match match = regex.Match(shareData.Id);


            if (match.Success)
            {
                string prefix = match.Groups["prefix"].Value;
                int idnumber = int.Parse(match.Groups["number"].Value);

                if (prefix == "folder")
                {
                    DataBankFolder dataBankFolder = _context.DataBankFolders.Where(folder => folder.Id == idnumber).FirstOrDefault();
                    if (dataBankFolder == null) return BadRequest();

                    List<string> oldUsers = _context.DatabankShareUsers.Where(x => x.ShareableType == ShareableType.Folder &&
                    x.ShareableId == idnumber).Select(x=> x.UserId).ToList();

                    var missingInOldUsers = shareData.Users.Except(oldUsers).ToList(); //odobrat tychto do db

                    var missingInNewUsers = oldUsers.Except(shareData.Users).ToList(); //pridat tychto do db

                    foreach (var userToRemove in missingInNewUsers)
                    {
                        DatabankShareUsers share = _context.DatabankShareUsers.Where(x => x.UserId == userToRemove && x.ShareableId == idnumber && x.ShareableType == ShareableType.Folder).FirstOrDefault();
                        _context.DatabankShareUsers.Remove(share);
                    }

                    int idShare = 1;
                    if (_context.DatabankShareUsers.Count() >= 1)
                    {
                        idShare = _context.DatabankShareUsers.OrderByDescending(obj => obj.Id)
                         .FirstOrDefault().Id + 1;
                    }
                    foreach (var userToAdd in missingInOldUsers)
                    {
                  
                        var newShare = new DatabankShareUsers
                        {
                            CreatedBy = userEmail,
                            ShareableType = ShareableType.Folder,
                            UserId = userToAdd,
                            CreatedAt = DateTime.UtcNow,
                            Id = idShare,
                            ShareableId = idnumber
                        };
                        _context.DatabankShareUsers.Add(newShare);
                        idShare++;
                    }

                    if(shareData.Public != dataBankFolder.Public)
                    {
                        dataBankFolder.Public = shareData.Public;
                        var files = _context.DataBankFiles.Where(x => x.FolderId == idnumber).ToList();
                        foreach (var file in files) file.Public = shareData.Public;
                    }
                   
                    _context.SaveChanges();
                    return Ok();

                }
                else if (prefix == "file")
                {
                    DataBankFile databankFile = _context.DataBankFiles.Where(x => x.Id == idnumber).FirstOrDefault();
                    if (databankFile == null) return BadRequest();
                    List<string> oldUsers = _context.DatabankShareUsers.Where(x => x.ShareableType == ShareableType.File &&
                      x.ShareableId == idnumber).Select(x => x.UserId).ToList();

                    var missingInOldUsers = shareData.Users.Except(oldUsers).ToList(); //odobrat tychto do db

                    var missingInNewUsers = oldUsers.Except(shareData.Users).ToList(); //pridat tychto do db

                    foreach (var userToRemove in missingInNewUsers)
                    {
                        DatabankShareUsers share = _context.DatabankShareUsers.Where(x => x.UserId == userToRemove && x.ShareableId == idnumber && x.ShareableType == ShareableType.File).FirstOrDefault();
                        _context.DatabankShareUsers.Remove(share);
                    }

                    int idShare = 1;
                    foreach (var userToAdd in missingInOldUsers)
                    {
                        if (_context.DatabankShareUsers.Count() >= 1)
                        {
                            idShare = _context.DatabankShareUsers.OrderByDescending(obj => obj.Id)
                             .FirstOrDefault().Id + 1;
                        }
                        var newShare = new DatabankShareUsers
                        {
                            CreatedBy = userEmail,
                            ShareableType = ShareableType.File,
                            UserId = userToAdd,
                            CreatedAt = DateTime.UtcNow,
                            Id = idShare,
                            ShareableId = idnumber
                        };
                        _context.DatabankShareUsers.Add(newShare);
                        idShare++;
                    }

                    if (shareData.Public != databankFile.Public)
                    {
                        databankFile.Public = shareData.Public;
                    }

                    _context.SaveChanges();
                    return Ok();
                }

            }

            return BadRequest();

        }

    }
}
