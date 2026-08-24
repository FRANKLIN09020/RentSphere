param([string]$OutputDirectory = "D:\RentalFamily\docs\academic-diagrams")

$ErrorActionPreference = 'Stop'
New-Item -ItemType Directory -Path $OutputDirectory -Force | Out-Null

function Escape([string]$value) { [System.Security.SecurityElement]::Escape($value) }
function Write-Svg([string]$name, [string]$body, [int]$width = 1600, [int]$height = 1000) {
    $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="$width" height="$height" viewBox="0 0 $width $height">
<defs>
  <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto"><path d="M0,0 L0,8 L11,4 z" fill="#172554"/></marker>
  <marker id="openArrow" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto"><path d="M0,0 L10,4 L0,8" fill="none" stroke="#172554" stroke-width="1.8"/></marker>
  <filter id="shadow"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.14"/></filter>
  <style>
    .title{font:700 30px 'Arial';fill:#0f172a}.subtitle{font:500 17px 'Arial';fill:#475569}
    .label{font:700 18px 'Arial';fill:#0f172a}.small{font:500 15px 'Arial';fill:#334155}.tiny{font:500 13px 'Arial';fill:#334155}
    .entity{fill:#fff;stroke:#1d4ed8;stroke-width:3}.process{fill:#dbeafe;stroke:#1d4ed8;stroke-width:3}
    .store{fill:#f8fafc;stroke:#7c3aed;stroke-width:3}.relationship{fill:#fef3c7;stroke:#b45309;stroke-width:3}
    .attribute{fill:#fff;stroke:#64748b;stroke-width:2}.flow{stroke:#172554;stroke-width:2.5;fill:none;marker-end:url(#arrow)}
    .association{stroke:#172554;stroke-width:2.2;fill:none}.lifeline{stroke:#64748b;stroke-width:2;stroke-dasharray:9 7}
  </style>
</defs>
<rect width="100%" height="100%" fill="#ffffff"/>
$body
</svg>
"@
    $path = Join-Path $OutputDirectory "$name.svg"
    [IO.File]::WriteAllText($path, $svg, (New-Object Text.UTF8Encoding($false)))
}

function Title([string]$title, [string]$subtitle) {
    "<text x='800' y='48' text-anchor='middle' class='title'>$(Escape $title)</text><text x='800' y='76' text-anchor='middle' class='subtitle'>$(Escape $subtitle)</text>"
}
function Rect([int]$x,[int]$y,[int]$w,[int]$h,[string]$text,[string]$class='entity') {
    "<rect x='$x' y='$y' width='$w' height='$h' rx='8' class='$class' filter='url(#shadow)'/><text x='$($x+$w/2)' y='$($y+$h/2+6)' text-anchor='middle' class='label'>$(Escape $text)</text>"
}
function Circle([int]$cx,[int]$cy,[int]$r,[string]$number,[string]$text) {
    "<circle cx='$cx' cy='$cy' r='$r' class='process' filter='url(#shadow)'/><text x='$cx' y='$($cy-10)' text-anchor='middle' class='label'>$(Escape $number)</text><text x='$cx' y='$($cy+18)' text-anchor='middle' class='small'>$(Escape $text)</text>"
}
function Store([int]$x,[int]$y,[int]$w,[int]$h,[string]$id,[string]$text) {
    "<path d='M$x,$y H$($x+$w) M$x,$($y+$h) H$($x+$w) M$x,$y V$($y+$h)' class='association'/><text x='$($x+18)' y='$($y+25)' class='label'>$(Escape $id)</text><text x='$($x+18)' y='$($y+52)' class='small'>$(Escape $text)</text>"
}
function Diamond([int]$cx,[int]$cy,[int]$w,[int]$h,[string]$text) {
    $points="$cx,$($cy-$h/2) $($cx+$w/2),$cy $cx,$($cy+$h/2) $($cx-$w/2),$cy"
    "<polygon points='$points' class='relationship' filter='url(#shadow)'/><text x='$cx' y='$($cy+6)' text-anchor='middle' class='small'>$(Escape $text)</text>"
}
function Oval([int]$cx,[int]$cy,[int]$rx,[int]$ry,[string]$text,[bool]$key=$false) {
    $decoration = if($key){'text-decoration="underline"'}else{''}
    "<ellipse cx='$cx' cy='$cy' rx='$rx' ry='$ry' class='attribute'/><text x='$cx' y='$($cy+5)' text-anchor='middle' class='tiny' $decoration>$(Escape $text)</text>"
}
function Flow([int]$x1,[int]$y1,[int]$x2,[int]$y2,[string]$label='') {
    $mx=($x1+$x2)/2;$my=($y1+$y2)/2-8
    "<line x1='$x1' y1='$y1' x2='$x2' y2='$y2' class='flow'/><text x='$mx' y='$my' text-anchor='middle' class='tiny'>$(Escape $label)</text>"
}

function New-ChenAttributeSheet([string]$file, [string]$title, $entities) {
    $width = 2400
    $panelTop = 105
    $panelGap = 28
    $panelHeights = @()
    foreach ($entry in $entities.GetEnumerator()) {
        $rows = [Math]::Ceiling($entry.Value.Count / 5.0)
        $panelHeights += 130 + $rows * 105
    }
    $height = $panelTop + (($panelHeights | Measure-Object -Sum).Sum) + ($entities.Count - 1) * $panelGap + 55
    $body = Title $title 'Chen attribute notation: underlined ovals are primary keys; [FK] identifies foreign keys'
    $y = $panelTop
    $entityIndex = 0
    foreach ($entry in $entities.GetEnumerator()) {
        $attributes = $entry.Value
        $panelHeight = $panelHeights[$entityIndex]
        $body += "<rect x='45' y='$y' width='2310' height='$panelHeight' rx='18' fill='#f8fafc' stroke='#cbd5e1' stroke-width='2'/>"
        $entityX = 1030
        $entityY = $y + 25
        $body += Rect $entityX $entityY 340 68 $entry.Key
        for ($i = 0; $i -lt $attributes.Count; $i++) {
            $column = $i % 5
            $row = [Math]::Floor($i / 5)
            $cx = 250 + $column * 475
            $cy = $y + 155 + $row * 105
            $raw = [string]$attributes[$i]
            $isKey = $raw.StartsWith('id [PK]')
            $rx = [Math]::Min(210, [Math]::Max(120, 72 + $raw.Length * 5))
            $body += "<line x1='1200' y1='$($entityY+68)' x2='$cx' y2='$($cy-35)' stroke='#64748b' stroke-width='1.8'/>"
            $body += Oval $cx $cy $rx 35 $raw $isKey
        }
        $y += $panelHeight + $panelGap
        $entityIndex++
    }
    Write-Svg $file $body $width $height
}

# 01 - DFD Level 0
$b = Title 'DATA FLOW DIAGRAM - LEVEL 0' 'RentSphere context diagram'
$b += Rect 55 190 250 90 'Administrator'
$b += Rect 55 455 250 90 'Property Owner'
$b += Rect 55 720 250 90 'Tenant'
$b += Circle 800 500 165 '0' 'RentSphere System'
$b += Rect 1295 165 250 90 'Razorpay'
$b += Rect 1295 365 250 90 'AI Provider'
$b += Rect 1295 565 250 90 'Email Service'
$b += Store 1295 760 250 75 'D1' 'Rental Database'
$b += Flow 305 235 640 420 'users, portfolio data'
$b += Flow 305 500 635 500 'property operations'
$b += Flow 305 765 650 585 'booking, payment, issues'
$b += Flow 965 425 1295 210 'order and verification'
$b += Flow 965 475 1295 410 'context and advice'
$b += Flow 965 545 1295 610 'notifications'
$b += Flow 950 600 1295 790 'read / write records'
Write-Svg '01-dfd-level-0-context' $b

# 02 - DFD Level 1
$b = Title 'DATA FLOW DIAGRAM - LEVEL 1' 'Major RentSphere processes and data stores'
$b += Rect 45 420 205 80 'Authenticated User'
$processes=@(@(390,190,'1.0','Authentication'),@(760,190,'2.0','Portfolio'),@(1130,190,'3.0','Booking'),@(390,520,'4.0','Payments'),@(760,520,'5.0','Complaints'),@(1130,520,'6.0','Notifications'))
foreach($p in $processes){$b+=Circle $p[0] $p[1] 105 $p[2] $p[3]}
$stores=@(@(275,800,'D1','Users / Tenants'),@(560,800,'D2','Properties / Units'),@(845,800,'D3','Invoices / Payments'),@(1130,800,'D4','Issues / Alerts'))
foreach($s in $stores){$b+=Store $s[0] $s[1] 225 65 $s[2] $s[3]}
$b+=Flow 250 445 315 250 'login';$b+=Flow 250 430 655 220 'portfolio data';$b+=Flow 250 415 1025 235 'booking request'
$b+=Flow 250 475 290 555 '';$b+=Flow 250 465 655 555 '';$b+=Flow 250 450 1025 520 ''
$b+=Flow 390 295 390 800 '';$b+=Flow 760 295 670 800 '';$b+=Flow 390 625 955 800 '';$b+=Flow 760 625 1240 800 '';$b+=Flow 1130 625 1240 800 ''
Write-Svg '02-dfd-level-1-processes' $b

# 03 - Payment DFD Level 2
$b = Title 'DATA FLOW DIAGRAM - LEVEL 2' 'Verified rent-payment process'
$b += Rect 45 430 190 80 'Tenant'
$xs=@(340,610,880,1150);$labels=@(@('4.1','Select Invoice'),@('4.2','Validate Ownership'),@('4.3','Create Order'),@('4.4','Verify Payment'))
for($i=0;$i -lt 4;$i++){$b+=Circle $xs[$i] 300 92 $labels[$i][0] $labels[$i][1]}
$b+=Circle 880 620 92 '4.5' 'Update Ledger';$b+=Circle 1150 620 92 '4.6' 'Notify Tenant'
$b+=Rect 1360 255 190 80 'Razorpay';$b+=Store 330 790 240 70 'D1' 'Invoices';$b+=Store 750 790 240 70 'D2' 'Payments';$b+=Store 1120 790 240 70 'D3' 'Notifications'
$b+=Flow 235 455 340 380 'invoice choice';$b+=Flow 432 300 518 300 'invoice ID';$b+=Flow 702 300 788 300 'valid request';$b+=Flow 972 300 1058 300 'order data';$b+=Flow 1242 300 1360 295 'checkout';$b+=Flow 1360 335 1242 355 'signed result';$b+=Flow 1150 392 940 555 'verified';$b+=Flow 972 620 1058 620 'success';$b+=Flow 880 712 870 790 'save';$b+=Flow 1150 712 1240 790 'save';$b+=Flow 1060 650 235 485 'receipt status'
Write-Svg '03-dfd-level-2-payment' $b

# 04 - Chen ER diagram
$b = Title 'ENTITY RELATIONSHIP DIAGRAM' 'Chen notation: rectangles = entities, diamonds = relationships, ovals = attributes'
$entities=@(@(80,160,'ORGANIZATION'),@(570,160,'PROPERTY'),@(1080,160,'BUILDING'),@(1320,430,'UNIT'),@(500,700,'AGREEMENT'),@(80,700,'TENANT'),@(80,430,'USER'),@(900,700,'INVOICE'),@(1300,700,'PAYMENT'))
foreach($e in $entities){$b+=Rect $e[0] $e[1] 200 70 $e[2]}
$rels=@(@(425,195,'OWNS'),@(935,195,'CONTAINS'),@(1250,320,'HAS'),@(1020,565,'COVERS'),@(390,735,'SIGNS'),@(180,565,'MAPS TO'),@(800,735,'GENERATES'),@(1200,735,'HAS'))
foreach($r in $rels){$b+=Diamond $r[0] $r[1] 150 86 $r[2]}
$lines=@(@(280,195,350,195),@(500,195,570,195),@(770,195,860,195),@(1010,195,1080,195),@(1280,205,1250,277),@(1280,363,1380,430),@(1320,500,1095,545),@(945,585,650,700),@(500,735,465,735),@(315,735,280,735),@(180,500,180,522),@(180,608,180,700),@(700,735,725,735),@(875,735,900,735),@(1100,735,1125,735),@(1275,735,1300,735))
foreach($l in $lines){$b+="<line x1='$($l[0])' y1='$($l[1])' x2='$($l[2])' y2='$($l[3])' class='association'/>"}
$b+=Oval 105 105 92 32 'organization_id' $true;$b+=Oval 650 105 78 32 'property_id' $true;$b+=Oval 1150 105 78 32 'building_id' $true
$b+=Oval 1490 405 70 32 'unit_id' $true;$b+=Oval 1490 520 85 32 'unit_number' $false;$b+=Oval 600 890 86 32 'agreement_id' $true
$b+=Oval 180 890 72 32 'tenant_id' $true;$b+=Oval 70 590 62 32 'user_id' $true;$b+=Oval 1000 890 70 32 'invoice_id' $true;$b+=Oval 1400 890 76 32 'payment_id' $true
$b+="<line x1='105' y1='137' x2='140' y2='160' class='association'/><line x1='650' y1='137' x2='670' y2='160' class='association'/><line x1='1150' y1='137' x2='1180' y2='160' class='association'/><line x1='1490' y1='437' x2='1480' y2='445' class='association'/><line x1='1490' y1='488' x2='1480' y2='485' class='association'/><line x1='600' y1='858' x2='600' y2='770' class='association'/><line x1='180' y1='858' x2='180' y2='770' class='association'/><line x1='70' y1='558' x2='115' y2='500' class='association'/><line x1='1000' y1='858' x2='1000' y2='770' class='association'/><line x1='1400' y1='858' x2='1400' y2='770' class='association'/><text x='325' y='180' class='tiny'>1</text><text x='525' y='180' class='tiny'>N</text><text x='815' y='180' class='tiny'>1</text><text x='1035' y='180' class='tiny'>N</text><text x='1285' y='265' class='tiny'>1</text><text x='1345' y='390' class='tiny'>N</text><text x='470' y='720' class='tiny'>1</text><text x='485' y='720' class='tiny'>N</text><text x='880' y='720' class='tiny'>1</text><text x='885' y='720' class='tiny'>N</text><text x='1280' y='720' class='tiny'>1</text><text x='1285' y='720' class='tiny'>N</text>"
Write-Svg '04-er-diagram-chen-notation' $b 1600 1000

$audit = @('created_at','updated_at','created_by','updated_by','deleted_by','deleted_at','deleted')
New-ChenAttributeSheet '04b-er-attributes-portfolio' 'ER ATTRIBUTES - PORTFOLIO AND IDENTITY' ([ordered]@{
    ORGANIZATION = @('id [PK]','name','address','phone','email') + $audit
    USER = @('id [PK]','organization_id [FK]','email','password_hash','name','phone','profile_image_url','role') + $audit
    PROPERTY = @('id [PK]','organization_id [FK]','owner_id [FK]','name','address','city','state','amenities','image_url') + $audit
    BUILDING = @('id [PK]','organization_id [FK]','property_id [FK]','name','floors','image_url') + $audit
    UNIT = @('id [PK]','organization_id [FK]','building_id [FK]','unit_number','rent_amount','status','image_url') + $audit
})
New-ChenAttributeSheet '04c-er-attributes-tenancy-finance' 'ER ATTRIBUTES - TENANCY AND FINANCE' ([ordered]@{
    TENANT = @('id [PK]','organization_id [FK]','user_id [FK]','unit_id [FK]','full_name','phone','emergency_contact','kyc_status','id_proof_url','address_proof_url') + $audit
    AGREEMENT = @('id [PK]','organization_id [FK]','tenant_id [FK]','unit_id [FK]','start_date','end_date','rent_amount','status') + $audit
    INVOICE = @('id [PK]','organization_id [FK]','tenant_id [FK]','agreement_id [FK]','amount','due_date','status') + $audit
    PAYMENT = @('id [PK]','organization_id [FK]','invoice_id [FK]','razorpay_order_id','razorpay_payment_id','amount','status','payment_date') + $audit
})
New-ChenAttributeSheet '04d-er-attributes-operations' 'ER ATTRIBUTES - COMPLAINTS AND LEGAL OPERATIONS' ([ordered]@{
    COMPLAINT = @('id [PK]','organization_id [FK]','tenant_id [FK]','unit_id [FK]','title','description','status','ai_priority','ai_category','ai_note') + $audit
    DEPOSIT_DISPUTE = @('id [PK]','organization_id [FK]','tenant_id [FK]','unit_id [FK]','agreement_id [FK]','deposit_amount','deducted_amount','owner_repair_estimate','market_repair_estimate','proposed_settlement_amount','deduction_reason','evidence_url','tenant_notes','owner_response','settlement_due_date','refund_paid_amount','settlement_payment_method','settlement_reference','settled_on','status') + $audit
    RENT_INCREASE = @('id [PK]','organization_id [FK]','tenant_id [FK]','unit_id [FK]','agreement_id [FK]','previous_rent','proposed_rent','notice_date','effective_date','notification_scheduled_at','notification_sent_at','reason','tenant_response','owner_notes','status') + $audit
})
New-ChenAttributeSheet '04e-er-attributes-workflow' 'ER ATTRIBUTES - APPROVALS AND NOTIFICATIONS' ([ordered]@{
    APPROVAL_REQUEST = @('id [PK]','organization_id [FK]','type','subject','details','requester_email','approver_email','status','decision_comment','decided_at') + $audit
    NOTIFICATION = @('id [PK]','organization_id [FK]','recipient_email','title','detail','type','target_path','created_at','read_at')
})

# 05 - Architecture
$b = Title 'SYSTEM ARCHITECTURE DIAGRAM' 'Layered deployment and external integrations'
$layers=@(@(210,135,1180,105,'Presentation Layer','React 19 | TypeScript | Material UI | Vite'),@(210,300,1180,105,'API and Security Layer','Spring REST | JWT | Role authorization | Validation'),@(210,465,1180,105,'Business Service Layer','Booking | Billing | Complaints | Disputes | Notifications | AI'),@(210,630,1180,105,'Persistence Layer','Spring Data JPA | Repositories | Transactions | Audit fields'),@(210,795,1180,105,'Data Layer','PostgreSQL / Supabase'))
foreach($l in $layers){$b+="<rect x='$($l[0])' y='$($l[1])' width='$($l[2])' height='$($l[3])' rx='16' class='process' filter='url(#shadow)'/><text x='800' y='$($l[1]+40)' text-anchor='middle' class='label'>$($l[4])</text><text x='800' y='$($l[1]+72)' text-anchor='middle' class='small'>$($l[5])</text>"}
for($y=240;$y -le 735;$y+=165){$b+=Flow 800 $y 800 ($y+55) ''}
$b+=Rect 25 390 145 75 'Razorpay';$b+=Rect 1430 330 145 75 'Email';$b+=Rect 1430 505 145 75 'AI Provider';$b+=Flow 170 425 210 425 '';$b+=Flow 1390 365 1430 365 '';$b+=Flow 1390 540 1430 540 ''
Write-Svg '05-system-architecture' $b

function ClassBox([int]$x,[int]$y,[int]$w,[string]$name,[string[]]$attributes,[string[]]$operations) {
    $h=58+($attributes.Count+$operations.Count)*24+24;$attrY=$y+58;$opY=$attrY+$attributes.Count*24+10
    $s="<rect x='$x' y='$y' width='$w' height='$h' fill='#fff' stroke='#172554' stroke-width='2.5'/><rect x='$x' y='$y' width='$w' height='44' fill='#dbeafe' stroke='#172554' stroke-width='2.5'/><text x='$($x+$w/2)' y='$($y+29)' text-anchor='middle' class='label'>$(Escape $name)</text><line x1='$x' y1='$($y+44)' x2='$($x+$w)' y2='$($y+44)' class='association'/>"
    for($i=0;$i-lt$attributes.Count;$i++){$s+="<text x='$($x+12)' y='$($attrY+$i*24)' class='tiny'>$(Escape $attributes[$i])</text>"}
    $s+="<line x1='$x' y1='$($opY-18)' x2='$($x+$w)' y2='$($opY-18)' class='association'/>"
    for($i=0;$i-lt$operations.Count;$i++){$s+="<text x='$($x+12)' y='$($opY+$i*24)' class='tiny'>$(Escape $operations[$i])</text>"}
    return $s
}

# 06 - Domain UML class diagram
$b=Title 'UML CLASS DIAGRAM' 'Core RentSphere domain model'
$b+=ClassBox 40 130 270 'Organization' @('- id: UUID','- name: String') @('+ managePortfolio()')
$b+=ClassBox 365 130 270 'Property' @('- id: UUID','- ownerId: UUID','- name: String') @('+ addBuilding()')
$b+=ClassBox 690 130 270 'Building' @('- id: UUID','- propertyId: UUID','- floors: Integer') @('+ addUnit()')
$b+=ClassBox 1015 130 270 'Unit' @('- id: UUID','- unitNumber: String','- rentAmount: Decimal','- status: UnitStatus') @('+ changeStatus()')
$b+=ClassBox 40 560 270 'Tenant' @('- id: UUID','- userId: UUID','- kycStatus: String') @('+ verifyKyc()')
$b+=ClassBox 365 560 270 'Agreement' @('- id: UUID','- tenantId: UUID','- startDate: Date','- rentAmount: Decimal') @('+ activate()')
$b+=ClassBox 690 560 270 'Invoice' @('- id: UUID','- agreementId: UUID','- amount: Decimal','- status: InvoiceStatus') @('+ markPaid()')
$b+=ClassBox 1015 560 270 'Payment' @('- id: UUID','- invoiceId: UUID','- gatewayReference: String') @('+ verifySignature()')
$assocs=@(@(310,230,365,230,'1','*'),@(635,230,690,230,'1','*'),@(960,230,1015,230,'1','*'),@(175,420,175,560,'1','1'),@(500,420,500,560,'1','*'),@(825,420,825,560,'1','*'),@(1150,420,1150,560,'1','*'),@(310,670,365,670,'1','*'),@(635,670,690,670,'1','*'),@(960,670,1015,670,'1','*'))
foreach($a in $assocs){$b+="<line x1='$($a[0])' y1='$($a[1])' x2='$($a[2])' y2='$($a[3])' class='association'/><text x='$($a[0]+5)' y='$($a[1]-8)' class='tiny'>$($a[4])</text><text x='$($a[2]-15)' y='$($a[3]-8)' class='tiny'>$($a[5])</text>"}
Write-Svg '06-uml-domain-class-diagram' $b

# 06b - Operational UML class diagram
$b=Title 'UML OPERATIONAL CLASS DIAGRAM' 'Complaints, disputes, rent notices, approvals and notifications'
$b+=ClassBox 45 140 285 'Complaint' @('- tenantId: UUID','- unitId: UUID','- title: String','- status: ComplaintStatus','- aiPriority: String') @('+ triage()','+ updateStatus()')
$b+=ClassBox 360 140 320 'DepositDispute' @('- tenantId: UUID','- agreementId: UUID','- depositAmount: Decimal','- deductedAmount: Decimal','- refundPaidAmount: Decimal','- status: DisputeStatus') @('+ proposeSettlement()','+ recordRefund()')
$b+=ClassBox 710 140 300 'RentIncrease' @('- tenantId: UUID','- agreementId: UUID','- previousRent: Decimal','- proposedRent: Decimal','- effectiveDate: Date','- status: IncreaseStatus') @('+ scheduleNotice()','+ recordResponse()')
$b+=ClassBox 1040 140 300 'ApprovalRequest' @('- organizationId: UUID','- requesterEmail: String','- approverEmail: String','- type: String','- status: ApprovalStatus') @('+ approve()','+ reject()')
$b+=ClassBox 560 620 320 'Notification' @('- organizationId: UUID','- recipientEmail: String','- title: String','- type: String','- targetPath: String','- readAt: DateTime') @('+ markRead()','+ streamToUser()')
$b+=ClassBox 80 620 280 'Tenant' @('- id: UUID','- userId: UUID','- unitId: UUID','- kycStatus: String') @('+ viewOwnRecords()')
$b+=ClassBox 1080 620 280 'Organization' @('- id: UUID','- name: String') @('+ notifyStaff()')
$b+="<line x1='187' y1='390' x2='220' y2='620' class='association'/><text x='205' y='515' class='tiny'>1 raises *</text><line x1='520' y1='414' x2='300' y2='620' class='association'/><text x='385' y='515' class='tiny'>1 owns *</text><line x1='860' y1='414' x2='330' y2='650' class='association'/><text x='570' y='535' class='tiny'>1 receives *</text><line x1='1190' y1='390' x2='1220' y2='620' class='association'/><text x='1200' y='515' class='tiny'>* scoped to 1</text><line x1='560' y1='740' x2='360' y2='740' class='association'/><text x='440' y='725' class='tiny'>delivered to</text><line x1='880' y1='740' x2='1080' y2='740' class='association'/><text x='950' y='725' class='tiny'>scoped by</text>"
Write-Svg '06b-uml-operational-class-diagram' $b

# 07 - Backend UML package/class diagram
$b=Title 'UML BACKEND LAYER DIAGRAM' 'Controller-service-repository collaboration'
$b+=ClassBox 90 250 300 'REST Controller' @('- service: DomainService') @('+ create()','+ findAll()','+ update()','+ delete()')
$b+=ClassBox 650 250 300 'Domain Service' @('- repository: Repository','- notifier: NotificationService') @('+ validate()','+ applyWorkflow()','+ notifyUser()')
$b+=ClassBox 1210 250 300 'JPA Repository' @('- entity: DomainEntity') @('+ save()','+ findByOrganizationId()','+ findById()')
$b+=Flow 390 390 650 390 'DTO / method call';$b+=Flow 950 390 1210 390 'persistence call'
$b+=Rect 650 710 300 85 'PostgreSQL Database' 'store';$b+=Flow 1360 520 950 750 'SQL / JPA';$b+="<text x='800' y='610' text-anchor='middle' class='small'>SecurityUtils and organization scope are applied before repository access.</text>"
Write-Svg '07-uml-backend-layer-diagram' $b

function New-Sequence([string]$file,[string]$title,[string[]]$participants,[object[]]$messages) {
    $body=Title $title 'UML sequence diagram'
    $margin=90;$spacing=[Math]::Floor((1420)/($participants.Count-1));$xs=@()
    for($i=0;$i-lt$participants.Count;$i++){$x=$margin+$i*$spacing;$xs+=$x;$body+=Rect ($x-85) 115 170 60 $participants[$i];$body+="<line x1='$x' y1='175' x2='$x' y2='920' class='lifeline'/>"}
    $y=230
    foreach($m in $messages){$from=[int]$m[0];$to=[int]$m[1];$label=[string]$m[2];$x1=$xs[$from];$x2=$xs[$to];$marker=if($m.Count-gt 3-and$m[3]-eq'return'){'openArrow'}else{'arrow'};$body+="<line x1='$x1' y1='$y' x2='$x2' y2='$y' stroke='#172554' stroke-width='2.4' marker-end='url(#$marker)'/><text x='$(($x1+$x2)/2)' y='$($y-10)' text-anchor='middle' class='small'>$(Escape $label)</text>";$y+=85}
    Write-Svg $file $body
}
New-Sequence '08-sequence-booking-to-tenancy' 'BOOKING-TO-TENANCY SEQUENCE' @('Tenant','Web App','Approval API','Owner','Agreement Service','Invoice Service') @(@(0,1,'Book apartment'),@(1,2,'Create approval request'),@(2,3,'Notify pending request'),@(3,2,'Approve request'),@(2,1,'Approval confirmed','return'),@(3,4,'Activate verified agreement'),@(4,5,'Create first invoice'),@(5,0,'Payment-ready notification','return'))
New-Sequence '09-sequence-razorpay-payment' 'RAZORPAY PAYMENT SEQUENCE' @('Tenant','Web App','Payment API','Razorpay','Database','Notification Service') @(@(0,1,'Select invoice'),@(1,2,'Create checkout order'),@(2,4,'Validate tenant and invoice'),@(2,3,'Create Razorpay order'),@(3,1,'Order details','return'),@(0,3,'Complete checkout'),@(1,2,'Submit payment signature'),@(2,3,'Verify HMAC'),@(2,4,'Payment SUCCESS + Invoice PAID'),@(2,5,'Notify tenant'),@(5,0,'Invoice ready to download','return'))
New-Sequence '10-sequence-complaint-maintenance' 'COMPLAINT AND MAINTENANCE SEQUENCE' @('Tenant','Complaint UI','Complaint API','AI Triage','Owner/Admin','Notification Service') @(@(0,1,'Enter title and description'),@(1,2,'Create complaint'),@(2,2,'Assign tenant, unit and organization'),@(2,3,'Request priority and category'),@(3,2,'AI triage result','return'),@(2,4,'Notify new maintenance issue'),@(4,2,'Update IN_PROGRESS / RESOLVED'),@(2,5,'Create tenant notification'),@(5,0,'Status update','return'))
New-Sequence '11-sequence-deposit-settlement' 'DEPOSIT DISPUTE SETTLEMENT SEQUENCE' @('Owner/Admin','Dispute API','AI Advice','Bank / UPI','Database','Tenant') @(@(0,1,'Create settlement proposal'),@(5,1,'View dispute record'),@(1,2,'Request fair deduction advice'),@(2,5,'Suggested refund','return'),@(0,3,'Transfer refund'),@(3,0,'UTR / reference','return'),@(0,1,'Record amount, method, UTR and date'),@(1,4,'Mark dispute SETTLED'),@(1,5,'Notify and enable PDF download','return'))

# 12 - UML use case
$b=Title 'UML USE CASE DIAGRAM' 'RentSphere role-based system boundary'
$b+="<rect x='300' y='105' width='1000' height='820' rx='18' fill='#f8fafc' stroke='#172554' stroke-width='3'/><text x='800' y='140' text-anchor='middle' class='label'>RentSphere System</text>"
function Actor([int]$x,[int]$y,[string]$name){"<circle cx='$x' cy='$y' r='24' fill='none' stroke='#172554' stroke-width='3'/><line x1='$x' y1='$($y+24)' x2='$x' y2='$($y+100)' class='association'/><line x1='$($x-42)' y1='$($y+55)' x2='$($x+42)' y2='$($y+55)' class='association'/><line x1='$x' y1='$($y+100)' x2='$($x-40)' y2='$($y+155)' class='association'/><line x1='$x' y1='$($y+100)' x2='$($x+40)' y2='$($y+155)' class='association'/><text x='$x' y='$($y+185)' text-anchor='middle' class='label'>$(Escape $name)</text>"}
function UseCase([int]$cx,[int]$cy,[int]$rx,[string]$text){"<ellipse cx='$cx' cy='$cy' rx='$rx' ry='43' fill='#fff' stroke='#1d4ed8' stroke-width='2.5'/><text x='$cx' y='$($cy+6)' text-anchor='middle' class='small'>$(Escape $text)</text>"}
$b+=Actor 120 190 'Administrator';$b+=Actor 120 500 'Owner';$b+=Actor 1480 350 'Tenant';$b+=Actor 1480 700 'Razorpay'
$cases=@(@(520,220,'Manage organizations'),@(800,220,'Manage users and roles'),@(1080,220,'Manage properties'),@(520,400,'Approve bookings'),@(800,400,'Manage agreements'),@(1080,400,'Issue invoices'),@(520,590,'Handle complaints'),@(800,590,'Settle disputes'),@(1080,590,'Notify users'),@(520,780,'Book apartment'),@(800,780,'Pay rent'),@(1080,780,'Download records'))
foreach($u in $cases){$b+=UseCase $u[0] $u[1] 145 $u[2]}
$links=@(@(170,240,375,220),@(170,240,655,220),@(170,240,935,220),@(170,550,375,400),@(170,550,655,400),@(170,550,935,400),@(170,550,375,590),@(170,550,655,590),@(1430,400,665,780),@(1430,400,935,780),@(1430,400,935,590),@(1430,750,945,780))
foreach($l in $links){$b+="<line x1='$($l[0])' y1='$($l[1])' x2='$($l[2])' y2='$($l[3])' class='association'/>"}
Write-Svg '12-uml-use-case-diagram' $b

Write-Output "Generated the complete academic SVG diagram set in $OutputDirectory"
