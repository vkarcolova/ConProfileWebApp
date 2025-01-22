using Accord;

namespace WebApiServer.DTOs
{
    public class FileContent
    {
        public int IDPROJECT {  get; set; }
        public string FILENAME { get; set; }
        public string FOLDERNAME { get; set; }
        public string CONTENT {  get; set; }
        public string? USEREMAIL { get; set; }

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
        public List<double>? PROFILE {  get; set; }
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
}
