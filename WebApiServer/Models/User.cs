using System.ComponentModel.DataAnnotations;
public class User
{
    [Required]
    [Key]
    [EmailAddress]
    public string UserEmail { get; set; }

    public string PasswordHash { get; set; }

    [Required]
    public string Role { get; set; } = "user"; // Default role
}
// Externé prihlasovania
//public string? GoogleId { get; set; } 
//public string? FacebookId { get; set; }