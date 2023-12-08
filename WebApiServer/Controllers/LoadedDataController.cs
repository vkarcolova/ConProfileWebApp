using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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

        [HttpPost]
        public async Task<IActionResult> Post([FromBody] LoadedFileDTO[] loadedFiles)
        {
            // Spracovanie prijatých súborov
            if (loadedFiles != null && loadedFiles.Any())
            {
                IActionResult result = await _loadedDataService.ProcessLoadedData(loadedFiles);
                return result;
            }
            else
            {
                return BadRequest("Chybný formát dát."); // Odpoveï 400 Bad Request
            }
        }
    }
}