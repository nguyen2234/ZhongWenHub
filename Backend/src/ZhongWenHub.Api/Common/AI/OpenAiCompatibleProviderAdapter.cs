using System.Net.Http;

namespace ZhongWenHub.Common.AI;

public class OpenAiCompatibleProviderAdapter : OpenAiProviderAdapter
{
    public OpenAiCompatibleProviderAdapter(HttpClient httpClient) : base(httpClient)
    {
    }

    public override string ProviderType => "OPENAI_COMPATIBLE";
}
