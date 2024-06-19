use std::fs::DirEntry;
use std::process::Command;
use crate::error::AutopushError;
use std::str;

pub mod error;

pub fn has_changes(project: &DirEntry) -> Result<bool, AutopushError> {
    let status = Command::new("git")
        .args(["status", "--porcelain"])
        .current_dir(project.path())
        .output()?;
    let status = str::from_utf8(status
        .stdout.as_slice())?;
    Ok(status.trim().len() < 1)
}

pub fn track_changes(project: &DirEntry) -> Result<(), AutopushError> {
    let status = Command::new("git")
        .args(["add", "-A"])
        .current_dir(project.path())
        .status()?;
    if !status.success() {
        Err(AutopushError::Git(String::from("Unable to track files (git add).")))
    } else {
        Ok(())
    }
}

pub fn make_commit(project: &DirEntry) -> Result<(), AutopushError> {
    let status = Command::new("git")
        .args(["commit"])
        .current_dir(project.path())
        .status()?;
    if !status.success() {
        Err(AutopushError::Git(String::from("Unable to make commit (git commit).")))
    } else {
        Ok(())
    }
}

pub fn push_project(project: &DirEntry) -> Result<(), AutopushError> {
    let status = Command::new("git")
        .args(["push", "--all", "origin"])
        .current_dir(project.path())
        .status()?;
    if !status.success() {
        Err(AutopushError::Git(String::from("Unable to push to remote (git push).")))
    } else {
        Ok(())
    }
}

pub fn file_is_project(candidate: &DirEntry) -> Result<bool, AutopushError> {
    Ok(!candidate.file_name()
        .to_str().unwrap_or(".invalid")
        .starts_with(".") &&
        candidate.file_type()?
            .is_dir())
}
