$ErrorActionPreference = 'Stop'

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $workspaceRoot 'source-assets\svg'
$runtimeRoot = Join-Path $workspaceRoot 'public\assets'
$allowedColors = @(
  '#17213A', '#F7F1E3', '#FFF4D6', '#F6A23C',
  '#FF6B6B', '#59D8D0', '#FFCA5C', '#E8B45A'
)
$errors = [System.Collections.Generic.List[string]]::new()
$expectedViewBoxes = @{
  'furniture\desk.svg' = '0 0 640 384'
  'furniture\chair.svg' = '0 0 320 384'
  'furniture\shelf.svg' = '0 0 384 512'
  'props\bottle.svg' = '0 0 192 256'
  'props\cat-food.svg' = '0 0 256 256'
  'props\toy-mouse.svg' = '0 0 256 256'
  'props\non-slip-mat.svg' = '0 0 384 192'
  'props\water-puddle.svg' = '0 0 384 192'
}

$sourceFiles = Get-ChildItem -LiteralPath $sourceRoot -Filter '*.svg' -Recurse | Sort-Object FullName
if ($sourceFiles.Count -ne 17) {
  $errors.Add("Expected 17 source SVGs, found $($sourceFiles.Count).")
}

foreach ($file in $sourceFiles) {
  # Windows PowerShell 5.1의 .NET Framework에는 Path.GetRelativePath가 없다.
  $relativePath = $file.FullName.Substring($sourceRoot.Length).TrimStart('\')
  $raw = Get-Content -Raw -LiteralPath $file.FullName
  try { [xml]$xml = $raw } catch { $errors.Add("$relativePath is not valid XML: $($_.Exception.Message)"); continue }

  $root = $xml.SelectSingleNode("/*[local-name()='svg']")
  if ($null -eq $root) { $errors.Add("$relativePath has no SVG root."); continue }
  if ($null -eq $xml.SelectSingleNode("/*[local-name()='svg']/*[local-name()='title']")) { $errors.Add("$relativePath has no title.") }
  if ($null -eq $xml.SelectSingleNode("/*[local-name()='svg']/*[local-name()='desc']")) { $errors.Add("$relativePath has no desc.") }
  if ($null -ne $xml.SelectSingleNode("//*[local-name()='image' or local-name()='text' or local-name()='filter' or local-name()='mask' or local-name()='clipPath' or local-name()='foreignObject' or local-name()='style']")) {
    $errors.Add("$relativePath contains a forbidden SVG element.")
  }
  if ($raw -match '\s(?:href|xlink:href)\s*=|url\s*\(') { $errors.Add("$relativePath contains an external/resource reference.") }

  $colors = [regex]::Matches($raw, '#[0-9A-Fa-f]{6}') | ForEach-Object { $_.Value.ToUpperInvariant() } | Sort-Object -Unique
  foreach ($color in $colors) {
    if ($allowedColors -notcontains $color) { $errors.Add("$relativePath uses out-of-palette color $color.") }
  }
  if ($colors -contains '#F7F1E3') { $errors.Add("$relativePath uses preview-only background color.") }

  $fills = [regex]::Matches($raw, 'fill="(#[0-9A-Fa-f]{6})"') | ForEach-Object { $_.Groups[1].Value.ToUpperInvariant() } | Where-Object { $_ -ne '#17213A' } | Sort-Object -Unique
  if ($fills.Count -gt 3) { $errors.Add("$relativePath uses more than three non-outline fill colors.") }

  $expected = $expectedViewBoxes[$relativePath]
  if ($relativePath -like 'characters\cat\*.svg') { $expected = '0 0 320 320' }
  if ($expected -and $root.viewBox -ne $expected) { $errors.Add("$relativePath has viewBox '$($root.viewBox)', expected '$expected'.") }

  $runtimeFile = Join-Path $runtimeRoot $relativePath
  if (-not (Test-Path -LiteralPath $runtimeFile)) {
    $errors.Add("Missing runtime copy: $relativePath")
  } elseif ((Get-FileHash -LiteralPath $file.FullName).Hash -ne (Get-FileHash -LiteralPath $runtimeFile).Hash) {
    $errors.Add("Source/runtime mismatch: $relativePath")
  }
}

$sourceRig = Join-Path $sourceRoot 'characters\cat\cat-rig.json'
$runtimeRig = Join-Path $runtimeRoot 'characters\cat\cat-rig.json'
$rig = Get-Content -Raw -LiteralPath $sourceRig | ConvertFrom-Json
if ($rig.canvas.width -ne 320 -or $rig.canvas.height -ne 320 -or $rig.canvas.baselineY -ne 286) { $errors.Add('cat-rig canvas metadata is invalid.') }
if ($rig.layers.Count -ne 8) { $errors.Add("cat-rig should describe 8 files; found $($rig.layers.Count).") }
if ((Get-FileHash -LiteralPath $sourceRig).Hash -ne (Get-FileHash -LiteralPath $runtimeRig).Hash) { $errors.Add('Source/runtime cat-rig.json mismatch.') }

[xml]$idleFace = Get-Content -Raw -LiteralPath (Join-Path $sourceRoot 'characters\cat\face-idle.svg')
[xml]$curiousFace = Get-Content -Raw -LiteralPath (Join-Path $sourceRoot 'characters\cat\face-curious.svg')
[xml]$happyFace = Get-Content -Raw -LiteralPath (Join-Path $sourceRoot 'characters\cat\face-happy.svg')
$idleNose = $idleFace.SelectSingleNode("//*[@id='nose']").d
if ($curiousFace.SelectSingleNode("//*[@id='nose']").d -ne $idleNose -or $happyFace.SelectSingleNode("//*[@id='nose']").d -ne $idleNose) {
  $errors.Add('Cat face noses are not aligned across expressions.')
}

[xml]$assembled = Get-Content -Raw -LiteralPath (Join-Path $sourceRoot 'characters\cat\assembled-preview.svg')
$partNames = @('back-leg.svg', 'tail.svg', 'body.svg', 'front-leg.svg', 'head.svg', 'face-idle.svg')
$shapeAttributes = @('d', 'cx', 'cy', 'rx', 'ry', 'x', 'y', 'width', 'height', 'fill', 'stroke', 'stroke-width', 'opacity')
foreach ($partName in $partNames) {
  [xml]$part = Get-Content -Raw -LiteralPath (Join-Path $sourceRoot "characters\cat\$partName")
  foreach ($node in $part.SelectNodes('//*[@id]')) {
    $assembledNode = $assembled.SelectSingleNode("//*[@id='$($node.id)']")
    if ($null -eq $assembledNode) { $errors.Add("assembled-preview.svg is missing $partName#$($node.id)."); continue }
    foreach ($attribute in $shapeAttributes) {
      if ($node.GetAttribute($attribute) -ne $assembledNode.GetAttribute($attribute)) {
        $errors.Add("assembled-preview.svg differs from $partName#$($node.id) at $attribute.")
      }
    }
  }
}

if ($errors.Count -gt 0) {
  $errors | ForEach-Object { Write-Error $_ }
  exit 1
}

Write-Output "Validated $($sourceFiles.Count) SVGs, cat rig metadata, part assembly, palette, forbidden elements, and identical runtime copies."
