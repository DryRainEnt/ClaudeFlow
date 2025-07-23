mod flow;
mod commands;
mod api_key;

use commands::{load_flow_file, save_flow_file, create_new_conversation, read_directory, remove_file};
use api_key::{save_api_key, get_api_key, has_api_key, delete_api_key, validate_api_connection};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            load_flow_file,
            save_flow_file,
            create_new_conversation,
            read_directory,
            remove_file,
            save_api_key,
            get_api_key,
            has_api_key,
            delete_api_key,
            validate_api_connection
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
