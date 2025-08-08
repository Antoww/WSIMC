// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use sysinfo::{System, Disks, Networks};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SystemInfo {
    pub name: String,
    pub os_version: String,
    pub kernel_version: String,
    pub hostname: String,
    pub uptime: u64,
    pub boot_time: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CpuInfo {
    pub name: String,
    pub brand: String,
    pub usage: f32,
    pub frequency: u64,
    pub cores: usize,
    pub physical_cores: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MemoryInfo {
    pub total: u64,
    pub used: u64,
    pub available: u64,
    pub usage_percent: f64,
    pub swap_total: u64,
    pub swap_used: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiskInfo {
    pub name: String,
    pub mount_point: String,
    pub total_space: u64,
    pub available_space: u64,
    pub used_space: u64,
    pub usage_percent: f64,
    pub file_system: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct NetworkInfo {
    pub name: String,
    pub received: u64,
    pub transmitted: u64,
}

// Commandes Tauri
#[tauri::command]
fn get_system_info() -> Result<SystemInfo, String> {
    Ok(SystemInfo {
        name: System::name().unwrap_or_default(),
        os_version: System::os_version().unwrap_or_default(),
        kernel_version: System::kernel_version().unwrap_or_default(),
        hostname: System::host_name().unwrap_or_default(),
        uptime: System::uptime(),
        boot_time: System::boot_time(),
    })
}

#[tauri::command]
fn get_cpu_info() -> Result<CpuInfo, String> {
    let mut sys = System::new_all();
    sys.refresh_cpu();
    
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_cpu();

    let cpu = sys.global_cpu_info();
    let cpus = sys.cpus();
    
    Ok(CpuInfo {
        name: cpu.name().to_string(),
        brand: cpu.brand().to_string(),
        usage: cpu.cpu_usage(),
        frequency: cpu.frequency(),
        cores: cpus.len(),
        physical_cores: sys.physical_core_count().unwrap_or(0),
    })
}

#[tauri::command]
fn get_memory_info() -> Result<MemoryInfo, String> {
    let mut sys = System::new_all();
    sys.refresh_memory();

    let total = sys.total_memory();
    let used = sys.used_memory();
    let available = sys.available_memory();
    let usage_percent = (used as f64 / total as f64) * 100.0;

    Ok(MemoryInfo {
        total,
        used,
        available,
        usage_percent,
        swap_total: sys.total_swap(),
        swap_used: sys.used_swap(),
    })
}

#[tauri::command]
fn get_disk_info() -> Result<Vec<DiskInfo>, String> {
    let disks = Disks::new_with_refreshed_list();

    let disk_info = disks
        .iter()
        .map(|disk| {
            let total = disk.total_space();
            let available = disk.available_space();
            let used = total - available;
            let usage_percent = if total > 0 {
                (used as f64 / total as f64) * 100.0
            } else {
                0.0
            };

            DiskInfo {
                name: disk.name().to_string_lossy().to_string(),
                mount_point: disk.mount_point().to_string_lossy().to_string(),
                total_space: total,
                available_space: available,
                used_space: used,
                usage_percent,
                file_system: disk.file_system().to_string_lossy().to_string(),
            }
        })
        .collect();

    Ok(disk_info)
}

#[tauri::command]
fn get_network_info() -> Result<Vec<NetworkInfo>, String> {
    let networks = Networks::new_with_refreshed_list();

    let network_info = networks
        .iter()
        .map(|(name, network)| NetworkInfo {
            name: name.clone(),
            received: network.received(),
            transmitted: network.transmitted(),
        })
        .collect();

    Ok(network_info)
}

#[tauri::command]
async fn get_real_time_stats() -> Result<HashMap<String, f64>, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_cpu();

    let mut stats = HashMap::new();
    
    // CPU usage
    stats.insert("cpu_usage".to_string(), sys.global_cpu_info().cpu_usage() as f64);
    
    // Memory usage
    let memory_percent = (sys.used_memory() as f64 / sys.total_memory() as f64) * 100.0;
    stats.insert("memory_usage".to_string(), memory_percent);
    
    // Memory in GB
    stats.insert("memory_used_gb".to_string(), sys.used_memory() as f64 / 1_024_f64.powi(3));
    stats.insert("memory_total_gb".to_string(), sys.total_memory() as f64 / 1_024_f64.powi(3));

    Ok(stats)
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_cpu_info,
            get_memory_info,
            get_disk_info,
            get_network_info,
            get_real_time_stats
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
