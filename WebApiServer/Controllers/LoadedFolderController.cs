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
        private readonly ILogger<LoadedDataController> _logger;
        private readonly ApiDbContext _context;
        private readonly ILoadedDataService _loadedDataService;


        public LoadedFolderController(ApiDbContext context,
            ILogger<LoadedDataController> logger,
            ILoadedDataService service)
        {
            _logger = logger;
            _context = context;
            _loadedDataService = service;
        }

        [HttpGet("GetFolder/{id}")]
        public ActionResult<FolderDTO> GetItemById(int id)
        {
            LoadedFolder folder = _context.LoadedFolders.Where(folder => folder.IdFolder == id).First();
            List<LoadedFile> files = _context.LoadedFiles.Where(file => file.IdFolder == id).OrderBy(file => file.Spectrum).ToList();
            if (!files.Any())
            {
                return NotFound(); // vráti HTTP 404, ak žiadne položky nie sú nájdené
            } else
            {
                List<double> excitation = new List<double>();
                List<FileDTO> tabledata = new List<FileDTO>();

                foreach (LoadedFile file in files)
                {
                    List<LoadedData> loadedData = _context.LoadedDatas.Where(data => data.IdFile == file.IdFile).ToList();
                    List<double> intensity = loadedData.Select(data => data.Intensity).ToList();

                    if (excitation.Count == 0 || (excitation.Count < intensity.Count))
                        excitation = loadedData.Select(data => data.Excitation).ToList();
                    
                    FileDTO data = new FileDTO
                    {
                        FILENAME = file.FileName,
                        INTENSITY = intensity,
                        SPECTRUM = file.Spectrum
                    };

                    tabledata.Add(data);
                }


                FolderDTO result = new FolderDTO
                {
                    //ID = folder.IdFolder,
                    FOLDERNAME = folder.FolderName,
                    EXCITATION = excitation,
                    DATA = tabledata
                    
                };
                return result;
            }
        }


        [HttpPost("CreateNewProject")]
        public async Task<IActionResult> CreateNewProject([FromBody] FileContent[] loadedFiles)
        {
            // Spracovanie prijatých súborov
            if (loadedFiles != null && loadedFiles.Any())
            {
                var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                string token = "";
                if (userToken == "")
                {
                    token = _loadedDataService.GenerateJwtToken();
                }
                else
                {
                    token = userToken;
                }

                List<FolderDTO> folders = new List<FolderDTO>();
                folders.Add(_loadedDataService.ProcessUploadedFolder(loadedFiles));
                ProjectDTO result = new ProjectDTO
                {
                    CREATED = DateTime.Now,
                    FOLDERS = folders,
                    IDPROJECT = -1,
                    PROJECTNAME = loadedFiles[0].FOLDERNAME
                };
                if (folders.Count != 0)
                {
                    return Ok(new { TOKEN = token, PROJECT = result });
                }
                else
                    return BadRequest(result);

            }
            else
            {
                return BadRequest("Chybný formát dát."); // Odpoveï 400 Bad Request
            }
        }
    }
}
