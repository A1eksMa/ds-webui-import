# Changelog

Архивы в этой папке — рабочая версия конвертера (без тестов), готовая к распаковке в
каталог `import/` внутри `ds-webui` (альтернатива `git submodule add` — на случай, если
машина без доступа к git/сети). Имя архива содержит номер версии:
`ds-webui-import-<version>.tar.gz`. Текущая версия — в файле [`VERSION`](../VERSION).

## Распаковка

```bash
mkdir -p /path/to/ds-webui/import
tar -xzf ds-webui-import-<version>.tar.gz -C /path/to/ds-webui/import
```

Внутри: `import.js`, `vendor/xlsx.full.min.js`, `vendor/SHEETJS-LICENSE`, `LICENSE`,
`README.md`. `ds-webui`'s `index.html` уже содержит опциональные `<script>`-теги на эти
пути — после распаковки на странице «Настройки» появится кнопка «Импорт из Excel».

---

## 0.2.0a1 — `ds-webui-import-0.2.0a1.tar.gz`

**Последняя alpha-версия этого репозитория.** `ds-webui` переходит в фазу бета-тестирования
и продолжает жить отдельным продуктом в составе организации
[JoinSheets](https://github.com/JoinSheets). Этот репозиторий будет переведён в архивный
режим; дальнейшая разработка — в новом месте под JoinSheets.

Заодно: формулировка в README, явно называвшая `ds-loader` единственным продюсером
контракта `ds-webui`, обобщена — конвертер следует тому же контракту, что и любой другой
продюсер данных (функционально ничего не изменилось).

## 0.1.0a1 — `ds-webui-import-0.1.0a1.tar.gz`

Первая версия. Разбор `.xlsx` (первый лист, первая строка — заголовки) через вендоренный
SheetJS 0.20.3 (Apache-2.0) в ленивый columnar-формат источника `ds-webui`
(`ds-webui/docs/contract.md`) + фрагмент манифеста + индекс `manifest.imports.js`. Единая
точка входа `window.DS_APP.importXlsx(file)`; результат — три скачиваемых файла через
`ds-webui`'s `effects.js::download` (тот же механизм, что у экспорта CSV/XLS), без записи
на диск и без File System Access API.
