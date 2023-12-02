
// public int _spektrum { get; set; }
// public List<double> _data { get; set; }
// public string _nazovSuboru { get; set; }


using System.ComponentModel.DataAnnotations;

namespace WebAPI.Models;

public class LoadedData {
    [Key]
    public int IdLoadedData { get; set; }
    public int IdFileData { get; set; }
    public double Wavelenght { get; set; }
    public double Intensity { get; set; }
}