fn main() {
    // Skip embedding resources in development
    if std::env::var("PROFILE").unwrap_or_default() == "debug" {
        println!("cargo:warning=Skipping resource embedding in debug mode");
        return;
    }
    tauri_build::build()
}
