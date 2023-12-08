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

        public LoadedFolderController(ApiDbContext context,
            ILogger<LoadedDataController> logger)
        {
            _logger = logger;
            _context = context;
        }

        [HttpGet("GetFolder/{id}")]
        public ActionResult<FolderDTO> GetItemById(int id)
        {
            LoadedFolder folder = _context.LoadedFolders.Where(folder => folder.IdFolder == id).First();
            List<LoadedFile> files = _context.LoadedFiles.Where(file => file.IdFolder == id).ToList();
            if (!files.Any())
            {
                return NotFound(); // vráti HTTP 404, ak žiadne položky nie sú nájdené
            } else
            {
                List<double> excitation = new List<double>();
                List<TableDataDTO> tabledata = new List<TableDataDTO>();

                foreach (LoadedFile file in files)
                {
                    List<LoadedData> loadedData = _context.LoadedDatas.Where(data => data.IdFile == file.IdFile).ToList();
                    List<double> intensity = loadedData.Select(data => data.Intensity).ToList();

                    if (excitation.Count == 0 || (excitation.Count < intensity.Count))
                        excitation = loadedData.Select(data => data.Excitation).ToList();
                    
                    TableDataDTO data = new TableDataDTO
                    {
                        FILENAME = file.FileName,
                        INTENSITY = intensity,
                        SPECTRUM = file.Spectrum
                    };

                    tabledata.Add(data);
                }


                FolderDTO result = new FolderDTO
                {
                    FOLDERNAME = folder.FolderName,
                    EXCITATION = excitation,
                    DATA = tabledata
                    
                };
                return result;
            }
        }

    }
}
