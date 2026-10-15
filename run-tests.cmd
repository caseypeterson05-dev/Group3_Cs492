@echo off
setlocal
pushd "%~dp0"

set "NODE_EXE="
for /f "delims=" %%I in ('where node.exe 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%I"
if not defined NODE_EXE if exist "%ProgramFiles%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles%\nodejs\node.exe"
if not defined NODE_EXE if defined ProgramFiles(x86) if exist "%ProgramFiles(x86)%\nodejs\node.exe" set "NODE_EXE=%ProgramFiles(x86)%\nodejs\node.exe"

if not defined NODE_EXE (
    echo Node.js could not be found.
    echo Install Node.js 20 or newer and try again.
    popd
    exit /b 1
)

"%NODE_EXE%" --test
set "EXIT_CODE=%ERRORLEVEL%"
popd
exit /b %EXIT_CODE%
