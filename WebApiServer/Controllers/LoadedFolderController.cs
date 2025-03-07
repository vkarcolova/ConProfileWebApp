using MathNet.Numerics.Interpolation;
using Microsoft.AspNetCore.Mvc;
using WebApiServer.Data;
using WebApiServer.DTOs;
using WebApiServer.Services;
using Accord.MachineLearning.VectorMachines;
using Accord.MachineLearning.VectorMachines.Learning;
using Accord.Statistics.Kernels;
using MathNet.Numerics.Interpolation;

using WebApiServer.Models;
using static System.Runtime.InteropServices.JavaScript.JSType;
using Newtonsoft.Json.Linq;
using MathNet.Numerics.LinearAlgebra;
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

        //BASIC INTERPOLACIA
        [HttpPost("CalculateEmptyData2")]
        public async Task<IActionResult> CalculateEmptyData2([FromBody] ColumnDTO column)
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
        [HttpPost("CalculateEmptyData")]
        public async Task<IActionResult> CalculateEmptyData([FromBody] ColumnDTO column)
        {
            if (column == null || column.Intensities == null || column.Excitations == null ||
                column.Intensities.Count != column.Excitations.Count)
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
                return BadRequest(new
                {
                    message = $"Stĺpec '{column.Name}' nemá dostatočne veľa dát na dopočítanie ďalších dát."
                });
            }

            // Vytvorenie spline interpolácie pre ostatné body
            var spline = CubicSpline.InterpolateNaturalSorted(
                validExcitacions.ToArray(),
                validIntensities.ToArray()
            );

            // Pomocná metóda na lineárnu extrapoláciu
            double LinearExtrapolate(double x1, double y1, double x2, double y2, double x)
            {
                double slope = (y2 - y1) / (x2 - x1);
                return y1 + slope * (x - x1);
            }

            // Detekcia najväčšieho bloku chýbajúcich dát
            int? blockStart = null;
            int? blockEnd = null;
            int maxMissingLength = 0;

            int currentStart = -1;
            int currentLength = 0;

            for (int i = 0; i < column.Intensities.Count; i++)
            {
                if (!column.Intensities[i].HasValue)
                {
                    if (currentStart < 0) currentStart = i;
                    currentLength++;
                }
                else
                {
                    if (currentStart >= 0)
                    {
                        if (currentLength > maxMissingLength)
                        {
                            maxMissingLength = currentLength;
                            blockStart = currentStart;
                            blockEnd = i - 1;
                        }
                        currentStart = -1;
                        currentLength = 0;
                    }
                }
            }
            if (currentStart >= 0 && currentLength > maxMissingLength)
            {
                blockStart = currentStart;
                blockEnd = column.Intensities.Count - 1;
            }

            // Použijeme clamped Hermiteovu interpoláciu pre hlavný blok, ak je obklopený platnými dátami
            if (blockStart.HasValue && blockEnd.HasValue)
            {
                int iStart = blockStart.Value - 1;
                int iEnd = blockEnd.Value + 1;

                if (iStart >= 0 && iEnd < column.Intensities.Count &&
                    column.Intensities[iStart].HasValue &&
                    column.Intensities[iEnd].HasValue)
                {
                    double xA = column.Excitations[iStart];
                    double yA = column.Intensities[iStart].Value;
                    double xB = column.Excitations[iEnd];
                    double yB = column.Intensities[iEnd].Value;

                    // Počet bodov, z ktorých počítame priemerný sklony (napr. 10)
                    int countForSlope = 10;

                    // Vypočítame priemerný smer zo strany pred medzerou
                    int leftStart = Math.Max(0, iStart - countForSlope + 1);
                    // Zostavíme zoznam platných hodnôt z ľavej strany
                    var leftExc = new List<double>();
                    var leftInt = new List<double>();
                    for (int i = leftStart; i <= iStart; i++)
                    {
                        if (column.Intensities[i].HasValue)
                        {
                            leftExc.Add(column.Excitations[i]);
                            leftInt.Add(column.Intensities[i].Value);
                        }
                    }
                    double leftSlope = ComputeAverageSlope(leftExc, leftInt, 0, leftExc.Count);
                    // Ak je leftSlope príliš malý, nastavte minimálnu hodnotu (pozitívnu)
                    if (Math.Abs(leftSlope) < 1e-6)
                        leftSlope = Math.Abs(yA) * 0.05;  // napr. 5 % z hodnoty

                    // Vypočítame priemerný smer zo strany po medzere
                    int rightEnd = Math.Min(column.Intensities.Count - 1, iEnd + countForSlope - 1);
                    var rightExc = new List<double>();
                    var rightInt = new List<double>();
                    for (int i = iEnd; i <= rightEnd; i++)
                    {
                        if (column.Intensities[i].HasValue)
                        {
                            rightExc.Add(column.Excitations[i]);
                            rightInt.Add(column.Intensities[i].Value);
                        }
                    }
                    double rightSlope = ComputeAverageSlope(rightExc, rightInt, 0, rightExc.Count);
                    if (Math.Abs(rightSlope) < 1e-6)
                        rightSlope = Math.Abs(yB) * 0.05;
                    // Na pravej strane chceme negatívny sklon (klesanie)
                    rightSlope = -Math.Abs(rightSlope);

                    // Vytvoríme clamped Hermiteovu spline pre interval [xA, xB]
                    // Používame dve body so zadanými deriváciami:
                    // V MathNet.Numerics trieda CubicHermiteSpline umožňuje takúto interpoláciu.
                    var xs = new double[] { xA, xB };
                    var ys = new double[] { yA, yB };
                    var slopes = new double[] { leftSlope, rightSlope };

                    var hermiteSpline = new CubicHermiteSpline(xA, yA, leftSlope, xB, yB, rightSlope);

                    for (int j = iStart + 1; j < iEnd; j++)
                    {
                        if (!column.Intensities[j].HasValue)
                        {
                            double xVal = column.Excitations[j];
                            double yVal = hermiteSpline.Interpolate(xVal);
                            column.Intensities[j] = yVal;
                            onlyCalculated[j] = yVal;
                            onlyCalculatedExct[j] = xVal;
                        }
                    }
                }
            }

            // Ostatné chýbajúce body (mimo blok) spracujeme pôvodným spôsobom
            for (int i = 0; i < column.Intensities.Count; i++)
            {
                if (!column.Intensities[i].HasValue)
                {
                    double x = column.Excitations[i];

                    if (x < validExcitacions.First())
                    {
                        column.Intensities[i] = LinearExtrapolate(
                            validExcitacions[0], validIntensities[0],
                            validExcitacions[1], validIntensities[1],
                            x);
                    }
                    else if (x > validExcitacions.Last())
                    {
                        column.Intensities[i] = LinearExtrapolate(
                            validExcitacions[^2], validIntensities[^2],
                            validExcitacions[^1], validIntensities[^1],
                            x);
                    }
                    else
                    {
                        column.Intensities[i] = spline.Interpolate(x);
                    }

                    onlyCalculated[i] = column.Intensities[i].Value;
                    onlyCalculatedExct[i] = column.Excitations[i];
                }
            }

            return Ok(new
            {
                Message = "Calculation completed",
                Column = column,
                OnlyValues = onlyCalculated,
                OnlyExcitations = onlyCalculatedExct
            });
        }




        // Pomocná metóda na výpočet priemernej derivácie pre zadané indexy
        private static double ComputeAverageSlope(List<double> excitations, List<double> intensities, int start, int count)
        {
            double sum = 0;
            int validCount = 0;
            for (int i = start; i < start + count - 1 && i + 1 < excitations.Count; i++)
            {
                double dx = excitations[i + 1] - excitations[i];
                double dy = intensities[i + 1] - intensities[i];
                if (Math.Abs(dx) > 1e-9)
                {
                    sum += dy / dx;
                    validCount++;
                }
            }
            return validCount > 0 ? sum / validCount : 0;
        }

        [HttpPost("CalculateAdjustedData")]
        public async Task<IActionResult> CalculateAdjustedData([FromBody] AdjustedDataRequest request)
        {
            if (request == null || request.Column == null || request.ReferenceSeries == null)
            {
                return BadRequest(new { message = "Nesprávne dáta." });
            }

            if (request.Column.Intensities == null ||
                request.Column.Excitations == null ||
                request.Column.Intensities.Count != request.Column.Excitations.Count ||
                request.Column.Intensities.Count != request.ReferenceSeries.Count)
            {
                return BadRequest(new { message = "Nesprávne dáta stĺpca alebo referenčná séria." });
            }

            int n = request.Column.Intensities.Count;
            var computedIntensities = new double?[n];

            int i = 0;
            while (i < n)
            {
                if (request.Column.Intensities[i].HasValue)
                {
                    computedIntensities[i] = null;
                    i++;
                }
                else
                {
                    int gapStart = i;
                    while (i < n && !request.Column.Intensities[i].HasValue) i++;
                    int gapEnd = i;

                    if (gapStart == 0 || gapEnd == n)
                    {
                        continue; // Extrapoláciu ponecháme pôvodnú
                    }

                    // Posledný známy bod pred medzerou
                    double xA = request.Column.Excitations[gapStart - 1];
                    double yA = request.Column.Intensities[gapStart - 1].Value;
                    // Prvý známy bod po medzere
                    double xB = request.Column.Excitations[gapEnd];
                    double yB = request.Column.Intensities[gapEnd].Value;

                    // Získanie referenčných hodnôt v chýbajúcom úseku
                    List<double> refX = new List<double>();
                    List<double> refY = new List<double>();

                    // Pridanie okrajových bodov pre lepšiu interpoláciu
                    refX.Add(xA);
                    refY.Add(yA);

                    for (int j = gapStart; j < gapEnd; j++)
                    {
                        refX.Add(request.Column.Excitations[j]);
                        refY.Add(request.ReferenceSeries[j]);
                    }

                    refX.Add(xB);
                    refY.Add(yB);

                    // Vytvorenie polynómového fitu cez referenčné hodnoty (stupeň 3)
                    var polyFit = MathNet.Numerics.Fit.Polynomial(refX.ToArray(), refY.ToArray(), 3);

                    // Dopočítanie chýbajúcich hodnôt pomocou fitovanej krivky
                    double[] interpolatedValues = new double[gapEnd - gapStart];

                    for (int j = gapStart; j < gapEnd; j++)
                    {
                        double x = request.Column.Excitations[j];

                        // Manuálny výpočet hodnoty polynómu
                        double yFit = 0;
                        for (int k = 0; k < polyFit.Length; k++)
                        {
                            yFit += polyFit[k] * Math.Pow(x, k);
                        }

                        interpolatedValues[j - gapStart] = yFit;
                    }

                    // **Spojíme interpoláciu s okrajmi posunom**
                    double yFitStart = interpolatedValues[0]; // Prvý interpolovaný bod
                    double yFitEnd = interpolatedValues[^1]; // Posledný interpolovaný bod

                    double shiftStart = yA - yFitStart; // Posun, aby interpolácia začínala správne
                    double shiftEnd = yB - yFitEnd; // Posun, aby interpolácia končila správne

                    // Dopočítanie upravených hodnôt
                    for (int j = gapStart; j < gapEnd; j++)
                    {
                        double t = (j - gapStart) / (double)(gapEnd - gapStart - 1); // Normalizácia do [0,1]
                        computedIntensities[j] = interpolatedValues[j - gapStart] + (1 - t) * shiftStart + t * shiftEnd;
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
