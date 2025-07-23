# ClaudeFlow API Configuration Guide

## Overview

ClaudeFlow requires a Claude API key to function. This guide will help you set up your API key and configure the application.

## Getting Started

### 1. Obtain a Claude API Key

1. Visit [console.anthropic.com](https://console.anthropic.com/api)
2. Sign in or create an account
3. Navigate to the API keys section
4. Create a new API key
5. Copy the key (it starts with `sk-ant-`)

### 2. First-Time Setup

When you first launch ClaudeFlow, you'll be greeted with a setup screen:

1. The app will automatically detect that no API key is configured
2. Enter your Claude API key in the secure input field
3. Click "Get Started" to validate and save your key

### 3. Settings Interface

You can access the settings at any time by clicking the API status indicator in the top-right corner:

- **API Configuration**: Manage your API key, endpoint, model selection, and parameters
- **Rate Limits**: Configure request and token limits to control usage
- **Usage Statistics**: Monitor your daily token usage and estimated costs

## Features

### Secure Storage

- API keys are stored securely using your system's keychain/credential manager
- Keys are never stored in plain text or sent to any servers
- The app uses Tauri's secure storage APIs for maximum security

### Rate Limiting

ClaudeFlow includes built-in rate limiting to help you:

- Stay within API rate limits
- Control daily token usage
- Receive warnings when approaching limits
- Prevent accidental overuse

### Usage Tracking

The app tracks:

- Daily token usage
- Estimated costs based on model pricing
- Request frequency
- Rate limit status

### Visual Indicators

- **Green**: Connected and functioning normally
- **Orange**: Approaching usage limits (warning threshold)
- **Red**: Disconnected or rate limit exceeded

## Configuration Options

### API Settings

- **API Key**: Your Claude API key (required)
- **Endpoint**: API endpoint URL (default: Anthropic's official endpoint)
- **Model**: Choose between Claude 3 Opus, Sonnet, or Haiku
- **Max Tokens**: Maximum tokens per response (1-100,000)
- **Temperature**: Creativity setting (0-1)

### Rate Limits

- **Max Requests/Minute**: Limit API calls per minute
- **Max Tokens/Day**: Daily token usage limit
- **Warning Threshold**: Percentage at which to show usage warnings

## Troubleshooting

### Common Issues

1. **"Invalid API key format"**: Ensure your key starts with `sk-ant-`
2. **"Failed to connect"**: Check your internet connection and API key
3. **"Rate limit exceeded"**: Wait for the cooldown period or adjust limits

### Security Notes

- Never share your API key
- The app stores keys securely in your system keychain
- API keys can be revoked from the Anthropic console at any time

## Development Notes

The API configuration system uses:

- **Zustand** for state management
- **Tauri commands** for secure storage
- **System keychain** for API key encryption
- **React components** for the UI

Key files:
- `src/flow/stores/settingsStore.ts` - Settings state management
- `src/flow/components/SettingsModal.tsx` - Settings UI
- `src-tauri/src/api_key.rs` - Secure storage backend
- `src/flow/services/claudeService.ts` - API interaction service