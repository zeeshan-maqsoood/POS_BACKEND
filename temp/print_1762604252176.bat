@echo off
chcp 65001 > nul
set "file=E:\\SourceFind - Copy\\Backend\\temp\\receipt_1762604252175.txt"
set "printer=HP LaserJet P1005"

echo Attempting to print %file% to %printer%

if not exist "%file%" (
    echo Error: File not found: %file%
    exit /b 1
)

print /D:"%printer%" "%file%"
if %ERRORLEVEL% neq 0 (
    echo Print command failed with error %ERRORLEVEL%
    exit /b %ERRORLEVEL%
)

echo Print job submitted successfully
exit /b 0