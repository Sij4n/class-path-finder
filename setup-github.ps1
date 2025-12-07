# GitHub Setup Script for Class Path Finder
# Run this script in PowerShell: .\setup-github.ps1

Write-Host "🚀 Setting up GitHub repository for Class Path Finder..." -ForegroundColor Cyan
Write-Host ""

# Check if Git is installed
try {
    $gitVersion = git --version 2>&1
    Write-Host "✅ Git is installed: $gitVersion" -ForegroundColor Green
}
catch {
    Write-Host "❌ Git is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "1. Checking Git Configuration..." -ForegroundColor Cyan

$gitEmail = git config user.email
$gitName = git config user.name

if ([string]::IsNullOrWhiteSpace($gitEmail) -or [string]::IsNullOrWhiteSpace($gitName)) {
    Write-Host "⚠️  Git user identity is not configured." -ForegroundColor Yellow
    Write-Host "   We need to configure this for your commits." -ForegroundColor White
    
    $email = Read-Host "   Enter your email for Git"
    $name = Read-Host "   Enter your name for Git"
    
    if (-not [string]::IsNullOrWhiteSpace($email)) {
        git config --global user.email $email
    }
    if (-not [string]::IsNullOrWhiteSpace($name)) {
        git config --global user.name $name
    }
    
    Write-Host "✅ Git identity configured." -ForegroundColor Green
}
else {
    Write-Host "✅ Git identity is already configured ($gitEmail)." -ForegroundColor Green
}

Write-Host ""
Write-Host "2. Adding all files..." -ForegroundColor Cyan
git add .
Write-Host "✅ Files added" -ForegroundColor Green

Write-Host ""
Write-Host "3. Creating initial commit..." -ForegroundColor Cyan
$commitMessage = "Initial commit"
git commit -m $commitMessage
Write-Host "✅ Initial commit created" -ForegroundColor Green

Write-Host ""
Write-Host "4. Setting up remote..." -ForegroundColor Cyan
$username = Read-Host "GitHub Username"

if ([string]::IsNullOrWhiteSpace($username)) {
    Write-Host "❌ Username cannot be empty." -ForegroundColor Red
    exit 1
}

$remoteUrl = "https://github.com/$username/class-path-finder.git"
$existingRemote = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "⚠️  Remote 'origin' already exists. Updating..." -ForegroundColor Yellow
    git remote set-url origin $remoteUrl
}
else {
    git remote add origin $remoteUrl
}
Write-Host "✅ Remote configured: $remoteUrl" -ForegroundColor Green

Write-Host ""
Write-Host "5. Pushing to GitHub..." -ForegroundColor Cyan
git branch -M main
git push -u origin main

Write-Host ""
Write-Host "✨ If push failed, you may need to authenticate." -ForegroundColor Yellow
Write-Host "   Use the popup or paste your Personal Access Token." -ForegroundColor Yellow
