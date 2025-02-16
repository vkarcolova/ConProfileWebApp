using System.ComponentModel.DataAnnotations;

namespace WebApiServer.Models
{
    public class DataBankFolder
    {
        [Key]
        public int Id { get; set; }
        public string FolderName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool Public { get; set; }
        public string UploadedBy { get; set; }

    }

}
