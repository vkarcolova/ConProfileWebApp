using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace WebApiServer.Models
{
    public class LoadedFolder
    {
        [Key]
        public int IdFolder { get; set; }
        public int IdProject { get; set; }
        public string FolderName { get; set; }

    }
}