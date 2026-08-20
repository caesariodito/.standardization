import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

type RouterModel = { id?: string; name?: string; context_window?: number; max_tokens?: number };

export default async function register9Router(pi: ExtensionAPI) {
  const baseUrl = process.env.NINE_ROUTER_BASE_URL;
  const apiKey = process.env.NINE_ROUTER_API_KEY;
  const selectedModel = process.env.NINE_ROUTER_MODEL;
  if (!baseUrl || !apiKey || !selectedModel) throw new Error("NINE_ROUTER_BASE_URL, NINE_ROUTER_API_KEY, and NINE_ROUTER_MODEL are required");
  // Do not expose the router credential to model-invoked subprocesses.
  delete process.env.NINE_ROUTER_API_KEY;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, {
    headers: { authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error(`9Router model discovery failed with HTTP ${response.status}`);
  const payload = await response.json() as { data?: RouterModel[] };
  const model = payload.data?.find((item) => item.id === selectedModel);
  if (!model) throw new Error(`9Router did not advertise required logical model alias: ${selectedModel}`);

  pi.registerProvider("9router", {
    baseUrl,
    apiKey,
    api: "openai-completions",
    compat: { supportsDeveloperRole: false, supportsReasoningEffort: true, maxTokensField: "max_tokens" },
    models: [{
      id: selectedModel,
      name: model.name ?? selectedModel,
      reasoning: true,
      input: ["text", "image"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: model.context_window ?? 200000,
      maxTokens: model.max_tokens ?? 16384
    }]
  });
}
