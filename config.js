/**
 * config.js — Конфигурация конструктора ТЗ
 *
 * Вся логика шагов, тексты и placeholder'ы хранятся здесь.
 * Чтобы добавить новый тип задачи, поле или систему — редактируй только этот файл.
 *
 * Структура:
 *  SYSTEMS           — доступные системы (1С, сайт, и т.д.)
 *  FEATURE_TYPES     — виды разработки, зависят от системы
 *  PRIORITY_LEVELS   — уровни приоритета
 *  FIELDS            — конфигурация всех полей формы
 *  STEPS             — порядок и состав шагов визарда
 *  RESULT_LABELS     — лейблы для итогового текста задачи
 */

const CONFIG = {

  // ─── Системы ──────────────────────────────────────────────────────────────

  SYSTEMS: [
    {
      value: '1c',
      icon: '🗂️',
      label: '1С',
      desc: 'ERP, ЗУП, Бухгалтерия, конфигурации 1С',
    },
    {
      value: 'site',
      icon: '🌐',
      label: 'Сайт / веб',
      desc: 'Интернет-магазин, лендинг, личный кабинет, API',
    },
    {
      value: 'integration',
      icon: '🔗',
      label: 'Интеграция 1С ↔ Сайт',
      desc: 'Синхронизация данных, обмен, выгрузка/загрузка',
    },
    {
      value: 'other',
      icon: '📦',
      label: 'Другое',
      desc: 'Другая система или инструмент',
    },
  ],

  // ─── Виды разработки (зависят от системы) ─────────────────────────────────
  // availableFor: массив значений из SYSTEMS, для которых показывается этот тип

  FEATURE_TYPES: [
    {
      value: 'bp',
      icon: '🔄',
      label: 'Бизнес-процесс',
      desc: 'Автоматизация, маршрут согласования, триггеры',
      availableFor: ['1c', 'integration'],
    },
    {
      value: 'report',
      icon: '📊',
      label: 'Отчёт',
      desc: 'Новый отчёт в 1С с выборкой данных',
      availableFor: ['1c'],
    },
    {
      value: 'printform',
      icon: '🖨️',
      label: 'Печатная форма',
      desc: 'Документ для печати: акт, договор, счёт, накладная',
      availableFor: ['1c'],
    },
    {
      value: 'processing',
      icon: '⚙️',
      label: 'Обработка / доработка логики',
      desc: 'Изменение алгоритма, новая обработка, изменение модуля',
      availableFor: ['1c', 'integration'],
    },
    {
      value: 'layout',
      icon: '🎨',
      label: 'Вёрстка / дизайн',
      desc: 'Новый блок, страница, изменение внешнего вида',
      availableFor: ['site', 'integration'],
    },
    {
      value: 'web-feature',
      icon: '🚀',
      label: 'Новый функционал',
      desc: 'Фича, модуль, форма, личный кабинет, интеграция',
      availableFor: ['site', 'integration'],
    },
    {
      value: 'seo',
      icon: '📈',
      label: 'SEO / технические изменения',
      desc: 'Мета-теги, редиректы, скорость, robots.txt',
      availableFor: ['site'],
    },
    {
      value: 'other-feature',
      icon: '📦',
      label: 'Другое',
      desc: 'Опишу вручную в следующем шаге',
      availableFor: ['other'],
    },
  ],

  // ─── Приоритеты ───────────────────────────────────────────────────────────

  PRIORITY_LEVELS: [
    { value: 'low',      label: '🟢 Низкий',    cssClass: 'p-low' },
    { value: 'medium',   label: '🟡 Средний',   cssClass: 'p-medium' },
    { value: 'high',     label: '🟠 Высокий',   cssClass: 'p-high' },
    { value: 'critical', label: '🔴 Критичный', cssClass: 'p-critical' },
  ],

  // ─── Поля формы ───────────────────────────────────────────────────────────
  //
  // Каждое поле:
  //   id         — уникальный идентификатор
  //   type       — 'text' | 'textarea' | 'select' | 'priority' | 'file-hint'
  //   label      — текст лейбла
  //   required   — обязательное поле
  //   placeholder — может быть строкой (одинаково для всех систем)
  //                 или объектом { '1c': '...', 'site': '...', 'default': '...' }
  //   options    — для select: массив { value, label }
  //   note       — подсказка под полем
  //   showWhen   — функция(state) → bool, определяет видимость поля

  FIELDS: {

    // ── Общее для всех шагов ────────────────────────────────────────────────

    taskTitle: {
      id: 'taskTitle',
      type: 'text',
      label: 'Краткое название задачи',
      required: true,
      placeholder: {
        bug: {
          '1c':          'Ошибка при проведении документа «Реализация товаров»',
          'site':        'Ошибка 500 на странице оформления заказа',
          'integration': 'Не синхронизируются остатки 1С → сайт',
          'default':     'Кратко опишите суть проблемы',
        },
        feature: {
          '1c':          'Отчёт «Продажи по менеджерам за период»',
          'site':        'Форма обратной связи на странице «Контакты»',
          'integration': 'Автоматическая выгрузка заказов с сайта в 1С',
          'default':     'Кратко опишите, что нужно сделать',
        },
      },
    },

    // ── Поля блока «Ошибка» ─────────────────────────────────────────────────

    bugWhere: {
      id: 'bugWhere',
      type: 'text',
      label: 'Где конкретно возникает ошибка?',
      required: true,
      placeholder: {
        '1c':          'Документ «Реализация», кнопка «Провести», вкладка «Товары»',
        'site':        'Страница /checkout, шаг 2 «Оплата», кнопка «Оплатить»',
        'integration': 'Обработка синхронизации, этап выгрузки номенклатуры',
        'default':     'Раздел, документ, форма, страница, URL',
      },
    },

    bugErrorText: {
      id: 'bugErrorText',
      type: 'textarea',
      label: 'Текст ошибки',
      required: true,
      placeholder: {
        '1c':    'Скопируй точный текст из красного окна 1С.\nЕсли нет текста — напиши «нет текста ошибки»',
        'site':  'Текст из всплывающего уведомления, страницы ошибки или консоли браузера.\nЕсли нет текста — напиши «нет текста ошибки»',
        'default': 'Скопируй точный текст ошибки из системы.\nЕсли нет текста — напиши «нет текста ошибки»',
      },
    },

    bugSteps: {
      id: 'bugSteps',
      type: 'textarea',
      label: 'Шаги для воспроизведения ошибки',
      required: true,
      minHeight: '120px',
      placeholder: {
        '1c':
          '1. Открыть документ «Реализация товаров»\n' +
          '2. Заполнить шапку: контрагент, склад\n' +
          '3. Добавить товар в таблицу\n' +
          '4. Нажать кнопку «Провести и закрыть»\n' +
          '5. Появляется ошибка',
        'site':
          '1. Перейти по ссылке https://...\n' +
          '2. Добавить товар в корзину\n' +
          '3. Перейти в корзину, нажать «Оформить заказ»\n' +
          '4. Заполнить форму доставки\n' +
          '5. Нажать «Оплатить» — появляется ошибка',
        'integration':
          '1. Запустить обработку синхронизации в 1С\n' +
          '2. Дождаться завершения / прервать\n' +
          '3. Описать, что происходит',
        'default':
          '1. ...\n2. ...\n3. ...\nОпиши каждый шаг максимально конкретно',
      },
    },

    bugFrequency: {
      id: 'bugFrequency',
      type: 'select',
      label: 'Как часто воспроизводится?',
      required: true,
      options: [
        { value: '',         label: '— выбери —' },
        { value: 'always',   label: 'Всегда (100%)' },
        { value: 'often',    label: 'Часто (больше половины случаев)' },
        { value: 'sometimes',label: 'Иногда (непредсказуемо)' },
        { value: 'once',     label: 'Произошло один раз' },
      ],
    },

    bugWhoAffected: {
      id: 'bugWhoAffected',
      type: 'select',
      label: 'Кто сталкивается с ошибкой?',
      required: true,
      options: [
        { value: '',     label: '— выбери —' },
        { value: 'all',  label: 'Все пользователи' },
        { value: 'role', label: 'Определённая роль / группа' },
        { value: 'one',  label: 'Только я / конкретный пользователь' },
      ],
    },

    bugWhoName: {
      id: 'bugWhoName',
      type: 'text',
      label: 'Укажи роль или имя пользователя',
      required: true,
      placeholder: {
        default: 'Менеджер по продажам / Иванова М.П.',
      },
      // Показывается только если выбран конкретный пользователь / роль
      showWhen: (state) => state.bugWhoAffected === 'role' || state.bugWhoAffected === 'one',
    },

    bugEnvironment: {
      id: 'bugEnvironment',
      type: 'text',
      label: 'Версия / среда',
      required: false,
      placeholder: {
        '1c':    'Версия 1С: 8.3.xx, конфигурация: УТ 11.5.x, ОС: Windows 10',
        'site':  'Браузер: Chrome 122, ОС: Windows 11, разрешение: 1920×1080',
        'default': 'Версия системы, браузер, ОС — если знаешь',
      },
    },

    bugExpected: {
      id: 'bugExpected',
      type: 'textarea',
      label: 'Ожидаемое поведение',
      required: true,
      placeholder: {
        '1c':    'Документ должен провестись, движения по регистрам созданы, форма закрылась.',
        'site':  'Заказ должен оформиться, пользователь перешёл на страницу «Спасибо за заказ».',
        'default': 'Что должно было произойти? Как должна работать система в норме?',
      },
    },

    bugComment: {
      id: 'bugComment',
      type: 'textarea',
      label: 'Дополнительно',
      required: false,
      placeholder: {
        default: 'Любая информация, которая может помочь: когда началось, что изменилось, временные решения',
      },
    },

    bugPriority: {
      id: 'bugPriority',
      type: 'priority',
      label: 'Приоритет',
      required: false,
      note: 'Критичный — система полностью не работает, бизнес остановлен.\nВысокий — серьёзная проблема, но есть обходной путь.',
    },

    featurePriority: {
      id: 'featurePriority',
      type: 'priority',
      label: 'Приоритет',
      required: false,
      note: 'Критичный — нужно немедленно, бизнес заблокирован.\nВысокий — важно, но не останавливает работу.',
    },

    bugAttachments: {
      id: 'bugAttachments',
      type: 'file-hint',
      label: 'Скриншоты / записи экрана',
      note: '📎 Прикрепи скриншоты с ошибкой к задаче в Битрикс24 после вставки текста.\nБез визуала время решения увеличивается в 3 раза.',
    },

    // ── Поля блока «Разработка» — общие ─────────────────────────────────────

    featureWhy: {
      id: 'featureWhy',
      type: 'textarea',
      label: 'Зачем это нужно? Бизнес-обоснование',
      required: true,
      placeholder: {
        default: 'Какую проблему решает?\nЧто сейчас неудобно или невозможно?\nПочему это важно для бизнеса?',
      },
    },

    featureNowWant: {
      id: 'featureNowWant',
      type: 'textarea',
      label: 'Сейчас → Хочу',
      required: true,
      minHeight: '100px',
      placeholder: {
        '1c':
          'СЕЙЧАС: менеджер вручную выгружает данные в Excel и считает итоги\n' +
          'ХОЧУ: автоматический отчёт в 1С с группировкой по менеджерам и итоговой суммой',
        'site':
          'СЕЙЧАС: клиент не может оставить заявку — только звонок\n' +
          'ХОЧУ: форма обратной связи на сайте с отправкой на email и в Битрикс24',
        'integration':
          'СЕЙЧАС: остатки товаров обновляются раз в сутки вручную\n' +
          'ХОЧУ: автоматическая синхронизация остатков 1С → сайт каждые 15 минут',
        'default':
          'СЕЙЧАС: [опиши, как работает сейчас или чего нет]\n' +
          'ХОЧУ: [опиши, как должно работать после разработки]',
      },
    },

    featureCriteria: {
      id: 'featureCriteria',
      type: 'textarea',
      label: 'Критерии приёмки — как понять, что готово?',
      required: true,
      placeholder: {
        '1c':
          'Задача считается выполненной, когда:\n' +
          '1. Отчёт открывается из меню «Продажи → Отчёты»\n' +
          '2. Данные совпадают с ручным расчётом за тестовый период\n' +
          '3. Фильтр по периоду работает корректно',
        'site':
          'Задача считается выполненной, когда:\n' +
          '1. Форма отображается на странице /contacts\n' +
          '2. При отправке приходит письмо на sales@company.ru\n' +
          '3. В Битрикс24 создаётся лид\n' +
          '4. Форма корректно отображается на мобильных',
        'default':
          'Задача считается выполненной, когда:\n1. ...\n2. ...\n3. ...',
      },
    },

    featureAcceptor: {
      id: 'featureAcceptor',
      type: 'text',
      label: 'Кто принимает работу',
      required: true,
      placeholder: {
        default: 'ФИО или должность ответственного за приёмку',
      },
    },

    featureDeadline: {
      id: 'featureDeadline',
      type: 'text',
      label: 'Срок / дедлайн',
      required: false,
      placeholder: {
        default: 'Желаемая дата или «как можно скорее»',
      },
    },

    featureComment: {
      id: 'featureComment',
      type: 'textarea',
      label: 'Дополнительно',
      required: false,
      placeholder: {
        default: 'Ограничения, пожелания, связанные задачи, ссылки',
      },
    },

    // ── Специфичные поля для типов разработки ───────────────────────────────

    // Бизнес-процесс
    bpParticipants: {
      id: 'bpParticipants',
      type: 'textarea',
      label: 'Участники процесса',
      required: true,
      placeholder: {
        default:
          'Перечисли всех участников:\n' +
          '- Инициатор: менеджер отдела продаж\n' +
          '- Согласующий: руководитель отдела\n' +
          '- Финансовый контроль: бухгалтерия\n' +
          '- Система уведомлений: email / 1С',
      },
    },

    bpTrigger: {
      id: 'bpTrigger',
      type: 'text',
      label: 'Триггер — что запускает процесс?',
      required: true,
      placeholder: {
        default: 'Создание документа «Заявка на оплату» / каждый понедельник / кнопка «Отправить на согласование»',
      },
    },

    bpSteps: {
      id: 'bpSteps',
      type: 'textarea',
      label: 'Шаги процесса',
      required: true,
      minHeight: '140px',
      placeholder: {
        default:
          '1. Менеджер создаёт заявку на оплату в 1С\n' +
          '2. Система отправляет уведомление руководителю\n' +
          '3. Руководитель согласует или отклоняет\n' +
          '   — если отклонено: уведомить менеджера, процесс завершён\n' +
          '   — если согласовано: перейти к шагу 4\n' +
          '4. Бухгалтер получает задание на оплату\n' +
          '5. Бухгалтер проводит оплату, статус меняется на «Оплачено»',
      },
    },

    bpBpmnHint: {
      id: 'bpBpmnHint',
      type: 'file-hint',
      label: 'Схема в формате .bpmn',
      note: '📎 Без схемы BPMN задача по бизнес-процессу будет отправлена на доработку.\nСоздать схему можно на bpmn.io — бесплатно, онлайн, без регистрации.',
    },

    // Отчёт
    reportSource: {
      id: 'reportSource',
      type: 'text',
      label: 'Источник данных',
      required: true,
      placeholder: {
        default: 'Документ «Реализация товаров», регистр накопления «Продажи», справочник «Номенклатура»',
      },
    },

    reportColumns: {
      id: 'reportColumns',
      type: 'textarea',
      label: 'Колонки отчёта',
      required: true,
      placeholder: {
        default:
          'Перечисли все нужные колонки:\n' +
          '- Менеджер (ФИО)\n' +
          '- Период (месяц)\n' +
          '- Контрагент\n' +
          '- Количество сделок\n' +
          '- Сумма продаж\n' +
          '- ИТОГО по менеджеру',
      },
    },

    reportFilters: {
      id: 'reportFilters',
      type: 'textarea',
      label: 'Фильтры / группировки',
      required: true,
      placeholder: {
        default:
          'Фильтры: по периоду (дата начала/конца), по менеджеру, по контрагенту\n' +
          'Группировка: по менеджерам, внутри — по месяцам\n' +
          'Итоги: сумма по каждому менеджеру и общий итог',
      },
    },

    reportExample: {
      id: 'reportExample',
      type: 'file-hint',
      label: 'Пример / аналог',
      note: '📎 Прикрепи Excel-файл с примером структуры или скриншот похожего отчёта.\nЭто значительно ускоряет разработку и снижает количество правок.',
    },

    // Печатная форма
    printformType: {
      id: 'printformType',
      type: 'text',
      label: 'Тип документа',
      required: true,
      placeholder: {
        default: 'Акт выполненных работ / договор поставки / товарная накладная / счёт-фактура',
      },
    },

    printformSource: {
      id: 'printformSource',
      type: 'textarea',
      label: 'Откуда берутся данные',
      required: true,
      placeholder: {
        default: 'Из какого документа 1С будет формироваться печатная форма? Например: «Реализация товаров и услуг»',
      },
    },

    printformContent: {
      id: 'printformContent',
      type: 'textarea',
      label: 'Что должно быть в форме',
      required: true,
      placeholder: {
        default:
          'Перечисли все элементы:\n' +
          '- Шапка: логотип, реквизиты компании, номер и дата документа\n' +
          '- Таблица: наименование, кол-во, цена, сумма\n' +
          '- Подвал: итого, НДС, сумма прописью\n' +
          '- Подписи: директор, главный бухгалтер, печать',
      },
    },

    printformExample: {
      id: 'printformExample',
      type: 'file-hint',
      label: 'Образец документа',
      note: '📎 Обязательно прикрепи образец (Word, PDF, скриншот).\nБез образца задача будет отклонена — это требование, не пожелание.',
    },

    // Обработка / доработка логики
    processingWhat: {
      id: 'processingWhat',
      type: 'textarea',
      label: 'Что и где нужно изменить',
      required: true,
      placeholder: {
        '1c':
          'Объект: документ «Поступление товаров», модуль проведения\n' +
          'Что изменить: при проведении автоматически создавать «Заказ покупателя» если остаток ниже нормы',
        'site':
          'Модуль: корзина, файл /bitrix/components/basket\n' +
          'Что изменить: добавить автоматическое применение промокода для авторизованных пользователей',
        'integration':
          'Что изменить: в обмене добавить передачу фотографий товаров из 1С на сайт',
        'default':
          'Укажи объект/файл/модуль и что конкретно нужно изменить в логике работы',
      },
    },

    processingConditions: {
      id: 'processingConditions',
      type: 'textarea',
      label: 'Условия и исключения',
      required: false,
      placeholder: {
        default:
          'Есть ли особые случаи?\n' +
          'Например: для контрагентов с типом «VIP» логика другая; если сумма > 100 000 — требуется доп. согласование',
      },
    },

    // Вёрстка / дизайн / веб-функционал / SEO
    webPage: {
      id: 'webPage',
      type: 'text',
      label: 'Страница / раздел сайта',
      required: true,
      placeholder: {
        'site':        'https://site.ru/contacts или «Страница каталога товаров»',
        'integration': 'Страница на сайте, которую затрагивает интеграция',
        'default':     'URL или название раздела',
      },
    },

    webDevices: {
      id: 'webDevices',
      type: 'text',
      label: 'Устройства и браузеры',
      required: false,
      placeholder: {
        default: 'Только ПК? Мобильные тоже? Chrome / Firefox / Safari — что важно?',
      },
    },

    webLayout: {
      id: 'webLayout',
      type: 'file-hint',
      label: 'Макет / референс',
      note: '📎 Прикрепи Figma-ссылку, скриншот или ссылку на сайт-референс.\nЧем точнее макет — тем меньше итераций.',
    },

  }, // end FIELDS


  // ─── Шаги визарда ─────────────────────────────────────────────────────────
  //
  // Каждый шаг:
  //   id         — уникальный идентификатор шага
  //   title      — заголовок (может быть функцией от state)
  //   hint       — подсказка
  //   fields     — массив id полей (из FIELDS) или объект с логикой
  //   next       — id следующего шага или функция(state) → id

  STEPS: [

    {
      id: 'taskType',
      title: 'Что нужно сделать?',
      hint: 'Выбери тип задачи. От этого зависит, какую информацию нужно будет заполнить.',
      type: 'choice',
      stateKey: 'taskType',
      choices: [
        { value: 'bug',     icon: '🐛', label: 'Ошибка / баг',           desc: 'Что-то сломалось, не работает, ведёт себя неожиданно' },
        { value: 'feature', icon: '⚡', label: 'Новый функционал / доработка', desc: 'Хочу новую фичу, отчёт, форму или изменение в логике' },
      ],
      next: () => 'system',
    },

    {
      id: 'system',
      title: (state) => state.taskType === 'bug' ? 'Где возникла проблема?' : 'В какой системе нужна разработка?',
      hint: (state) => state.taskType === 'bug'
        ? 'Выбери систему, в которой возникла ошибка.'
        : 'Выбери систему, в которой нужна разработка.',
      type: 'choice',
      stateKey: 'system',
      choicesKey: 'SYSTEMS', // ссылка на CONFIG.SYSTEMS
      next: (state) => state.taskType === 'bug' ? 'bugDetails' : 'featureType',
    },

    {
      id: 'featureType',
      title: 'Что нужно разработать?',
      hint: 'Выбери вид разработки. Это определит, какие детали потребуются.',
      type: 'choice',
      stateKey: 'featureType',
      choicesKey: 'FEATURE_TYPES', // фильтруются по state.system
      next: () => 'featureDetails',
    },

    {
      id: 'bugDetails',
      title: 'Описание ошибки',
      hint: 'Чем подробнее — тем быстрее исправим.',
      type: 'form',
      fields: [
        { section: 'Основное' },
        'taskTitle',
        'bugWhere',
        'bugErrorText',
        { section: 'Воспроизведение' },
        'bugSteps',
        'bugFrequency',
        'bugWhoAffected',
        'bugWhoName',
        { section: 'Окружение' },
        'bugEnvironment',
        'bugExpected',
        { section: 'Прочее' },
        'bugPriority',
        'bugAttachments',
        'bugComment',
      ],
      next: null, // финальный шаг — генерация результата
    },

    {
      id: 'featureDetails',
      title: 'Детали задачи',
      hint: 'Чем точнее опишешь — тем меньше итераций.',
      type: 'form',
      // fields динамические — определяются в StepManager на основе featureType
      fields: 'dynamic',
      next: null,
    },

  ],

  // ─── Динамические поля для каждого типа разработки ────────────────────────
  // Используются в шаге featureDetails

  FEATURE_DETAIL_FIELDS: {
    bp: [
      { section: 'Суть задачи' },
      'taskTitle',
      'featureWhy',
      'featureNowWant',
      { section: 'Бизнес-процесс' },
      'bpParticipants',
      'bpTrigger',
      'bpSteps',
      'bpBpmnHint',
      { section: 'Приёмка' },
      'featureCriteria',
      'featureAcceptor',
      'featureDeadline',
      'featurePriority',
      { section: 'Прочее' },
      'featureComment',
    ],
    report: [
      { section: 'Суть задачи' },
      'taskTitle',
      'featureWhy',
      'featureNowWant',
      { section: 'Параметры отчёта' },
      'reportSource',
      'reportColumns',
      'reportFilters',
      'reportExample',
      { section: 'Приёмка' },
      'featureCriteria',
      'featureAcceptor',
      'featureDeadline',
      'featurePriority',
      { section: 'Прочее' },
      'featureComment',
    ],
    printform: [
      { section: 'Суть задачи' },
      'taskTitle',
      'featureWhy',
      'featureNowWant',
      { section: 'Печатная форма' },
      'printformType',
      'printformSource',
      'printformContent',
      'printformExample',
      { section: 'Приёмка' },
      'featureCriteria',
      'featureAcceptor',
      'featureDeadline',
      'featurePriority',
      { section: 'Прочее' },
      'featureComment',
    ],
    processing: [
      { section: 'Суть задачи' },
      'taskTitle',
      'featureWhy',
      'featureNowWant',
      { section: 'Доработка логики' },
      'processingWhat',
      'processingConditions',
      { section: 'Приёмка' },
      'featureCriteria',
      'featureAcceptor',
      'featureDeadline',
      'featurePriority',
      { section: 'Прочее' },
      'featureComment',
    ],
    layout: [
      { section: 'Суть задачи' },
      'taskTitle',
      'featureWhy',
      'featureNowWant',
      { section: 'Веб-разработка' },
      'webPage',
      'webDevices',
      'webLayout',
      { section: 'Приёмка' },
      'featureCriteria',
      'featureAcceptor',
      'featureDeadline',
      'featurePriority',
      { section: 'Прочее' },
      'featureComment',
    ],
    'web-feature': [
      { section: 'Суть задачи' },
      'taskTitle',
      'featureWhy',
      'featureNowWant',
      { section: 'Веб-разработка' },
      'webPage',
      'webDevices',
      'webLayout',
      { section: 'Приёмка' },
      'featureCriteria',
      'featureAcceptor',
      'featureDeadline',
      'featurePriority',
      { section: 'Прочее' },
      'featureComment',
    ],
    seo: [
      { section: 'Суть задачи' },
      'taskTitle',
      'featureWhy',
      'featureNowWant',
      { section: 'Веб / SEO' },
      'webPage',
      'webDevices',
      { section: 'Приёмка' },
      'featureCriteria',
      'featureAcceptor',
      'featureDeadline',
      'featurePriority',
      { section: 'Прочее' },
      'featureComment',
    ],
    'other-feature': [
      { section: 'Суть задачи' },
      'taskTitle',
      'featureWhy',
      'featureNowWant',
      { section: 'Приёмка' },
      'featureCriteria',
      'featureAcceptor',
      'featureDeadline',
      'featurePriority',
      { section: 'Прочее' },
      'featureComment',
    ],
  },

  // ─── Лейблы для итогового текста ──────────────────────────────────────────

  RESULT_LABELS: {
    taskType:   { bug: '🐛 Ошибка / баг', feature: '⚡ Разработка / доработка' },
    system:     { '1c': '1С', site: 'Сайт / веб', integration: 'Интеграция 1С ↔ Сайт', other: 'Другое' },
    featureType: {
      bp: 'Бизнес-процесс',
      report: 'Отчёт',
      printform: 'Печатная форма',
      processing: 'Обработка / доработка логики',
      layout: 'Вёрстка / дизайн',
      'web-feature': 'Новый функционал',
      seo: 'SEO / технические изменения',
      'other-feature': 'Другое',
    },
    priority: {
      low: '🟢 Низкий',
      medium: '🟡 Средний',
      high: '🟠 Высокий',
      critical: '🔴 Критичный',
    },
    bugFrequency: {
      always: 'Всегда (100%)',
      often: 'Часто (больше половины случаев)',
      sometimes: 'Иногда (непредсказуемо)',
      once: 'Произошло один раз',
    },
    bugWhoAffected: {
      all: 'Все пользователи',
      role: 'Определённая роль / группа',
      one: 'Конкретный пользователь',
    },
  },

};
