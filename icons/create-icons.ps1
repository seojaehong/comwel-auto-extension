Add-Type -AssemblyName System.Drawing

function Create-Icon {
    param(
        [int]$size,
        [string]$outputPath
    )

    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = 'AntiAlias'
    $graphics.TextRenderingHint = 'AntiAlias'

    # Background color #1a5f7a
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(26, 95, 122))

    # Draw rounded rectangle background
    $radius = [int]($size * 0.15)
    $gfxPath = New-Object System.Drawing.Drawing2D.GraphicsPath
    $rect = New-Object System.Drawing.Rectangle(0, 0, $size, $size)

    $gfxPath.AddArc($rect.X, $rect.Y, $radius * 2, $radius * 2, 180, 90)
    $gfxPath.AddArc($rect.Right - $radius * 2, $rect.Y, $radius * 2, $radius * 2, 270, 90)
    $gfxPath.AddArc($rect.Right - $radius * 2, $rect.Bottom - $radius * 2, $radius * 2, $radius * 2, 0, 90)
    $gfxPath.AddArc($rect.X, $rect.Bottom - $radius * 2, $radius * 2, $radius * 2, 90, 90)
    $gfxPath.CloseFigure()
    $graphics.FillPath($bgBrush, $gfxPath)

    # Draw text 'C'
    $fontSize = [int]($size * 0.55)
    $font = New-Object System.Drawing.Font('Arial', $fontSize, [System.Drawing.FontStyle]::Bold)
    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = 'Center'
    $format.LineAlignment = 'Center'
    $textRect = New-Object System.Drawing.RectangleF(0, 0, $size, $size)
    $graphics.DrawString('C', $font, $textBrush, $textRect, $format)

    # Save
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $graphics.Dispose()
    $bitmap.Dispose()
    $font.Dispose()
    $bgBrush.Dispose()
    $textBrush.Dispose()

    Write-Host "Created: $outputPath"
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Create-Icon -size 16 -outputPath "$scriptDir\icon16.png"
Create-Icon -size 48 -outputPath "$scriptDir\icon48.png"
Create-Icon -size 128 -outputPath "$scriptDir\icon128.png"

Write-Host "All icons created successfully!"
