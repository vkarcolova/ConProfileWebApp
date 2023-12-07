using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using WebApiServer.Data;
using WebApiServer.DTOs;
using WebApiServer.Models;

namespace WebAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly ILogger<ProjectController> _logger;
        private readonly ApiDbContext _context;

        public ProjectController(ApiDbContext context,
            ILogger<ProjectController> logger)
        {
            _logger = logger;
            _context = context;
        }

        [HttpGet("GetCount")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var count = _context.Projects.Count();

                return Ok(new { Count = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Internal Server Error", Message = ex.Message });
            }
        }




    }
}