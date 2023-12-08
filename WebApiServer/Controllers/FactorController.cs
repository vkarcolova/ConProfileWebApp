using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApiServer.Data;
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

            return Ok(allLoadedData);
        }
    }
}