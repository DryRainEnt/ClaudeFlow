use crate::flow::{read_flow_file, write_flow_file, FlowConversation, FlowFile};
use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub fn load_flow_file(path: String) -> Result<FlowFile, String> {
    let path = PathBuf::from(path);
    read_flow_file(&path)
}

#[tauri::command]
pub fn save_flow_file(path: String, flow_file: FlowFile) -> Result<(), String> {
    let path = PathBuf::from(path);
    write_flow_file(&path, &flow_file)
}

#[tauri::command]
pub fn create_new_conversation() -> FlowConversation {
    use std::time::{SystemTime, UNIX_EPOCH};

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs() as i64;

    FlowConversation {
        id: uuid::Uuid::new_v4().to_string(),
        title: "New Conversation".to_string(),
        created: timestamp,
        updated: timestamp,
        messages: vec![],
        settings: None,
    }
}

#[tauri::command]
pub fn read_directory(path: String) -> Result<Vec<String>, String> {
    let path = PathBuf::from(path);

    let entries = fs::read_dir(&path).map_err(|e| format!("Failed to read directory: {}", e))?;

    let mut files = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            if let Some(file_name) = entry.file_name().to_str() {
                files.push(file_name.to_string());
            }
        }
    }

    Ok(files)
}

#[tauri::command]
pub fn remove_file(path: String) -> Result<(), String> {
    let path = PathBuf::from(path);
    fs::remove_file(&path).map_err(|e| format!("Failed to remove file: {}", e))
}
