using Accord;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion.Internal;

namespace WebApiServer.DTOs
{
    public class FileContent
    {
        public int IDPROJECT { get; set; }
        public string FILENAME { get; set; }
        public string FOLDERNAME { get; set; }
        public string CONTENT { get; set; }
        public string? USEREMAIL { get; set; }

    }

    public class ExcelFileContent
    {
        public string[] HEADER { get; set; }
        public string[][] DATA { get; set; }
        public string NAME { get; set; }
        public int? IDPROJECT { get; set; }

    }


    public class IntensityDTO
    {
        public int? IDDATA { get; set; }
        public double EXCITATION { get; set; }
        public double INTENSITY { get; set; }
        public double? MULTIPLIEDINTENSITY { get; set; }
    }

    public class FileDTO
    {
        public int ID { get; set; }
        public string FILENAME { get; set; }
        public List<IntensityDTO> INTENSITY { get; set; }
        public int SPECTRUM { get; set; }
        public double? FACTOR { get; set; }
    }
    public class FolderDTO
    {
        public int ID { get; set; }
        public string FOLDERNAME { get; set; }
        public List<double> EXCITATION { get; set; }
        public List<double>? PROFILE { get; set; }
        public List<FileDTO> DATA { get; set; }

    }

    public class ProjectDTO
    {
        public int IDPROJECT { get; set; }
        public string PROJECTNAME { get; set; }
        public List<FolderDTO> FOLDERS { get; set; }
        public DateTime CREATED { get; set; }
        public string? USEREMAIL { get; set; }
    }

    public class MultiplyDataDTO
    {
        public int IDFOLDER { get; set; }
        public List<double> FACTORS { get; set; }
        public List<int> IDS { get; set; }

        public double[] EXCITATION { get; set; }

    }

    public class FolderDeleteRequestDTO
    {
        public int PROJECTID { get; set; }
        public List<int> FOLDERIDS { get; set; } = new List<int>();
    }


    public class RegisterFormDTO
    {
        public string EMAIL { get; set; }
        public string PASSWORD { get; set; }
        public string PASSWORD2 { get; set; }
    }

    public class LoginDto
    {
        public string EMAIL { get; set; }
        public string PASSWORD { get; set; }
    }

    public class ColumnDTO
    {
        public string Name { get; set; } = string.Empty;
        public List<double?> Intensities { get; set; } = new List<double?>();

        public List<double> Excitations { get; set; }
    }

    public class CalculatedDataDTO
    {
        public int IDFILE { get; set; }
        public double[] CALCULATEDINTENSITIES { get; set; }
        public double[] EXCITACIONS { get; set; }
    }

    public class DatabankFileDTO
    {
        public int Id { get; set; }
        public int? FolderId { get; set; }
        public string FileName { get; set; }
        public string Type { get; set; }
        public int Size { get; set; }
        public string Content { get; set; }
        public DateTime UploadedAt { get; set; }
        public string UploadedBy { get; set; }
        public bool Public { get; set; }
        public List<string> Shares { get; set; } = new List<string>();
    }

    public class DatabankFolderDTO
    {
        public int Id { get; set; }
        public string FolderName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string UploadedBy { get; set; }

        public List<DatabankFileDTO> Files { get; set; }
        public bool Public { get; set; }
        public List<string> Shares { get; set; } = new List<string>();
    }

    public class DatabankDataToSend
    {
        public List<ExcelFileContent> excelContents { get; set; }
        public List<string> ids { get; set; }
    }

    public class ShareDatabankObjectDTO {
        public string Id { get; set; } 
        public List<string> Users { get; set; }
        public bool Public { get; set; }
    }

    public class AdjustedDataRequest
    {
        public ColumnDTO Column { get; set; }
        public List<double> ReferenceSeries { get; set; }
    }

    public class DeleteUserDTO
    {
        public string Password { get; set;}
        public bool DeleteDatabankData { get; set; }
    }

    public class ChangePasswordDTO
    {
        public string OldPassword { get; set; }
        public string NewPassword { get; set;}
        public string ConfirmPassword { get; set; }

    }

    public class ResetPasswordDTO
    {
        public string NewPassword { get; set; }
        public string ConfirmPassword { get; set; }

        public string Token { get; set; }
    }

    public class UserDTO
    {
        public string Email { get; set; }
        public string Role { get; set; }
    }

    public class UserAllDTO
    {
        public string Email { get; set; }
        public string Role { get; set; }
        public string[] Projects {  get; set; }
        public string[] DatabankUploads {  get; set; }  
    }
}
