' JobApply AI - hidden startup launcher.
' Runs the keepalive script (server + tunnel) with no visible window.
' Called from the Windows Startup folder and safe to run any time:
' the PowerShell script is idempotent and skips anything already running.
Set sh = CreateObject("WScript.Shell")
sh.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -File ""D:\proc\AI Projects\JobApply-AI\tools\start-jobapply.ps1""", 0, False
