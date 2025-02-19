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
                    return Unauthorized(new { message = "Neplatné prihlásenie" });

                var existingProject = _context.Projects.FirstOrDefault(p => (p.Token == userToken || p.CreatedBy == userEmail)
                              && p.IdProject == loadedFiles[0].IDPROJECT);
                if (existingProject != null)
                {
                    IActionResult result = await _dataProcessService.AddProjectData(loadedFiles);
                    return Ok();
                }
                else
                {
                    return BadRequest(new { message = "Chybný formát dát." });
                }
            }
            else
            {
                return BadRequest(new { message = "Chybný formát dát." });
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
                return BadRequest(new { message = "Chybný formát dát." });
            }
        }

        [HttpPost("PostNewExcelToProject")]
        public async Task<IActionResult> PostNewExcelToProject([FromBody] ExcelFileContent excelFile)
        {
            // Spracovanie prijatých súborov
            if (excelFile != null)
            {
                var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                var userEmail = Request.Headers["UserEmail"].ToString();

                if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                    return Unauthorized(new { message = "Neplatné prihlásenie" });

                var existingProject = _context.Projects.FirstOrDefault(p => (p.Token == userToken || p.CreatedBy == userEmail)
                              && p.IdProject == excelFile.IDPROJECT);
                if (existingProject != null)
                {
                    IActionResult result = await _dataProcessService.AddProjectDataFromExcel(excelFile);
                    return result;
                }
                else
                {
                    return BadRequest(new { message = "Chybný formát dát." });
                }
            }
            else
            {
                return BadRequest(new { message = "Chybný formát dát." });
            }
        }


        [HttpPost("PostNewExcelToSession")] //pridavanie priecinku bez noveho projektu
        public async Task<IActionResult> PostNewExcelToSession([FromBody] ExcelFileContent excelFile) { 
            // Spracovanie prijatých súborov
            if (excelFile != null)
            {
                FolderDTO result = _dataProcessService.ProcessUploadedFolderFromExcel(excelFile);
                if (result != null) return Ok(new { FOLDER = result });
                else return BadRequest(result);

            }
            else
            {
                return BadRequest(new { message = "Chybný formát dát." });
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
                return BadRequest(new { message = "Chybný formát dát." }); 
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

            return BadRequest(new { message = "Žiadne dáta neboli načítané." });
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
                return BadRequest(new { message = "Nesprávne dáta." });
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
                return BadRequest(new { message = $"Stĺpec '{column.Name}' nemá dostatočne veľa dát na dopočítanie ďalších dát."});
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
        public static List<double?> RemoveLongRepeatingValues(List<double?> data, int minRepeatCount = 20)
        {
            if (data == null || data.Count == 0) return data;

            List<double?> result = new List<double?>(data);
            int count = 1;
            double? lastValue = data[0];
            int startIndex = 0;

            for (int i = 1; i < data.Count; i++)
            {
                if (data[i] == lastValue && lastValue != 0)
                {
                    count++;
                }
                else
                {
                    if (count >= minRepeatCount && lastValue != 0)
                    {
                        for (int j = startIndex; j < startIndex + count; j++)
                        {
                            result[j] = null;
                        }
                    }
                    count = 1;
                    lastValue = data[i];
                    startIndex = i;
                }
            }

            if (count >= minRepeatCount && lastValue != 0)
            {
                for (int j = startIndex; j < startIndex + count; j++)
                {
                    result[j] = null;
                }
            }

            return result;
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
                        return Unauthorized(new { message = "Neplatné prihlásenie" });



                    int nextDataId = (_context.LoadedDatas.OrderByDescending(obj => obj.IdData).FirstOrDefault()?.IdData ?? 0) + 1;
                    LoadedFile file = _context.LoadedFiles.Where(x => x.IdFile == calculatedData.IDFILE).FirstOrDefault();
                    double? factor = null;
                    if (file.Factor.HasValue)
                    {
                        factor = file.Factor.Value;
                    }

                        for (int i = 0; i < calculatedData.CALCULATEDINTENSITIES.Length; i++)
                    {
                        LoadedData newData = new LoadedData
                        {
                            Intensity = calculatedData.CALCULATEDINTENSITIES[i],
                            Excitation = calculatedData.EXCITACIONS[i],
                            IdData = nextDataId,
                            IdFile = calculatedData.IDFILE
                        };
                        if (factor.HasValue)
                            newData.MultipliedIntensity =  calculatedData.CALCULATEDINTENSITIES[i] * factor;

                        nextDataId++;
                        _context.LoadedDatas.Add(newData);

                    };
                   await _context.SaveChangesAsync();

                    if (file.Factor.HasValue) {
                        bool success = true;
                        List<LoadedData> loadedDatas = _context.LoadedDatas.Where(x => x.IdFile == calculatedData.IDFILE).ToList();
                        var ordered = loadedDatas.OrderBy(x => x.Excitation).ToList();
                        List<ProfileData> profileDatas = _context.ProfileDatas.Where(x => x.IdFolder == file.IdFolder).ToList();
                        profileDatas.OrderBy(x => x.Excitation).ToList();
                        for(int i = 0;i < ordered.Count; i++)
                        {
                            if (ordered[i].Excitation != profileDatas[i].Excitation)
                            { 
                                success = false; break;
                            }

                            if (ordered[i].MultipliedIntensity.HasValue && profileDatas[i].MaxIntensity < ordered[i].MultipliedIntensity.Value)
                            {
                                profileDatas[i].MaxIntensity = ordered[i].MultipliedIntensity.Value;
                            }    

                        }

                        if(success) await _context.SaveChangesAsync();
                    }



                    return Ok();
                }
                else
                {
                    return BadRequest(new { message = "Chybný formát dát." });
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

        [HttpPost("ReplaceCalculatedData")]
        public async Task<IActionResult> ReplaceCalculatedData([FromBody] CalculatedDataDTO calculatedData)
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
                        return Unauthorized(new { message = "Neplatné prihlásenie" });

                    //zobrat podla excitacie dane dato 

                    LoadedFile file = _context.LoadedFiles.Where(x => x.IdFile == calculatedData.IDFILE).FirstOrDefault();
                    double? factor = null;
                    if (file.Factor.HasValue)
                    {
                        factor = file.Factor.Value;
                    }

                    for (int i = 0; i < calculatedData.CALCULATEDINTENSITIES.Length; i++)
                    {
                        LoadedData dataToReplace = _context.LoadedDatas.Where(x => x.IdFile ==  calculatedData.IDFILE &&  x.Excitation == calculatedData.EXCITACIONS[i]).FirstOrDefault();
                        dataToReplace.Intensity = calculatedData.CALCULATEDINTENSITIES[i];
                        if (file.Factor.HasValue && factor.HasValue && factor != null )
                        {
                            double multiplied = dataToReplace.Intensity * factor.Value;
                            dataToReplace.MultipliedIntensity = multiplied;
                            ProfileData profile = _context.ProfileDatas.Where(x => x.IdFolder == file.IdFolder && x.Excitation == calculatedData.EXCITACIONS[i]).FirstOrDefault();
                            if(profile.MaxIntensity < multiplied)
                            {
                                profile.MaxIntensity = multiplied;
                            }
                        }
                    };
                    await _context.SaveChangesAsync();

                     return Ok();
                }
                else
                {
                    return BadRequest(new { message = "Chybný formát dát." });
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

    }
}
