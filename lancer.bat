@echo off
chcp 65001 >nul
title Thai Food 77 - Serveur Local
cd /d "%~dp0"

echo.
echo ========================================
echo    Thai Food 77 - Demarrage du serveur
echo ========================================
echo.

REM --- Verification de Node.js ---
where node >nul 2>nul
if errorlevel 1 (
    echo [ERREUR] Node.js n'est pas installe sur cet ordinateur.
    echo.
    echo Telechargez-le ici : https://nodejs.org
    echo Choisissez la version "LTS" puis relancez ce fichier.
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detecte.
node -v

REM --- Installation des dependances si necessaire ---
if not exist "node_modules" (
    echo.
    echo Installation des dependances ^(premier lancement, cela peut prendre quelques minutes^)...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo [ERREUR] L'installation des dependances a echoue.
        echo Verifiez votre connexion internet puis relancez ce fichier.
        echo.
        pause
        exit /b 1
    )
) else (
    echo [OK] Dependances deja installees.
)

echo.
echo Demarrage du serveur...
echo Le site s'ouvrira automatiquement dans votre navigateur a l'adresse :
echo.
echo    http://localhost:2000
echo.
echo Pour arreter le serveur : fermez cette fenetre ou appuyez sur Ctrl+C.
echo.

REM --- Ouvre le navigateur quand le serveur est pret (attend que localhost:2000 reponde) ---
start "" powershell -NoProfile -WindowStyle Hidden -Command "for($i=0;$i -lt 60;$i++){try{$r=Invoke-WebRequest 'http://localhost:2000' -UseBasicParsing -TimeoutSec 2;Start-Process 'http://localhost:2000';break}catch{Start-Sleep 2}}"

REM --- Lance le serveur de developpement Next.js ---
call npm run dev

pause
