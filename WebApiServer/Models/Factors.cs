using System.ComponentModel.DataAnnotations;

namespace WebApiServer.Models
{
    public class Factors
    {
        [Key]
        public int Spectrum { get; set; }
        public double Factor { get; set; }
    }
}
