# Перенос школы на другой компьютер

Исходники хранятся в репозитории сайта и в подмодулях `stylist-svelte`. Сохраняйте расположение каталогов: Yarn portal и исходные импорты используют соседнюю библиотеку.

Нужны Git с доступом к приватным репозиториям владельца, Node.js 24.11+ и Yarn 4.13. Python 3.10+ нужен для экспорта и упаковки данных, для обычного запуска достаточно Node/Yarn.

## Получить исходники

Например, для рабочего каталога `D:\school`:

```powershell
New-Item -ItemType Directory -Force D:\school\myspanish.space
git clone --recurse-submodules https://github.com/Godmy/stylist-svelte.git D:\school\stylist-svelte
git -C D:\school\stylist-svelte submodule update --init --checkout modules/business modules/prototype
git -C D:\school\stylist-svelte\modules\business submodule update --init --checkout spanish
git clone https://github.com/Godmy/myspanish.space.git D:\school\myspanish.space\myspanish.space
```

Команды для `business`, `prototype` и `spanish` указаны явно: некоторые приватные подмодули имеют `update=none` и обычный recursive clone пропускает их. Генерацию barrel-файлов запускать для установки не требуется.

## Запустить

```powershell
cd D:\school\stylist-svelte
yarn install --immutable
cd D:\school\myspanish.space\myspanish.space
yarn install --immutable
yarn dev
```

Открыть http://localhost:5176. Тестовые роли — `/login`. Без отдельного импорта новая локальная база содержит собственный демомодуль.

## Перенести каталог реальных материалов

На исходном компьютере из каталога приложения:

```powershell
python scripts/school/prepare-transfer.py
```

Получатся `.school-transfer/archive-metadata-2026-10-30.zip` и соседний `.sha256`. ZIP содержит manifest и ровно 142 используемые порции импорта. Файл предназначен для частного переноса: метаданные закрытых материалов не публикуются в Git. Пароли, cookies, конфигурации входа, рабочие базы и исторические персональные работы в него не включаются.

Скопируйте оба файла на новый компьютер. После остановки dev-сервера, из каталога приложения:

```powershell
Get-FileHash .\archive-metadata-2026-10-30.zip -Algorithm SHA256
# Сравнить с содержимым соседнего .sha256.
Expand-Archive -LiteralPath .\archive-metadata-2026-10-30.zip -DestinationPath .school-import -Force
yarn archive:apply
yarn dev
```

Откройте `/staff/archive`, `/staff/library` и `/staff/courses`. Для исходного экспорта понадобится отдельно переданный `school-stage1.sqlite`; для загрузки готовых порций достаточно ZIP. Физические учебные файлы по-прежнему подключаются отдельно.

Редакторские изменения, локальные пользователи и учебная история находятся в `.school-data`. Для их переноса остановите локальный сервер и перенесите весь каталог вместе с файлами, как описано в HANDOFF.md. Это отдельный перенос рабочего состояния; ZIP метаданных восстанавливает исходное наполнение.

## Preview и секреты

Постоянный Cloudflare preview и его база продолжают работать независимо от компьютера. Для просмотра нужен прежний пароль; файл `.preview.local/access-key.txt` передаётся отдельно по приватному каналу. Для управления публикацией на новом компьютере требуется собственная авторизация Wrangler в аккаунте владельца. `.env`, `.dev.vars`, локальные ключи и пароли в Git не хранятся.

Проверки после переноса: `yarn test:preview`, `yarn check`, `yarn check:worker`. Для браузерных тестов нужен установленный Chrome: `yarn test:e2e`.
