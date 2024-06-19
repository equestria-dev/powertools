use std::io;
use std::str::Utf8Error;

#[derive(Debug)]
#[allow(dead_code)] // Since AutopushError implements Debug
pub enum AutopushError {
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
