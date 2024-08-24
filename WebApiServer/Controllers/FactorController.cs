using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApiServer.Data;
using WebApiServer.Models;
using WebApiServer.Services;

namespace WebApiServer.Controllers
{

    [ApiController]
    [Route("[controller]")]
    public class FactorController : ControllerBase
    {
        private readonly ILogger<FactorController> _logger;
        private readonly ApiDbContext _context;

        public FactorController(ApiDbContext context,
            ILogger<FactorController> logger)
        {
            _logger = logger;
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var allLoadedData = await _context.Factors.ToListAsync();
            if(allLoadedData.Count == 0)
            {
                allLoadedData = new List<Factors>
                {
                new Factors { Factor = 1, Spectrum = 0 },
                new Factors { Factor = 1.4, Spectrum = 2 },
                new Factors { Factor = 2.2, Spectrum = 8 },
                new Factors { Factor = 3.6, Spectrum = 32 },
                new Factors { Factor = 5, Spectrum = 128 },
                new Factors { Factor = 1, Spectrum = 512 }
                };
                _context.Factors.AddRange(allLoadedData);
                await _context.SaveChangesAsync();
            }

            return Ok(allLoadedData);
        }
    }
}