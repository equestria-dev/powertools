use std::fs;
use std::path::Path;
use log::{debug, error, info, warn};
use simple_logger::SimpleLogger;
use std::str;
use autopush::{file_is_project, has_changes, make_commit, push_project, track_changes};

use autopush::error::AutopushError;

fn run(source: &str) -> Result<(), AutopushError> {
    let directory = fs::read_dir(&source)?;

    for project in directory {
        let project = project?;
        let project_file_name = project.file_name();
        let project_name = project_file_name.to_str().unwrap();

        if !file_is_project(&project)? {
            continue;
        }

        info!("------------------------------------");
        info!("Processing: {}", project_name);

        let mut git_path = project.path();
        git_path.push(".git");

        if !git_path.exists() {
            warn!("{project_name}: No Git repository found");
            continue;
        }

        debug!("{project_name}: Checking for changes");
        if has_changes(&project)? {
            info!("{project_name}: No changes to commit");
            continue;
        } else {
            debug!("{project_name}: Found changes to commit");
        }

        info!("{project_name}: Tracking files");
        track_changes(&project)?;

        info!("{project_name}: Making commit");
        make_commit(&project)?;

        info!("{project_name}: Pushing to remote");
        push_project(&project)?;

        info!("{project_name}: Completed!");
    }

    Ok(())
}

fn main() {
    SimpleLogger::new()
        .init()
        .unwrap();

    info!("Autopush Standalone version {}", env!("CARGO_PKG_VERSION"));
    let source = if Path::new("/Volumes/Projects").exists() {
        "/Volumes/Projects"
    } else {
        "."
    };

    debug!("Working with Git repositories in {}", source);

    if let Err(err) = run(source) {
        error!("An error has occurred: {err:?}. Unable to continue.");
    } else {
        info!("------------------------------------");
        info!("Autopush has completed successfully.");
    }
}
