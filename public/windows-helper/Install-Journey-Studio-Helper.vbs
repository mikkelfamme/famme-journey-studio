Option Explicit

Const PRODUCT_NAME = "Journey Studio"
Const PROTOCOL_NAME = "journeystudio-helper"
Const ICON_URL = "https://mikkelfamme.github.io/famme-journey-studio/journey-studio-app-v2.ico"

Dim shell, fso, localAppData, installDir, installedScript, firstArg
Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

localAppData = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%")
installDir = localAppData & "\JourneyStudioHelper"
installedScript = installDir & "\JourneyStudioHelper.vbs"
firstArg = ""
If WScript.Arguments.Count > 0 Then firstArg = LCase(WScript.Arguments(0))

If InStr(firstArg, "create-shortcut") > 0 Then
  Call CreateDesktopShortcut(True)
  WScript.Quit 0
End If

InstallHelper
Dim shortcutCreated
shortcutCreated = CreateDesktopShortcut(False)
If shortcutCreated Then
  MsgBox "Journey Studio Windows-helper er installeret." & vbCrLf & vbCrLf & _
         "Der er samtidig oprettet en rigtig Journey Studio-genvej på skrivebordet." & vbCrLf & _
         "Fremover kan knappen 'Opret skrivebordsgenvej' i Journey Studio genskabe genvejen med ét klik.", _
         vbInformation, "Journey Studio"
Else
  MsgBox "Journey Studio Windows-helper er installeret, men der blev ikke fundet en installeret Journey Studio-app at kopiere." & vbCrLf & vbCrLf & _
         "Installér Journey Studio som app/PWA og brug derefter Settings > Opret skrivebordsgenvej.", _
         vbExclamation, "Journey Studio"
End If
WScript.Quit 0

Sub InstallHelper()
  On Error Resume Next
  If Not fso.FolderExists(installDir) Then fso.CreateFolder installDir
  On Error GoTo 0

  If LCase(WScript.ScriptFullName) <> LCase(installedScript) Then
    On Error Resume Next
    fso.CopyFile WScript.ScriptFullName, installedScript, True
    If Err.Number <> 0 Then
      MsgBox "Windows-helperen kunne ikke kopieres til din brugerprofil." & vbCrLf & Err.Description, vbCritical, PRODUCT_NAME
      WScript.Quit 2
    End If
    On Error GoTo 0
  End If

  Dim command
  command = Chr(34) & WScript.FullName & Chr(34) & " //nologo " & Chr(34) & installedScript & Chr(34) & " " & Chr(34) & "%1" & Chr(34)

  On Error Resume Next
  shell.RegWrite "HKCU\Software\Classes\" & PROTOCOL_NAME & "\", "URL:Journey Studio Helper Protocol", "REG_SZ"
  shell.RegWrite "HKCU\Software\Classes\" & PROTOCOL_NAME & "\URL Protocol", "", "REG_SZ"
  shell.RegWrite "HKCU\Software\Classes\" & PROTOCOL_NAME & "\DefaultIcon\", WScript.FullName & ",0", "REG_SZ"
  shell.RegWrite "HKCU\Software\Classes\" & PROTOCOL_NAME & "\shell\open\command\", command, "REG_SZ"
  If Err.Number <> 0 Then
    MsgBox "Windows-helperen kunne ikke registreres for din bruger." & vbCrLf & Err.Description, vbCritical, PRODUCT_NAME
    WScript.Quit 3
  End If
  On Error GoTo 0

  DownloadIcon installDir & "\JourneyStudio.ico"
End Sub

Function CreateDesktopShortcut(showResult)
  CreateDesktopShortcut = False
  Dim sourcePath, desktopPath, destinationPath, iconPath
  sourcePath = FindJourneyStudioShortcut()

  If sourcePath = "" Then
    If showResult Then
      MsgBox "Jeg kunne ikke finde den installerede Journey Studio-app i Windows Start-menuen." & vbCrLf & vbCrLf & _
             "Installér først Journey Studio som app/PWA i din browser og kør derefter helperen igen.", _
             vbExclamation, PRODUCT_NAME
    End If
    Exit Function
  End If

  desktopPath = shell.SpecialFolders("Desktop")
  destinationPath = desktopPath & "\Journey Studio.lnk"
  iconPath = installDir & "\JourneyStudio.ico"

  On Error Resume Next
  fso.CopyFile sourcePath, destinationPath, True
  If Err.Number <> 0 Then
    Dim copyError
    copyError = Err.Description
    On Error GoTo 0
    If showResult Then MsgBox "Genvejen kunne ikke oprettes på skrivebordet." & vbCrLf & copyError, vbCritical, PRODUCT_NAME
    Exit Function
  End If
  On Error GoTo 0

  If Not fso.FileExists(iconPath) Then DownloadIcon iconPath

  If fso.FileExists(iconPath) Then
    On Error Resume Next
    Dim shortcut
    Set shortcut = shell.CreateShortcut(destinationPath)
    shortcut.IconLocation = iconPath & ",0"
    shortcut.Description = "Journey Studio"
    shortcut.Save
    On Error GoTo 0
  End If

  CleanupOldDesktopShortcuts desktopPath, destinationPath

  CreateDesktopShortcut = True
  If showResult Then
    MsgBox "Journey Studio-genvejen er oprettet på skrivebordet.", vbInformation, PRODUCT_NAME
  End If
End Function

Function FindJourneyStudioShortcut()
  Dim userPrograms, commonPrograms, result
  userPrograms = shell.ExpandEnvironmentStrings("%APPDATA%") & "\Microsoft\Windows\Start Menu\Programs"
  commonPrograms = shell.ExpandEnvironmentStrings("%PROGRAMDATA%") & "\Microsoft\Windows\Start Menu\Programs"

  result = FindNamedShortcut(userPrograms)
  If result = "" Then result = FindNamedShortcut(commonPrograms)
  FindJourneyStudioShortcut = result
End Function

Function FindNamedShortcut(rootPath)
  Dim result
  result = ""
  If Not fso.FolderExists(rootPath) Then
    FindNamedShortcut = result
    Exit Function
  End If

  result = SearchFolder(rootPath)
  FindNamedShortcut = result
End Function

Function SearchFolder(folderPath)
  Dim folder, file, subFolder, nameLower, nestedResult
  SearchFolder = ""
  On Error Resume Next
  Set folder = fso.GetFolder(folderPath)
  If Err.Number <> 0 Then
    Err.Clear
    On Error GoTo 0
    Exit Function
  End If
  On Error GoTo 0

  For Each file In folder.Files
    nameLower = LCase(file.Name)
    If nameLower = "journey studio.lnk" Or _
       nameLower = "journey studio by famme.lnk" Or _
       nameLower = "famme journey studio.lnk" Then
      SearchFolder = file.Path
      Exit Function
    End If
  Next

  For Each subFolder In folder.SubFolders
    nestedResult = SearchFolder(subFolder.Path)
    If nestedResult <> "" Then
      SearchFolder = nestedResult
      Exit Function
    End If
  Next
End Function

Sub CleanupOldDesktopShortcuts(desktopPath, keepPath)
  Dim candidates, item, path
  candidates = Array("Famme Journey Studio.lnk", "Journey Studio by Famme.lnk")
  For Each item In candidates
    path = desktopPath & "\" & item
    If LCase(path) <> LCase(keepPath) And fso.FileExists(path) Then
      On Error Resume Next
      fso.DeleteFile path, True
      On Error GoTo 0
    End If
  Next
End Sub

Sub DownloadIcon(targetPath)
  On Error Resume Next
  Dim http, stream
  Set http = CreateObject("MSXML2.XMLHTTP.6.0")
  http.Open "GET", ICON_URL, False
  http.Send
  If Err.Number <> 0 Or http.Status <> 200 Then
    Err.Clear
    On Error GoTo 0
    Exit Sub
  End If

  Set stream = CreateObject("ADODB.Stream")
  stream.Type = 1
  stream.Open
  stream.Write http.responseBody
  stream.SaveToFile targetPath, 2
  stream.Close
  On Error GoTo 0
End Sub
