$path = (Resolve-Path "C:\Users\Redaiah\OneDrive\Documents\Planning to move.pptx").Path
$exportDir = Join-Path (Get-Location).Path "slide_previews"
if (!(Test-Path $exportDir)) { New-Item -ItemType Directory -Path $exportDir | Out-Null }

try {
    $ppt = New-Object -ComObject PowerPoint.Application
    # 0 = msoFalse for WithWindow
    $pres = $ppt.Presentations.Open($path, -1, 0, 0)
    for ($i = 1; $i -le $pres.Slides.Count; $i++) {
        $outFile = Join-Path $exportDir ("slide_" + $i + ".png")
        $pres.Slides.Item($i).Export($outFile, "PNG", 1920, 1080)
    }
    $pres.Close()
    $ppt.Quit()
    Write-Output "Successfully exported all slides to PNG!"
} catch {
    Write-Output ("COM Export error: " + $_.Exception.Message)
}
