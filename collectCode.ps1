Set-Location $PSScriptRoot

$files = Get-ChildItem -Path .\* -Include *.js, *.html, *.json

New-Item .\codeFile.txt -Force

foreach ($file in $files) {
    "File: " + $file.Name | Out-File -FilePath .\codeFile.txt -Append
    " " | Out-File -FilePath .\codeFile.txt -Append
    Get-Content $file.Name | Out-File -FilePath .\codeFile.txt -Append
    " " | Out-File -FilePath .\codeFile.txt -Append
    " " | Out-File -FilePath .\codeFile.txt -Append
}
