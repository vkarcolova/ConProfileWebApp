namespace WebApiServer.DTOs
{
    public class LoadedFileDTO
    {
        public string FILENAME { get; set; }
        public string FOLDERNAME { get; set; }
        public string CONTENT {  get; set; }
    }

    public class FolderDTO
    {
        public int ID { get; set; }
        public string FOLDERNAME { get; set; }
        public List<double> EXCITATION { get; set; }
        public List<double>? PROFILE {  get; set; }
        public List<TableDataDTO> DATA { get; set; }

    }

    public class TableDataDTO
    {
        public int ID { get; set; }
        public string FILENAME { get; set; }
        public List<double> INTENSITY { get; set; }
        public List<double>? MULTIPLIEDINTENSITY { get; set; }
        public int SPECTRUM { get; set; }
    }

    public class ProjectDTO
    { 
        public int IDPROJECT { get; set; }
        public string PROJECTNAME { get; set;}
        public List<FolderDTO> FOLDERS { get; set; }
    }

    public class MultiplyDataDTO
    {
        public int IDFOLDER { get; set; }
        public List<double> FACTORS { get; set; }
        public List<int> IDS { get; set; }

    }

}
