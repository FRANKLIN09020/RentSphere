param(
    [string]$SourceMarkdown = "D:\RentalFamily\docs\RentSphere-Final-Project-Report.md",
    [string]$FrontMatter = "D:\RentalFamily\mini project front page (4).docx",
    [string]$OutputPath = "D:\RentalFamily\docs\RentSphere-Mini-Project-Report-Final.docx"
)

$ErrorActionPreference = 'Stop'
$word = $null
$document = $null
$frontDocument = $null
$diagramDirectory = "D:\RentalFamily\docs\report-diagrams"
$script:diagramAssetIndex = 0

function Clean-Text([string]$text) {
    $clean = $text -replace '`([^`]*)`', '$1'
    $clean = $clean -replace '\*\*([^*]+)\*\*', '$1'
    $clean = $clean -replace '\*([^*]+)\*', '$1'
    $clean = $clean -replace '\[([^\]]+)\]\(([^)]+)\)', '$1 ($2)'
    return $clean.Trim()
}

function Add-Paragraph([string]$text, [string]$style = 'Normal') {
    $selection.Style = $style
    $selection.TypeText((Clean-Text $text))
    $selection.TypeParagraph()
}

function Shade-Cell($cell, [int]$color, [bool]$bold = $false) {
    $cell.Shading.BackgroundPatternColor = $color
    $cell.Range.Font.Bold = $bold
    $cell.Range.Font.Name = 'Times New Roman'
    $cell.Range.Font.Size = 9
    $cell.VerticalAlignment = 1
}

function Escape-Xml([string]$value) {
    return [System.Security.SecurityElement]::Escape($value)
}

function New-SvgText([string]$value, [double]$x, [double]$centerY, [int]$maxChars, [int]$fontSize, [string]$color) {
    $words = $value.Split(' ', [System.StringSplitOptions]::RemoveEmptyEntries)
    $lines = New-Object System.Collections.Generic.List[string]
    $current = ''
    foreach ($word in $words) {
        $candidate = if ($current) { "$current $word" } else { $word }
        if ($candidate.Length -gt $maxChars -and $current) {
            $lines.Add($current)
            $current = $word
        } else {
            $current = $candidate
        }
    }
    if ($current) { $lines.Add($current) }
    if ($lines.Count -gt 3) {
        $tail = ($lines.GetRange(2, $lines.Count - 2) -join ' ')
        while ($lines.Count -gt 2) { $lines.RemoveAt(2) }
        $lines.Add($tail)
    }
    $lineHeight = $fontSize + 5
    $firstY = $centerY - (($lines.Count - 1) * $lineHeight / 2)
    $spans = New-Object System.Collections.Generic.List[string]
    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = Escape-Xml $lines[$i]
        $y = $firstY + $i * $lineHeight
        $spans.Add("<tspan x='$x' y='$y'>$line</tspan>")
    }
    return "<text x='$x' y='$centerY' text-anchor='middle' font-family='Arial, sans-serif' font-size='$fontSize' font-weight='700' fill='$color'>" + ($spans -join '') + '</text>'
}

function Insert-DiagramSvg([string]$svg, [string]$caption) {
    if (-not (Test-Path -LiteralPath $diagramDirectory)) {
        New-Item -ItemType Directory -Path $diagramDirectory -Force | Out-Null
    }
    $script:diagramAssetIndex++
    $svgPath = Join-Path $diagramDirectory ("diagram-{0:D2}.svg" -f $script:diagramAssetIndex)
    [System.IO.File]::WriteAllText($svgPath, $svg, (New-Object System.Text.UTF8Encoding($false)))
    $selection.ParagraphFormat.Alignment = 1
    $picture = $selection.InlineShapes.AddPicture($svgPath, $false, $true, $selection.Range)
    $picture.LockAspectRatio = -1
    if ($picture.Width -gt 485) { $picture.Width = 485 }
    $selection.SetRange($picture.Range.End, $picture.Range.End)
    $selection.TypeParagraph()
    $selection.Style = 'Caption'
    $selection.Font.Name = 'Times New Roman'
    $selection.Font.Size = 10
    $selection.Font.Italic = $true
    $selection.TypeText($caption)
    $selection.TypeParagraph()
    $selection.Style = 'Normal'
    $selection.ParagraphFormat.Alignment = 3
}

function Add-MarkdownTable([System.Collections.Generic.List[string]]$lines) {
    if ($lines.Count -lt 2) { return }
    $parsed = @()
    foreach ($line in $lines) {
        $cells = $line.Trim().Trim('|').Split('|') | ForEach-Object { (Clean-Text $_).Trim() }
        if (($cells -join '') -match '^[-: ]+$') { continue }
        $parsed += ,$cells
    }
    if ($parsed.Count -eq 0) { return }
    $columns = ($parsed | ForEach-Object { $_.Count } | Measure-Object -Maximum).Maximum
    $range = $selection.Range
    $table = $document.Tables.Add($range, $parsed.Count, $columns)
    $table.Borders.Enable = 1
    $table.AllowAutoFit = $true
    $table.AutoFitBehavior(1)
    for ($r = 1; $r -le $parsed.Count; $r++) {
        for ($c = 1; $c -le $columns; $c++) {
            $value = if ($c -le $parsed[$r - 1].Count) { $parsed[$r - 1][$c - 1] } else { '' }
            $table.Cell($r, $c).Range.Text = $value
            Shade-Cell $table.Cell($r, $c) $(if ($r -eq 1) { 12611584 } elseif ($r % 2 -eq 0) { 15921906 } else { 16777215 }) ($r -eq 1)
            if ($r -eq 1) { $table.Cell($r, $c).Range.Font.Color = 16777215 }
        }
    }
    $selection.SetRange($table.Range.End, $table.Range.End)
    $selection.TypeParagraph()
}

function Add-FlowDiagram([string[]]$steps, [string]$caption) {
    $width = 1200
    $height = 300
    $margin = 28
    $gap = 42
    $boxWidth = [Math]::Floor(($width - 2 * $margin - ($steps.Count - 1) * $gap) / $steps.Count)
    $boxHeight = 112
    $y = 86
    $elements = New-Object System.Collections.Generic.List[string]
    $elements.Add('<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#1d4ed8"/></marker><filter id="shadow"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-opacity="0.16"/></filter></defs>')
    $elements.Add('<rect width="1200" height="300" rx="22" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2"/>')
    for ($i = 0; $i -lt $steps.Count; $i++) {
        $x = $margin + $i * ($boxWidth + $gap)
        if ($i -lt $steps.Count - 1) {
            $x1 = $x + $boxWidth
            $x2 = $x1 + $gap - 7
            $lineY = $y + $boxHeight / 2
            $elements.Add("<line x1='$x1' y1='$lineY' x2='$x2' y2='$lineY' stroke='#1d4ed8' stroke-width='5' marker-end='url(#arrow)'/>")
        }
        $fill = if ($i -eq 0) { '#dbeafe' } elseif ($i -eq $steps.Count - 1) { '#dcfce7' } else { '#ffffff' }
        $stroke = if ($i -eq $steps.Count - 1) { '#16a34a' } else { '#2563eb' }
        $elements.Add("<rect x='$x' y='$y' width='$boxWidth' height='$boxHeight' rx='16' fill='$fill' stroke='$stroke' stroke-width='3' filter='url(#shadow)'/>")
        $textX = $x + $boxWidth / 2
        $textY = $y + $boxHeight / 2 + 5
        $maxChars = [Math]::Max(10, [Math]::Floor($boxWidth / 10))
        $elements.Add((New-SvgText $steps[$i] $textX $textY $maxChars 18 '#0f172a'))
    }
    $svg = "<svg xmlns='http://www.w3.org/2000/svg' width='$width' height='$height' viewBox='0 0 $width $height'>" + ($elements -join '') + '</svg>'
    Insert-DiagramSvg $svg $caption
}

function Add-MatrixDiagram([string[][]]$rows, [string]$caption) {
    $width = 1200
    $columns = ($rows | ForEach-Object { $_.Count } | Measure-Object -Maximum).Maximum
    $margin = 32
    $gapX = 54
    $gapY = 20
    $boxWidth = [Math]::Floor(($width - 2 * $margin - ($columns - 1) * $gapX) / $columns)
    $boxHeight = 74
    $height = 70 + $rows.Count * ($boxHeight + $gapY)
    $elements = New-Object System.Collections.Generic.List[string]
    $elements.Add('<defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#64748b"/></marker><filter id="shadow"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.13"/></filter></defs>')
    $elements.Add("<rect width='$width' height='$height' rx='22' fill='#f8fafc' stroke='#cbd5e1' stroke-width='2'/>")
    for ($r = 0; $r -lt $rows.Count; $r++) {
        $y = 30 + $r * ($boxHeight + $gapY)
        for ($c = 0; $c -lt $columns; $c++) {
            $x = $margin + $c * ($boxWidth + $gapX)
            $value = if ($c -lt $rows[$r].Count) { $rows[$r][$c] } else { '' }
            $isHeader = $r -eq 0
            $fill = if ($isHeader) { '#16324f' } elseif ($c -eq 1) { '#dbeafe' } else { '#ffffff' }
            $stroke = if ($isHeader) { '#16324f' } elseif ($c -eq 1) { '#2563eb' } else { '#94a3b8' }
            $textColor = if ($isHeader) { '#ffffff' } else { '#0f172a' }
            $elements.Add("<rect x='$x' y='$y' width='$boxWidth' height='$boxHeight' rx='13' fill='$fill' stroke='$stroke' stroke-width='2.5' filter='url(#shadow)'/>")
            $textX = $x + $boxWidth / 2
            $textY = $y + $boxHeight / 2 + 4
            $maxChars = [Math]::Max(16, [Math]::Floor($boxWidth / 9))
            $elements.Add((New-SvgText $value $textX $textY $maxChars 16 $textColor))
            if (-not $isHeader -and $c -lt $columns - 1) {
                $x1 = $x + $boxWidth
                $x2 = $x1 + $gapX - 7
                $lineY = $y + $boxHeight / 2
                $elements.Add("<line x1='$x1' y1='$lineY' x2='$x2' y2='$lineY' stroke='#64748b' stroke-width='3.5' marker-end='url(#arrow)'/>")
            }
        }
    }
    $svg = "<svg xmlns='http://www.w3.org/2000/svg' width='$width' height='$height' viewBox='0 0 $width $height'>" + ($elements -join '') + '</svg>'
    Insert-DiagramSvg $svg $caption
}

function Add-TechnicalDiagram([int]$index) {
    switch ($index) {
        1 { Add-MatrixDiagram @(
                @('Administrator', 'RentSphere Platform', 'PostgreSQL / Supabase'),
                @('Portfolio data and decisions ', 'Authentication  Workflows  Reports', ' Persistent records'),
                @('Owner  properties, units, invoices', 'Notifications and role-based dashboards', 'Razorpay  verified payments'),
                @('Tenant  booking, payment, complaint', 'Personal status and downloadable records', 'AI Provider  contextual advice')
            ) 'Figure 3.1  Level 0 Context Diagram' }
        2 { Add-MatrixDiagram @(
                @('User Input', 'Major Process', 'Primary Data Store'),
                @('Credentials and profile', '1. Authentication and Profile', 'Users  Tenants'),
                @('Portfolio records', '2. Portfolio Management', 'Properties  Buildings  Units'),
                @('Apartment booking', '3. Booking and Approval', 'Approval Requests'),
                @('Rent payment', '4. Invoicing and Payment', 'Invoices  Payments'),
                @('Service or legal issue', '5. Complaints and Disputes', 'Complaints  Disputes'),
                @('Events and questions', '6. Notifications and Assistant', 'Notifications  AI context')
            ) 'Figure 3.2  Level 1 Data Flow Diagram' }
        3 { Add-FlowDiagram @('Select invoice', 'Validate ownership', 'Create Razorpay order', 'Verify signature', 'Mark invoice PAID', 'Notify tenant') 'Figure 3.3  Level 2 Payment Data Flow' }
        4 { Add-MatrixDiagram @(
                @('Parent Entity', 'Relationship', 'Child Entity'),
                @('Organization', '1 : many', 'Users  Properties  Notifications'),
                @('Property', '1 : many', 'Buildings'),
                @('Building', '1 : many', 'Units'),
                @('User', '1 : 0..1', 'Tenant profile'),
                @('Tenant + Unit', '1 : many', 'Agreements'),
                @('Agreement', '1 : many', 'Invoices  Disputes  Rent Increases'),
                @('Invoice', '1 : many', 'Payment attempts'),
                @('Tenant + Unit', '1 : many', 'Complaints')
            ) 'Figure 3.4  Entity Relationship Diagram' }
        5 { Add-MatrixDiagram @(
                @('Presentation Layer', 'Application Layer', 'Data / External Services'),
                @('React + TypeScript', 'Spring REST Controllers', 'PostgreSQL / Supabase'),
                @('Material UI + Router', 'Services + DTO Mapping', 'Razorpay Checkout'),
                @('JWT client + SSE', 'Spring Security + JPA', 'Email + AI Provider'),
                @('Role-aware pages', 'Repositories + Transactions', 'Persistent Notifications')
            ) 'Figure 4.1  Layered System Architecture' }
        6 { Add-MatrixDiagram @(
                @('Domain Class', 'Key Links', 'Responsibilities'),
                @('Organization', 'User, Property', 'Portfolio boundary'),
                @('Property / Building / Unit', 'Hierarchical composition', 'Rental inventory'),
                @('Tenant / Agreement', 'User and Unit', 'Identity, KYC and occupancy'),
                @('Invoice / Payment', 'Agreement and Tenant', 'Billing and verified collection'),
                @('Complaint', 'Tenant and Unit', 'Maintenance lifecycle'),
                @('DepositDispute', 'Tenant and Agreement', 'Deduction and refund settlement'),
                @('RentIncrease', 'Tenant and Agreement', 'Notice and response')
            ) 'Figure 4.2  Domain Class Diagram' }
        7 { Add-FlowDiagram @('Controller', 'DTO Mapper', 'Domain Service', 'Repository', 'Database') 'Figure 4.3  Backend Layer Class Collaboration' }
        8 { Add-FlowDiagram @('Tenant books unit', 'Approval created', 'Owner approves', 'Tenant linked to organization', 'KYC verified', 'Agreement activated', 'Invoice created') 'Figure 4.4  Booking-to-Tenancy Sequence' }
        9 { Add-FlowDiagram @('Tenant selects invoice', 'Backend validates', 'Razorpay checkout', 'Signature verified', 'Payment SUCCESS', 'Invoice PAID', 'Receipt available') 'Figure 4.5  Payment Sequence' }
        10 { Add-FlowDiagram @('Tenant reports issue', 'Organization staff alerted', 'AI priority assigned', 'Owner updates status', 'Tenant notified', 'Issue resolved') 'Figure 4.6  Complaint and Maintenance Sequence' }
        11 { Add-FlowDiagram @('Owner proposes settlement', 'Tenant reviews AI advice', 'Owner refunds tenant', 'Method + UTR recorded', 'Status SETTLED', 'Tenant downloads statement') 'Figure 4.7  Deposit Dispute Settlement Sequence' }
        12 { Add-MatrixDiagram @(
                @('Actor', 'Primary Use Cases', 'Access Boundary'),
                @('Administrator', 'Organizations, users, portfolio, finance, approvals', 'Platform-wide administration'),
                @('Owner', 'Properties, tenants, agreements, invoices, complaints', 'Own organization only'),
                @('Tenant', 'Book apartment, KYC, pay rent, complaint, view disputes', 'Own personal records only'),
                @('Razorpay', 'Checkout and payment verification', 'Signed payment exchange'),
                @('AI Provider', 'Complaint triage and settlement advice', 'Server-filtered context')
            ) 'Figure 4.8  Use Case Diagram' }
    }
}

try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0

    $frontDocument = $word.Documents.Open($FrontMatter, $false, $true)
    if (Test-Path -LiteralPath $OutputPath) { Remove-Item -LiteralPath $OutputPath -Force }
    $frontDocument.SaveAs2($OutputPath, 16)
    $frontDocument.Close($false)
    $frontDocument = $null

    $document = $word.Documents.Open($OutputPath)
    foreach ($pair in @(
        @('Smart Inventory Control and Billing System', 'RentSphere - Smart Property and Rental Management System'),
        @('Smart Inventory Control and Billing system', 'RentSphere - Smart Property and Rental Management System')
    )) {
        $find = $document.Content.Find
        $find.ClearFormatting()
        $find.Replacement.ClearFormatting()
        $find.Execute($pair[0], $false, $false, $false, $false, $false, $true, 1, $false, $pair[1], 2) | Out-Null
    }

    $selection = $word.Selection
    $selection.EndKey(6) | Out-Null
    $selection.InsertBreak(7)

    $normal = $document.Styles.Item('Normal')
    $normal.Font.Name = 'Times New Roman'
    $normal.Font.Size = 12
    $normal.ParagraphFormat.Alignment = 3
    $normal.ParagraphFormat.LineSpacingRule = 1
    $normal.ParagraphFormat.SpaceAfter = 6
    foreach ($styleName in @('Title', 'Heading 1', 'Heading 2', 'Heading 3')) {
        $document.Styles.Item($styleName).Font.Name = 'Times New Roman'
        $document.Styles.Item($styleName).Font.Color = 0
        $document.Styles.Item($styleName).Font.Bold = $true
    }

    Add-Paragraph 'TABLE OF CONTENTS' 'Heading 1'
    $document.TablesOfContents.Add($selection.Range, $true, 1, 3) | Out-Null
    $selection.EndKey(6) | Out-Null
    $selection.InsertBreak(7)

    $lines = Get-Content -LiteralPath $SourceMarkdown
    $started = $false
    $inFence = $false
    $fenceType = ''
    $diagramIndex = 0
    $tableLines = New-Object 'System.Collections.Generic.List[string]'

    foreach ($raw in $lines) {
        $line = $raw.TrimEnd()
        if (-not $started) {
            if ($line -eq '# 1. ABSTRACT') { $started = $true } else { continue }
        }

        if ($line -match '^```(.*)$') {
            if (-not $inFence) {
                if ($tableLines.Count) { Add-MarkdownTable $tableLines; $tableLines.Clear() }
                $inFence = $true
                $fenceType = $Matches[1].Trim().ToLowerInvariant()
            } else {
                $inFence = $false
                if ($fenceType -eq 'mermaid') {
                    $diagramIndex++
                    Add-TechnicalDiagram $diagramIndex
                }
                $fenceType = ''
            }
            continue
        }
        if ($inFence) { continue }

        if ($line.StartsWith('|')) { $tableLines.Add($line); continue }
        if ($tableLines.Count) { Add-MarkdownTable $tableLines; $tableLines.Clear() }
        if ([string]::IsNullOrWhiteSpace($line) -or $line -eq '---') { continue }

        if ($line -eq '# 5. IMPLEMENTATION') {
            $selection.InsertBreak(7)
            Add-Paragraph '5. SYSTEM IMPLEMENTATION OVERVIEW' 'Heading 1'
            Add-Paragraph 'This chapter describes the implemented modules and workflows. Source-code listings are intentionally omitted in accordance with the prescribed mini-project report format.'
            continue
        }
        if ($line -match '^# ([^#].*)$') {
            $selection.InsertBreak(7)
            Add-Paragraph $Matches[1] 'Heading 1'
            continue
        }
        if ($line -match '^## (.*)$') { Add-Paragraph $Matches[1] 'Heading 2'; continue }
        if ($line -match '^### (.*)$') { Add-Paragraph $Matches[1] 'Heading 3'; continue }
        if ($line -match '^> (.*)$') { Add-Paragraph $Matches[1] 'Intense Quote'; continue }
        if ($line -match '^[-*] (.*)$') { Add-Paragraph $Matches[1] 'List Bullet'; continue }
        if ($line -match '^\d+\. (.*)$') { Add-Paragraph $Matches[1] 'List Number'; continue }

        $updated = $line
        $updated = $updated -replace 'The current backend suite contains 19 passing tests', 'The verified backend suite contains 24 passing tests'
        $updated = $updated -replace 'Tenants create complaints with title, description and unit context\.', 'Tenants create complaints using only a title and description; the backend securely assigns their organization, tenant identity, unit and OPEN status.'
        $updated = $updated -replace 'Tenant list and detail access are ownership-checked\.', 'Tenant access is read-only and ownership-checked. Owners record refund amount, method, transaction reference and settlement date; tenants receive notifications, AI settlement advice and a downloadable statement.'
        if ($updated -match '^Insert current screenshots') {
            Add-Paragraph 'The following screen list defines the evidence captured during system demonstration. Screenshots should use non-sensitive demonstration data.'
        } else {
            Add-Paragraph $updated
        }
    }
    if ($tableLines.Count) { Add-MarkdownTable $tableLines }

    foreach ($section in $document.Sections) {
        $footer = $section.Footers.Item(1)
        $footer.Range.ParagraphFormat.Alignment = 1
        if ($footer.PageNumbers.Count -eq 0) { $footer.PageNumbers.Add() | Out-Null }
    }
    foreach ($toc in $document.TablesOfContents) { $toc.Update() }
    $document.Fields.Update() | Out-Null
    $document.Save()
    $pages = $document.ComputeStatistics(2)
    $document.Close($false)
    $document = $null
    $word.Quit()
    $word = $null
    Write-Output "Created: $OutputPath"
    Write-Output "Pages: $pages"
    Write-Output "Diagrams: $diagramIndex"
} finally {
    if ($frontDocument) { try { $frontDocument.Close($false) } catch {} }
    if ($document) { try { $document.Close($false) } catch {} }
    if ($word) { try { $word.Quit() } catch {} }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
