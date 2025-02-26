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
        public async Task<IActionResult> PostNewExcelToSession([FromBody] ExcelFileContent excelFile)
        {
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
                return BadRequest(new { message = $"Stĺpec '{column.Name}' nemá dostatočne veľa dát na dopočítanie ďalších dát." });
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

        [HttpPost("CalculateAdjustedData")]
        public async Task<IActionResult> CalculateAdjustedData([FromBody] AdjustedDataRequest request)
        {
            if (request == null || request.Column == null || request.ReferenceSeries == null)
            {
                return BadRequest(new { message = "Nesprávne dáta." });
            }

            // Overíme, či majú všetky zoznamy rovnakú dĺžku.
            if (request.Column.Intensities == null ||
                request.Column.Excitations == null ||
                request.Column.Intensities.Count != request.Column.Excitations.Count ||
                request.Column.Intensities.Count != request.ReferenceSeries.Count)
            {
                return BadRequest(new { message = "Nesprávne dáta stĺpca alebo referenčná séria." });
            }

            int n = request.Column.Intensities.Count;

            // Získame platné hodnoty pre výpočet škálovacieho faktora.
            var validIntensities = request.Column.Intensities
                .Where(x => x.HasValue)
                .Select(x => x.Value)
                .ToList();

            if (validIntensities.Count == 0)
            {
                return BadRequest(new { message = "Stĺpec neobsahuje žiadne platné dáta na dopočítanie." });
            }

            double meanColumn = validIntensities.Average();
            double meanReference = request.ReferenceSeries.Average();

            if (meanReference == 0)
            {
                return BadRequest(new { message = "Referenčná séria obsahuje len nulové hodnoty." });
            }

            double scaleFactor = meanColumn / meanReference;

            // Výstupné pole – dopočítané hodnoty pre gap-y, inak null (čo znamená, že existujúca hodnota zostáva)
            var computedIntensities = new double?[n];

            // Pomocná funkcia pre lineárnu extrapoláciu (na začiatku alebo na konci)
            double LinearExtrapolate(double x1, double y1, double x2, double y2, double x)
            {
                double slope = (y2 - y1) / (x2 - x1);
                return y1 + slope * (x - x1);
            }

            int i = 0;
            while (i < n)
            {
                // Ak je hodnota platná, necháme computedIntensities[i] ako null (t.j. už existujúce dáta sa nemenia)
                if (request.Column.Intensities[i].HasValue)
                {
                    computedIntensities[i] = null;
                    i++;
                }
                else
                {
                    // Detekujeme gap – súvislý úsek chýbajúcich hodnôt.
                    int gapStart = i;
                    while (i < n && !request.Column.Intensities[i].HasValue)
                    {
                        i++;
                    }
                    int gapEnd = i; // gapEnd je prvý index po gap-e, kde je hodnota platná (alebo n, ak gap pokračuje až do konca)

                    // Ak je gap na začiatku, použijeme lineárnu extrapoláciu z prvej platnej hodnoty.
                    if (gapStart == 0)
                    {
                        double x2 = request.Column.Excitations[gapEnd];
                        double y2 = request.Column.Intensities[gapEnd].Value;
                        for (int j = gapStart; j < gapEnd; j++)
                        {
                            double x = request.Column.Excitations[j];
                            computedIntensities[j] = LinearExtrapolate(x2, y2, x2 + 1, y2, x); // Jednoduchá extrapolácia
                        }
                    }
                    // Ak je gap na konci, extrapolujeme z poslednej platnej hodnoty.
                    else if (gapEnd == n)
                    {
                        double x1 = request.Column.Excitations[gapStart - 1];
                        double y1 = request.Column.Intensities[gapStart - 1].Value;
                        for (int j = gapStart; j < gapEnd; j++)
                        {
                            double x = request.Column.Excitations[j];
                            computedIntensities[j] = LinearExtrapolate(x1 - 1, y1, x1, y1, x); // Jednoduchá extrapolácia
                        }
                    }
                    // Gap je uprostred, máme platný bod pred gapom aj po gapu.
                    else
                    {
                        // Posledný platný bod pred gapom
                        double x0 = request.Column.Excitations[gapStart - 1];
                        double y0 = request.Column.Intensities[gapStart - 1].Value;
                        // Prvý platný bod po gapu
                        double x1 = request.Column.Excitations[gapEnd];
                        double y1 = request.Column.Intensities[gapEnd].Value;

                        // Kandidátske hodnoty z referenčnej série pre hranice gapu
                        double candidateStart = request.ReferenceSeries[gapStart] * scaleFactor;
                        double candidateEnd = request.ReferenceSeries[gapEnd] * scaleFactor;

                        // Vypočítame lineárnu transformáciu, ktorá zabezpečí, že:
                        // pri x = request.Column.Excitations[gapStart] bude computed = y0,
                        // pri x = request.Column.Excitations[gapEnd] bude computed = y1.
                        // Predpokladáme lineárnu mapovaciu funkciu: computed = a + b * (reference[i] * scaleFactor).
                        // Určíme a a b:
                        double b = (y1 - y0) / (candidateEnd - candidateStart + 1e-9);
                        double a = y0 - b * candidateStart;

                        // Pre každý index v gap-e dopočítať hodnotu:
                        for (int j = gapStart; j < gapEnd; j++)
                        {
                            double candidate = request.ReferenceSeries[j] * scaleFactor;
                            computedIntensities[j] = a + b * candidate;
                        }
                    }
                }
            }

            return Ok(new
            {
                Message = "Calculation completed",
                Column = request.Column,
                AdjustedValues = computedIntensities
            });
        }




        //[HttpPost("CalculateAdjustedData")]
        //public async Task<IActionResult> CalculateAdjustedData([FromBody] AdjustedDataRequest request)
        //{
        //    if (request == null || request.Column.Intensities == null || request.ReferenceSeries == null)
        //        return BadRequest(new { message = "Neplatné dáta v požiadavke." });

        //    int n = request.Column.Intensities.Count;
        //    if (n == 0 || request.ReferenceSeries.Count != n)
        //        return BadRequest(new { message = "OriginalIntensities a ReferenceIntensities musia mať rovnakú dĺžku > 0." });

        //    var original = request.Column.Intensities;
        //    var reference = request.ReferenceSeries;

        //    // 2. Pole, kam uložíme dopočítané hodnoty
        //    double?[] computed = new double?[n];

        //    // 3. Prechádzame celé pole a hľadáme medzery
        //    int i = 0;
        //    while (i < n)
        //    {
        //        if (original[i].HasValue)
        //        {
        //            // Platná hodnota => nedopočítavame nič
        //            computed[i] = null;
        //            i++;
        //        }
        //        else
        //        {
        //            // Začiatok medzery
        //            int gapStart = i;
        //            while (i < n && !original[i].HasValue)
        //            {
        //                i++;
        //            }
        //            int gapEnd = i;
        //            // gapEnd je prvý index, kde znovu existuje platná hodnota
        //            // alebo n, ak sme dobehli až na koniec

        //            // Zistíme poslednú platnú hodnotu pred gap-om (ak existuje)
        //            double? M_start = (gapStart > 0) ? original[gapStart - 1] : (double?)null;
        //            // Zistíme prvú platnú hodnotu po gap-e (ak existuje)
        //            double? M_end = (gapEnd < n) ? original[gapEnd] : (double?)null;

        //            // Kandidátske hodnoty z referencie
        //            double R_start = reference[gapStart];
        //            double R_end = (gapEnd < n) ? reference[gapEnd] : R_start;

        //            // 4. Rôzne prípady
        //            if (M_start.HasValue && M_end.HasValue)
        //            {
        //                // Dvojité ukotvenie:
        //                // => chceme, aby pre gapStart platilo: computed[gapStart] = M_start
        //                //    a pre gapEnd   platilo: computed[gapEnd - 1] plynulo smeruje k M_end
        //                // Vypočítame lineárnu transformáciu: computed = a + b * R
        //                // tak, aby (a + b*R_start = M_start) a (a + b*R_end = M_end)

        //                double b = (M_end.Value - M_start.Value) / (R_end - R_start + 1e-9);
        //                double a = M_start.Value - b * R_start;

        //                // Vypočítame hodnoty pre indexy v gap-e
        //                for (int j = gapStart; j < gapEnd; j++)
        //                {
        //                    double R_j = reference[j];
        //                    computed[j] = a + b * R_j;
        //                }
        //            }
        //            else if (M_start.HasValue && !M_end.HasValue)
        //            {
        //                // Medzera až do konca poľa => ukotvíme sa len na M_start
        //                // Jednoduchá voľba: candidate = M_start + b*(R_j - R_start)
        //                // Napríklad b = 1.0 => zachováme tvar, ale posunieme tak, aby prvý bod sedel
        //                double offset = M_start.Value - R_start;
        //                for (int j = gapStart; j < n; j++)
        //                {
        //                    computed[j] = reference[j] + offset;
        //                }
        //            }
        //            else if (!M_start.HasValue && M_end.HasValue)
        //            {
        //                // Medzera od začiatku
        //                // Môžeme nastaviť, aby posledný bod v gap-e sedel na M_end
        //                // a zvyšok sa škáluje. Napríklad:
        //                double offset = M_end.Value - R_end;
        //                for (int j = 0; j < gapEnd; j++)
        //                {
        //                    computed[j] = reference[j] + offset;
        //                }
        //            }
        //            else
        //            {
        //                // Ani začiatok, ani koniec nemá platnú hodnotu => celé pole je gap?
        //                // Jednoducho prenesieme referenciu, alebo ju necháme tak
        //                for (int j = gapStart; j < gapEnd; j++)
        //                {
        //                    computed[j] = reference[j];
        //                }
        //            }
        //        }
        //    }

        //    // 5. Vrátime výsledok
        //    return Ok(new
        //    {
        //        Message = "Calculation completed (two-anchor approach)",
        //        AdjustedValues = computed
        //    });
        //}

        //[HttpPost("CalculateAdjustedData")]
        //public async Task<IActionResult> CalculateAdjustedData([FromBody] AdjustedDataRequest request)
        //{
        //    if (request == null || request.Column.Intensities == null || request.ReferenceSeries == null)
        //        return BadRequest(new { message = "Neplatné dáta v požiadavke." });

        //    int n = request.Column.Intensities.Count;
        //    if (n == 0 || request.ReferenceSeries.Count != n)
        //        return BadRequest(new { message = "OriginalIntensities a ReferenceIntensities musia mať rovnakú dĺžku > 0." });

        //    double[] original = new double[n];
        //    for (int i = 0; i < n; i++)
        //    {
        //        original[i] = request.Column.Intensities[i].HasValue ? request.Column.Intensities[i].Value : 0;
        //    }

        //    double[] reference = request.ReferenceSeries.ToArray();

        //    // Použitie adaptívnej interpolácie
        //    double[] adjustedValues = ComputeAdaptiveInterpolation(original, reference);

        //    return Ok(new
        //    {
        //        Message = "Calculation completed (Adaptive Interpolation)",
        //        AdjustedValues = adjustedValues
        //    });
        //}

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
                                newData.MultipliedIntensity = calculatedData.CALCULATEDINTENSITIES[i] * factor;

                            nextDataId++;
                            _context.LoadedDatas.Add(newData);

                        };
                        await _context.SaveChangesAsync();

                        if (file.Factor.HasValue)
                        {
                            bool success = true;
                            List<LoadedData> loadedDatas = _context.LoadedDatas.Where(x => x.IdFile == calculatedData.IDFILE).ToList();
                            var ordered = loadedDatas.OrderBy(x => x.Excitation).ToList();
                            List<ProfileData> profileDatas = _context.ProfileDatas.Where(x => x.IdFolder == file.IdFolder).ToList();
                            profileDatas.OrderBy(x => x.Excitation).ToList();
                            for (int i = 0; i < ordered.Count; i++)
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

                            if (success) await _context.SaveChangesAsync();
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
                            LoadedData dataToReplace = _context.LoadedDatas.Where(x => x.IdFile == calculatedData.IDFILE && x.Excitation == calculatedData.EXCITACIONS[i]).FirstOrDefault();
                            dataToReplace.Intensity = calculatedData.CALCULATEDINTENSITIES[i];
                            if (file.Factor.HasValue && factor.HasValue && factor != null)
                            {
                                double multiplied = dataToReplace.Intensity * factor.Value;
                                dataToReplace.MultipliedIntensity = multiplied;
                                ProfileData profile = _context.ProfileDatas.Where(x => x.IdFolder == file.IdFolder && x.Excitation == calculatedData.EXCITACIONS[i]).FirstOrDefault();
                                if (profile.MaxIntensity < multiplied)
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
