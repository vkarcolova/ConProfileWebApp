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
        public string FOLDERNAME { get; set; }
        public List<double> EXCITATION { get; set; }
        public List<TableDataDTO> DATA { get; set; }

    }

    public class TableDataDTO
    {
        public string FILENAME { get; set; }
        public List<double> INTENSITY { get; set; }
        public int SPECTRUM { get; set; }
    }

}
