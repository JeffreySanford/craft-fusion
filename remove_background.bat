@echo off
setlocal

if "%~1"=="" (
  echo Usage: remove_background.bat image.png
  exit /b 1
)

set "input_file=%~1"
set "output_file=%~dpn1_transparent%~x1"

echo Processing %input_file%...

powershell -Command ^
  "$img = [System.Drawing.Image]::FromFile('%input_file%'); ^
   $bitmap = New-Object System.Drawing.Bitmap($img.Width, $img.Height); ^
   $g = [System.Drawing.Graphics]::FromImage($bitmap); ^
   $g.Clear([System.Drawing.Color]::Transparent); ^
   $g.DrawImage($img, 0, 0, $img.Width, $img.Height); ^
   $g.Dispose(); ^
   $threshold = 230; ^
   for ($x = 0; $x -lt $bitmap.Width; $x++) { ^
     for ($y = 0; $y -lt $bitmap.Height; $y++) { ^
       $pixel = $bitmap.GetPixel($x, $y); ^
       if ($pixel.R -gt $threshold -and $pixel.G -gt $threshold -and $pixel.B -gt $threshold) { ^
         $bitmap.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255)); ^
       } ^
     } ^
   } ^
   $bitmap.Save('%output_file%', [System.Drawing.Imaging.ImageFormat]::Png); ^
   $bitmap.Dispose(); ^
   $img.Dispose(); ^
   Write-Host 'Image saved as %output_file%'"

echo Done!
endlocal
