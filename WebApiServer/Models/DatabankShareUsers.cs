using Accord.Math.Geometry;
using System.ComponentModel.DataAnnotations;

namespace WebApiServer.Models
{
    public class DatabankShareUsers
    {
        [Key]
        public int Id { get; set; }
        public int ShareableId { get; set; }
        public ShareableType ShareableType { get; set; }
        public int CreatedBy { get; set; }
        public string UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }

    public enum ShareableType
    {
        File,
        Folder
    }
}
