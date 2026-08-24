param(
    [string]$InputPath = "D:\RentalFamily\docs\RentSphere-Final-Project-Report.md",
    [string]$OutputPath = "D:\RentalFamily\docs\RentSphere-Final-Project-Report.docx"
)

$ErrorActionPreference = 'Stop'
$word = $null
$document = $null

function Clean-InlineMarkdown([string]$text) {
    $text = $text -replace '`([^`]*)`', '$1'
    $text = $text -replace '\*\*([^*]+)\*\*', '$1'
    $text = $text -replace '\*([^*]+)\*', '$1'
    $text = $text -replace '\[([^\]]+)\]\(([^)]+)\)', '$1 ($2)'
    return $text.TrimEnd()
}

function Add-Paragraph([string]$text, [string]$style = 'Normal') {
    $selection.Style = $style
    $selection.TypeText((Clean-InlineMarkdown $text))
    $selection.TypeParagraph()
}

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $document = $word.Documents.Add()
    $selection = $word.Selection

    $section = $document.Sections.Item(1)
    $section.PageSetup.PaperSize = 7 # A4
    $section.PageSetup.TopMargin = $word.CentimetersToPoints(2.54)
    $section.PageSetup.BottomMargin = $word.CentimetersToPoints(2.54)
    $section.PageSetup.LeftMargin = $word.CentimetersToPoints(2.8)
    $section.PageSetup.RightMargin = $word.CentimetersToPoints(2.5)

    $normal = $document.Styles.Item('Normal')
    $normal.Font.Name = 'Times New Roman'
    $normal.Font.Size = 12
    $normal.ParagraphFormat.Alignment = 3 # justified
    $normal.ParagraphFormat.LineSpacingRule = 1
    $normal.ParagraphFormat.SpaceAfter = 6

    foreach ($heading in @('Title','Heading 1','Heading 2','Heading 3')) {
        $document.Styles.Item($heading).Font.Name = 'Times New Roman'
        $document.Styles.Item($heading).Font.Color = 0
    }
    $document.Styles.Item('Title').Font.Size = 22
    $document.Styles.Item('Heading 1').Font.Size = 16
    $document.Styles.Item('Heading 2').Font.Size = 14
    $document.Styles.Item('Heading 3').Font.Size = 12

    # Cover page
    $selection.ParagraphFormat.Alignment = 1
    $selection.Style = 'Title'
    $selection.TypeText('RENTSPHERE')
    $selection.TypeParagraph()
    $selection.Style = 'Subtitle'
    $selection.TypeText('Smart Property and Rental Management System')
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    $selection.TypeText('FINAL PROJECT REPORT')
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    $selection.TypeText('Technology Stack: React, TypeScript, Spring Boot, Java, PostgreSQL/Supabase and Razorpay')
    $selection.TypeParagraph()
    $selection.TypeParagraph()
    $selection.TypeText('Academic Year 2026')
    $selection.InsertBreak(7)

    # Automatic Word table of contents.
    $selection.Style = 'Heading 1'
    $selection.TypeText('TABLE OF CONTENTS')
    $selection.TypeParagraph()
    $document.TablesOfContents.Add($selection.Range, $true, 1, 3) | Out-Null
    $selection.EndKey(6) | Out-Null
    $selection.InsertBreak(7)

    $lines = Get-Content -LiteralPath $InputPath
    $inCode = $false
    $codeLines = New-Object System.Collections.Generic.List[string]
    $skipInitialTitle = $true

    foreach ($raw in $lines) {
        $line = $raw.TrimEnd()
        if ($line -match '^```') {
            if (-not $inCode) {
                $inCode = $true
                $codeLines.Clear()
            } else {
                $inCode = $false
                $selection.Style = 'Normal'
                $selection.Font.Name = 'Consolas'
                $selection.Font.Size = 8
                $selection.ParagraphFormat.Alignment = 0
                $selection.ParagraphFormat.LeftIndent = $word.CentimetersToPoints(0.5)
                $selection.ParagraphFormat.RightIndent = $word.CentimetersToPoints(0.5)
                $selection.Shading.BackgroundPatternColor = 15132390
                $selection.TypeText(($codeLines -join "`r`n"))
                $selection.TypeParagraph()
                $selection.Font.Name = 'Times New Roman'
                $selection.Font.Size = 12
                $selection.ParagraphFormat.LeftIndent = 0
                $selection.ParagraphFormat.RightIndent = 0
                $selection.Shading.BackgroundPatternColor = 16777215
            }
            continue
        }
        if ($inCode) { $codeLines.Add($line); continue }
        if ($skipInitialTitle -and ($line -match '^# ' -or $line -match '^## Smart Property' -or $line -match '^### Final Project')) { continue }
        if ($line -eq '---') { continue }
        if ([string]::IsNullOrWhiteSpace($line)) { continue }

        if ($line -match '^# ([^#].*)$') {
            $selection.InsertBreak(7)
            Add-Paragraph $Matches[1] 'Heading 1'
            continue
        }
        if ($line -match '^## ([^#].*)$') { Add-Paragraph $Matches[1] 'Heading 2'; continue }
        if ($line -match '^### (.*)$') { Add-Paragraph $Matches[1] 'Heading 3'; continue }
        if ($line -match '^> (.*)$') {
            $selection.Style = 'Intense Quote'
            Add-Paragraph $Matches[1] 'Intense Quote'
            continue
        }
        if ($line -match '^[-*] (.*)$') {
            $selection.Style = 'List Bullet'
            Add-Paragraph $Matches[1] 'List Bullet'
            continue
        }
        if ($line -match '^\d+\. (.*)$') {
            $selection.Style = 'List Number'
            Add-Paragraph $Matches[1] 'List Number'
            continue
        }
        if ($line.StartsWith('|')) {
            $selection.Style = 'Normal'
            $selection.Font.Name = 'Consolas'
            $selection.Font.Size = 8
            $selection.ParagraphFormat.Alignment = 0
            $selection.TypeText((Clean-InlineMarkdown $line))
            $selection.TypeParagraph()
            $selection.Font.Name = 'Times New Roman'
            $selection.Font.Size = 12
            continue
        }
        Add-Paragraph $line
    }

    # Footer with centered page numbers.
    foreach ($sec in $document.Sections) {
        $footer = $sec.Footers.Item(1)
        $footer.Range.ParagraphFormat.Alignment = 1
        $footer.PageNumbers.Add() | Out-Null
    }

    foreach ($toc in $document.TablesOfContents) { $toc.Update() }
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -LiteralPath $OutputPath -Force }
    $document.SaveAs2($OutputPath, 16)
    $document.Close($false)
    $word.Quit()
    Write-Output $OutputPath
} finally {
    if ($document) { try { $document.Close($false) } catch {} }
    if ($word) { try { $word.Quit() } catch {} }
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($selection) 2>$null | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($document) 2>$null | Out-Null
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) 2>$null | Out-Null
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
