# GitHub Setup Instructions

Follow these steps to push your project to GitHub:

## Step 1: Install Git (if not already installed)

1. Download Git for Windows from: https://git-scm.com/download/win
2. Run the installer and follow the setup wizard
3. Restart your terminal/PowerShell after installation

## Step 2: Verify Git Installation

Open PowerShell and run:
```powershell
git --version
```

If you see a version number, Git is installed correctly.

## Step 3: Configure Git (First time only)

```powershell
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

## Step 4: Initialize Git Repository

Navigate to your project folder and run:

```powershell
cd C:\Users\Asus\.gemini\antigravity\scratch\class-path-finder
git init
```

## Step 5: Add All Files

```powershell
git add .
```

## Step 6: Create Initial Commit

```powershell
git commit -m "Initial commit: Class Path Finder - University schedule management app"
```

## Step 7: Create GitHub Repository

1. Go to https://github.com and sign in (or create an account)
2. Click the "+" icon in the top right → "New repository"
3. Repository name: `class-path-finder` (or any name you prefer)
4. Description: "A modern web app for university students to manage and navigate their class schedules"
5. Select **Public** (to make it public)
6. **DO NOT** initialize with README, .gitignore, or license (we already have these)
7. Click "Create repository"

## Step 8: Connect Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these:

```powershell
git remote add origin https://github.com/YOUR_USERNAME/class-path-finder.git
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 9: Push to GitHub

```powershell
git branch -M main
git push -u origin main
```

You may be prompted to authenticate. Use your GitHub username and a Personal Access Token (not your password).

### Creating a Personal Access Token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name like "Class Path Finder"
4. Select scopes: `repo` (full control of private repositories)
5. Click "Generate token"
6. Copy the token and use it as your password when pushing

## Step 10: Verify

Visit your repository on GitHub:
```
https://github.com/YOUR_USERNAME/class-path-finder
```

Your code should now be public on GitHub! 🎉

## Quick Command Summary

```powershell
# Navigate to project
cd C:\Users\Asus\.gemini\antigravity\scratch\class-path-finder

# Initialize and commit
git init
git add .
git commit -m "Initial commit: Class Path Finder"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/class-path-finder.git

# Push to GitHub
git branch -M main
git push -u origin main
```

