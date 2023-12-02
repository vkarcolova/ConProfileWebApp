using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace WebApiServer.Models
{
    public class LoadedFile
    {
        [Key]
        public int IdFile { get; set; }
        public int IdFolder { get; set; }
        public int Spectrum { get; set; } //in file name
        public int? Factor { get; set; } //user input that multiplies
        public string FileName { get; set; }
    }
}