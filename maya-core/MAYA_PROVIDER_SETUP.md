# Maya Provider Setup Guide

## Quick Start

Maya requires an LLM provider API key to deliver real responses. Without a key, Maya runs in **mock mode** with placeholder responses.

## Environment Variables

Set one of the following environment variables:

| Variable | Provider | Default Model |
|----------|----------|---------------|
| `OPENAI_API_KEY` | OpenAI | `gpt-4o-mini` |
| `ANTHROPIC_API_KEY` | Anthropic | `claude-3-5-sonnet-20241022` |
| `GOOGLE_AI_KEY` | Google AI | `gemini-1.5-flash` |

### Priority Order

If multiple keys are set, Maya selects in this order:
1. OpenAI (if `OPENAI_API_KEY` is set)
2. Anthropic (if `ANTHROPIC_API_KEY` is set)
3. Google (if `GOOGLE_AI_KEY` is set)
4. Mock (fallback if no keys)

## Local Development

1. Create a `.env.local` file in `maya-core/`:

```env
# Primary provider (recommended)
OPENAI_API_KEY=sk-...

# Alternative providers
# ANTHROPIC_API_KEY=sk-ant-...
# GOOGLE_AI_KEY=...
```

2. Start the development server:

```bash
cd maya-core
npm run dev
```

3. Open http://localhost:3000/maya

4. Check the status indicator in the header:
   - **Orange "MOCK MODE"**: No API key configured
   - **Green "LIVE: openai / gpt-4o-mini"**: Real provider active

## Available Models

### OpenAI
- `gpt-4o-mini` (default) - Fast, cost-effective
- `gpt-4o` - Higher quality
- `gpt-5` - Latest model (uses max_completion_tokens)

### Anthropic
- `claude-3-5-sonnet-20241022` (default)
- `claude-3-5-haiku-20241022` - Faster, cheaper

### Google AI
- `gemini-1.5-flash` (default)
- `gemini-1.5-pro` - Higher quality

## Health Check Endpoints

### `/api/maya/providers`
Returns provider configuration status:

```json
{
  "providers": [
    {
      "type": "openai",
      "name": "OpenAI",
      "configured": true,
      "available": true,
      "status": "ready",
      "defaultModel": "gpt-4o-mini",
      "models": [...]
    }
  ],
  "defaultProvider": "openai",
  "defaultModel": "gpt-4o-mini",
  "hasRealProvider": true,
  "isMockMode": false,
  "status": "live",
  "message": "Real provider configured and ready."
}
```

### `/api/maya/health`
Returns system health including chat provider status:

```json
{
  "status": "ok",
  "chatProvider": {
    "ready": true,
    "primaryProvider": "openai",
    "primaryModel": "gpt-4o-mini",
    "keyConfigured": true,
    "isMockMode": false
  },
  ...
}
```

## Deploy Configuration (Render)

1. Go to your Render dashboard
2. Select the Maya web service
3. Navigate to **Environment** tab
4. Add environment variable:
   - Key: `OPENAI_API_KEY`
   - Value: `sk-...`
5. Click **Save Changes** - service will redeploy

## Troubleshooting

### "Provider not available" error
- Check that the API key is set correctly
- Verify the key is valid and not expired
- Ensure the key has sufficient credits

### Mock responses when key is set
- Restart the development server after adding `.env.local`
- Check for typos in the variable name
- Verify the file is in `maya-core/` directory

### Rate limit errors
- The cost guard may block requests if daily budget exceeded
- Check `/api/maya/health` for `status: "blocked"`
- Wait for daily reset or adjust `DAILY_BUDGET_CENTS`

## Cost Management

Maya includes a cost guard that tracks daily spending:

| Variable | Default | Description |
|----------|---------|-------------|
| `DAILY_BUDGET_CENTS` | 100 | Maximum daily spend in cents |

When exceeded, chat requests return a budget exceeded message. Store reads remain available.

## E2E Smoke Test

After configuration, verify with a simple chat:

1. Open `/maya`
2. Confirm green "LIVE" indicator
3. Send: "Hello, what model are you?"
4. Expected: Real model response with provider/model shown in message footer

## Security Notes

- Never commit API keys to git
- `.env.local` is gitignored by default
- On Render, use environment variables, not files
- Rotate keys if accidentally exposed
