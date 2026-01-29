Write-Host "Verificando el proyecto web..."
if (Get-Command pnpm -ErrorAction SilentlyContinue) {
  try {
    pnpm -w -C apps/web run lint
  } catch {
    Write-Host "Lint falló (ver salida)." -ForegroundColor Yellow
  }

  try {
    pnpm -w -C apps/web run build
  } catch {
    Write-Host "Build falló (ver salida)." -ForegroundColor Yellow
  }
} else {
  Write-Host "pnpm/Node no encontrado en este entorno. Instala Node.js y pnpm y ejecuta 'scripts\verify-projects.ps1' localmente." -ForegroundColor Red
}
