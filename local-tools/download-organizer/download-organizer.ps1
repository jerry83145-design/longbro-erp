param(
  [switch]$ScanOnce,
  [switch]$Silent,
  [switch]$NoPrompt
)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$ErrorActionPreference = "Stop"

$mutex = $null
if (-not $ScanOnce) {
  $createdNew = $false
  $mutex = New-Object System.Threading.Mutex($true, "Global\LongbroERPDownloadOrganizerV2", [ref]$createdNew)
  if (-not $createdNew) {
    [System.Windows.Forms.MessageBox]::Show("Download organizer is already running.", "Download organizer") | Out-Null
    return
  }
}

function Get-AccountingRoot {
  $root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
  return $root
}

$AccountingRoot = Get-AccountingRoot
$DownloadRoot = Join-Path $env:USERPROFILE "Downloads"
$LogRoot = Join-Path $AccountingRoot "download-organizer-log"
$LogFile = Join-Path $LogRoot ("download_organizer_{0}.csv" -f (Get-Date -Format "yyyyMM"))
$PidFile = Join-Path $PSScriptRoot "download-organizer.pid"

function Ensure-Directory($path) {
  if (-not (Test-Path -LiteralPath $path)) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
  }
}

Ensure-Directory $LogRoot

if (-not $ScanOnce) {
  Set-Content -LiteralPath $PidFile -Value $PID -Encoding ASCII
}

function Get-Categories {
  $keys = @("A","B","C","D","E","F","G","Z")
  $result = [ordered]@{}
  foreach ($key in $keys) {
    $folder = Get-ChildItem -LiteralPath $AccountingRoot -Directory -ErrorAction SilentlyContinue |
      Where-Object { $_.Name -like "$key`_*" } |
      Select-Object -First 1

    if ($folder) {
      $result[$key] = @{
        Name = $folder.Name
        Label = ("{0}  {1}" -f $key, $folder.Name)
      }
    }
  }
  return $result
}

$Categories = Get-Categories

function Write-OrganizerLog {
  param(
    [string]$Source,
    [string]$Target,
    [string]$Category,
    [string]$Confidence,
    [string]$Reason
  )

  $row = [pscustomobject]@{
    Time = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    Source = $Source
    Target = $Target
    Category = $Category
    Confidence = $Confidence
    Reason = $Reason
  }

  if (-not (Test-Path -LiteralPath $LogFile)) {
    $row | Export-Csv -LiteralPath $LogFile -NoTypeInformation -Encoding UTF8
  } else {
    $row | Export-Csv -LiteralPath $LogFile -NoTypeInformation -Encoding UTF8 -Append
  }
}

if (-not $ScanOnce) {
  Write-OrganizerLog -Source $PSScriptRoot -Target "" -Category "status" -Confidence "info" -Reason ("organizer started pid " + $PID)
}

function Test-FileReady {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) { return $false }
  if ($Path -match '\.crdownload$|\.tmp$|\.part$') { return $false }

  try {
    $stream = [System.IO.File]::Open($Path, "Open", "ReadWrite", "None")
    $stream.Close()
    return $true
  } catch {
    return $false
  }
}

function Get-TargetMonth {
  param([System.IO.FileInfo]$File)

  $name = $File.Name
  $patterns = @(
    '(20[2-3][0-9])[-_./]?(0[1-9]|1[0-2])[-_./]?[0-3]?[0-9]',
    '(20[2-3][0-9])(0[1-9]|1[0-2])'
  )

  foreach ($pattern in $patterns) {
    $match = [regex]::Match($name, $pattern)
    if ($match.Success) {
      return @{
        Year = $match.Groups[1].Value
        Month = ("{0}{1}" -f $match.Groups[1].Value, $match.Groups[2].Value)
        Reason = "file name date"
      }
    }
  }

  return @{
    Year = $File.LastWriteTime.ToString("yyyy")
    Month = $File.LastWriteTime.ToString("yyyyMM")
    Reason = "file modified time"
  }
}

function Contains-AnyText {
  param(
    [string]$Text,
    [string[]]$Needles
  )

  foreach ($needle in $Needles) {
    if ($Text -like "*$needle*") { return $true }
  }
  return $false
}

function New-UtfText {
  param([int[]]$Codes)
  return -join ($Codes | ForEach-Object { [char]$_ })
}

$ReportTerms = @(
  "report", "daily", "weekly", "monthly",
  (New-UtfText @(0x5167,0x5E33,0x5831,0x8868)),
  (New-UtfText @(0x5831,0x8868)),
  (New-UtfText @(0x6708,0x5831)),
  (New-UtfText @(0x9031,0x5831)),
  (New-UtfText @(0x5468,0x5831)),
  (New-UtfText @(0x65E5,0x5831)),
  (New-UtfText @(0x640D,0x76CA)),
  (New-UtfText @(0x8CC7,0x7522,0x8CA0,0x50B5)),
  (New-UtfText @(0x6191,0x8B49,0x6838,0x5C0D))
)

$AdminTerms = @(
  "admin", "drive sync",
  (New-UtfText @(0x8655,0x7406,0x6E05,0x55AE)),
  (New-UtfText @(0x884C,0x653F,0x4EBA,0x54E1)),
  (New-UtfText @(0x884C,0x653F,0x6E05,0x55AE))
)

$BankTerms = @(
  "bank", "statement", "cashflow", "card",
  (New-UtfText @(0x9280,0x884C)),
  (New-UtfText @(0x5C0D,0x5E33)),
  (New-UtfText @(0x5E33,0x6236)),
  (New-UtfText @(0x5B58,0x647A)),
  (New-UtfText @(0x91D1,0x6D41)),
  (New-UtfText @(0x4FE1,0x7528,0x5361)),
  (New-UtfText @(0x5237,0x5361))
)

$InventoryTerms = @(
  "inventory", "stock",
  (New-UtfText @(0x9032,0x92B7,0x5B58)),
  (New-UtfText @(0x5EAB,0x5B58)),
  (New-UtfText @(0x9032,0x8CA8)),
  (New-UtfText @(0x92B7,0x8CA8)),
  (New-UtfText @(0x5546,0x54C1)),
  (New-UtfText @(0x5361,0x76D2)),
  (New-UtfText @(0x5361,0x7247))
)

$VoucherTerms = @(
  "invoice", "receipt", "voucher",
  (New-UtfText @(0x767C,0x7968)),
  (New-UtfText @(0x6536,0x64DA)),
  (New-UtfText @(0x6191,0x8B49)),
  (New-UtfText @(0x4E09,0x806F)),
  (New-UtfText @(0x4E8C,0x806F)),
  (New-UtfText @(0x7D71,0x7DE8)),
  (New-UtfText @(0x7D71,0x4E00,0x7DE8,0x865F)),
  (New-UtfText @(0x767C,0x7968,0x865F,0x78BC))
)

$ImportTerms = @("raw", "import")
$VoucherExtensions = @(".jpg", ".jpeg", ".png", ".pdf", ".heic", ".webp")
$SpreadsheetExtensions = @(".xlsx", ".xls", ".csv")

$ErpSourceTerms = @(
  "jerry83145-design.github.io",
  "longbro-erp",
  "longbroerp",
  "localhost",
  "127.0.0.1"
)

function Add-RuleTerms {
  param(
    [string[]]$Current,
    $Extra
  )

  $items = @($Current)
  if ($Extra) {
    $items += @($Extra | ForEach-Object { [string]$_ })
  }
  return @($items | Where-Object { $_ } | Select-Object -Unique)
}

$RulesFile = Join-Path $PSScriptRoot "download-rules.json"
if (Test-Path -LiteralPath $RulesFile) {
  try {
    $rules = Get-Content -Raw -Encoding UTF8 -LiteralPath $RulesFile | ConvertFrom-Json
    $ErpSourceTerms = Add-RuleTerms $ErpSourceTerms $rules.sourceTerms
    $ReportTerms = Add-RuleTerms $ReportTerms $rules.categories.B.terms
    $AdminTerms = Add-RuleTerms $AdminTerms $rules.categories.E.terms
    $BankTerms = Add-RuleTerms $BankTerms $rules.categories.F.terms
    $InventoryTerms = Add-RuleTerms $InventoryTerms $rules.categories.G.terms
    $VoucherTerms = Add-RuleTerms $VoucherTerms $rules.categories.D.terms
    $ImportTerms = Add-RuleTerms $ImportTerms $rules.categories.C.terms
    $VoucherExtensions = Add-RuleTerms $VoucherExtensions $rules.categories.D.extensions
    $SpreadsheetExtensions = Add-RuleTerms $SpreadsheetExtensions $rules.categories.C.extensions
  } catch {
    Write-OrganizerLog -Source $RulesFile -Target "" -Category "rules-error" -Confidence "error" -Reason ($_.Exception.Message)
  }
}

$AccountingTerms = @(
  "erp", "backup",
  $ErpSourceTerms,
  $ReportTerms,
  $AdminTerms,
  $BankTerms,
  $InventoryTerms,
  $VoucherTerms,
  $ImportTerms
) | ForEach-Object { $_ }

function Get-DownloadSourceText {
  param([string]$Path)

  try {
    $stream = Get-Content -LiteralPath $Path -Stream Zone.Identifier -ErrorAction SilentlyContinue
    if ($stream) { return ($stream -join "`n").ToLowerInvariant() }
  } catch {
  }

  return ""
}

function Test-ShouldProcessFile {
  param(
    [System.IO.FileInfo]$File,
    [hashtable]$Category
  )

  $sourceText = Get-DownloadSourceText $File.FullName
  if ($sourceText -and (Contains-AnyText $sourceText $ErpSourceTerms)) {
    return @{ ShouldProcess = $true; Reason = "ERP source" }
  }

  $name = $File.Name.ToLowerInvariant()
  if (Contains-AnyText $name $AccountingTerms) {
    return @{ ShouldProcess = $true; Reason = "accounting keyword" }
  }

  if ($Category.Confidence -eq "high") {
    return @{ ShouldProcess = $true; Reason = "high confidence category" }
  }

  return @{ ShouldProcess = $false; Reason = "not ERP source and no accounting keyword" }
}

function Get-FileCategory {
  param([System.IO.FileInfo]$File)

  $name = $File.Name.ToLowerInvariant()
  $ext = $File.Extension.ToLowerInvariant()

  if (Contains-AnyText $name @("erp", "backup")) {
    return @{ Key = "A"; Confidence = "high"; Reason = "ERP or backup keyword" }
  }
  if (Contains-AnyText $name $ReportTerms) {
    return @{ Key = "B"; Confidence = "high"; Reason = "report keyword" }
  }
  if (Contains-AnyText $name $AdminTerms) {
    return @{ Key = "E"; Confidence = "high"; Reason = "admin keyword" }
  }
  if (Contains-AnyText $name $BankTerms) {
    return @{ Key = "F"; Confidence = "high"; Reason = "bank or cashflow keyword" }
  }
  if (Contains-AnyText $name $InventoryTerms) {
    return @{ Key = "G"; Confidence = "high"; Reason = "inventory keyword" }
  }
  if (Contains-AnyText $name $VoucherTerms) {
    return @{ Key = "D"; Confidence = "high"; Reason = "voucher keyword" }
  }
  if (Contains-AnyText $name $ImportTerms) {
    return @{ Key = "C"; Confidence = "medium"; Reason = "import keyword" }
  }
  if ($ext -in $VoucherExtensions) {
    return @{ Key = "D"; Confidence = "medium"; Reason = "image or PDF may be voucher" }
  }
  if ($ext -in $SpreadsheetExtensions) {
    return @{ Key = "C"; Confidence = "medium"; Reason = "spreadsheet import file" }
  }

  return @{ Key = ""; Confidence = "unknown"; Reason = "no matching rule" }
}

function Show-CategoryPrompt {
  param(
    [System.IO.FileInfo]$File,
    [string]$Reason,
    [string]$SuggestedKey
  )

  $form = New-Object System.Windows.Forms.Form
  $form.Text = "Download organizer"
  $form.Size = New-Object System.Drawing.Size(620, 270)
  $form.StartPosition = "CenterScreen"
  $form.TopMost = $true

  $label = New-Object System.Windows.Forms.Label
  $label.AutoSize = $false
  $label.Location = New-Object System.Drawing.Point(18, 18)
  $label.Size = New-Object System.Drawing.Size(570, 70)
  $label.Text = "Please choose where to move this file:`r`n$($File.Name)`r`nReason: $Reason"
  $form.Controls.Add($label)

  $combo = New-Object System.Windows.Forms.ComboBox
  $combo.DropDownStyle = "DropDownList"
  $combo.Location = New-Object System.Drawing.Point(22, 105)
  $combo.Size = New-Object System.Drawing.Size(550, 32)

  foreach ($key in $Categories.Keys) {
    [void]$combo.Items.Add($Categories[$key].Label)
  }

  $defaultKey = if ($SuggestedKey -and $Categories.Contains($SuggestedKey)) { $SuggestedKey } else { "Z" }
  $defaultIndex = [array]::IndexOf(@($Categories.Keys), $defaultKey)
  if ($defaultIndex -ge 0) { $combo.SelectedIndex = $defaultIndex }
  $form.Controls.Add($combo)

  $okButton = New-Object System.Windows.Forms.Button
  $okButton.Text = "Move"
  $okButton.Location = New-Object System.Drawing.Point(350, 165)
  $okButton.Size = New-Object System.Drawing.Size(100, 42)
  $okButton.DialogResult = [System.Windows.Forms.DialogResult]::OK
  $form.AcceptButton = $okButton
  $form.Controls.Add($okButton)

  $cancelButton = New-Object System.Windows.Forms.Button
  $cancelButton.Text = "Skip"
  $cancelButton.Location = New-Object System.Drawing.Point(470, 165)
  $cancelButton.Size = New-Object System.Drawing.Size(100, 42)
  $cancelButton.DialogResult = [System.Windows.Forms.DialogResult]::Cancel
  $form.CancelButton = $cancelButton
  $form.Controls.Add($cancelButton)

  $result = $form.ShowDialog()
  if ($result -eq [System.Windows.Forms.DialogResult]::OK -and $combo.SelectedIndex -ge 0) {
    return @($Categories.Keys)[$combo.SelectedIndex]
  }

  return ""
}

function Get-UniqueTargetPath {
  param(
    [string]$Folder,
    [string]$FileName
  )

  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($FileName)
  $ext = [System.IO.Path]::GetExtension($FileName)
  $candidate = Join-Path $Folder $FileName
  $version = 2

  while (Test-Path -LiteralPath $candidate) {
    $candidate = Join-Path $Folder ("{0}_v{1}{2}" -f $baseName, $version, $ext)
    $version += 1
  }

  return $candidate
}

function Move-DownloadedFile {
  param([string]$Path)

  if (-not (Test-FileReady $Path)) { return }

  $file = Get-Item -LiteralPath $Path
  $category = Get-FileCategory $file
  $processCheck = Test-ShouldProcessFile -File $file -Category $category
  if (-not $processCheck.ShouldProcess) {
    Write-OrganizerLog -Source $Path -Target "" -Category "ignored" -Confidence $category.Confidence -Reason $processCheck.Reason
    return
  }

  $month = Get-TargetMonth $file
  $key = $category.Key

  if (-not $Categories.Contains($key) -or $category.Confidence -ne "high") {
    if ($NoPrompt) {
      Write-OrganizerLog -Source $Path -Target "" -Category "skipped" -Confidence $category.Confidence -Reason ("no prompt scan: " + $category.Reason)
      return
    }
    $chosenKey = Show-CategoryPrompt -File $file -Reason $category.Reason -SuggestedKey $key
    if (-not $chosenKey) {
      Write-OrganizerLog -Source $Path -Target "" -Category "skipped" -Confidence $category.Confidence -Reason "user skipped"
      return
    }
    $key = $chosenKey
  }

  if (-not $Categories.Contains($key)) { $key = "Z" }

  $categoryFolder = Join-Path $AccountingRoot $Categories[$key].Name
  $yearFolder = Join-Path $categoryFolder $month.Year
  $monthFolder = Join-Path $yearFolder $month.Month
  Ensure-Directory $monthFolder

  $target = Get-UniqueTargetPath -Folder $monthFolder -FileName $file.Name
  Copy-Item -LiteralPath $Path -Destination $target
  $copied = Get-Item -LiteralPath $target -ErrorAction SilentlyContinue
  if (-not $copied -or $copied.Length -ne $file.Length) {
    Write-OrganizerLog -Source $Path -Target $target -Category "copy-error" -Confidence "error" -Reason "copy verification failed"
    return
  }

  Remove-Item -LiteralPath $Path -Force

  Write-OrganizerLog -Source $Path -Target $target -Category $Categories[$key].Name -Confidence $category.Confidence -Reason $category.Reason
}

function Scan-ExistingDownloads {
  Get-ChildItem -LiteralPath $DownloadRoot -File -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime |
    ForEach-Object {
      try {
        Move-DownloadedFile $_.FullName
      } catch {
        Write-OrganizerLog -Source $_.FullName -Target "" -Category "error" -Confidence "error" -Reason ($_.Exception.Message)
      }
    }
}

if ($ScanOnce) {
  Scan-ExistingDownloads
  return
}

function Initialize-KnownFiles {
  $script:knownFiles = @{}
  Get-ChildItem -LiteralPath $DownloadRoot -File -ErrorAction SilentlyContinue | ForEach-Object {
    $script:knownFiles[$_.FullName] = $true
  }
}

function Scan-NewDownloads {
  $files = Get-ChildItem -LiteralPath $DownloadRoot -File -ErrorAction SilentlyContinue
  foreach ($file in $files) {
    $path = $file.FullName
    if ($script:knownFiles.ContainsKey($path)) { continue }
    if (-not (Test-FileReady $path)) { continue }

    $script:knownFiles[$path] = $true
    try {
      Move-DownloadedFile $path
    } catch {
      Write-OrganizerLog -Source $path -Target "" -Category "error" -Confidence "error" -Reason ($_.Exception.Message)
    }
  }
}

if ($Silent) {
  try {
    Initialize-KnownFiles
    while ($true) {
      Scan-NewDownloads
      Start-Sleep -Seconds 5
    }
  } finally {
    if (Test-Path -LiteralPath $PidFile) {
      try { Remove-Item -LiteralPath $PidFile -Force } catch {}
    }
    if ($mutex) {
      try { $mutex.ReleaseMutex() } catch {}
      $mutex.Dispose()
    }
  }
  return
}

$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Icon = [System.Drawing.SystemIcons]::Information
$notify.Text = "Accounting download organizer"
$notify.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip
$scanItem = $menu.Items.Add("Scan Downloads now")
$logItem = $menu.Items.Add("Open organizer log")
$exitItem = $menu.Items.Add("Exit")
$notify.ContextMenuStrip = $menu

$scanItem.Add_Click({ Scan-ExistingDownloads })
$logItem.Add_Click({
  if (Test-Path -LiteralPath $LogFile) {
    Start-Process -FilePath $LogFile
  } else {
    [System.Windows.Forms.MessageBox]::Show("No log file yet.", "Download organizer") | Out-Null
  }
})
$exitItem.Add_Click({
  $notify.Visible = $false
  if ($mutex) {
    $mutex.ReleaseMutex()
    $mutex.Dispose()
  }
  [System.Windows.Forms.Application]::Exit()
})

if (-not $Silent) {
  $startMessage = "Download organizer is running.`r`n`r`nIt will watch new files in Downloads.`r`nRight-click the tray icon to scan current Downloads or exit."
  [System.Windows.Forms.MessageBox]::Show($startMessage, "Download organizer") | Out-Null
}

Initialize-KnownFiles

$timer = New-Object System.Windows.Forms.Timer
$timer.Interval = 5000
$timer.Add_Tick({ Scan-NewDownloads })
$timer.Start()

try {
  [System.Windows.Forms.Application]::Run()
} finally {
  if ($notify) { $notify.Visible = $false }
  if (-not $ScanOnce -and (Test-Path -LiteralPath $PidFile)) {
    try { Remove-Item -LiteralPath $PidFile -Force } catch {}
  }
  if ($mutex) {
    try { $mutex.ReleaseMutex() } catch {}
    $mutex.Dispose()
  }
}
