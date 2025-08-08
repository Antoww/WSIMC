# Script PowerShell pour créer une icône PNG simple
Add-Type -AssemblyName System.Drawing

# Créer une nouvelle bitmap 32x32
$bitmap = New-Object System.Drawing.Bitmap(32, 32)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)

# Remplir avec une couleur de fond bleue
$brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::Blue)
$graphics.FillRectangle($brush, 0, 0, 32, 32)

# Ajouter un texte simple
$font = New-Object System.Drawing.Font("Arial", 8, [System.Drawing.FontStyle]::Bold)
$textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
$graphics.DrawString("W", $font, $textBrush, 10, 8)

# Sauvegarder l'image
$bitmap.Save("icon.png", [System.Drawing.Imaging.ImageFormat]::Png)

# Nettoyer les ressources
$graphics.Dispose()
$bitmap.Dispose()
$brush.Dispose()
$textBrush.Dispose()

Write-Host "Icône créée avec succès: icon.png"
