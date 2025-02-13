﻿using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json.Linq;
using System;
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
        public async Task<IActionResult> UploadExcelToDatabank([FromBody] DatabankFileDTO excelFile)
        {
            if (excelFile == null || excelFile.Content == null)
                return BadRequest("Neplatné dáta súboru.");

            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (string.IsNullOrEmpty(userEmail) || !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized("Neplatné prihlásenie.");

            try
            {
                var newFile = new DataBankFile
                {
                    FileName = excelFile.FileName,
                    Type = excelFile.Type,
                    Size = excelFile.Size,
                    Content = Convert.FromBase64String(excelFile.Content),
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

                    var newFile = new DataBankFile
                    {
                        FileName = file.FileName,
                        Type = file.Type,
                        Size = file.Size,
                        Content = Convert.FromBase64String(file.Content),
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

        [HttpGet("GetAllDatabankData")] // ked je v rezime  prihlasenia  
        public ActionResult<List<DatabankFolderDTO>> GetAllDatabankData()
        {
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized("Neplatné prihlásenie");

            List<DataBankFolder> folders = _context.DataBankFolders.ToList();
            List<DatabankFolderDTO> result = new List<DatabankFolderDTO>();
            foreach (var folder in folders)
            {
                List<DataBankFile> files = _context.DataBankFiles.Where(x => x.FolderId == folder.Id).ToList();
                List<DatabankFileDTO> resultFiles = new List<DatabankFileDTO>();
                foreach(var file in files)
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
                    });
                }

                result.Add(new DatabankFolderDTO{
                   CreatedAt= folder.CreatedAt,
                   FolderName = folder.FolderName,
                   Id = folder.Id,
                   Files = resultFiles
                });
            }


            List<DataBankFile> excelFiles = _context.DataBankFiles.Where(x => x.FolderId == null && x.Type == "Excel").ToList();
            List<DatabankFileDTO> resultExcelFiles = new List<DatabankFileDTO>();
            foreach (var file in excelFiles)
            {
                resultExcelFiles.Add(new DatabankFileDTO
                {
                    Id = file.Id,
                    FileName = file.FileName,
                    Content = "", 
                    Size = file.Size,
                    Type = file.Type,
                    UploadedAt = file.UploadedAt,
                    UploadedBy = file.UploadedBy,
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

            if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized("Neplatné prihlásenie");


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


    }
}
