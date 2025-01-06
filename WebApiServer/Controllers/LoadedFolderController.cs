using MathNet.Numerics.Interpolation;
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
        private readonly IUserService _userService;


        public LoadedFolderController(ApiDbContext context,
            IDataProcessService service,
            IUserService userService)
        {
            _context = context;
            _dataProcessService = service;
            _userService = userService;
        }


        [HttpPost("PostNewFolderToProject")]
        public async Task<IActionResult> PostAddDataToSavedProject([FromBody] FileContent[] loadedFiles)
        {
            // Spracovanie prijatých súborov
            if (loadedFiles != null && loadedFiles.Any())
            {
                var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                var userEmail = Request.Headers["UserEmail"].ToString();

                if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                    return Unauthorized("Neplatné prihlásenie");

                var existingProject = _context.Projects.FirstOrDefault(p => (p.Token == userToken || p.CreatedBy == userEmail)
                              && p.IdProject == loadedFiles[0].IDPROJECT);
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
                if (result != null) return Ok(new { FOLDER = result });
                else return BadRequest(result);

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

        //Spracovanie suborov a poslanie ich vo forme dto este nesavnutie
        [HttpPost("BatchProcessFolders")]
        public async Task<IActionResult> BatchProcessFolders([FromBody] FileContent[] loadedFiles)
        {
            if (loadedFiles != null && loadedFiles.Any())
            {
                List<FolderDTO> folders = new List<FolderDTO>();
                var groupedByFolder = loadedFiles.GroupBy(f => f.FOLDERNAME);
                foreach (var folderGroup in groupedByFolder)
                {
                    var folderFiles = folderGroup.ToArray();
                    var folderDTO = _dataProcessService.ProcessUploadedFolder(folderFiles);
                    folders.Add(folderDTO);
                }

                if (folders.Count != 0)
                    return Ok(new { FOLDERS = folders });
                else
                    return BadRequest();
            }

            return BadRequest("No files uploaded.");
        }
                //result bude list columns s tymi nazvami a tiez list neuspesnych columns pre error

                // po kazdom stlpci sa pojde 
                // najprv ci chybaju data zo zaciatku 

                //potom niekde zo stredu to moze asi aj viac krat cize while 
                

                //na konci
        [HttpPost("CalculateEmptyData")]
        public async Task<IActionResult> CalculateEmptyData([FromBody] ColumnDTO[] columns)
        {
            if (columns != null && columns.Any())
            {
                foreach (var column in columns)
                {
                    if (column.Intensities == null || column.Excitations == null || column.Intensities.Count != column.Excitations.Count)
                    {
                        return BadRequest("Invalid data: Intensity and Excitacion lists must have the same number of elements.");
                    }

                    // Extrahuj excitácie a intenzity, kde intenzity nie sú null
                    var validExcitacions = new List<double>();
                    var validIntensities = new List<double>();

                    for (int i = 0; i < column.Intensities.Count; i++)
                    {
                        if (column.Intensities[i].HasValue)
                        {
                            validExcitacions.Add(column.Excitations[i]);
                            validIntensities.Add(column.Intensities[i].Value);
                        }
                    }

                    // Ak nie sú dostatočné údaje na interpoláciu
                    if (validExcitacions.Count < 2)
                    {
                        return BadRequest($"Column '{column.Name}' does not have enough valid data points for interpolation.");
                    }

                    // Vytvor spline interpoláciu
                    var spline = CubicSpline.InterpolateNaturalSorted(validExcitacions.ToArray(), validIntensities.ToArray());

                    // Dopočítaj chýbajúce hodnoty
                    for (int i = 0; i < column.Intensities.Count; i++)
                    {
                        if (!column.Intensities[i].HasValue)
                        {
                            column.Intensities[i] = spline.Interpolate(column.Excitations[i]);
                        }
                    }
                }

                return Ok(new { Message = "Interpolation completed", Columns = columns });
            }

            return BadRequest("No files uploaded.");
        }
    }
}
