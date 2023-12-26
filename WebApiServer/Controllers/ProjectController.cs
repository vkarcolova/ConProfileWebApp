using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Runtime.ConstrainedExecution;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using WebApiServer.Data;
using WebApiServer.DTOs;
using WebApiServer.Models;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace WebAPI.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class ProjectController : ControllerBase
    {
        private readonly ILogger<ProjectController> _logger;
        private readonly ApiDbContext _context;

        public ProjectController(ApiDbContext context,
            ILogger<ProjectController> logger)
        {
            _logger = logger;
            _context = context;
        }

        [HttpGet("GetCount")]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var count = _context.Projects.Count();

                return Ok(new { Count = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Error = "Internal Server Error", Message = ex.Message });
            }
        }

        [HttpGet("GetProjectsByToken/{token}")]
        public ActionResult<List<ProjectDTO>> GetItemsByToken(string token)
        {
            var userToken = token.ToString().Replace("Bearer ", "");

            List<Project> projects = _context.Projects.Where(project => project.Token == userToken).ToList();

            if (projects == null)
            {
                return NotFound(); // vráti HTTP 404, ak žiadne položky nie sú nájdené
            } else
            {
                List<ProjectDTO> allProjects = new List<ProjectDTO>();
                foreach(Project project in projects)
                {
                    List<LoadedFolder> folders = _context.LoadedFolders.Where(folder => folder.IdProject == project.IdProject).ToList();
                    List<FolderDTO> foldersDTO = new List<FolderDTO>();
                    foreach(LoadedFolder folder in folders)
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
                bool multipliedData = false;


                foreach (LoadedFolder folder in folders) { 
                    List<LoadedFile> files = _context.LoadedFiles.Where(file => file.IdFolder == folder.IdFolder).OrderBy(file => file.Spectrum).ToList();
                    List<TableDataDTO> tabledata = new List<TableDataDTO>();

                    foreach (LoadedFile file in files)
                    {

                        List <LoadedData> loadedData = _context.LoadedDatas.Where(data => data.IdFile == file.IdFile).ToList();
                        

                        List<double> intensity = loadedData.Select(data => data.Intensity).ToList();

                        if (excitation.Count == 0 || (excitation.Count < intensity.Count))
                            excitation = loadedData.Select(data => data.Excitation).ToList();

                        TableDataDTO data = new TableDataDTO
                        {
                            ID = file.IdFile,
                            FILENAME = file.FileName,
                            INTENSITY = intensity,
                            SPECTRUM = file.Spectrum
                        };

                        if (loadedData[0].MultipliedIntensity != null)
                        {
                            List<double> multipliedintensity = new List<double>();
                            multipliedintensity = loadedData.Select(data => data.MultipliedIntensity.GetValueOrDefault()).ToList();
                            if(multipliedintensity.Count > 0) 
                                data.MULTIPLIEDINTENSITY = multipliedintensity;

                            multipliedData = true;

                        }

                        tabledata.Add(data);
                    }

                    

                    FolderDTO newFolder = new FolderDTO
                    {
                        ID = folder.IdFolder,
                        FOLDERNAME = folder.FolderName,
                        EXCITATION = excitation,
                        DATA = tabledata

                    };

                    if (multipliedData)
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


    }
}