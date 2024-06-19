use std::{fs, io};
use std::path::Path;
use std::process::Command;
use log::{debug, error, info, warn};
use simple_logger::SimpleLogger;
use std::str;
use std::str::Utf8Error;

#[derive(Debug)]
#[allow(dead_code)] // Since AutopushError implements Debug
enum AutopushError {
    IO(io::Error),
    Utf8(Utf8Error),
    Git(String)
}

impl From<Utf8Error> for AutopushError {
    fn from(value: Utf8Error) -> Self {
        Self::Utf8(value)
    }
}

impl From<io::Error> for AutopushError {
    fn from(value: io::Error) -> Self {
        Self::IO(value)
    }
}

fn run(source: &str) -> Result<(), AutopushError> {
    let directory = fs::read_dir(&source)?;

    for project in directory {
        let project = project?;
        let project_file_name = project.file_name();
        let project_name = project_file_name.to_str().unwrap();

        if project.file_name()
            .to_str().unwrap()
            .starts_with(".") ||
            !project.file_type()
                .unwrap().is_dir() {
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
        let status = Command::new("git")
            .args(["status", "--porcelain"])
            .current_dir(project.path())
            .output()?;
        let status = str::from_utf8(status
            .stdout.as_slice())?;
        if status.trim().len() < 1 {
            info!("{project_name}: No changes to commit");
            continue;
        } else {
            debug!("{project_name}: Found changes to commit");
        }

        info!("{project_name}: Tracking files");
        let status = Command::new("git")
            .args(["add", "-A"])
            .current_dir(project.path())
            .status()?;
        if !status.success() {
            return Err(AutopushError::Git(String::from("Unable to track files (git add).")));
        }

        info!("{project_name}: Making commit");
        let status = Command::new("git")
            .args(["commit"])
            .current_dir(project.path())
            .status()?;
        if !status.success() {
            return Err(AutopushError::Git(String::from("Unable to make commit (git commit).")));
        }

        info!("{project_name}: Pushing to remote");
        let status = Command::new("git")
            .args(["push", "--all", "origin"])
            .current_dir(project.path())
            .status()?;
        if !status.success() {
            return Err(AutopushError::Git(String::from("Unable to push to remote (git push).")));
        }

        info!("{project_name}: Completed!");
    }

    Ok(())
}

fn main() {
    SimpleLogger::new()
        .init()
        .unwrap();

    info!("Autopush version {}; part of Equestria.dev Power Tools", env!("CARGO_PKG_VERSION"));
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
