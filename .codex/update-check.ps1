# Хук SessionStart для Windows. Ведёт себя так же, как .codex/update-check.sh,
# и по тем же причинам: молчит, когда сказать нечего, и никогда не роняет старт
# чата. Держите оба файла согласованными — Менеджеры сидят на обеих ОС.

$ErrorActionPreference = 'SilentlyContinue'
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Say($text) {
    Write-Output ('{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"' + $text + '"}}')
}

$repo = Split-Path -Parent $PSScriptRoot
if (-not $repo) { exit 0 }
Set-Location $repo

git rev-parse --git-dir *> $null
if ($LASTEXITCODE -ne 0) { exit 0 }

# Только dev: на другой ветке работает разработчик, перематывать её нельзя.
$branch = (git rev-parse --abbrev-ref HEAD 2>$null)
if ($branch -ne 'dev') { exit 0 }

git remote get-url origin *> $null
if ($LASTEXITCODE -ne 0) { exit 0 }

git -c http.lowSpeedLimit=1000 -c http.lowSpeedTime=10 fetch --quiet origin dev *> $null
if ($LASTEXITCODE -ne 0) { exit 0 }

$behind = (git rev-list --count HEAD..origin/dev 2>$null)
if ($LASTEXITCODE -ne 0) { exit 0 }
if (-not $behind -or [int]$behind -le 0) { exit 0 }

# Отслеживаемые файлы откатываем, неотслеживаемые не трогаем.
$reverted = ''
$dirty = (git status --porcelain --untracked-files=no 2>$null)
if ($dirty) {
    git checkout -- . *> $null
    if ($LASTEXITCODE -eq 0) {
        $reverted = ' Локальные изменения в файлах инструмента были отменены — предупреди об этом.'
    }
}

git merge --ff-only origin/dev *> $null
if ($LASTEXITCODE -eq 0) {
    Say ("Инструмент обновлён: подтянуто новых изменений — $behind. Правила и скиллы читаются в начале чата, поэтому обновление вступит в силу только в следующем. Скажи Менеджеру об обновлении и предложи открыть New chat." + $reverted)
} else {
    Say 'Автообновление инструмента не сработало: git не смог применить изменения. Скажи Менеджеру, что версия у него устаревшая, и предложи написать — обнови инструмент.'
}

exit 0
