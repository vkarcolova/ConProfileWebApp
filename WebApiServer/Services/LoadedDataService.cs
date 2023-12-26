﻿using System;
using System.Collections.Generic;
using System.Data;
using System.Diagnostics;
using System.Globalization;
using System.Linq;
using System.Numerics;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using WebApiServer.Data;
using WebApiServer.DTOs;
using WebApiServer.Models;
using static System.Net.Mime.MediaTypeNames;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace WebApiServer.Services
{
    public interface ILoadedDataService
    {
        public Task<IActionResult> MultiplyData(MultiplyDataDTO multiplyDatas);
        public Task<IActionResult> ProcessNewProjectData(LoadedFileDTO[] loadedFiles, string token, int idProject);
        public Task<IActionResult> AddProjectData(LoadedFileDTO[] loadedFiles);

    }

    public class LoadedDataService : ILoadedDataService
    {
        private readonly ApiDbContext _context;

        public LoadedDataService(ApiDbContext context)
        {
            _context = context;
        }

        public async Task<IActionResult> MultiplyData(MultiplyDataDTO multiplyDatas)
        {
            if (multiplyDatas != null)
            {
                try
                {

                    List<List<LoadedData>> allData = new List<List<LoadedData>>();

                    for (int i = 0; i < multiplyDatas.IDS.Count; i++)
                    {
                        List<LoadedData> datas = _context.LoadedDatas.Where(item => item.IdFile == multiplyDatas.IDS[i]).ToList();

                        allData.Add(datas);

                        foreach (var data in datas)
                        {
                            double multiplied = data.Intensity * multiplyDatas.FACTORS[i];
                            data.MultipliedIntensity = multiplied;
                        }
                    }
                    int idProfile = _context.ProfileDatas.Count() + 1;

                    if (allData[0][0].MultipliedIntensity.HasValue)
                    {
                        List<ProfileData> profileData = _context.ProfileDatas.Where(item => item.IdFolder == multiplyDatas.IDFOLDER).ToList();
                        _context.ProfileDatas.RemoveRange(profileData);
                    }


                    for (int i = 0; i < allData[0].Count; i++) //kazdy riadok
                    {
                        double maxIntensity = -1;
                        for (int j = 0; j < allData.Count; j++) //kazdy folder
                        {
                            var local = allData[j][i].MultipliedIntensity;

                            if (allData[j][i].MultipliedIntensity > maxIntensity)
                                maxIntensity = (double)allData[j][i].MultipliedIntensity;

                        }

                        //create profile 
                        ProfileData profile = new ProfileData
                        {
                            IdProfileData = idProfile,
                            Excitation = allData[0][i].Excitation,
                            IdFolder = multiplyDatas.IDFOLDER,
                            MaxIntensity = maxIntensity
                        };
                        _context.ProfileDatas.Add(profile);
                        idProfile++;
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

        public async Task<IActionResult> ProcessNewProjectData(LoadedFileDTO[] loadedFiles, string token, int idProject)
        {
            if (loadedFiles != null)
            {
                try
                {
                    Project newProject = new Project
                    {
                        ProjectName = "NewProject",
                        IdProject = idProject,
                        Token = token,
                        Created = DateTime.UtcNow,
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
                    for (int i = 0; i < loadedFiles.Length; i++)
                    {
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
                            if (line != null)
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
                    return new BadRequestResult() ;
                }

            }
            else
            {
                return new BadRequestResult(); // Odpoveď 400 Bad Request
            }

        }

        public async Task<IActionResult> AddProjectData(LoadedFileDTO[] loadedFiles)
        {
            if (loadedFiles != null)
            {
                try
                {
                    int idProject = loadedFiles[0].IDPROJECT;
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
                    for (int i = 0; i < loadedFiles.Length; i++)
                    {
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
                            if (line != null)
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
