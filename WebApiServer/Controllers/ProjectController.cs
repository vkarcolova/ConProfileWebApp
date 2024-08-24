using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.ConstrainedExecution;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using WebApiServer.Data;
using WebApiServer.DTOs;
using WebApiServer.Models;
using WebApiServer.Services;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace WebAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly ApiDbContext _context;
        private readonly IDataProcessService _loadedDataService;

        public ProjectController(ApiDbContext context,
            IDataProcessService service)
        {
            _context = context;
            _loadedDataService = service;
        }


        [HttpGet("GetProjectsByToken/{token}")]
        public ActionResult<List<ProjectDTO>> GetItemsByToken(string token)
        {
            var userToken = token.ToString().Replace("Bearer ", "");

            List<Project> projects = _context.Projects.Where(project => project.Token == userToken).ToList();

            if (projects == null)
            {
                return NotFound(); // vráti HTTP 404, ak žiadne položky nie sú nájdené
            }
            else
            {
                List<ProjectDTO> allProjects = new List<ProjectDTO>();
                foreach (Project project in projects)
                {
                    List<LoadedFolder> folders = _context.LoadedFolders.Where(folder => folder.IdProject == project.IdProject).ToList();
                    List<FolderDTO> foldersDTO = new List<FolderDTO>();
                    foreach (LoadedFolder folder in folders)
                    {
                        FolderDTO folderDTO = new FolderDTO { FOLDERNAME = folder.FolderName };
                        foldersDTO.Add(folderDTO);
                    }
                    ProjectDTO result = new ProjectDTO
                    {
                        IDPROJECT = project.IdProject,
                        PROJECTNAME = project.ProjectName,
                        FOLDERS = foldersDTO,
                        CREATED = project.Created,
                    };

                    allProjects.Add(result);
                }

                return allProjects;
            }
        }

        //Spracovanie suborov a poslanie ich vo forme dto este nesavnutie
        [HttpPost("CreateNewProject")]
        public async Task<IActionResult> CreateNewProject([FromBody] FileContent[] loadedFiles)
        {
            // Spracovanie prijatých súborov
            if (loadedFiles != null && loadedFiles.Any())
            {
                var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                string token = "";
                if (userToken == "")
                    token = _loadedDataService.GenerateJwtToken();
                else token = userToken;

                List<FolderDTO> folders = new List<FolderDTO>();
                folders.Add(_loadedDataService.ProcessUploadedFolder(loadedFiles));
                ProjectDTO result = new ProjectDTO
                {
                    CREATED = DateTime.Now,
                    FOLDERS = folders,
                    IDPROJECT = -1,
                    PROJECTNAME = loadedFiles[0].FOLDERNAME
                };
                if (folders.Count != 0) return Ok(new { TOKEN = token, PROJECT = result });
                else return BadRequest(result);
            }
            else
            {
                return BadRequest("Chybný formát dát.");
            }
        }

        //Savnutie noveho projekt
        [HttpPost("SaveNewProject")]
        public async Task<IActionResult> SaveNewProject([FromBody] ProjectDTO projectData)
        {
            try
            {// Spracovanie prijatých súborov
                if (projectData != null && projectData.FOLDERS.Any())
                {
                    var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                    string token;
                    if (userToken == "") token = _loadedDataService.GenerateJwtToken();
                    else token = userToken;

                    Project project = new Project
                    {
                        Created = projectData.CREATED.ToUniversalTime(),
                        IdProject = _context.Projects.Count() + 1,
                        ProjectName = projectData.PROJECTNAME,
                        Token = token
                    };
                    _context.Projects.Add(project);
                    int nextFileId = _context.LoadedFiles.Count() + 1;
                    int nextFolderId = _context.LoadedFolders.Count() + 1;
                    int nextDataId = _context.LoadedDatas.Count() + 1;
                    int nextProfileId = _context.ProfileDatas.Count() + 1;



                    foreach (FolderDTO folderData in projectData.FOLDERS)
                    {
                        LoadedFolder folder = new LoadedFolder
                        {
                            IdProject = project.IdProject,
                            IdFolder = nextFolderId,
                            FolderName = folderData.FOLDERNAME
                        };
                        _context.LoadedFolders.Add(folder);
                        nextFolderId++;

                        foreach (FileDTO fileData in folderData.DATA)
                        {
                            LoadedFile file = new LoadedFile
                            {
                                IdFolder = folder.IdFolder,
                                IdFile = nextFileId,
                                FileName = fileData.FILENAME,
                                Spectrum = fileData.SPECTRUM
                            };
                            _context.LoadedFiles.Add(file);
                            nextFileId++;

                            for (int i = 0; i < fileData.INTENSITY.Count; i++)
                            {

                                LoadedData data = new LoadedData
                                {
                                    IdFile = file.IdFile,
                                    IdData = nextDataId,
                                    Excitation = fileData.INTENSITY[i].EXCITATION,
                                    Intensity = fileData.INTENSITY[i].INTENSITY,
                                    MultipliedIntensity = fileData.INTENSITY[i].MULTIPLIEDINTENSITY != null
                                 ? fileData.INTENSITY[i].MULTIPLIEDINTENSITY : null
                                };
                                _context.LoadedDatas.Add(data);
                                nextDataId++;
                            }
                        }
                        if (folderData.PROFILE != null)
                        {
                            for (int i = 0; i < folderData.PROFILE.Count; i++)
                            {
                                ProfileData data = new ProfileData
                                {
                                    IdFolder = folder.IdFolder,
                                    IdProfileData = nextDataId,
                                    Excitation = folderData.EXCITATION[i],
                                    MaxIntensity = folderData.PROFILE[i],
                                };
                                nextDataId++;
                                _context.ProfileDatas.Add(data);
                            }
                        }

                    }

                    _context.SaveChanges();

                    return Ok(new
                    {
                        ProjectId = project.IdProject,
                        Token = token
                    });
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

        //GET PROJECT FROM ID POTREBUJEM
        [HttpGet("GetProject/{id}")]
        public ActionResult<ProjectDTO> GetItemById(int id)
        {
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");

            Project project = _context.Projects.Where(project => project.IdProject == id && project.Token == userToken).FirstOrDefault();

            if (project == null)
            {
                return NotFound(); // vráti HTTP 404, ak žiadne položky nie sú nájdené
            }
            else
            {
                List<double> excitation = new List<double>();
                List<LoadedFolder> folders = _context.LoadedFolders.Where(folder => folder.IdProject == id).ToList();
                List<FolderDTO> folderList = new List<FolderDTO>();

                foreach (LoadedFolder folder in folders)
                {
                    List<LoadedFile> files = _context.LoadedFiles.Where(file => file.IdFolder == folder.IdFolder).OrderBy(file => file.Spectrum).ToList();
                    List<FileDTO> tabledata = new List<FileDTO>();

                    foreach (LoadedFile file in files)
                    {

                        List<LoadedData> loadedData = _context.LoadedDatas.Where(data => data.IdFile == file.IdFile).ToList();

                        List<IntensityDTO> intensity = loadedData.Select(obj => new IntensityDTO
                        { INTENSITY = obj.Intensity, EXCITATION = obj.Excitation, MULTIPLIEDINTENSITY =obj.MultipliedIntensity, IDDATA = obj.IdData })
                            .ToList();

                        if (excitation.Count == 0 || (excitation.Count < intensity.Count))
                            excitation = loadedData.Select(data => data.Excitation).ToList();

                        FileDTO data = new FileDTO
                        {
                            ID = file.IdFile,
                            FILENAME = file.FileName,
                            INTENSITY = intensity,
                            SPECTRUM = file.Spectrum
                        };

                        tabledata.Add(data);
                    }

                    FolderDTO newFolder = new FolderDTO
                    {
                        ID = folder.IdFolder,
                        FOLDERNAME = folder.FolderName,
                        EXCITATION = excitation,
                        DATA = tabledata

                    };

                    if (tabledata[0].INTENSITY[0].MULTIPLIEDINTENSITY.HasValue)
                    {
                        List<ProfileData> dataprofiles = _context.ProfileDatas.Where(data => data.IdFolder == folder.IdFolder).ToList();
                        List<double> profile = dataprofiles.Select(data => data.MaxIntensity).ToList();
                        newFolder.PROFILE = profile;
                    }

                    folderList.Add(newFolder);
                }


                ProjectDTO result = new ProjectDTO
                {
                    IDPROJECT = id,
                    PROJECTNAME = project.ProjectName,
                    FOLDERS = folderList,
                    CREATED = project.Created,

                };
                return result;
            }
        }

        [HttpDelete("DeleteProject/{id}")]
        public ActionResult<ProjectDTO> DeleteItemById(int id)
        {
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            Project projectToRemove = _context.Projects.FirstOrDefault(project => project.IdProject == id && project.Token == userToken);
            if (projectToRemove == null) return NotFound();
            List<LoadedFolder> folders = _context.LoadedFolders.Where(folder => folder.IdProject == id).ToList();
            foreach (LoadedFolder folder in folders)
            {
                List<LoadedFile> files = _context.LoadedFiles.Where(file => file.IdFolder == folder.IdFolder).ToList();
                foreach (LoadedFile file in files)
                {
                    List<LoadedData> data = _context.LoadedDatas.Where(datas => datas.IdFile == file.IdFile).ToList();

                    _context.LoadedDatas.RemoveRange(data);
                }
                _context.LoadedFiles.RemoveRange(files);

                List<ProfileData> profile = _context.ProfileDatas.Where(data => data.IdFolder == folder.IdFolder).ToList();
                _context.ProfileDatas.RemoveRange(profile);
            }
            _context.LoadedFolders.RemoveRange(folders);

            _context.Projects.Remove(projectToRemove);
            _context.SaveChanges();

            return Ok();
        }

    }
}