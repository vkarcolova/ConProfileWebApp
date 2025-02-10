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
using WebApiServer.Services;

namespace WebApiServer.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class DataBankController : ControllerBase
    {

        private readonly ApiDbContext _context;

        public DataBankController(ApiDbContext context)
        {
            _context = context;
        }

      
    }
}
