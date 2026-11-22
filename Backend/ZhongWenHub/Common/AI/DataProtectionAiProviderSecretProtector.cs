using System;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;

namespace ZhongWenHub.Common.AI;

public class DataProtectionAiProviderSecretProtector : IAiProviderSecretProtector
{
    private readonly byte[] _encryptionKey;

    public DataProtectionAiProviderSecretProtector(IConfiguration configuration)
    {
        var configuredKey = configuration["AiSecurity:EncryptionKey"] 
            ?? configuration["JwtSettings:Secret"] 
            ?? "ZhongWenHub_Default_AI_Protection_Key_2026";
            
        using var sha = SHA256.Create();
        _encryptionKey = sha.ComputeHash(Encoding.UTF8.GetBytes(configuredKey));
    }

    public string Encrypt(string plainSecret)
    {
        if (string.IsNullOrEmpty(plainSecret))
        {
            return string.Empty;
        }

        using var aes = Aes.Create();
        aes.Key = _encryptionKey;
        aes.GenerateIV();

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);
        using var ms = new MemoryStream();
        ms.Write(aes.IV, 0, aes.IV.Length);

        using (var cs = new CryptoStream(ms, encryptor, CryptoStreamMode.Write))
        using (var sw = new StreamWriter(cs, Encoding.UTF8))
        {
            sw.Write(plainSecret);
        }

        return Convert.ToBase64String(ms.ToArray());
    }

    public string Decrypt(string encryptedSecret)
    {
        if (string.IsNullOrWhiteSpace(encryptedSecret))
        {
            return string.Empty;
        }

        try
        {
            var fullCipher = Convert.FromBase64String(encryptedSecret);
            if (fullCipher.Length < 16)
            {
                return string.Empty;
            }

            using var aes = Aes.Create();
            aes.Key = _encryptionKey;

            var iv = new byte[16];
            Array.Copy(fullCipher, 0, iv, 0, 16);
            aes.IV = iv;

            using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
            using var ms = new MemoryStream(fullCipher, 16, fullCipher.Length - 16);
            using var cs = new CryptoStream(ms, decryptor, CryptoStreamMode.Read);
            using var sr = new StreamReader(cs, Encoding.UTF8);

            return sr.ReadToEnd();
        }
        catch
        {
            return string.Empty;
        }
    }

    public string Mask(string secret)
    {
        if (string.IsNullOrEmpty(secret))
        {
            return string.Empty;
        }

        if (secret.Length <= 4)
        {
            return "****";
        }

        var suffix = secret[^4..];
        return string.Concat(new string('*', Math.Min(secret.Length - 4, 12)), suffix);
    }
}
