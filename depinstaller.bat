:: filepath: d:\torrento\setup_torrento.bat
@echo off
setlocal

echo [Torrento] Vérification de Node.js...

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js n'est pas installé.
    echo Veuillez télécharger et installer Node.js depuis https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js est installé.
echo [Torrento] Installation des dépendances npm...
call npm install

if %ERRORLEVEL% neq 0 (
    echo Une erreur est survenue lors de l'installation des dépendances.
    pause
    exit /b 1
)

echo.
echo [Torrento] Installation terminée avec succès!
echo Pour lancer l'application, utilisez :
echo   node index.js --torrent chemin\vers\fichier.torrent
pause