# Registers the JobApply KeepAlive scheduled task (runs at every logon).
$action  = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument '-NoProfile -ExecutionPolicy Bypass -File "D:\proc\AI Projects\JobApply-AI\tools\start-jobapply.ps1"'
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
Register-ScheduledTask -TaskName 'JobApply KeepAlive' -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
$task = Get-ScheduledTask -TaskName 'JobApply KeepAlive'
Write-Host "Task registered:" $task.TaskName "| state:" $task.State
