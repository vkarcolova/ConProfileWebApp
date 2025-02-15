using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Reflection.Metadata;
using System.Runtime.ConstrainedExecution;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using Microsoft.AspNetCore.Http.HttpResults;
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
        private readonly IUserService _userService;

        public ProjectController(ApiDbContext context,
            IDataProcessService service,
            IUserService userService)
        {
            _context = context;
            _loadedDataService = service;
            _userService = userService;
        }


        [HttpGet("GetProjectsByToken/{token}")] // ked je v rezime host bez prihlasenia iba 
        public ActionResult<List<ProjectDTO>> GetProjectsByToken(string token)
        {
            var userToken = token.ToString().Replace("Bearer ", "");

            List<Project> projects = _context.Projects.Where(project => project.Token == userToken && project.CreatedBy == "").ToList();

            if (projects == null)
            {
                return NotFound(); // vráti HTTP 404, ak žiadne položky nie sú nájdené
            }
            else
            {
                return getSpecificProjectDTOs(projects);
            }
        }


        [HttpGet("GetProjectsByUser/{useremail}")] // ked je v rezime  prihlasenia  
        public ActionResult<List<ProjectDTO>> GetProjectsByUser(string useremail)
        {
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized("Neplatné prihlásenie");

            List<Project> projects = _context.Projects.Where(project => project.CreatedBy == useremail).ToList();

            if (projects == null)
            {
                return NotFound();
            }
            else
            {
                return getSpecificProjectDTOs(projects);
            }
        }

        private List<ProjectDTO> getSpecificProjectDTOs(List<Project> projects)
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
                    USEREMAIL = project.CreatedBy
                };

                allProjects.Add(result);
            }

            return allProjects;
        }

        //Spracovanie suborov a poslanie ich vo forme dto este nesavnutie
        [HttpPost("CreateNewProject")]
        public async Task<IActionResult> CreateNewProject([FromBody] FileContent[] loadedFiles)
        {
            // Spracovanie prijatých súborov
            if (loadedFiles != null && loadedFiles.Any())
            {
                var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                var userEmail = Request.Headers["UserEmail"].ToString();
                string token = "";
                if (userToken == "")
                {
                    if (string.IsNullOrEmpty(userEmail)) token = _userService.GenerateJwtToken();
                    else token = _userService.GenerateJwtToken(userEmail!);

                }
                else token = userToken;

                if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                    return Unauthorized("Neplatné prihlásenie");

                List<FolderDTO> folders = new List<FolderDTO>();
                folders.Add(_loadedDataService.ProcessUploadedFolder(loadedFiles));
                ProjectDTO result = new ProjectDTO
                {
                    CREATED = DateTime.Now,
                    FOLDERS = folders,
                    IDPROJECT = -1,
                    PROJECTNAME = "NovyProjekt",
                    USEREMAIL = userEmail
                };
                if (folders.Count != 0) return Ok(new { TOKEN = token, PROJECT = result });
                else return BadRequest(result);
            }
            else
            {
                return BadRequest("Chybný formát dát.");
            }
        }

        [HttpPost("CreateNewProjectWithExcel")]
        public async Task<IActionResult> CreateNewProjectWithExcel([FromBody] ExcelFileContent content)
        {
            // Spracovanie prijatých súborov
            if (content != null)
            {
                var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
                var userEmail = Request.Headers["UserEmail"].ToString();
                string token = "";
                if (userToken == "")
                {
                    if (string.IsNullOrEmpty(userEmail)) token = _userService.GenerateJwtToken();
                    else token = _userService.GenerateJwtToken(userEmail!);

                }
                else token = userToken;

                if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                    return Unauthorized("Neplatné prihlásenie");
                List<FolderDTO> folders = new List<FolderDTO>();
                folders.Add(_loadedDataService.ProcessUploadedFolderFromExcel(content));
                ProjectDTO result = new ProjectDTO
                {
                    CREATED = DateTime.Now,
                    FOLDERS = folders,
                    IDPROJECT = -1,
                    PROJECTNAME = "NovyProjekt",
                    USEREMAIL = userEmail
                };
                if (folders.Count != 0) return Ok(new { TOKEN = token, PROJECT = result });
                else return BadRequest(result);
            }
            else
            {
                return BadRequest("Chybný formát dát.");
            }
        }

        [HttpPost("CreateNewProjectWithDatabank")]
        public async Task<IActionResult> CreateNewProjectWithDatabank([FromBody] DatabankDataToSend data)
        {
            // Spracovanie prijatých súborov
            if(data == null) return BadRequest();
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();
            string token = "";
            if (userToken == "")
            {
                if (string.IsNullOrEmpty(userEmail)) token = _userService.GenerateJwtToken();
                else token = _userService.GenerateJwtToken(userEmail!);

            }
            else token = userToken;
            List<FolderDTO> folders = new List<FolderDTO>();

            if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized("Neplatné prihlásenie");
            if (data.ids != null && data.ids.Count > 0)
            {

                List<int> folderIds = data.ids
                .Where(id => id.StartsWith("folder"))
                .Select(id => int.Parse(id.Substring(6)))
                .ToList();


                foreach (var folder in folderIds)
                {
                    DataBankFolder folderData = _context.DataBankFolders.Where(x => x.Id == folder).FirstOrDefault();
                    List<DataBankFile> filesFromFolder = _context.DataBankFiles.Where(file => file.FolderId == folder).ToList();
                    FileContent[] filecontents = new FileContent[filesFromFolder.Count];
                    for (int i = 0; i < filecontents.Length; i++)
                    {
                        filecontents[i] = new FileContent
                        {
                            FILENAME = filesFromFolder[i].FileName,
                            FOLDERNAME = folderData.FolderName,
                            USEREMAIL = userEmail,
                            CONTENT = Encoding.UTF8.GetString(filesFromFolder[i].Content)
                        };
                    }

                    folders.Add(_loadedDataService.ProcessUploadedFolder(filecontents));

                }
            }

            if (data.excelContents != null && data.excelContents.Count > 0)
            {
                foreach (var file in data.excelContents)
                {
                    folders.Add(_loadedDataService.ProcessUploadedFolderFromExcel(file));
                }
            }
            ProjectDTO result = new ProjectDTO
            {
                CREATED = DateTime.Now,
                FOLDERS = folders,
                IDPROJECT = -1,
                PROJECTNAME = "NovyProjekt",
                USEREMAIL = userEmail
            };
            if (folders.Count != 0) return Ok(new { TOKEN = token, PROJECT = result });
            else return BadRequest(result);
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
                    if (userToken == "") token = _userService.GenerateJwtToken();
                    else token = userToken;
                    var userEmail = Request.Headers["UserEmail"].ToString();

                    if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                        return Unauthorized("Neplatné prihlásenie");


                    int idproject = (_context.Projects.OrderByDescending(obj => obj.IdProject).FirstOrDefault()?.IdProject ?? 0) + 1;

                    Project project = new Project
                    {
                        Created = projectData.CREATED.ToUniversalTime(),
                        IdProject = idproject,
                        ProjectName = projectData.PROJECTNAME,
                        Token = token,
                        CreatedBy = userEmail,

                    };
                    _context.Projects.Add(project);
                    int nextFileId = (_context.LoadedFiles.OrderByDescending(obj => obj.IdFile).FirstOrDefault()?.IdFile ?? 0) + 1;
                    int nextFolderId = (_context.LoadedFolders.OrderByDescending(obj => obj.IdFolder).FirstOrDefault()?.IdFolder ?? 0) + 1;
                    int nextDataId = (_context.LoadedDatas.OrderByDescending(obj => obj.IdData).FirstOrDefault()?.IdData ?? 0) + 1;
                    int nextProfileId = (_context.ProfileDatas.OrderByDescending(p => p.IdProfileData).FirstOrDefault()?.IdProfileData ?? 0) + 1;


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
                                    IdProfileData = nextProfileId,
                                    Excitation = folderData.EXCITATION[i],
                                    MaxIntensity = folderData.PROFILE[i],
                                };
                                nextProfileId++;
                                _context.ProfileDatas.Add(data);
                            }
                        }

                    }

                    await _context.SaveChangesAsync();

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


        //GET PROJECT FROM ID z db
        [HttpGet("GetProject/{id}")]
        public ActionResult<ProjectDTO> GetItemById(int id)
        {
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized("Neplatné prihlásenie");



            Project project = _context.Projects.Where(project => project.IdProject == id && (project.Token == userToken || userEmail == project.CreatedBy)).FirstOrDefault();

            if (project == null)
            {
                return NotFound();
            }
            else
            {
                List<LoadedFolder> folders = _context.LoadedFolders.Where(folder => folder.IdProject == id).ToList();
                List<FolderDTO> folderList = new List<FolderDTO>();

                foreach (LoadedFolder folder in folders)
                {
                    List<double> excitation = new List<double>();

                    List<LoadedFile> files = _context.LoadedFiles.Where(file => file.IdFolder == folder.IdFolder).OrderBy(file => file.Spectrum).ToList();
                    List<FileDTO> fileList = new List<FileDTO>();
                    bool excitacionLoaded = false;

                    foreach (LoadedFile file in files)
                    {

                        List<LoadedData> loadedData = _context.LoadedDatas.Where(data => data.IdFile == file.IdFile).ToList();

                        List<IntensityDTO> intensity = loadedData.Select(obj => new IntensityDTO
                        { INTENSITY = obj.Intensity, EXCITATION = obj.Excitation, MULTIPLIEDINTENSITY = obj.MultipliedIntensity, IDDATA = obj.IdData })
                            .ToList();

                        if (excitacionLoaded)
                            excitation = loadedData.Select(data => data.Excitation).ToList();
                        else
                        {
                            foreach (var loaded in loadedData)
                            {
                                double excitacionLoadedData = loaded.Excitation;
                                if (!excitation.Contains(excitacionLoadedData)) excitation.Add(excitacionLoadedData);
                            }
                        }

                        FileDTO data = new FileDTO
                        {
                            ID = file.IdFile,
                            FILENAME = file.FileName,
                            INTENSITY = intensity,
                            SPECTRUM = file.Spectrum,
                            FACTOR = file.Factor
                        };


                        fileList.Add(data);
                    }
                    excitation.Sort();
                    fileList = fileList.OrderBy(x => x.SPECTRUM == -1 ? 0 : 1)
                   .ThenBy(x => x.SPECTRUM == -1 ? x.FILENAME : x.SPECTRUM.ToString())
                   .ToList();

                    FolderDTO newFolder = new FolderDTO
                    {
                        ID = folder.IdFolder,
                        FOLDERNAME = folder.FolderName,
                        EXCITATION = excitation,
                        DATA = fileList
                    };

                    if (fileList[0].INTENSITY[0].MULTIPLIEDINTENSITY.HasValue)
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
                    USEREMAIL = project.CreatedBy
                };
                return result;
            }
        }

        //GET PROJECT FROM ID z db
        [HttpPut("UpdateProjectName")]
        public async Task<ActionResult<ProjectDTO>> UpdateProjectNameAsync([FromQuery] int idproject, [FromQuery] string projectname)
        {
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();


            if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized("Neplatné prihlásenie");

            Project project = _context.Projects.Where(project =>
                                project.IdProject == idproject && (project.Token == userToken || project.CreatedBy == userEmail)).FirstOrDefault();

            if (project == null)
            {
                return NotFound();
            }

            project.ProjectName = projectname;
            await _context.SaveChangesAsync();
            return Ok();
        }


        [HttpDelete("DeleteProject/{id}")]
        public ActionResult<ProjectDTO> DeleteItemById(int id)
        {
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized("Neplatné prihlásenie");

            Project projectToRemove = _context.Projects.Where(project =>
                                project.IdProject == id && (project.Token == userToken || project.CreatedBy == userEmail)).FirstOrDefault();

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

        [HttpDelete("DeleteFoldersFromProject")]
        public async Task<IActionResult> DeleteFoldersFromProject([FromBody] FolderDeleteRequestDTO request)
        {
            var userToken = Request.Headers["Authorization"].ToString().Replace("Bearer ", "");
            var userEmail = Request.Headers["UserEmail"].ToString();

            if (!string.IsNullOrEmpty(userEmail) && !_userService.IsAuthorized(userEmail, userToken))
                return Unauthorized("Neplatné prihlásenie");


            var projectId = request.PROJECTID;
            var folderIds = request.FOLDERIDS;
            Project projectToRemove = _context.Projects.Where(project =>
                                project.IdProject == projectId && (project.Token == userToken || project.CreatedBy == userEmail)).FirstOrDefault();

            if (projectToRemove == null) return NotFound();
            List<LoadedFolder> folders = _context.LoadedFolders.Where(folder => folder.IdProject == projectId).ToList();
            List<string> failedToDelete = new List<string>();
            foreach (int folderId in folderIds)
            {
                LoadedFolder folderToDelete = folders.Where(value => value.IdFolder == folderId).FirstOrDefault();
                if (folderToDelete == null)
                {
                    failedToDelete.Add(folderToDelete.FolderName);
                }
                else
                {
                    try
                    {
                        List<LoadedFile> files = _context.LoadedFiles.Where(file => file.IdFolder == folderId).ToList();
                        foreach (LoadedFile file in files)
                        {
                            List<LoadedData> data = _context.LoadedDatas.Where(datas => datas.IdFile == file.IdFile).ToList();

                            _context.LoadedDatas.RemoveRange(data);
                        }
                        _context.LoadedFiles.RemoveRange(files);

                        List<ProfileData> profile = _context.ProfileDatas.Where(data => data.IdFolder == folderId).ToList();
                        _context.ProfileDatas.RemoveRange(profile);
                        _context.LoadedFolders.Remove(folderToDelete);
                    }
                    catch
                    {
                        failedToDelete.Add(folderToDelete.FolderName);
                    }
                }
            }

            _context.SaveChanges();
            if (failedToDelete.Count == 0) return Ok();
            else
                return NotFound("Nasledujúce priečinky sa nepodarilo vymazať: " + string.Join(", ", failedToDelete));

        }
    }
}