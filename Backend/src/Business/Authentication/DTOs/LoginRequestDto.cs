using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Authentication.DTOs;

public class LoginRequestDto : IValidatableObject
{
    private string _usernameOrEmail = string.Empty;

    public string UsernameOrEmail
    {
        get => string.IsNullOrWhiteSpace(_usernameOrEmail) ? (Email ?? string.Empty) : _usernameOrEmail;
        set => _usernameOrEmail = value;
    }

    public string? Email
    {
        get => _usernameOrEmail;
        set
        {
            if (string.IsNullOrWhiteSpace(_usernameOrEmail) && !string.IsNullOrWhiteSpace(value))
            {
                _usernameOrEmail = value;
            }
        }
    }

    [Required(ErrorMessage = "Mật khẩu không được để trống.")]
    public string Password { get; set; } = string.Empty;

    public bool RememberMe { get; set; } = false;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(UsernameOrEmail) && string.IsNullOrWhiteSpace(Email))
        {
            yield return new ValidationResult(
                "Tên đăng nhập hoặc email không được để trống.",
                new[] { nameof(UsernameOrEmail), nameof(Email) });
        }
    }
}
