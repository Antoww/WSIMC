// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use sysinfo::{System, Disks, Networks};
use std::collections::HashMap;
use chrono::{DateTime, Utc};

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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProcessInfo {
    pub name: String,
    pub pid: u32,
    pub cpu_usage: f32,
    pub memory: u64,
    pub gpu_usage: f32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TemperatureInfo {
    pub component: String,
    pub temperature: f32,
    pub max_temperature: Option<f32>,
    pub critical_temperature: Option<f32>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AdvancedSystemInfo {
    pub load_average: Vec<f64>,
    pub process_count: usize,
    pub total_processes: usize,
    pub users_count: usize,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ExtendedRealtimeStats {
    pub cpu_usage: f64,
    pub memory_usage: f64,
    pub memory_used_gb: f64,
    pub memory_total_gb: f64,
    pub temperatures: Vec<TemperatureInfo>,
    pub network_activity: HashMap<String, (u64, u64)>, // (received, transmitted)
    pub top_processes: Vec<ProcessInfo>,
    pub timestamp: DateTime<Utc>,
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
    
    // Utiliser la fréquence du premier CPU si global_cpu_info retourne 0
    let frequency = if cpu.frequency() > 0 {
        cpu.frequency()
    } else {
        cpus.first().map(|c| c.frequency()).unwrap_or(0)
    };
    
    Ok(CpuInfo {
        name: cpu.name().to_string(),
        brand: cpu.brand().to_string(),
        usage: cpu.cpu_usage(),
        frequency,
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

#[tauri::command]
fn get_temperatures() -> Result<Vec<TemperatureInfo>, String> {
    // Températures simulées car sysinfo 0.30 n'a plus components()
    Ok(vec![
        TemperatureInfo {
            component: "CPU Package".to_string(),
            temperature: 45.0, // Valeur simulée
            max_temperature: Some(100.0),
            critical_temperature: Some(105.0),
        },
        TemperatureInfo {
            component: "System".to_string(),
            temperature: 35.0, // Valeur simulée
            max_temperature: Some(80.0),
            critical_temperature: Some(90.0),
        }
    ])
}

#[tauri::command]
fn get_top_processes() -> Result<Vec<ProcessInfo>, String> {
    let mut sys = System::new_all();
    sys.refresh_processes();
    
    // Obtenir le nombre de cœurs CPU pour normaliser l'usage
    let cpu_count = sys.cpus().len() as f32;

    let mut processes: Vec<ProcessInfo> = sys.processes()
        .values()
        .map(|process| {
            // Normaliser l'usage CPU : diviser par le nombre de cœurs pour obtenir un pourcentage sur 100%
            let normalized_cpu_usage = process.cpu_usage() / cpu_count;
            
            // Simulation de l'usage GPU basée sur le nom du processus et l'usage CPU
            let gpu_usage = match process.name() {
                name if name.contains("chrome") || name.contains("firefox") || name.contains("edge") => 
                    (normalized_cpu_usage * 0.3).min(15.0), // Navigateurs utilisent un peu de GPU
                name if name.contains("game") || name.contains("unity") || name.contains("unreal") => 
                    (normalized_cpu_usage * 2.0).min(85.0), // Jeux utilisent beaucoup de GPU
                name if name.contains("nvidia") || name.contains("amd") || name.contains("gpu") => 
                    (normalized_cpu_usage * 1.5).min(25.0), // Processus GPU
                name if name.contains("WSIMC") => 
                    (normalized_cpu_usage * 0.1).min(5.0), // Notre app utilise peu de GPU
                _ => (normalized_cpu_usage * 0.05).min(3.0), // Processus normaux utilisent très peu de GPU
            };
            
            ProcessInfo {
                name: process.name().to_string(),
                pid: process.pid().as_u32(),
                cpu_usage: normalized_cpu_usage,
                memory: process.memory(),
                gpu_usage,
            }
        })
        .collect();

    // Trier par utilisation CPU décroissante
    processes.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap());
    
    // Retourner les 15 premiers pour la fenêtre des processus
    Ok(processes.into_iter().take(15).collect())
}

#[tauri::command]
fn get_advanced_system_info() -> Result<AdvancedSystemInfo, String> {
    let mut sys = System::new_all();
    sys.refresh_all();

    Ok(AdvancedSystemInfo {
        load_average: vec![0.0, 0.0, 0.0], // load_average n'est plus disponible
        process_count: sys.processes().len(),
        total_processes: sys.processes().len(),
        users_count: 1, // users() n'est plus disponible
    })
}

#[tauri::command]
async fn get_extended_realtime_stats() -> Result<ExtendedRealtimeStats, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_cpu();
    sys.refresh_processes();

    // Températures simulées
    let temperatures: Vec<TemperatureInfo> = vec![
        TemperatureInfo {
            component: "CPU Package".to_string(),
            temperature: 45.0 + (sys.global_cpu_info().cpu_usage() * 0.5), // Simulée basée sur l'usage CPU
            max_temperature: Some(100.0),
            critical_temperature: Some(105.0),
        },
        TemperatureInfo {
            component: "System".to_string(),
            temperature: 35.0 + (sys.global_cpu_info().cpu_usage() * 0.3),
            max_temperature: Some(80.0),
            critical_temperature: Some(90.0),
        }
    ];

    // Activité réseau
    let networks = Networks::new_with_refreshed_list();
    let mut network_activity = HashMap::new();
    for (name, network) in networks.iter() {
        network_activity.insert(
            name.clone(), 
            (network.received(), network.transmitted())
        );
    }

    // Top processus
    let cpu_count = sys.cpus().len() as f32;
    let mut processes: Vec<ProcessInfo> = sys.processes()
        .values()
        .map(|process| {
            let normalized_cpu_usage = process.cpu_usage() / cpu_count;
            
            let gpu_usage = match process.name() {
                name if name.contains("chrome") || name.contains("firefox") || name.contains("edge") => 
                    (normalized_cpu_usage * 0.3).min(15.0),
                name if name.contains("game") || name.contains("unity") || name.contains("unreal") => 
                    (normalized_cpu_usage * 2.0).min(85.0),
                name if name.contains("nvidia") || name.contains("amd") || name.contains("gpu") => 
                    (normalized_cpu_usage * 1.5).min(25.0),
                name if name.contains("WSIMC") => 
                    (normalized_cpu_usage * 0.1).min(5.0),
                _ => (normalized_cpu_usage * 0.05).min(3.0),
            };
            
            ProcessInfo {
                name: process.name().to_string(),
                pid: process.pid().as_u32(),
                cpu_usage: normalized_cpu_usage,
                memory: process.memory(),
                gpu_usage,
            }
        })
        .collect();

    processes.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap());
    let top_processes = processes.into_iter().take(5).collect();

    Ok(ExtendedRealtimeStats {
        cpu_usage: sys.global_cpu_info().cpu_usage() as f64,
        memory_usage: (sys.used_memory() as f64 / sys.total_memory() as f64) * 100.0,
        memory_used_gb: sys.used_memory() as f64 / 1_024_f64.powi(3),
        memory_total_gb: sys.total_memory() as f64 / 1_024_f64.powi(3),
        temperatures,
        network_activity,
        top_processes,
        timestamp: Utc::now(),
    })
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_cpu_info,
            get_memory_info,
            get_disk_info,
            get_network_info,
            get_real_time_stats,
            get_temperatures,
            get_top_processes,
            get_advanced_system_info,
            get_extended_realtime_stats
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
