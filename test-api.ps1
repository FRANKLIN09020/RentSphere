param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$Email = $env:RENTSPHERE_TEST_EMAIL,
    [string]$Password = $env:RENTSPHERE_TEST_PASSWORD,
    [string]$Message = "What are the tenant's responsibilities for maintenance?"
)

if (-not $Email -or -not $Password) {
    Write-Error "Provide a login via -Email/-Password or set RENTSPHERE_TEST_EMAIL and RENTSPHERE_TEST_PASSWORD environment variables."
    exit 1
}

$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json

try {
    $login = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body $loginBody -TimeoutSec 30
    $token = $login.token
} catch {
    Write-Error "Login failed: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) { Write-Output $_.ErrorDetails.Message }
    exit 1
}

$chatBody = @{ message = $Message; context = "" } | ConvertTo-Json
$headers = @{
    "Content-Type"  = "application/json"
    "Authorization" = "Bearer $token"
}

try {
    $result = Invoke-RestMethod -Uri "$BaseUrl/assistant/chat" -Method POST -Headers $headers -Body $chatBody -TimeoutSec 60
    Write-Output "Success!"
    Write-Output "Reply: $($result.reply)"
    Write-Output "UsedFallback: $($result.usedFallback)"
    Write-Output "Model: $($result.model)"
} catch {
    Write-Error "Chat failed: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) { Write-Output $_.ErrorDetails.Message }
    exit 1
}