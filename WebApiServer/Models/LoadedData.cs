
// public int _spektrum { get; set; }
// public List<double> _data { get; set; }
// public string _nazovSuboru { get; set; }


using System.ComponentModel.DataAnnotations;

namespace WebApiServer.Models;

public class LoadedData {
    [Key]
    public int IdData { get; set; }
    public int IdFileData { get; set; }
    public double Excitation { get; set; }
    public double Intensity { get; set; }
    public double? MultipliedIntensity { get; set; }

}