using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace WebApiServer.Models
{
    public class Project
    {
        [Key]
        public int IdProject { get; set; }
        public string ProjectName { get; set; }

        public string Token { get; set; }

        public string? CreatedBy {  get; set; } = null;

        public DateTime Created { get; set; }

    }
}