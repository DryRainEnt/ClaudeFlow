// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::process::{Command, Stdio};
use std::collections::HashMap;
use std::sync::Mutex;
use tauri::State;

// Tauri command to initialize project directories
#[tauri::command]
fn initialize_directories() -> Result<String, String> {
    // Get the current working directory
    let current_dir = std::env::current_dir()
        .map_err(|e| format!("Failed to get current directory: {}", e))?;
    
    // Define directories to create
    let directories = vec![".flow", "outputs"];
    
    for dir in directories {
        let dir_path = current_dir.join(dir);
        
        if !dir_path.exists() {
            fs::create_dir_all(&dir_path)
                .map_err(|e| format!("Failed to create directory {}: {}", dir, e))?;
        }
    }
    
    // Create subdirectories in .flow
    let flow_subdirs = vec!["sessions", "cache", "processes", "logs"];
    for subdir in flow_subdirs {
        let subdir_path = current_dir.join(".flow").join(subdir);
        if !subdir_path.exists() {
            fs::create_dir_all(&subdir_path)
                .map_err(|e| format!("Failed to create .flow/{}: {}", subdir, e))?;
        }
    }
    
    Ok(format!("Directories initialized successfully in: {}", current_dir.display()))
}

// Tauri command to log verification results
#[tauri::command]
async fn log_verification_result(test_type: String, results: serde_json::Value) -> Result<String, String> {
    use std::io::Write;
    
    let current_dir = std::env::current_dir()
        .map_err(|e| format!("Failed to get current directory: {}", e))?;
    
    let log_dir = current_dir.join(".flow").join("logs");
    let log_file = log_dir.join("verification.log");
    
    // Ensure log directory exists
    if !log_dir.exists() {
        fs::create_dir_all(&log_dir)
            .map_err(|e| format!("Failed to create logs directory: {}", e))?;
    }
    
    // Create log entry
    let timestamp = chrono::Utc::now().to_rfc3339();
    let log_entry = serde_json::json!({
        "timestamp": timestamp,
        "test_type": test_type,
        "results": results
    });
    
    // Append to log file
    let mut file = fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file)
        .map_err(|e| format!("Failed to open log file: {}", e))?;
    
    writeln!(file, "{}", serde_json::to_string_pretty(&log_entry).unwrap())
        .map_err(|e| format!("Failed to write to log file: {}", e))?;
    
    Ok(format!("Verification result logged to: {}", log_file.display()))
}

// Tauri command to get current working directory
#[tauri::command]
fn get_current_directory() -> Result<String, String> {
    std::env::current_dir()
        .map(|path| path.to_string_lossy().to_string())
        .map_err(|e| format!("Failed to get current directory: {}", e))
}

// Terminal process management
type TerminalProcesses = Mutex<HashMap<u32, std::process::Child>>;

// Tauri command to open system terminal with user's real environment
#[tauri::command]
async fn open_system_terminal(working_directory: Option<String>) -> Result<String, String> {
    let work_dir = working_directory.unwrap_or_else(|| {
        std::env::current_dir()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string()
    });

    #[cfg(target_os = "macos")]
    {
        // macOS에서 iTerm2 또는 Terminal 앱으로 새 터미널 창 열기
        let script = format!(
            r#"tell application "iTerm2"
                tell current window
                    create tab with default profile
                    tell current session
                        write text "cd '{}'"
                    end tell
                end tell
                activate
            end tell"#,
            work_dir
        );
        
        let result = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output();
            
        match result {
            Ok(_) => Ok(format!("iTerm2 터미널이 {}에서 열렸습니다", work_dir)),
            Err(_) => {
                // iTerm2가 없으면 기본 Terminal 앱 사용
                let script = format!(
                    r#"tell application "Terminal"
                        do script "cd '{}'"
                        activate
                    end tell"#,
                    work_dir
                );
                
                Command::new("osascript")
                    .arg("-e")
                    .arg(&script)
                    .output()
                    .map_err(|e| format!("터미널 열기 실패: {}", e))?;
                    
                Ok(format!("터미널이 {}에서 열렸습니다", work_dir))
            }
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        Err("시스템 터미널 열기는 현재 macOS에서만 지원됩니다".to_string())
    }
}

// Tauri command to create terminal with full user environment
#[tauri::command]
async fn create_terminal(
    terminal_id: u32,
    working_directory: Option<String>,
    processes: State<'_, TerminalProcesses>
) -> Result<String, String> {
    let work_dir = working_directory.unwrap_or_else(|| {
        std::env::current_dir()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string()
    });

    // 사용자의 실제 shell 환경을 사용하는 터미널 프로세스
    #[cfg(unix)]
    let user_shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/bash".to_string());
    #[cfg(unix)]
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| "/Users/dryrain".to_string());
    
    // zsh 설정 파일을 명시적으로 로드
    #[cfg(unix)]
    let shell_command = if user_shell.contains("zsh") {
        format!("{} -i", user_shell) // -i 플래그로 interactive shell 시작 (설정 파일 로드)
    } else {
        user_shell.clone()
    };
    
    #[cfg(unix)]
    let child = if user_shell.contains("zsh") {
        // zsh의 경우 직접 zsh를 실행하고 -i 플래그로 interactive mode 시작
        Command::new(&user_shell)
            .arg("-i") // interactive mode로 .zshrc 로드
            .current_dir(&work_dir)
            .envs(std::env::vars()) // 모든 환경변수 상속
            .env("HOME", &home_dir)
            .env("USER", std::env::var("USER").unwrap_or_else(|_| "dryrain".to_string()))
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn zsh terminal: {}", e))?
    } else {
        // 다른 shell의 경우 기존 방식
        Command::new("sh")
            .arg("-c")
            .arg(&shell_command)
            .current_dir(&work_dir)
            .envs(std::env::vars()) // 모든 환경변수 상속
            .env("HOME", &home_dir)
            .env("USER", std::env::var("USER").unwrap_or_else(|_| "dryrain".to_string()))
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn terminal with {}: {}", shell_command, e))?
    };

    // Windows에서 cmd 실행
    #[cfg(windows)]
    let child = Command::new("cmd")
        .current_dir(&work_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| format!("Failed to spawn terminal process: {}", e))?;

    // 프로세스를 HashMap에 저장
    let mut proc_map = processes.lock().unwrap();
    proc_map.insert(terminal_id, child);

    Ok(format!("Terminal {} created successfully in: {}", terminal_id, work_dir))
}

// Tauri command to execute command in terminal
#[tauri::command]
async fn execute_command(
    terminal_id: u32,
    command: String,
    processes: State<'_, TerminalProcesses>
) -> Result<String, String> {
    // 단순한 명령어는 직접 실행해서 출력 반환
    match command.trim() {
        "pwd" => {
            let output = Command::new("pwd")
                .output()
                .map_err(|e| format!("Failed to execute pwd: {}", e))?;
            
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
            }
        },
        "ls" => {
            let output = Command::new("ls")
                .output()
                .map_err(|e| format!("Failed to execute ls: {}", e))?;
            
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
            }
        },
        "ls -la" => {
            let output = Command::new("ls")
                .arg("-la")
                .output()
                .map_err(|e| format!("Failed to execute ls -la: {}", e))?;
            
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
            }
        },
        "date" => {
            let output = Command::new("date")
                .output()
                .map_err(|e| format!("Failed to execute date: {}", e))?;
            
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
            }
        },
        "whoami" => {
            let output = Command::new("whoami")
                .output()
                .map_err(|e| format!("Failed to execute whoami: {}", e))?;
            
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
            }
        },
        cmd if cmd.starts_with("echo ") => {
            let _echo_text = &cmd[5..]; // "echo " 이후 부분
            
            #[cfg(unix)]
            let user_shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
            #[cfg(unix)]
            let home_dir = std::env::var("HOME").unwrap_or_else(|_| "/Users/dryrain".to_string());
            #[cfg(unix)]
            let output = Command::new(&user_shell)
                .arg("-c")
                .arg(cmd)
                .envs(std::env::vars()) // 사용자 환경변수 상속
                .env("HOME", &home_dir)
                .output()
                .map_err(|e| format!("Failed to execute echo: {}", e))?;
            
            #[cfg(windows)]
            let output = Command::new("cmd")
                .arg("/C")
                .arg(cmd)
                .output()
                .map_err(|e| format!("Failed to execute echo: {}", e))?;
            
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
            }
        },
        "claude --version" => {
            let user_shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
            let home_dir = std::env::var("HOME").unwrap_or_else(|_| "/Users/dryrain".to_string());
            let output = Command::new(&user_shell)
                .arg("-c")
                .arg("source ~/.zshrc 2>/dev/null || true; claude --version")
                .envs(std::env::vars()) // 사용자 환경변수 상속
                .env("HOME", &home_dir)
                .output()
                .map_err(|e| format!("Failed to execute claude --version: {}", e))?;
            
            if output.status.success() {
                Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
            } else {
                Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
            }
        },
        "claude --help" => {
            let user_shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
            let home_dir = std::env::var("HOME").unwrap_or_else(|_| "/Users/dryrain".to_string());
            let output = Command::new(&user_shell)
                .arg("-c")
                .arg("source ~/.zshrc 2>/dev/null || true; claude --help")
                .envs(std::env::vars()) // 사용자 환경변수 상속
                .env("HOME", &home_dir) // HOME 디렉토리 명시적 설정
                .output()
                .map_err(|e| format!("Failed to execute claude --help: {}", e))?;
            
            if output.status.success() {
                let help_output = String::from_utf8_lossy(&output.stdout);
                // Help output은 길 수 있으므로 처음 몇 줄만 반환
                let lines: Vec<&str> = help_output.lines().take(10).collect();
                Ok(format!("Claude CLI Help (첫 10줄):\n{}", lines.join("\n")))
            } else {
                Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
            }
        },
        "claude auth status" => {
            let user_shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
            let home_dir = std::env::var("HOME").unwrap_or_else(|_| "/Users/dryrain".to_string());
            let output = Command::new(&user_shell)
                .arg("-c")
                .arg("source ~/.zshrc 2>/dev/null || true; claude auth status")
                .envs(std::env::vars()) // 사용자 환경변수 상속
                .env("HOME", &home_dir) // HOME 디렉토리 명시적 설정
                .output()
                .map_err(|e| format!("Failed to execute claude auth status: {}", e))?;
            
            if output.status.success() {
                let auth_output = String::from_utf8_lossy(&output.stdout);
                Ok(format!("Auth Status: {}", auth_output.trim()))
            } else {
                let error_output = String::from_utf8_lossy(&output.stderr);
                Err(format!("Auth check failed: {}", error_output.trim()))
            }
        },
        _ => {
            // 기타 명령어는 기존 방식 사용 (stdin으로 전송)
            let mut proc_map = processes.lock().unwrap();
            
            if let Some(child) = proc_map.get_mut(&terminal_id) {
                if let Some(ref mut stdin) = child.stdin {
                    use std::io::Write;
                    stdin.write_all(format!("{}\n", command).as_bytes())
                        .map_err(|e| format!("Failed to write to terminal: {}", e))?;
                    stdin.flush()
                        .map_err(|e| format!("Failed to flush terminal input: {}", e))?;
                }
                Ok(format!("Command '{}' executed in terminal {}", command, terminal_id))
            } else {
                Err(format!("Terminal {} not found", terminal_id))
            }
        }
    }
}

// Tauri command to terminate terminal process
#[tauri::command]
async fn terminate_terminal(
    terminal_id: u32,
    processes: State<'_, TerminalProcesses>
) -> Result<String, String> {
    let mut proc_map = processes.lock().unwrap();
    
    if let Some(mut child) = proc_map.remove(&terminal_id) {
        child.kill()
            .map_err(|e| format!("Failed to kill terminal process: {}", e))?;
        Ok(format!("Terminal {} terminated", terminal_id))
    } else {
        Err(format!("Terminal {} not found", terminal_id))
    }
}

// Tauri command to list active terminals
#[tauri::command]
async fn list_terminals(processes: State<'_, TerminalProcesses>) -> Result<Vec<u32>, String> {
    let proc_map = processes.lock().unwrap();
    Ok(proc_map.keys().cloned().collect())
}

// Tauri command to check ClaudeCode CLI installation
#[tauri::command]
async fn check_claude_cli() -> Result<serde_json::Value, String> {
    use serde_json::json;
    
    println!("[DEBUG] Starting Claude CLI detection...");
    
    // Check if claude command exists - prioritize user's alias over system installation
    let user_shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| "/Users/dryrain".to_string());
    
    println!("[DEBUG] Using shell: {}, HOME: {}", user_shell, home_dir);
    
    // First try to get the actual claude path from alias by loading shell configuration
    let which_result = Command::new(&user_shell)
        .arg("-c")
        .arg("source ~/.zshrc 2>/dev/null || true; which claude")
        .envs(std::env::vars()) // 사용자 환경변수 상속
        .env("HOME", &home_dir)
        .output();
    
    let (is_installed, path, version, debug_info) = match which_result {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);
            println!("[DEBUG] {} -c 'source ~/.zshrc; which claude' - status: {}, stdout: '{}', stderr: '{}'", 
                user_shell, output.status.success(), stdout.trim(), stderr.trim());
            
            if output.status.success() && !stdout.trim().is_empty() {
                let raw_path = stdout.trim();
                
                // Handle alias output (e.g., "claude: aliased to /path/to/claude")
                let actual_path = if raw_path.contains("aliased to") {
                    raw_path.split("aliased to ").nth(1).unwrap_or(raw_path).trim()
                } else {
                    raw_path
                }.to_string();
                
                println!("[DEBUG] Processed path: '{}', checking version...", actual_path);
                
                // Get version information using user's shell with configuration loaded
                let version_result = Command::new(&user_shell)
                    .arg("-c")
                    .arg("source ~/.zshrc 2>/dev/null || true; claude --version")
                    .envs(std::env::vars()) // 사용자 환경변수 상속
                    .env("HOME", &home_dir)
                    .output();
                
                let version = match version_result {
                    Ok(ver_output) => {
                        let ver_stdout = String::from_utf8_lossy(&ver_output.stdout);
                        let ver_stderr = String::from_utf8_lossy(&ver_output.stderr);
                        println!("[DEBUG] {} -c 'source ~/.zshrc; claude --version' - status: {}, stdout: '{}', stderr: '{}'", 
                            user_shell, ver_output.status.success(), ver_stdout.trim(), ver_stderr.trim());
                        
                        if ver_output.status.success() {
                            ver_stdout.trim().to_string()
                        } else {
                            format!("Version check failed: {}", ver_stderr.trim())
                        }
                    }
                    Err(e) => {
                        println!("[DEBUG] Failed to execute claude --version: {}", e);
                        format!("Error: {}", e)
                    }
                };
                
                (true, Some(actual_path.clone()), Some(version.clone()), 
                 format!("Found at: {}, Version: {}", actual_path, version))
            } else {
                let debug_msg = format!("which failed - stdout: '{}', stderr: '{}'", stdout.trim(), stderr.trim());
                println!("[DEBUG] {}", debug_msg);
                (false, None, None, debug_msg)
            }
        }
        Err(e) => {
            let debug_msg = format!("which command error: {}", e);
            println!("[DEBUG] {}", debug_msg);
            (false, None, None, debug_msg)
        }
    };
    
    println!("[DEBUG] Final result - installed: {}, path: {:?}, version: {:?}", 
        is_installed, path, version);
    
    Ok(json!({
        "isInstalled": is_installed,
        "path": path,
        "version": version,
        "debugInfo": debug_info,
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

// Tauri command to check Claude authentication status
#[tauri::command]
async fn check_claude_auth() -> Result<serde_json::Value, String> {
    use serde_json::json;
    
    // Check authentication status using user's shell with full environment
    let user_shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
    let home_dir = std::env::var("HOME").unwrap_or_else(|_| "/Users/dryrain".to_string());
    
    println!("[DEBUG] Checking Claude auth with shell: {}, HOME: {}", user_shell, home_dir);
    
    let auth_result = Command::new(&user_shell)
        .arg("-c")
        .arg("source ~/.zshrc 2>/dev/null || true; claude auth status")
        .envs(std::env::vars()) // 사용자 환경변수 상속
        .env("HOME", &home_dir) // HOME 디렉토리 명시적 설정
        .output();
    
    let (is_authenticated, status_message) = match auth_result {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let stderr = String::from_utf8_lossy(&output.stderr);
            let full_output = format!("{}{}", stdout, stderr).trim().to_string();
            
            println!("[DEBUG] Claude auth check - status: {}, stdout: '{}', stderr: '{}'", 
                output.status.success(), stdout.trim(), stderr.trim());
            
            if output.status.success() {
                // Check if output indicates successful authentication
                let is_auth = !full_output.to_lowercase().contains("not authenticated") 
                    && !full_output.to_lowercase().contains("login required")
                    && !full_output.is_empty();
                println!("[DEBUG] Authentication result: {}, message: '{}'", is_auth, full_output);
                (is_auth, full_output)
            } else {
                println!("[DEBUG] Auth command failed with: '{}'", full_output);
                (false, full_output)
            }
        }
        Err(e) => {
            let error_msg = format!("Failed to check auth status: {}", e);
            println!("[DEBUG] Auth check error: {}", error_msg);
            (false, error_msg)
        }
    };
    
    Ok(json!({
        "isAuthenticated": is_authenticated,
        "statusMessage": status_message,
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}

// Tauri command to start Claude session in terminal
#[tauri::command]
async fn start_claude_session(
    terminal_id: u32,
    session_args: Option<Vec<String>>,
    processes: State<'_, TerminalProcesses>
) -> Result<String, String> {
    let mut proc_map = processes.lock().unwrap();
    
    if let Some(child) = proc_map.get_mut(&terminal_id) {
        if let Some(ref mut stdin) = child.stdin {
            use std::io::Write;
            
            // Build claude command with arguments
            let mut command = "claude".to_string();
            if let Some(args) = session_args {
                for arg in args {
                    command.push_str(&format!(" {}", arg));
                }
            }
            
            // Start Claude session
            stdin.write_all(format!("{}\n", command).as_bytes())
                .map_err(|e| format!("Failed to start Claude session: {}", e))?;
            stdin.flush()
                .map_err(|e| format!("Failed to flush Claude session command: {}", e))?;
            
            Ok(format!("Claude session started in terminal {} with command: {}", terminal_id, command))
        } else {
            Err(format!("Terminal {} has no stdin available", terminal_id))
        }
    } else {
        Err(format!("Terminal {} not found", terminal_id))
    }
}

// Tauri command to send message to Claude session
#[tauri::command]
async fn send_claude_message(
    terminal_id: u32,
    message: String,
    processes: State<'_, TerminalProcesses>
) -> Result<String, String> {
    let mut proc_map = processes.lock().unwrap();
    
    if let Some(child) = proc_map.get_mut(&terminal_id) {
        if let Some(ref mut stdin) = child.stdin {
            use std::io::Write;
            
            // Send message to Claude session
            stdin.write_all(format!("{}\n", message).as_bytes())
                .map_err(|e| format!("Failed to send message to Claude: {}", e))?;
            stdin.flush()
                .map_err(|e| format!("Failed to flush Claude message: {}", e))?;
            
            Ok(format!("Message sent to Claude session in terminal {}", terminal_id))
        } else {
            Err(format!("Terminal {} has no stdin available", terminal_id))
        }
    } else {
        Err(format!("Terminal {} not found", terminal_id))
    }
}

// Tauri command to stop Claude session
#[tauri::command]
async fn stop_claude_session(
    terminal_id: u32,
    processes: State<'_, TerminalProcesses>
) -> Result<String, String> {
    let mut proc_map = processes.lock().unwrap();
    
    if let Some(child) = proc_map.get_mut(&terminal_id) {
        if let Some(ref mut stdin) = child.stdin {
            use std::io::Write;
            
            // Send Ctrl+C to stop Claude session
            stdin.write_all(b"\x03")
                .map_err(|e| format!("Failed to stop Claude session: {}", e))?;
            stdin.flush()
                .map_err(|e| format!("Failed to flush stop command: {}", e))?;
            
            Ok(format!("Claude session stopped in terminal {}", terminal_id))
        } else {
            Err(format!("Terminal {} has no stdin available", terminal_id))
        }
    } else {
        Err(format!("Terminal {} not found", terminal_id))
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(TerminalProcesses::default())
        .invoke_handler(tauri::generate_handler![
            initialize_directories,
            log_verification_result,
            get_current_directory,
            open_system_terminal,
            create_terminal,
            execute_command,
            terminate_terminal,
            list_terminals,
            check_claude_cli,
            check_claude_auth,
            start_claude_session,
            send_claude_message,
            stop_claude_session
        ])
        .setup(|_app| {
            // Initialize directories on app startup
            if let Err(e) = initialize_directories() {
                eprintln!("Failed to initialize directories: {}", e);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}