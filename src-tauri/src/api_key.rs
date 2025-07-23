use keyring::Entry;
use serde::{Deserialize, Serialize};
use std::error::Error;

const SERVICE_NAME: &str = "ClaudeFlow";
const API_KEY_ACCOUNT: &str = "claude_api_key";

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiKeyError {
    message: String,
}

impl From<Box<dyn Error>> for ApiKeyError {
    fn from(error: Box<dyn Error>) -> Self {
        ApiKeyError {
            message: error.to_string(),
        }
    }
}

impl From<keyring::Error> for ApiKeyError {
    fn from(error: keyring::Error) -> Self {
        ApiKeyError {
            message: error.to_string(),
        }
    }
}

/// Save the API key securely using the system keyring
#[tauri::command]
pub fn save_api_key(api_key: String) -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, API_KEY_ACCOUNT)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    
    entry.set_password(&api_key)
        .map_err(|e| format!("Failed to save API key: {}", e))?;
    
    Ok(())
}

/// Retrieve the API key from secure storage
#[tauri::command]
pub fn get_api_key() -> Result<String, String> {
    let entry = Entry::new(SERVICE_NAME, API_KEY_ACCOUNT)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    
    match entry.get_password() {
        Ok(password) => Ok(password),
        Err(keyring::Error::NoEntry) => Err("No API key found".to_string()),
        Err(e) => Err(format!("Failed to retrieve API key: {}", e)),
    }
}

/// Check if an API key exists
#[tauri::command]
pub fn has_api_key() -> Result<bool, String> {
    let entry = Entry::new(SERVICE_NAME, API_KEY_ACCOUNT)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    
    match entry.get_password() {
        Ok(_) => Ok(true),
        Err(keyring::Error::NoEntry) => Ok(false),
        Err(e) => Err(format!("Failed to check API key: {}", e)),
    }
}

/// Delete the stored API key
#[tauri::command]
pub fn delete_api_key() -> Result<(), String> {
    let entry = Entry::new(SERVICE_NAME, API_KEY_ACCOUNT)
        .map_err(|e| format!("Failed to create keyring entry: {}", e))?;
    
    match entry.delete_credential() {
        Ok(_) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()), // Already deleted
        Err(e) => Err(format!("Failed to delete API key: {}", e)),
    }
}

/// Validate API connection by making a test request
#[tauri::command]
pub async fn validate_api_connection(api_key: String, endpoint: String) -> Result<bool, String> {
    let client = reqwest::Client::new();
    
    // Make a simple request to validate the API key
    let response = client
        .post(&endpoint)
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&serde_json::json!({
            "model": "claude-3-haiku-20240307",
            "messages": [{
                "role": "user",
                "content": "Hi"
            }],
            "max_tokens": 10
        }))
        .send()
        .await
        .map_err(|e| format!("Failed to connect to API: {}", e))?;
    
    match response.status().as_u16() {
        200 => Ok(true),
        401 => Err("Invalid API key".to_string()),
        _ => Err(format!("API validation failed with status: {}", response.status())),
    }
}