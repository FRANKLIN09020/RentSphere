param(
    [string]$SourceMarkdown = "D:\RentalFamily\docs\RentSphere-Final-Project-Report.md",
    [string]$FrontMatter = "D:\RentalFamily\mini project front page (4).docx",
    [string]$OutputPath = "D:\RentalFamily\docs\RentSphere-Mini-Project-Report-Final.docx"
)

$ErrorActionPreference = 'Stop'
$word = $null
$document = $null
$frontDocument = $null

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
    $selection.ParagraphFormat.Alignment = 1
    $selection.Font.Bold = $true
    $selection.Font.Size = 10
    $selection.TypeText($caption)
    $selection.TypeParagraph()
    $columns = $steps.Count * 2 - 1
    $table = $document.Tables.Add($selection.Range, 1, $columns)
    $table.Borders.Enable = 0
    $table.AllowAutoFit = $true
    for ($i = 0; $i -lt $steps.Count; $i++) {
        $cellIndex = $i * 2 + 1
        $cell = $table.Cell(1, $cellIndex)
        $cell.Range.Text = $steps[$i]
        Shade-Cell $cell 15198183 $true
        $cell.Range.ParagraphFormat.Alignment = 1
        if ($i -lt $steps.Count - 1) {
            $arrow = $table.Cell(1, $cellIndex + 1)
            $arrow.Range.Text = '->'
            $arrow.Range.Font.Size = 15
            $arrow.Range.Font.Bold = $true
            $arrow.Range.Font.Color = 12611584
            $arrow.Range.ParagraphFormat.Alignment = 1
            $arrow.VerticalAlignment = 1
        }
    }
    $selection.SetRange($table.Range.End, $table.Range.End)
    $selection.TypeParagraph()
    $selection.ParagraphFormat.Alignment = 3
}

function Add-MatrixDiagram([string[][]]$rows, [string]$caption) {
    $selection.ParagraphFormat.Alignment = 1
    $selection.Font.Bold = $true
    $selection.Font.Size = 10
    $selection.TypeText($caption)
    $selection.TypeParagraph()
    $columns = ($rows | ForEach-Object { $_.Count } | Measure-Object -Maximum).Maximum
    $table = $document.Tables.Add($selection.Range, $rows.Count, $columns)
    $table.Borders.Enable = 1
    $table.AllowAutoFit = $true
    for ($r = 0; $r -lt $rows.Count; $r++) {
        for ($c = 0; $c -lt $columns; $c++) {
            $value = if ($c -lt $rows[$r].Count) { $rows[$r][$c] } else { '' }
            $cell = $table.Cell($r + 1, $c + 1)
            $cell.Range.Text = $value
            $isHeader = $r -eq 0
            Shade-Cell $cell $(if ($isHeader) { 12611584 } elseif (($r + $c) % 2 -eq 0) { 15921906 } else { 16777215 }) $isHeader
            $cell.Range.ParagraphFormat.Alignment = 1
            if ($isHeader) { $cell.Range.Font.Color = 16777215 }
        }
    }
    $selection.SetRange($table.Range.End, $table.Range.End)
    $selection.TypeParagraph()
    $selection.ParagraphFormat.Alignment = 3
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
