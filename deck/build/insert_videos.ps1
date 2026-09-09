$ErrorActionPreference = "Stop"

$deck   = "F:\SIH\deck\disha-intercollege.pptx"
$clips  = "F:\SIH\media\clips"
$poster = "F:\SIH\media\posters"
$pdf    = "F:\SIH\deck\disha-intercollege.pdf"

$app = New-Object -ComObject PowerPoint.Application
$pres = $app.Presentations.Open($deck, $false, $false, $false)

$done = @()
foreach ($i in 1..$pres.Slides.Count) {
  $slide = $pres.Slides.Item($i)
  # collect first: replacing a shape mutates the collection we are walking
  $slots = @()
  foreach ($sh in $slide.Shapes) {
    if ($sh.Name -like "VIDEOSLOT::*") {
      $slots += [pscustomobject]@{
        Clip = $sh.Name.Substring(11)
        L = $sh.Left; T = $sh.Top; W = $sh.Width; H = $sh.Height
        Shape = $sh
      }
    }
  }
  foreach ($s in $slots) {
    $mp4 = Join-Path $clips ($s.Clip + ".mp4")
    $png = Join-Path $poster ($s.Clip + ".png")
    if (-not (Test-Path $mp4)) { throw "missing clip $mp4" }
    if (-not (Test-Path $png)) { throw "missing poster $png" }
    $s.Shape.Delete()

    $v = $slide.Shapes.AddMediaObject2($mp4, 0, -1, $s.L, $s.T, $s.W, $s.H)
    $v.Name = "VIDEO-" + $s.Clip

    $ps = $v.AnimationSettings.PlaySettings
    $ps.PlayOnEntry = -1          # msoTrue
    $ps.LoopUntilStopped = -1
    $ps.HideWhileNotPlaying = 0   # msoFalse - the frame stays on screen

    # PlayOnEntry alone leaves the play effect as nodeType="clickEffect" inside a
    # click group, so the clip would sit still until the presenter pressed space.
    # Moving the trigger to WithPrevious is what actually means "on slide entry".
    $seq = $slide.TimeLine.MainSequence
    $fixed = 0
    for ($e = 1; $e -le $seq.Count; $e++) {
      $eff = $seq.Item($e)
      if ($eff.Shape.Id -eq $v.Id) {
        $eff.Timing.TriggerType = 2   # msoAnimTriggerWithPrevious
        $fixed++
      }
    }

    # the still the PDF and the un-played slide will show
    $v.MediaFormat.SetDisplayPictureFromFile($png)

    $done += ("slide {0}  {1,-14} play={2} loop={3} hide={4} triggersFixed={5}" -f `
      $i, $s.Clip, $ps.PlayOnEntry, $ps.LoopUntilStopped, $ps.HideWhileNotPlaying, $fixed)
  }
}

$pres.Save()
if (Test-Path $pdf) { Remove-Item $pdf -Force }
$pres.SaveCopyAs($pdf, 32)
$pres.Close()
$app.Quit()

$done | ForEach-Object { Write-Output $_ }
Write-Output "PDF:  $((Get-Item $pdf).Length) bytes"
Write-Output "PPTX: $((Get-Item $deck).Length) bytes"
