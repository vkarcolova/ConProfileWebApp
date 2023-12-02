using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WebApiServer.Data;
using WebApiServer.Models;

namespace WebAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class LoadedDataController : ControllerBase
    {
        private readonly ILogger<LoadedDataController> _logger;
        private readonly ApiDbContext _context;

        public LoadedDataController(ApiDbContext context,
            ILogger<LoadedDataController> logger)
        {
            _logger = logger;
            _context = context;
        }

        [HttpGet("GetAllLoadedData")]
        public async Task<IActionResult> GetAll()
        {
            var allLoadedData = await _context.LoadedDatas.ToListAsync();

            return Ok(allLoadedData);
        }

        


    }
}