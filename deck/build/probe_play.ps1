$ErrorActionPreference = "Stop"
$deck = "F:\SIH\deck\disha-intercollege.pptx"

$app = New-Object -ComObject PowerPoint.Application
$app.Visible = -1
$pres = $app.Presentations.Open($deck, $false, $false, $true)

$vid = @{}
foreach ($i in 2..5) {
  foreach ($sh in $pres.Slides.Item($i).Shapes) {
    if ($sh.Name -like "VIDEO-*") { $vid[$i] = @($sh.Id, $sh.Name, $sh.MediaFormat.Length) }
  }
}
foreach ($i in 2..5) {
  $e = $pres.Slides.Item($i).TimeLine.MainSequence.Item(1)
  Write-Output ("slide {0} {1,-14} len={2}ms  TriggerType={3} (2 = with previous)" -f $i, $vid[$i][1], $vid[$i][2], $e.Timing.TriggerType)
}

$pres.SlideShowSettings.ShowType = 1
$show = $pres.SlideShowSettings.Run()
Start-Sleep -Milliseconds 2500
$view = $show.View

foreach ($i in 2..5) {
  $view.GotoSlide($i)
  Start-Sleep -Milliseconds 2500
  $p1 = $view.Player($vid[$i][0])
  $s1 = $p1.State; $c1 = $p1.CurrentPosition
  Start-Sleep -Milliseconds 3000
  $p2 = $view.Player($vid[$i][0])
  Write-Output ("slide {0}: t=2.5s state={1} pos={2}ms  ->  t=5.5s state={3} pos={4}ms" -f $i, $s1, $c1, $p2.State, $p2.CurrentPosition)
}

# loop: sit on slide 2 well past the 14.07 s clip
$view.GotoSlide(2)
Start-Sleep -Seconds 16
$pa = $view.Player($vid[2][0])
Write-Output ("slide 2 loop: t=16s state={0} pos={1}ms" -f $pa.State, $pa.CurrentPosition)
Start-Sleep -Seconds 4
$pb = $view.Player($vid[2][0])
Write-Output ("slide 2 loop: t=20s state={0} pos={1}ms" -f $pb.State, $pb.CurrentPosition)

$view.Exit()
$pres.Close()
$app.Quit()
