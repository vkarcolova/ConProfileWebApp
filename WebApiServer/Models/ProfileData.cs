using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace WebApiServer.Models
{
    public class ProfileData
    {
        [Key]
        public int IdProfileData { get; set; }
        public int IdFolder { get; set; }
        public double Excitation { get; set; }
        public double MaxIntensity { get; set; } 
    }
}