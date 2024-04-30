using Microsoft.AspNetCore.Mvc;
using System.Xml.Linq;
using WebAPI.Controllers;
using WebApiServer.Data;
using WebApiServer.DTOs;
using WebApiServer.Models;
using WebApiServer.Services;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace WebApiServer.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class LoadedFolderController : ControllerBase
    {
        private readonly ApiDbContext _context;
        private readonly IDataProcessService _dataProcessService;


        public LoadedFolderController(ApiDbContext context,
            IDataProcessService service)
        {
            _context = context;
            _dataProcessService = service;
        }


        [HttpPost("PostNewFolderToProject")]
        public async Task<IActionResult> PostAddDataToSavedProject([FromBody] FileContent[] loadedFiles)
        {
            // Spracovanie prijatých súborov
            if (loadedFiles != null && loadedFiles.Any())
            {

                var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                var existingProject = _context.Projects.FirstOrDefault(p => p.Token == userToken && p.IdProject == loadedFiles[0].IDPROJECT);
                if (existingProject != null)
                {
                    IActionResult result = await _dataProcessService.AddProjectData(loadedFiles);
                    return Ok();
                }
                else
                {
                    return BadRequest("Chybný formát dát.");
                }

            }
            else
            {
                return BadRequest("Chybný formát dát."); // Odpoveď 400 Bad Request
            }
        }


        [HttpPost("PostNewFolder")] //pridavanie priecinku bez noveho projektu
        public async Task<IActionResult> PostAddData([FromBody] FileContent[] loadedFiles)
        {
            // Spracovanie prijatých súborov
            if (loadedFiles != null && loadedFiles.Any())
            {

                FolderDTO result = _dataProcessService.ProcessUploadedFolder(loadedFiles);

                if (result != null)
                {
                    return Ok(new { FOLDER = result });
                }
                else
                    return BadRequest(result);

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
                IActionResult result = await _dataProcessService.MultiplyData(multiplyDatas);
                return result;
            }
            else
            {
                return BadRequest("Chybný formát dát."); // Odpoveď 400 Bad Request
            }
        }
    }
}
