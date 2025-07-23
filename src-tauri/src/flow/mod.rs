use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FlowMessage {
    pub id: String,
    pub timestamp: i64,
    pub sender: String,
    pub content: String,
    pub metadata: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FlowConversation {
    pub id: String,
    pub title: String,
    pub created: i64,
    pub updated: i64,
    pub messages: Vec<FlowMessage>,
    pub settings: Option<ConversationSettings>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ConversationSettings {
    pub model: String,
    pub temperature: f32,
    pub max_tokens: i32,
    pub system_prompt: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FlowFile {
    pub version: String,
    pub conversation: FlowConversation,
    pub checksum: Option<String>,
}

pub fn read_flow_file(path: &Path) -> Result<FlowFile, String> {
    let content = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read file: {}", e))?;
    
    let flow_file: FlowFile = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse flow file: {}", e))?;
    
    Ok(flow_file)
}

pub fn write_flow_file(path: &Path, flow_file: &FlowFile) -> Result<(), String> {
    let content = serde_json::to_string_pretty(flow_file)
        .map_err(|e| format!("Failed to serialize flow file: {}", e))?;
    
    fs::write(path, content)
        .map_err(|e| format!("Failed to write file: {}", e))?;
    
    Ok(())
}