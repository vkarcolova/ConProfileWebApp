using System.ComponentModel.DataAnnotations;

public class User
{
    [Required]
    [Key]
    [EmailAddress]
    public string UserEmail { get; set; } 

    public string PasswordHash { get; set; }



}    // Externé prihlasovania
    //public string? GoogleId { get; set; } 
    //public string? FacebookId { get; set; }