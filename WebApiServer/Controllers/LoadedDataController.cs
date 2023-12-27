using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.IdentityModel.Tokens;
using WebApiServer.Data;
using WebApiServer.DTOs;
using WebApiServer.Models;
using WebApiServer.Services;

namespace WebAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class LoadedDataController : ControllerBase
    {
        private readonly ILogger<LoadedDataController> _logger;
        private readonly ApiDbContext _context;
        private readonly ILoadedDataService _loadedDataService;

        public LoadedDataController(ApiDbContext context,
            ILogger<LoadedDataController> logger,
            ILoadedDataService service)
        {
            _logger = logger;
            _context = context;
            _loadedDataService = service;
        }

        [HttpGet("GetAllLoadedData")]
        public async Task<IActionResult> GetAll()
        {
            var allLoadedData = await _context.LoadedDatas.ToListAsync();

            return Ok(allLoadedData);
        }

        [HttpPost("PostNewProject")]
        public async Task<IActionResult> PostNewProject([FromBody] LoadedFileDTO[] loadedFiles)
        {
            // Spracovanie prijatých súborov
            if (loadedFiles != null && loadedFiles.Any())
            {
                var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                string token = "";
                if (userToken == "") {
                    token = GenerateJwtToken();
                } else
                {
                    token = userToken;
                }
                int idProject = 1;
                if(_context.Projects.Count() >= 1)
                {
                    idProject = _context.Projects
                .OrderByDescending(obj => obj.IdProject)
                .FirstOrDefault().IdProject + 1;

                }

                IActionResult result = await _loadedDataService.ProcessNewProjectData(loadedFiles, token, idProject);

                if (result is OkResult)
                {
                    return Ok(new { TOKEN = token, IDPROJECT =  idProject});

                }
                else
                    return BadRequest(result);

            }
            else
            {
                return BadRequest("Chybný formát dát."); // Odpoveï 400 Bad Request
            }
        }

        [HttpPost]
        public async Task<IActionResult> PostAddData([FromBody] LoadedFileDTO[] loadedFiles)
        {
            // Spracovanie prijatých súborov
            if (loadedFiles != null && loadedFiles.Any())
            {

                var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                var existingProject = _context.Projects.FirstOrDefault(p => p.Token == userToken && p.IdProject == loadedFiles[0].IDPROJECT);
                if (existingProject != null)
                {
                    IActionResult result = await _loadedDataService.AddProjectData(loadedFiles);
                    return Ok();
                } else
                {
                    return BadRequest("Chybný formát dát.");
                }



            }
            else
            {
                return BadRequest("Chybný formát dát."); // Odpoveï 400 Bad Request
            }
        }



        [HttpPost("PostFactorsMultiply")]
        public async Task<IActionResult> Post([FromBody] MultiplyDataDTO multiplyDatas)
        {
            if (multiplyDatas != null)
            {
                IActionResult result = await _loadedDataService.MultiplyData(multiplyDatas);
                return result;
            }
            else
            {
                return BadRequest("Chybný formát dát."); // Odpoveï 400 Bad Request
            }
        }


        private string GenerateJwtToken()
        {
            // Generovanie JWT tokenu bez identifikátora užívate¾a
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes("L#9pD2m0oP7rW!4xN*1vL#9pD2m0oP7rW!4xN*1vL#9pD2m0oP7rW!4xN*1v");
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Expires = DateTime.UtcNow.AddDays(30),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

    }
}