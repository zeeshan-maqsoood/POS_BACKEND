@echo off
chcp 65001 > nul
set "file=E:\\SourceFind - Copy\\Backend\\temp\\receipt_1762604318737.txt"
set "printer=HP LaserJet P1005"

:: Check if printer is online
powershell -Command "$printer = Get-Printer -Name 'HP LaserJet P1005' -ErrorAction SilentlyContinue; if (-not $printer) { Write-Output 'ERROR: Printer not found'; exit 1 }; if ($printer.PrinterStatus -ne 'Normal') { Write-Output ('ERROR: Printer status: ' + $printer.PrinterStatus); exit 1 }"
if %ERRORLEVEL% neq 0 (
    echo Failed to verify printer status
    exit /b 1
)

echo Attempting to print %file% to %printer%

if not exist "%file%" (
    echo Error: File not found: %file%
    exit /b 1
)

echo Sending to printer...
print /D:"%printer%" "%file%" >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Print command failed with error %ERRORLEVEL%
    echo Please check:
    echo 1. Is the printer powered on and connected?
    echo 2. Is the printer online in Windows?
    echo 3. Can you print a test page from Windows?
    exit /b %ERRORLEVEL%
)

echo Print job submitted successfully
exit /b 0