using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WebApiServer.Data;
using WebApiServer.DTOs;
using WebApiServer.Models;
using static System.Net.Mime.MediaTypeNames;

namespace WebApiServer.Services
{
    public interface ILoadedDataService
    {
        public Task<IActionResult> ProcessLoadedData(LoadedFileDTO[] loadedFiles);
    }

    public class LoadedDataService : ILoadedDataService
    {
        private readonly ApiDbContext _context;

        public LoadedDataService(ApiDbContext context)
        {
            _context = context;
        }
        public async Task<IActionResult> ProcessLoadedData(LoadedFileDTO[] loadedFiles)
        {
            if (loadedFiles != null)
            {
                try
                {
                    int idProject = _context.Projects.Count() + 1;
                    Project newProject = new Project
                    {
                        ProjectName = "NewProject",
                        IdProject = idProject
                    };
                    _context.Projects.Add(newProject);

                    int idFolder = _context.LoadedFolders.Count() + 1;
                    LoadedFolder newFolder = new LoadedFolder
                    {
                        FolderName = loadedFiles[0].FOLDERNAME,
                        IdFolder = idFolder,
                        IdProject = idProject
                    };
                    _context.LoadedFolders.Add(newFolder);
                    int idData = _context.LoadedDatas.Count();
                    int rowCount = 1;
                    int idFile = _context.LoadedFiles.Count() + 1;
                    for (int i = 0; i < loadedFiles.Length; i++) { 
                        LoadedFileDTO file = loadedFiles[i];
                        int spectrum = -1;
                        string pattern = @"(?<=m)\d+(?=\.)"; //cisla co su po m a pred . 
                        Match typeOfData = Regex.Match(file.FILENAME, pattern);
                        if (int.TryParse(typeOfData.Value, NumberStyles.Float, CultureInfo.InvariantCulture, out int resultType))
                        {
                            spectrum = resultType;
                        }

                        LoadedFile newFile = new LoadedFile
                        {
                            FileName = loadedFiles[i].FILENAME,
                            IdFolder = idFolder,
                            IdFile = idFile + i,
                            Spectrum = spectrum
                        };
                        _context.LoadedFiles.Add(newFile);

                        string[] lines = file.CONTENT.Split('\n');
                        bool startReading = false;


                        foreach (var row in lines)
                        {
                            string line = row.Replace("\r", "");


                            double excitacion = -1;
                            double data = -1;
                            if (line  != null)
                            {
                                if (startReading == true && !string.IsNullOrWhiteSpace(line))
                                {
                                    string[] words = line.Split(new char[] { ' ', '\t' }, StringSplitOptions.RemoveEmptyEntries); //rozdelenie slov v riadku
                                    if (double.TryParse(words[0].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out double x))
                                    {
                                        excitacion = x;
                                    }

                                    if (double.TryParse(words[1].Trim(), NumberStyles.Float, CultureInfo.InvariantCulture, out double result)) //skusam slovo dat na double
                                    {
                                        data = result;
                                    }
                                    

                                    LoadedData newRow = new LoadedData
                                    {
                                        IdFile = idFile + i,
                                        Excitation = excitacion,
                                        Intensity = data,
                                        IdData = idData + rowCount
                                    };
                                    rowCount++;
                                    _context.LoadedDatas.Add(newRow);

                                }



                                if (startReading == false && line == "#DATA") 
                                    startReading = true;
                            }

                        }

                    }
                    _context.SaveChanges();

                    return new OkResult(); // Odpoveď 200 OK
                }
                catch (Exception ex)
                {
                    return new BadRequestResult(); ;
                }

            }
            else
            {
                return new BadRequestResult(); // Odpoveď 400 Bad Request
            }

        }
    }
}
