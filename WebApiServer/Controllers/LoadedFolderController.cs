using MathNet.Numerics.Interpolation;
using Microsoft.AspNetCore.Mvc;
using WebApiServer.Data;
using WebApiServer.DTOs;
using WebApiServer.Services;
using Accord.MachineLearning.VectorMachines;
using Accord.MachineLearning.VectorMachines.Learning;
using Accord.Statistics.Kernels;
using WebApiServer.Models;
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
        //result bude list column s tymi nazvami a tiez list neuspesnych column pre error

        // po kazdom stlpci sa pojde 
        // najprv ci chybaju data zo zaciatku 

        //potom niekde zo stredu to moze asi aj viac krat cize while 


        [HttpPost("CalculateEmptyData")]
        public async Task<IActionResult> CalculateEmptyData([FromBody] ColumnDTO column)
        {
            if (column == null || column.Intensities == null || column.Excitations == null || column.Intensities.Count != column.Excitations.Count)
            {
                return BadRequest("Invalid data: Intensity and Excitacion lists must have the same number of elements.");
            }

            var validExcitacions = new List<double>();
            var validIntensities = new List<double>();
            var onlyCalculated = new double?[column.Excitations.Count];
            var onlyCalculatedExct = new double?[column.Excitations.Count];

            // Získanie platných dát (bez medzier)
            for (int i = 0; i < column.Intensities.Count; i++)
            {
                if (column.Intensities[i].HasValue)
                {
                    validExcitacions.Add(column.Excitations[i]);
                    validIntensities.Add(column.Intensities[i].Value);
                }
            }

            if (validExcitacions.Count < 2)
            {
                return BadRequest($"Column '{column.Name}' does not have enough valid data points for interpolation.");
            }

            // Vytvorenie spline interpolácie
            var spline = CubicSpline.InterpolateNaturalSorted(validExcitacions.ToArray(), validIntensities.ToArray());

            // Pomocné metódy na lineárnu extrapoláciu
            double LinearExtrapolate(double x1, double y1, double x2, double y2, double x)
            {
                double slope = (y2 - y1) / (x2 - x1);
                return y1 + slope * (x - x1);
            }

            // Spracovanie intenzít
            for (int i = 0; i < column.Intensities.Count; i++)
            {
                if (!column.Intensities[i].HasValue)
                {
                    double x = column.Excitations[i];

                    if (x < validExcitacions.First())
                    {
                        // Extrapolácia na začiatku (lineárna)
                        column.Intensities[i] = LinearExtrapolate(
                            validExcitacions[0], validIntensities[0],
                            validExcitacions[1], validIntensities[1],
                            x);
                    }
                    else if (x > validExcitacions.Last())
                    {
                        // Extrapolácia na konci (lineárna)
                        column.Intensities[i] = LinearExtrapolate(
                            validExcitacions[^2], validIntensities[^2],
                            validExcitacions[^1], validIntensities[^1],
                            x);
                    }
                    else
                    {
                        // Interpolácia v strede (spline)
                        column.Intensities[i] = spline.Interpolate(x);
                    }

                    onlyCalculated[i] = column.Intensities[i].Value;
                    onlyCalculatedExct[i] = column.Excitations[i];
                }
            }

            return Ok(new { Message = "Calculation completed", Column = column, OnlyValues = onlyCalculated, OnlyExcitations = onlyCalculatedExct });
          

        }


        [HttpPost("AddCalculatedData")]
        public async Task<IActionResult> AddCalculatedData([FromBody] CalculatedDataDTO calculatedData)
        {
            try
            {
                if (calculatedData != null)
                {
                    var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                    string token;
                    if (userToken == "") token = _userService.GenerateJwtToken();
                    else token = userToken;
                    var userEmail = Request.Headers["UserEmail"].ToString();

                    if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                        return Unauthorized("Neplatné prihlásenie");



                    int nextDataId = (_context.LoadedDatas.OrderByDescending(obj => obj.IdData).FirstOrDefault()?.IdData ?? 0) + 1;

                    for (int i = 0; i < calculatedData.CALCULATEDINTENSITIES.Length; i++)
                    {
                        LoadedData newData = new LoadedData
                        {
                            Intensity = calculatedData.CALCULATEDINTENSITIES[i],
                            Excitation = calculatedData.EXCITACIONS[i],
                            IdData = nextDataId,
                            IdFile = calculatedData.IDFILE
                        };

                        _context.LoadedDatas.Add(newData);
                    };

                    //mozno pridat aj multiplied?
                

                    await _context.SaveChangesAsync();

                    return Ok();
                }
                else
                {
                    return BadRequest("Chybný formát dát.");
                }
            }
            catch (System.Exception e)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new
                {
                    Error = "Chyba pri uložení projektu: " + e.Message
                });
            }

        }


        //if (column == null || column.Intensities == null || column.Excitations == null || column.Intensities.Count != column.Excitations.Count)
        //{
        //    return BadRequest("Invalid data: Intensity and Excitacion lists must have the same number of elements.");
        //}

        //var validExcitacions = new List<double>();
        //var validIntensities = new List<double>();
        //var onlyCalculated = new double?[column.Excitations.Count];

        // Získanie platných dát (bez medzier)
        //for (int i = 0; i < column.Intensities.Count; i++)
        //{
        //    if (column.Intensities[i].HasValue)
        //    {
        //        validExcitacions.Add(column.Excitations[i]);
        //        validIntensities.Add(column.Intensities[i].Value);
        //    }
        //}

        //if (validExcitacions.Count < 2)
        //{
        //    return BadRequest($"Column '{column.Name}' does not have enough valid data points for interpolation.");
        //}

        // Prevod platných dát do matíc (Accord.NET používa matice ako vstupy)
        //double[][] inputs = validExcitacions.Select(x => new double[] { x }).ToArray();
        //double[] outputs = validIntensities.ToArray();

        // Inicializácia Gaussovského procesu s exponenciálnym jadrom
        //var kernel = new Gaussian(1.0);
        //var machine = new SupportVectorMachine<Gaussian>(1, kernel);

        // Tréning modelu
        //var teacher = new SequentialMinimalOptimization<Gaussian>()
        //{
        //    Complexity = 100 // Parameter C pre SVM
        //};
        //teacher.Learn(machine, inputs, outputs);

        // Predikcia
        //for (int i = 0; i < column.Excitations.Count; i++)
        //{
        //    if (!column.Intensities[i].HasValue)
        //    {
        //        double x = column.Excitations[i];
        //        column.Intensities[i] = machine.Score(new double[] { x });
        //        onlyCalculated[i] = column.Intensities[i].Value;
        //    }
        //}

        //return Ok(new { Message = "Calculation completed with Gaussian Process", Column = column, OnlyValues = onlyCalculated });

    }
}
