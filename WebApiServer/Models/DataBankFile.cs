using System.ComponentModel.DataAnnotations;

namespace WebApiServer.Models
{
    public class DataBankFile
    {
        [Key]
        public int Id { get; set; }
        public int? FolderId { get; set; }
        public string FileName { get; set; }
        public string Type { get; set; }
        public int Size { get; set; }
        public byte[] Content { get; set; }
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        public string UploadedBy { get; set; }

        public bool Public {get; set;}
    }

}
