/**
 * app.js — Логика конструктора ТЗ
 *
 * Классы:
 *  Storage       — обёртка над localStorage с защитой от ошибок
 *  State         — единое хранилище данных формы (с автосохранением)
 *  Validator     — валидация полей
 *  FieldRenderer — рендер полей на основе конфига
 *  StepManager   — управление шагами визарда (с восстановлением шага)
 *  ResultBuilder — сборка итогового текста задачи
 *  FormWizard    — точка входа, связывает всё вместе
 */


// ─────────────────────────────────────────────────────────────────────────────
// Storage — обёртка над localStorage
//
// Зачем отдельный класс: localStorage может быть недоступен (приватный режим
// браузера, квота заполнена, политики безопасности). Обёртка изолирует эти
// ситуации — при любой ошибке приложение продолжает работать, просто без
// сохранения.
// ─────────────────────────────────────────────────────────────────────────────

class Storage {
  static KEY = 'tz_constructor_state';

  /** Сохраняет объект в localStorage */
  static save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      // Тихо игнорируем — приложение работает без сохранения
      console.warn('Storage.save: не удалось сохранить состояние', e);
    }
  }

  /** Загружает объект из localStorage. Возвращает null если ничего нет. */
  static load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Storage.load: не удалось загрузить состояние', e);
      return null;
    }
  }

  /** Удаляет сохранённое состояние */
  static clear() {
    try {
      localStorage.removeItem(this.KEY);
    } catch (e) {
      console.warn('Storage.clear: не удалось очистить состояние', e);
    }
  }

  /** Проверяет, есть ли сохранённые данные */
  static hasSavedData() {
    return this.load() !== null;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// State — единое хранилище состояния формы
//
// Автоматически сохраняет данные в localStorage при каждом set().
// При создании можно передать начальные данные (для восстановления).
// ─────────────────────────────────────────────────────────────────────────────

class State {
  constructor(initialData = null) {
    this._data = {
      taskType:       null,  // 'bug' | 'feature'
      system:         null,  // '1c' | 'site' | 'integration' | 'other'
      featureType:    null,  // 'bp' | 'report' | 'printform' | ...
      priority:       null,  // 'low' | 'medium' | 'high' | 'critical'
      // Значения полей формы хранятся по id поля из CONFIG.FIELDS
    };
    this._listeners = [];

    // Восстанавливаем данные если переданы (например, из localStorage)
    if (initialData) {
      Object.assign(this._data, initialData);
    }
  }

  get(key) {
    return this._data[key] ?? null;
  }

  set(key, value) {
    this._data[key] = value;
    this._listeners.forEach(fn => fn(key, value));
    // Автосохранение при каждом изменении
    Storage.save(this._data);
  }

  // Получить все данные для генерации результата
  getAll() {
    return { ...this._data };
  }

  onChange(fn) {
    this._listeners.push(fn);
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Validator — валидация полей
// ─────────────────────────────────────────────────────────────────────────────

class Validator {
  /**
   * Проверяет одно поле. Возвращает true если поле валидно.
   * @param {HTMLElement} fieldEl — элемент поля (input, textarea, select)
   * @param {Object} fieldConfig  — конфиг поля из CONFIG.FIELDS
   * @param {State} state
   */
  static validateField(fieldEl, fieldConfig, state) {
    if (!fieldConfig.required) return true;

    // Поля с showWhen, которые сейчас скрыты — не валидируем
    if (fieldConfig.showWhen && !fieldConfig.showWhen(state.getAll())) return true;

    const value = fieldEl ? fieldEl.value.trim() : '';
    const isValid = value.length > 0;

    const wrapper = document.getElementById(`field-wrapper-${fieldConfig.id}`);
    if (wrapper) {
      wrapper.classList.toggle('invalid', !isValid);
    }

    return isValid;
  }

  /**
   * Валидирует все поля шага. Возвращает true если все валидны.
   * @param {string[]} fieldIds — массив id полей
   * @param {State} state
   */
  static validateStep(fieldIds, state) {
    let allValid = true;

    fieldIds.forEach(fieldId => {
      if (typeof fieldId !== 'string') return; // пропускаем { section: '...' }

      const fieldConfig = CONFIG.FIELDS[fieldId];
      if (!fieldConfig || fieldConfig.type === 'file-hint') return;

      const fieldEl = document.getElementById(`field-${fieldId}`);
      const isValid = this.validateField(fieldEl, fieldConfig, state);
      if (!isValid) allValid = false;
    });

    return allValid;
  }

  /**
   * Убирает ошибку с поля при вводе (blur-валидация)
   */
  static clearOnFocus(fieldEl, fieldConfig, state) {
    const events = ['input', 'change', 'blur'];
    events.forEach(eventName => {
      fieldEl.addEventListener(eventName, () => {
        if (eventName === 'blur' || fieldEl.value.trim().length > 0) {
          this.validateField(fieldEl, fieldConfig, state);
        }
      });
    });
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// FieldRenderer — рендерит поля формы на основе конфига
// ─────────────────────────────────────────────────────────────────────────────

class FieldRenderer {
  constructor(state) {
    this.state = state;
  }

  /**
   * Получает placeholder для поля с учётом текущего контекста (type + system)
   */
  getPlaceholder(fieldConfig) {
    const ph = fieldConfig.placeholder;
    if (!ph) return '';

    // Простая строка — возвращаем как есть
    if (typeof ph === 'string') return ph;

    const taskType = this.state.get('taskType');
    const system   = this.state.get('system');

    // Placeholder зависит от taskType (bug/feature), потом от system
    if (ph[taskType]) {
      const byType = ph[taskType];
      if (typeof byType === 'string') return byType;
      return byType[system] || byType['default'] || '';
    }

    // Placeholder зависит только от system
    return ph[system] || ph['default'] || '';
  }

  /**
   * Рендерит одно поле и возвращает HTML-строку
   */
  renderField(fieldId) {
    const config = CONFIG.FIELDS[fieldId];
    if (!config) {
      console.warn(`FieldRenderer: поле "${fieldId}" не найдено в CONFIG.FIELDS`);
      return '';
    }

    const isRequired = config.required;
    const placeholder = this.getPlaceholder(config);
    const label = config.label;

    // Метка обязательности
    const reqMark = isRequired
      ? `<span class="field-req" title="Обязательное поле">★</span>`
      : `<span class="field-opt">(необязательно)</span>`;

    // Само поле
    let inputHtml = '';
    switch (config.type) {
      case 'text':
        inputHtml = `<input
          type="text"
          id="field-${config.id}"
          placeholder="${this._escapeAttr(placeholder)}"
          autocomplete="off"
        >`;
        break;

      case 'textarea':
        const minH = config.minHeight || '90px';
        inputHtml = `<textarea
          id="field-${config.id}"
          placeholder="${this._escapeAttr(placeholder)}"
          style="min-height:${minH}"
        ></textarea>`;
        break;

      case 'select':
        const options = config.options.map(opt =>
          `<option value="${opt.value}">${opt.label}</option>`
        ).join('');
        inputHtml = `<select id="field-${config.id}">${options}</select>`;
        break;

      case 'priority':
        // Приоритет рендерится отдельно через renderPriorityField
        inputHtml = this._renderPriorityButtons(config);
        break;

      case 'file-hint':
        return `
          <div class="field-group" id="field-wrapper-${config.id}">
            <label>${label}</label>
            <div class="field-note">${this._escapeHtml(config.note || '').replace(/\n/g, '<br>')}</div>
          </div>`;
    }

    return `
      <div class="field-group" id="field-wrapper-${config.id}">
        <label for="field-${config.id}">${label} ${reqMark}</label>
        ${inputHtml}
        <div class="field-error">Заполни это поле</div>
      </div>`;
  }

  /**
   * Рендерит секцию заголовка
   */
  renderSection(title) {
    return `<div class="section-label">// ${title}</div>`;
  }

  /**
   * Рендерит список полей (массив id + секции)
   */
  renderFields(fieldList) {
    return fieldList.map(item => {
      if (typeof item === 'object' && item.section) {
        return this.renderSection(item.section);
      }
      return this.renderField(item);
    }).join('');
  }

  /**
   * Рендерит кнопки выбора приоритета
   */
  _renderPriorityButtons(config) {
    const buttons = CONFIG.PRIORITY_LEVELS.map(p =>
      `<button type="button" class="priority-btn ${p.cssClass}" data-value="${p.value}">${p.label}</button>`
    ).join('');

    return `
      <div class="priority-group" id="field-${config.id}">
        ${buttons}
      </div>
      <div class="field-note">
        Критичный — система полностью не работает, бизнес остановлен.<br>
        Высокий — серьёзная проблема, но есть обходной путь.
      </div>`;
  }

  _escapeAttr(str) {
    return str.replace(/"/g, '&quot;').replace(/\n/g, '&#10;');
  }

  _escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// StepManager — управляет шагами визарда
// ─────────────────────────────────────────────────────────────────────────────

class StepManager {
  constructor(state, fieldRenderer) {
    this.state = state;
    this.fieldRenderer = fieldRenderer;
    this.container = document.getElementById('wizard-container');
    this.progressEl = document.getElementById('progress');

    // Восстанавливаем историю шагов из сохранённого состояния,
    // либо начинаем с первого шага
    const savedHistory = state.get('_stepHistory');
    this.history = (Array.isArray(savedHistory) && savedHistory.length > 0)
      ? savedHistory
      : ['taskType'];
  }

  /**
   * Сохраняет историю шагов — вызывается при каждой навигации
   */
  _persistHistory() {
    this.state.set('_stepHistory', this.history);
  }

  // Текущий шаг
  get currentStepId() {
    return this.history[this.history.length - 1];
  }

  // Конфиг текущего шага
  get currentStepConfig() {
    return CONFIG.STEPS.find(s => s.id === this.currentStepId);
  }

  // Всего шагов в текущем пути
  get totalSteps() {
    return this.state.get('taskType') === 'bug' ? 3 : 4;
  }

  /**
   * Переходит на следующий шаг
   * @returns {boolean} false если есть ошибки валидации
   */
  next() {
    const step = this.currentStepConfig;

    // Валидируем поля текущего шага
    if (step.type === 'form') {
      const fieldList = this._getFieldList(step);
      const fieldIds = fieldList.filter(f => typeof f === 'string');
      if (!Validator.validateStep(fieldIds, this.state)) {
        this._scrollToFirstError();
        return false;
      }
    }

    const nextId = typeof step.next === 'function'
      ? step.next(this.state.getAll())
      : step.next;

    if (!nextId) {
      // Финальный шаг — генерируем результат
      this._showResult();
      return true;
    }

    this.history.push(nextId);
    this._persistHistory();
    this._render();
    return true;
  }

  /**
   * Возвращается на предыдущий шаг
   */
  back() {
    if (this.history.length <= 1) return;
    this.history.pop();
    this._persistHistory();
    this._render();
  }

  /**
   * Рендерит текущий шаг
   */
  _render() {
    const step = this.currentStepConfig;
    const title = typeof step.title === 'function'
      ? step.title(this.state.getAll())
      : step.title;
    const hint = typeof step.hint === 'function'
      ? step.hint(this.state.getAll())
      : step.hint;

    const stepNum = this.history.length;
    const total = this.totalSteps;

    let bodyHtml = '';

    if (step.type === 'choice') {
      bodyHtml = this._renderChoiceStep(step);
    } else if (step.type === 'form') {
      bodyHtml = this._renderFormStep(step);
    }

    // Кнопки навигации
    const backBtn = this.history.length > 1
      ? `<button class="btn-back" id="btn-back">← Назад</button>`
      : '';

    const isFormStep = step.type === 'form';
    const nextLabel = isFormStep ? 'Сформировать ТЗ →' : 'Далее →';
    const nextDisabled = step.type === 'choice' ? 'disabled' : '';
    const nextBtn = `<button class="btn-next" id="btn-next" ${nextDisabled}>${nextLabel}</button>`;

    this.container.innerHTML = `
      <div class="step active">
        <div class="step-number">Шаг ${stepNum} из ${total}</div>
        <div class="step-title">${title}</div>
        <div class="step-hint">${hint}</div>
        ${bodyHtml}
        <div class="nav">
          ${backBtn}
          ${nextBtn}
        </div>
      </div>`;

    this._updateProgress(stepNum, total);
    this._bindStepEvents(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * Рендерит шаг с выбором варианта
   */
  _renderChoiceStep(step) {
    let choices = [];

    if (step.choices) {
      // Inline-варианты
      choices = step.choices;
    } else if (step.choicesKey === 'SYSTEMS') {
      choices = CONFIG.SYSTEMS;
    } else if (step.choicesKey === 'FEATURE_TYPES') {
      // Фильтруем по текущей системе
      const system = this.state.get('system');
      choices = CONFIG.FEATURE_TYPES.filter(ft => ft.availableFor.includes(system));
    }

    const items = choices.map(c => `
      <div class="choice" data-value="${c.value}">
        <div class="choice-icon">${c.icon}</div>
        <div>
          <div class="choice-label">${c.label}</div>
          <div class="choice-desc">${c.desc}</div>
        </div>
      </div>`).join('');

    return `<div class="choices">${items}</div>`;
  }

  /**
   * Рендерит шаг с формой
   */
  _renderFormStep(step) {
    const fieldList = this._getFieldList(step);
    return `<div class="fields">${this.fieldRenderer.renderFields(fieldList)}</div>`;
  }

  /**
   * Получает список полей для шага (с учётом динамических)
   */
  _getFieldList(step) {
    if (step.fields === 'dynamic') {
      const featureType = this.state.get('featureType');
      return CONFIG.FEATURE_DETAIL_FIELDS[featureType] || [];
    }
    return step.fields || [];
  }

  /**
   * Вешает события на элементы текущего шага
   */
  _bindStepEvents(step) {
    // Кнопка "Далее"
    const btnNext = document.getElementById('btn-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => this.next());
    }

    // Кнопка "Назад"
    const btnBack = document.getElementById('btn-back');
    if (btnBack) {
      btnBack.addEventListener('click', () => this.back());
    }

    // Выборы (choice step)
    if (step.type === 'choice') {
      document.querySelectorAll('.choice').forEach(el => {
        el.addEventListener('click', () => {
          document.querySelectorAll('.choice').forEach(c => c.classList.remove('selected'));
          el.classList.add('selected');

          // Сохраняем в state
          this.state.set(step.stateKey, el.dataset.value);

          // Активируем кнопку "Далее"
          if (btnNext) btnNext.disabled = false;
        });
      });
    }

    // Поля формы
    if (step.type === 'form') {
      const fieldList = this._getFieldList(step);

      fieldList.forEach(item => {
        if (typeof item !== 'string') return;

        const fieldConfig = CONFIG.FIELDS[item];
        if (!fieldConfig || fieldConfig.type === 'file-hint') return;

        const fieldEl = document.getElementById(`field-${fieldConfig.id}`);
        if (!fieldEl) return;

        // Сохраняем значение в state при изменении
        fieldEl.addEventListener('input', () => {
          this.state.set(fieldConfig.id, fieldEl.value);
        });
        fieldEl.addEventListener('change', () => {
          this.state.set(fieldConfig.id, fieldEl.value);
        });

        // Blur-валидация
        Validator.clearOnFocus(fieldEl, fieldConfig, this.state);

        // Для bugWhoAffected — показываем/скрываем поле bugWhoName
        if (fieldConfig.id === 'bugWhoAffected') {
          fieldEl.addEventListener('change', () => {
            this._toggleConditionalFields(fieldList);
          });
        }

        // Восстанавливаем сохранённое значение
        const savedValue = this.state.get(fieldConfig.id);
        if (savedValue !== null) {
          fieldEl.value = savedValue;
        }
      });

      // Кнопки приоритета
      document.querySelectorAll('.priority-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.priority-btn').forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.state.set('priority', btn.dataset.value);
        });
      });

      // Восстанавливаем приоритет
      const savedPriority = this.state.get('priority');
      if (savedPriority) {
        const activeBtn = document.querySelector(`.priority-btn[data-value="${savedPriority}"]`);
        if (activeBtn) activeBtn.classList.add('selected');
      }

      // Инициализируем видимость условных полей
      this._toggleConditionalFields(fieldList);
    }
  }

  /**
   * Показывает / скрывает поля с условием showWhen
   */
  _toggleConditionalFields(fieldList) {
    fieldList.forEach(item => {
      if (typeof item !== 'string') return;

      const fieldConfig = CONFIG.FIELDS[item];
      if (!fieldConfig || !fieldConfig.showWhen) return;

      const wrapper = document.getElementById(`field-wrapper-${fieldConfig.id}`);
      if (!wrapper) return;

      const isVisible = fieldConfig.showWhen(this.state.getAll());
      wrapper.style.display = isVisible ? '' : 'none';
    });
  }

  _updateProgress(current, total) {
    const pct = Math.round((current / (total + 1)) * 100);
    if (this.progressEl) this.progressEl.style.width = `${pct}%`;
  }

  _scrollToFirstError() {
    const firstError = document.querySelector('.field-group.invalid');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  _showResult() {
    const text = ResultBuilder.build(this.state);
    document.getElementById('result-text').textContent = text;
    this.container.style.display = 'none';
    document.getElementById('result-screen').style.display = 'block';
    if (this.progressEl) this.progressEl.style.width = '100%';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// ResultBuilder — собирает итоговый текст задачи для Битрикс24
// ─────────────────────────────────────────────────────────────────────────────

class ResultBuilder {
  /**
   * Строит итоговый текст на основе state
   * @param {State} state
   * @returns {string}
   */
  static build(state) {
    const s = state.getAll();
    const L = CONFIG.RESULT_LABELS;

    const line   = (label, value) => value ? `${label}: ${value}\n` : '';
    const section = (title)       => `\n━━━ ${title} ━━━\n`;
    const val    = (key)          => (s[key] || '').trim();

    let text = '';

    // Шапка
    text += `📌 ЗАДАЧА: ${val('taskTitle')}\n`;
    text += line('Тип',     L.taskType[s.taskType]);
    text += line('Система', L.system[s.system]);
    if (s.taskType === 'feature') {
      text += line('Вид работы', L.featureType[s.featureType]);
    }
    text += line('Приоритет', L.priority[s.priority] || '—');

    if (s.taskType === 'bug') {
      text += this._buildBugResult(s, section, line, val);
    } else {
      text += this._buildFeatureResult(s, section, line, val);
    }

    text += '\n\n⚠️ Задача создана через конструктор ТЗ.';
    text += '\n   Маршрут: поддержка (первая линия) → разработка.';

    return text;
  }

  static _buildBugResult(s, section, line, val) {
    let text = '';

    text += section('ОПИСАНИЕ ОШИБКИ');
    text += line('Где возникает', val('bugWhere'));
    text += '\nТекст ошибки:\n' + (val('bugErrorText') || '—') + '\n';

    text += section('ВОСПРОИЗВЕДЕНИЕ');
    text += 'Шаги:\n' + (val('bugSteps') || '—') + '\n';
    text += line('\nЧастота', CONFIG.RESULT_LABELS.bugFrequency[s.bugFrequency]);

    let whoStr = CONFIG.RESULT_LABELS.bugWhoAffected[s.bugWhoAffected] || '—';
    if ((s.bugWhoAffected === 'role' || s.bugWhoAffected === 'one') && val('bugWhoName')) {
      whoStr += ': ' + val('bugWhoName');
    }
    text += line('Затронуты', whoStr);

    if (val('bugEnvironment')) text += line('Окружение', val('bugEnvironment'));

    text += section('ОЖИДАЕМОЕ ПОВЕДЕНИЕ');
    text += (val('bugExpected') || '—') + '\n';

    if (val('bugComment')) {
      text += section('ДОПОЛНИТЕЛЬНО');
      text += val('bugComment') + '\n';
    }

    text += section('ВЛОЖЕНИЯ');
    text += '[ ] Скриншоты с ошибкой\n';
    text += '[ ] Запись экрана (если поможет)\n';

    return text;
  }

  static _buildFeatureResult(s, section, line, val) {
    let text = '';

    if (val('featureDeadline')) text += line('Дедлайн', val('featureDeadline'));
    if (val('featureAcceptor')) text += line('Принимает', val('featureAcceptor'));

    text += section('БИЗНЕС-ОБОСНОВАНИЕ');
    text += (val('featureWhy') || '—') + '\n';

    text += section('ТЕКУЩЕЕ СОСТОЯНИЕ → ЦЕЛЬ');
    text += (val('featureNowWant') || '—') + '\n';

    // Специфичные блоки по типу разработки
    const ft = s.featureType;

    if (ft === 'bp') {
      text += section('БИЗНЕС-ПРОЦЕСС');
      text += line('Участники', val('bpParticipants'));
      text += line('Триггер', val('bpTrigger'));
      if (val('bpSteps')) text += '\nШаги процесса:\n' + val('bpSteps') + '\n';
      text += '\n📎 Схема BPMN: [ ] прикреплена к задаче (ОБЯЗАТЕЛЬНО)\n';
    }

    if (ft === 'report') {
      text += section('ПАРАМЕТРЫ ОТЧЁТА');
      text += line('Источник данных', val('reportSource'));
      if (val('reportColumns')) text += '\nКолонки:\n' + val('reportColumns') + '\n';
      if (val('reportFilters')) text += '\nФильтры / группировки:\n' + val('reportFilters') + '\n';
      text += '\n📎 Пример структуры (Excel / скриншот): [ ] прикреплён к задаче\n';
    }

    if (ft === 'printform') {
      text += section('ПЕЧАТНАЯ ФОРМА');
      text += line('Тип документа', val('printformType'));
      text += line('Документ-источник в 1С', val('printformSource'));
      if (val('printformContent')) text += '\nСодержимое:\n' + val('printformContent') + '\n';
      text += '\n📎 Образец документа: [ ] прикреплён к задаче (ОБЯЗАТЕЛЬНО)\n';
    }

    if (ft === 'processing') {
      text += section('ДОРАБОТКА ЛОГИКИ');
      if (val('processingWhat')) text += 'Что изменить:\n' + val('processingWhat') + '\n';
      if (val('processingConditions')) text += '\nУсловия / исключения:\n' + val('processingConditions') + '\n';
    }

    if (['layout', 'web-feature', 'seo'].includes(ft)) {
      text += section('ВЕБ-РАЗРАБОТКА');
      text += line('Страница / раздел', val('webPage'));
      if (val('webDevices')) text += line('Устройства', val('webDevices'));
      text += '📎 Макет / референс: [ ] прикреплён к задаче\n';
    }

    text += section('КРИТЕРИИ ПРИЁМКИ');
    text += (val('featureCriteria') || '—') + '\n';

    if (val('featureComment')) {
      text += section('ДОПОЛНИТЕЛЬНО');
      text += val('featureComment') + '\n';
    }

    return text;
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// FormWizard — точка входа, инициализирует приложение
// ─────────────────────────────────────────────────────────────────────────────

class FormWizard {
  constructor() {
    // Пытаемся восстановить сохранённое состояние из localStorage.
    // Если данных нет — начинаем с чистого листа.
    const savedData = Storage.load();
    this.state         = new State(savedData);
    this.fieldRenderer = new FieldRenderer(this.state);
    this.stepManager   = new StepManager(this.state, this.fieldRenderer);
  }

  init() {
    // Если было сохранённое состояние — показываем баннер восстановления
    if (Storage.hasSavedData()) {
      this._showRestoredBanner();
    }

    this.stepManager._render();
    this._bindResultButtons();
  }

  /**
   * Показывает одноразовый баннер «Данные восстановлены»
   */
  _showRestoredBanner() {
    const banner = document.createElement('div');
    banner.className = 'restore-banner';
    banner.innerHTML = `
      <span>♻️ Черновик восстановлен — продолжай с того места, где остановился</span>
      <button class="restore-dismiss" title="Закрыть">✕</button>
    `;

    const container = document.querySelector('.container');
    const progressBar = document.querySelector('.progress-bar');
    container.insertBefore(banner, progressBar);

    // Закрытие по кнопке
    banner.querySelector('.restore-dismiss').addEventListener('click', () => {
      banner.remove();
    });

    // Автоматически скрываем через 5 секунд
    setTimeout(() => banner.remove(), 5000);
  }

  _bindResultButtons() {
    // Кнопка копирования
    document.getElementById('btn-copy').addEventListener('click', () => {
      const text = document.getElementById('result-text').textContent;
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btn-copy');
        btn.textContent = '✅ Скопировано!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = '📋 Скопировать текст';
          btn.classList.remove('copied');
        }, 2000);
      });
    });

    // Кнопка сброса — чистим localStorage и перезапускаем с нуля
    document.getElementById('btn-reset').addEventListener('click', () => {
      Storage.clear();
      this.state         = new State();
      this.fieldRenderer = new FieldRenderer(this.state);
      this.stepManager   = new StepManager(this.state, this.fieldRenderer);

      document.getElementById('result-screen').style.display = 'none';
      document.getElementById('wizard-container').style.display = 'block';
      this.stepManager._render();
      this._bindResultButtons();
    });
  }
}


// ─────────────────────────────────────────────────────────────────────────────
// Запуск
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  const wizard = new FormWizard();
  wizard.init();
});
