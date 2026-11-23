namespace ZhongWenHub.Common.AI;

public interface IAiProviderSecretProtector
{
    string Encrypt(string plainSecret);
    string Decrypt(string encryptedSecret);
    string Mask(string secret);
}
