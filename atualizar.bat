@echo off
rem Atualiza o ambiente local do MiniERP. O trabalho fica em backend\scripts\atualizar.js.
rem Use --sem-pausa para nao esperar uma tecla no fim.
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo ERRO: o Node.js nao foi encontrado. Instale o Node.js e abra um novo terminal.
  if /i not "%~1"=="--sem-pausa" pause
  exit /b 1
)

node backend\scripts\atualizar.js
set CODIGO=%ERRORLEVEL%

if /i not "%~1"=="--sem-pausa" pause
exit /b %CODIGO%
