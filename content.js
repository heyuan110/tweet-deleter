// Tweet Deleter - Content Script
// 在 X/Twitter 页面中注入悬浮控制面板并执行删除操作

(function() {
  // 防止重复注入
  if (window.tweetDeleterInjected) {
    // 如果已注入，则切换面板显示状态
    togglePanel();
    return;
  }
  window.tweetDeleterInjected = true;

  // 状态管理
  let isDeleting = false;
  let shouldStop = false;
  let scannedTweets = [];
  let panelElement = null;
  let currentLang = 'zh_CN'; // 默认中文

  // 多语言翻译字典（7种语言）
  const i18n = {
    en: {
      title: 'Tweet Deleter',
      contentType: 'Content Type',
      tweets: 'Tweets',
      replies: 'Replies',
      reposts: 'Reposts',
      timeRange: 'Time Range',
      last7Days: '7 Days',
      last30Days: '30 Days',
      last3Months: '3 Months',
      last1Year: '1 Year',
      all: 'All',
      keywordFilter: 'Keyword Filter',
      keywordPlaceholder: 'Enter keywords, separated by commas',
      keywordHint: 'Only delete content with these keywords (leave empty to delete all)',
      excludeKeywords: 'Exclude content with keywords',
      advancedOptions: 'Advanced Options',
      deleteSpeed: 'Delete Speed',
      speedSlow: 'Slow (Safe)',
      speedNormal: 'Normal',
      speedFast: 'Fast (Risky)',
      batchSize: 'Batch Size',
      scanContent: '🔍 Scan Content',
      startDelete: '🗑️ Start Delete',
      stop: 'Stop',
      deletableItems: 'deletable items',
      deleteResult: 'Delete Result',
      total: 'Total',
      success: 'Success',
      failed: 'Failed',
      warningMessage: '⚠️ Deletion cannot be undone, use with caution',
      statusScanning: 'Scanning content...',
      statusDeleting: 'Deleting content...',
      statusComplete: 'Delete complete!',
      statusStopped: 'Stopped',
      deleted: 'Deleted',
      processed: 'Processed',
      unreposted: 'unreposted',
      minimize: 'Minimize',
      close: 'Close'
    },
    zh_CN: {
      title: 'Tweet Deleter',
      contentType: '内容类型',
      tweets: '推文',
      replies: '回复',
      reposts: '转发',
      timeRange: '时间范围',
      last7Days: '7天',
      last30Days: '30天',
      last3Months: '3个月',
      last1Year: '1年',
      all: '全部',
      keywordFilter: '关键词过滤',
      keywordPlaceholder: '输入关键词，用逗号分隔',
      keywordHint: '只删除包含这些关键词的内容（留空删除全部）',
      excludeKeywords: '排除包含关键词的内容',
      advancedOptions: '高级选项',
      deleteSpeed: '删除速度',
      speedSlow: '慢速 (安全)',
      speedNormal: '正常',
      speedFast: '快速 (有风险)',
      batchSize: '批次大小',
      scanContent: '🔍 扫描内容',
      startDelete: '🗑️ 开始删除',
      stop: '停止',
      deletableItems: '条可删除内容',
      deleteResult: '删除结果',
      total: '总计',
      success: '成功',
      failed: '失败',
      warningMessage: '⚠️ 删除操作不可撤销，请谨慎使用',
      statusScanning: '正在扫描内容...',
      statusDeleting: '正在删除内容...',
      statusComplete: '删除完成！',
      statusStopped: '已停止',
      deleted: '已删除',
      processed: '已处理',
      unreposted: '个取消转发',
      minimize: '最小化',
      close: '关闭'
    },
    zh_TW: {
      title: 'Tweet Deleter',
      contentType: '內容類型',
      tweets: '推文',
      replies: '回覆',
      reposts: '轉發',
      timeRange: '時間範圍',
      last7Days: '7天',
      last30Days: '30天',
      last3Months: '3個月',
      last1Year: '1年',
      all: '全部',
      keywordFilter: '關鍵詞過濾',
      keywordPlaceholder: '輸入關鍵詞，用逗號分隔',
      keywordHint: '只刪除包含這些關鍵詞的內容（留空刪除全部）',
      excludeKeywords: '排除包含關鍵詞的內容',
      advancedOptions: '進階選項',
      deleteSpeed: '刪除速度',
      speedSlow: '慢速 (安全)',
      speedNormal: '正常',
      speedFast: '快速 (有風險)',
      batchSize: '批次大小',
      scanContent: '🔍 掃描內容',
      startDelete: '🗑️ 開始刪除',
      stop: '停止',
      deletableItems: '條可刪除內容',
      deleteResult: '刪除結果',
      total: '總計',
      success: '成功',
      failed: '失敗',
      warningMessage: '⚠️ 刪除操作不可撤銷，請謹慎使用',
      statusScanning: '正在掃描內容...',
      statusDeleting: '正在刪除內容...',
      statusComplete: '刪除完成！',
      statusStopped: '已停止',
      deleted: '已刪除',
      processed: '已處理',
      unreposted: '個取消轉發',
      minimize: '最小化',
      close: '關閉'
    },
    ja: {
      title: 'Tweet Deleter',
      contentType: 'コンテンツタイプ',
      tweets: 'ツイート',
      replies: '返信',
      reposts: 'リポスト',
      timeRange: '期間',
      last7Days: '7日',
      last30Days: '30日',
      last3Months: '3ヶ月',
      last1Year: '1年',
      all: '全て',
      keywordFilter: 'キーワードフィルター',
      keywordPlaceholder: 'カンマで区切ってキーワードを入力',
      keywordHint: 'これらのキーワードを含むコンテンツのみ削除（空欄で全て削除）',
      excludeKeywords: 'キーワードを含むコンテンツを除外',
      advancedOptions: '詳細オプション',
      deleteSpeed: '削除速度',
      speedSlow: '遅い（安全）',
      speedNormal: '普通',
      speedFast: '速い（リスクあり）',
      batchSize: 'バッチサイズ',
      scanContent: '🔍 スキャン',
      startDelete: '🗑️ 削除開始',
      stop: '停止',
      deletableItems: '件の削除可能なコンテンツ',
      deleteResult: '削除結果',
      total: '合計',
      success: '成功',
      failed: '失敗',
      warningMessage: '⚠️ 削除は取り消せません、ご注意ください',
      statusScanning: 'スキャン中...',
      statusDeleting: '削除中...',
      statusComplete: '削除完了！',
      statusStopped: '停止しました',
      deleted: '削除済み',
      processed: '処理済み',
      unreposted: '件のリポスト解除',
      minimize: '最小化',
      close: '閉じる'
    },
    fr: {
      title: 'Tweet Deleter',
      contentType: 'Type de Contenu',
      tweets: 'Tweets',
      replies: 'Réponses',
      reposts: 'Reposts',
      timeRange: 'Plage de Temps',
      last7Days: '7 jours',
      last30Days: '30 jours',
      last3Months: '3 mois',
      last1Year: '1 an',
      all: 'Tout',
      keywordFilter: 'Filtre Mots-clés',
      keywordPlaceholder: 'Entrez les mots-clés, séparés par des virgules',
      keywordHint: 'Supprimer uniquement le contenu contenant ces mots-clés (vide = tout)',
      excludeKeywords: 'Exclure le contenu avec mots-clés',
      advancedOptions: 'Options Avancées',
      deleteSpeed: 'Vitesse de Suppression',
      speedSlow: 'Lent (Sûr)',
      speedNormal: 'Normal',
      speedFast: 'Rapide (Risqué)',
      batchSize: 'Taille du Lot',
      scanContent: '🔍 Scanner',
      startDelete: '🗑️ Supprimer',
      stop: 'Arrêter',
      deletableItems: 'éléments supprimables',
      deleteResult: 'Résultat',
      total: 'Total',
      success: 'Succès',
      failed: 'Échec',
      warningMessage: '⚠️ Les suppressions sont irréversibles, utilisez avec prudence',
      statusScanning: 'Analyse du contenu...',
      statusDeleting: 'Suppression en cours...',
      statusComplete: 'Suppression terminée!',
      statusStopped: 'Arrêté',
      deleted: 'Supprimé',
      processed: 'Traité',
      unreposted: 'reposts annulés',
      minimize: 'Réduire',
      close: 'Fermer'
    },
    es: {
      title: 'Tweet Deleter',
      contentType: 'Tipo de Contenido',
      tweets: 'Tweets',
      replies: 'Respuestas',
      reposts: 'Reposts',
      timeRange: 'Rango de Tiempo',
      last7Days: '7 días',
      last30Days: '30 días',
      last3Months: '3 meses',
      last1Year: '1 año',
      all: 'Todo',
      keywordFilter: 'Filtro de Palabras',
      keywordPlaceholder: 'Ingrese palabras clave, separadas por comas',
      keywordHint: 'Solo eliminar contenido con estas palabras (vacío = todo)',
      excludeKeywords: 'Excluir contenido con palabras clave',
      advancedOptions: 'Opciones Avanzadas',
      deleteSpeed: 'Velocidad de Eliminación',
      speedSlow: 'Lento (Seguro)',
      speedNormal: 'Normal',
      speedFast: 'Rápido (Riesgoso)',
      batchSize: 'Tamaño del Lote',
      scanContent: '🔍 Escanear',
      startDelete: '🗑️ Eliminar',
      stop: 'Detener',
      deletableItems: 'elementos eliminables',
      deleteResult: 'Resultado',
      total: 'Total',
      success: 'Éxito',
      failed: 'Fallido',
      warningMessage: '⚠️ Las eliminaciones no se pueden deshacer, use con precaución',
      statusScanning: 'Escaneando contenido...',
      statusDeleting: 'Eliminando contenido...',
      statusComplete: '¡Eliminación completada!',
      statusStopped: 'Detenido',
      deleted: 'Eliminado',
      processed: 'Procesado',
      unreposted: 'reposts cancelados',
      minimize: 'Minimizar',
      close: 'Cerrar'
    },
    de: {
      title: 'Tweet Deleter',
      contentType: 'Inhaltstyp',
      tweets: 'Tweets',
      replies: 'Antworten',
      reposts: 'Reposts',
      timeRange: 'Zeitbereich',
      last7Days: '7 Tage',
      last30Days: '30 Tage',
      last3Months: '3 Monate',
      last1Year: '1 Jahr',
      all: 'Alle',
      keywordFilter: 'Schlüsselwortfilter',
      keywordPlaceholder: 'Schlüsselwörter eingeben, durch Kommas getrennt',
      keywordHint: 'Nur Inhalte mit diesen Schlüsselwörtern löschen (leer = alles)',
      excludeKeywords: 'Inhalte mit Schlüsselwörtern ausschließen',
      advancedOptions: 'Erweiterte Optionen',
      deleteSpeed: 'Löschgeschwindigkeit',
      speedSlow: 'Langsam (Sicher)',
      speedNormal: 'Normal',
      speedFast: 'Schnell (Riskant)',
      batchSize: 'Stapelgröße',
      scanContent: '🔍 Scannen',
      startDelete: '🗑️ Löschen',
      stop: 'Stoppen',
      deletableItems: 'löschbare Elemente',
      deleteResult: 'Ergebnis',
      total: 'Gesamt',
      success: 'Erfolg',
      failed: 'Fehlgeschlagen',
      warningMessage: '⚠️ Löschvorgänge können nicht rückgängig gemacht werden',
      statusScanning: 'Inhalte werden gescannt...',
      statusDeleting: 'Inhalte werden gelöscht...',
      statusComplete: 'Löschen abgeschlossen!',
      statusStopped: 'Gestoppt',
      deleted: 'Gelöscht',
      processed: 'Verarbeitet',
      unreposted: 'Reposts rückgängig',
      minimize: 'Minimieren',
      close: 'Schließen'
    }
  };

  // 获取翻译文本
  function t(key) {
    return i18n[currentLang]?.[key] || i18n['en'][key] || key;
  }

  // 删除速度配置（毫秒）
  const SPEED_CONFIG = {
    slow: { deleteDelay: 1000, scrollDelay: 2000 },
    normal: { deleteDelay: 500, scrollDelay: 1500 },
    fast: { deleteDelay: 200, scrollDelay: 800 }
  };

  // 创建悬浮面板
  async function createPanel() {
    // 从 storage 加载语言设置
    try {
      const result = await chrome.storage.local.get('tweetDeleterLang');
      if (result.tweetDeleterLang) {
        currentLang = result.tweetDeleterLang;
      }
    } catch (e) {
      console.log('[Tweet Deleter] 无法加载语言设置');
    }

    // 注入 CSS
    const style = document.createElement('style');
    style.id = 'tweet-deleter-style';
    style.textContent = getPanelCSS();
    document.head.appendChild(style);

    // 创建面板 HTML
    const panel = document.createElement('div');
    panel.id = 'tweet-deleter-panel';
    panel.innerHTML = getPanelHTML();
    document.body.appendChild(panel);

    panelElement = panel;

    // 设置语言选择器的当前值
    const langSelect = document.getElementById('td-lang-select');
    if (langSelect) {
      langSelect.value = currentLang;
    }

    // 初始化事件
    initPanelEvents();
    initDraggable();

    return panel;
  }

  // 获取面板 HTML
  function getPanelHTML() {
    return `
      <div class="td-panel-header">
        <div class="td-panel-title">
          <span class="td-panel-title-icon">🗑️</span>
          <span data-i18n="title">Tweet Deleter</span>
        </div>
        <div class="td-panel-header-right">
          <select class="td-lang-select" id="td-lang-select" title="Language">
            <option value="zh_CN" selected>简体</option>
            <option value="zh_TW">繁體</option>
            <option value="en">EN</option>
            <option value="ja">日本語</option>
            <option value="fr">FR</option>
            <option value="es">ES</option>
            <option value="de">DE</option>
          </select>
          <div class="td-panel-actions">
            <button class="td-panel-btn-icon" id="td-btn-minimize" title="${t('minimize')}">−</button>
            <button class="td-panel-btn-icon" id="td-btn-close" title="${t('close')}">×</button>
          </div>
        </div>
      </div>
      <div class="td-panel-body">
        <!-- 内容类型 -->
        <div class="td-section">
          <div class="td-section-title" data-i18n="contentType">${t('contentType')}</div>
          <div class="td-checkbox-group">
            <label class="td-checkbox-item checked" data-type="tweets">
              <input type="checkbox" id="td-type-tweets" checked>
              <span data-i18n="tweets">${t('tweets')}</span>
            </label>
            <label class="td-checkbox-item" data-type="replies">
              <input type="checkbox" id="td-type-replies">
              <span data-i18n="replies">${t('replies')}</span>
            </label>
            <label class="td-checkbox-item" data-type="reposts">
              <input type="checkbox" id="td-type-reposts">
              <span data-i18n="reposts">${t('reposts')}</span>
            </label>
          </div>
        </div>

        <!-- 时间范围 -->
        <div class="td-section">
          <div class="td-section-title" data-i18n="timeRange">${t('timeRange')}</div>
          <div class="td-time-inputs">
            <input type="date" id="td-date-from">
            <input type="date" id="td-date-to">
          </div>
          <div class="td-quick-btns">
            <button class="td-quick-btn" data-range="7" data-i18n="last7Days">${t('last7Days')}</button>
            <button class="td-quick-btn" data-range="30" data-i18n="last30Days">${t('last30Days')}</button>
            <button class="td-quick-btn" data-range="90" data-i18n="last3Months">${t('last3Months')}</button>
            <button class="td-quick-btn" data-range="365" data-i18n="last1Year">${t('last1Year')}</button>
            <button class="td-quick-btn active" data-range="all" data-i18n="all">${t('all')}</button>
          </div>
        </div>

        <!-- 关键词过滤 -->
        <div class="td-section">
          <div class="td-section-title" data-i18n="keywordFilter">${t('keywordFilter')}</div>
          <input type="text" class="td-keyword-input" id="td-keywords" data-i18n-placeholder="keywordPlaceholder" placeholder="${t('keywordPlaceholder')}">
          <div class="td-hint" data-i18n="keywordHint">${t('keywordHint')}</div>
          <label class="td-checkbox-item" style="margin-top: 8px; background: transparent; border: none; padding: 0;">
            <input type="checkbox" id="td-exclude-keywords">
            <span style="margin-left: 4px;" data-i18n="excludeKeywords">${t('excludeKeywords')}</span>
          </label>
        </div>

        <!-- 高级选项 -->
        <div class="td-section td-collapsible">
          <div class="td-collapsible-header">
            <span class="td-section-title" style="margin: 0;" data-i18n="advancedOptions">${t('advancedOptions')}</span>
            <span class="td-arrow">▼</span>
          </div>
          <div class="td-collapsible-content">
            <div class="td-option-row">
              <label data-i18n="deleteSpeed">${t('deleteSpeed')}</label>
              <select id="td-speed">
                <option value="slow" data-i18n="speedSlow">${t('speedSlow')}</option>
                <option value="normal" selected data-i18n="speedNormal">${t('speedNormal')}</option>
                <option value="fast" data-i18n="speedFast">${t('speedFast')}</option>
              </select>
            </div>
            <div class="td-option-row">
              <label data-i18n="batchSize">${t('batchSize')}</label>
              <select id="td-batch-size">
                <option value="10">10</option>
                <option value="25" selected>25</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="td-actions">
          <button class="td-btn td-btn-secondary" id="td-btn-scan" data-i18n="scanContent">
            ${t('scanContent')}
          </button>
          <button class="td-btn td-btn-primary" id="td-btn-delete" disabled data-i18n="startDelete">
            ${t('startDelete')}
          </button>
        </div>

        <!-- 扫描结果 -->
        <div class="td-scan-result td-hidden" id="td-scan-result">
          <div class="td-count" id="td-scan-count">0</div>
          <div class="td-label" data-i18n="deletableItems">${t('deletableItems')}</div>
        </div>

        <!-- 进度 -->
        <div class="td-progress td-hidden" id="td-progress">
          <div class="td-progress-bar">
            <div class="td-progress-fill" id="td-progress-fill"></div>
          </div>
          <div class="td-progress-text">
            <span id="td-progress-text">${t('deleted')}: 0 / 0</span>
            <button class="td-btn td-btn-danger" id="td-btn-stop" style="padding: 4px 12px; font-size: 12px;" data-i18n="stop">${t('stop')}</button>
          </div>
        </div>

        <!-- 结果统计 -->
        <div class="td-result td-hidden" id="td-result">
          <div class="td-result-title" data-i18n="deleteResult">${t('deleteResult')}</div>
          <div class="td-result-stats">
            <div class="td-stat-item">
              <div class="td-stat-value total" id="td-stat-total">0</div>
              <div class="td-stat-label" data-i18n="total">${t('total')}</div>
            </div>
            <div class="td-stat-item">
              <div class="td-stat-value success" id="td-stat-success">0</div>
              <div class="td-stat-label" data-i18n="success">${t('success')}</div>
            </div>
            <div class="td-stat-item">
              <div class="td-stat-value failed" id="td-stat-failed">0</div>
              <div class="td-stat-label" data-i18n="failed">${t('failed')}</div>
            </div>
          </div>
        </div>

        <!-- 状态消息 -->
        <div class="td-status td-hidden" id="td-status"></div>
      </div>
      <div class="td-panel-footer" data-i18n="warningMessage">
        ${t('warningMessage')}
      </div>
    `;
  }

  // 更新界面语言
  function updatePanelLanguage() {
    // 更新所有带 data-i18n 属性的元素
    panelElement.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });

    // 更新带 data-i18n-placeholder 属性的输入框
    panelElement.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = t(key);
    });

    // 更新按钮 title
    document.getElementById('td-btn-minimize').title = t('minimize');
    document.getElementById('td-btn-close').title = t('close');

    // 更新速度选项
    const speedSelect = document.getElementById('td-speed');
    if (speedSelect) {
      speedSelect.options[0].textContent = t('speedSlow');
      speedSelect.options[1].textContent = t('speedNormal');
      speedSelect.options[2].textContent = t('speedFast');
    }

    // 保存语言偏好到 storage
    chrome.storage.local.set({ tweetDeleterLang: currentLang });
  }

  // 初始化面板事件
  function initPanelEvents() {
    // 语言切换
    document.getElementById('td-lang-select').addEventListener('change', (e) => {
      currentLang = e.target.value;
      updatePanelLanguage();
    });

    // 关闭按钮
    document.getElementById('td-btn-close').addEventListener('click', () => {
      panelElement.remove();
      document.getElementById('tweet-deleter-style')?.remove();
      window.tweetDeleterInjected = false;
    });

    // 最小化按钮
    document.getElementById('td-btn-minimize').addEventListener('click', () => {
      panelElement.classList.toggle('minimized');
      const btn = document.getElementById('td-btn-minimize');
      btn.textContent = panelElement.classList.contains('minimized') ? '+' : '−';
    });

    // 内容类型复选框
    document.querySelectorAll('.td-checkbox-item[data-type]').forEach(item => {
      item.addEventListener('click', () => {
        const checkbox = item.querySelector('input');
        checkbox.checked = !checkbox.checked;
        item.classList.toggle('checked', checkbox.checked);
      });
    });

    // 快速时间选择
    document.querySelectorAll('.td-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.td-quick-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const range = btn.dataset.range;
        const today = new Date();
        const dateFrom = document.getElementById('td-date-from');
        const dateTo = document.getElementById('td-date-to');

        if (range === 'all') {
          dateFrom.value = '';
          dateTo.value = '';
        } else {
          const days = parseInt(range);
          const fromDate = new Date(today);
          fromDate.setDate(fromDate.getDate() - days);
          dateFrom.value = fromDate.toISOString().split('T')[0];
          dateTo.value = today.toISOString().split('T')[0];
        }
      });
    });

    // 折叠高级选项
    document.querySelector('.td-collapsible-header').addEventListener('click', () => {
      document.querySelector('.td-collapsible').classList.toggle('open');
    });

    // 扫描按钮
    document.getElementById('td-btn-scan').addEventListener('click', handleScan);

    // 删除按钮
    document.getElementById('td-btn-delete').addEventListener('click', handleDelete);

    // 停止按钮
    document.getElementById('td-btn-stop').addEventListener('click', handleStop);

    // 排除关键词复选框
    document.getElementById('td-exclude-keywords').addEventListener('change', function() {
      this.parentElement.classList.toggle('checked', this.checked);
    });

    // 初始化日期
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('td-date-to').max = today;
    document.getElementById('td-date-from').max = today;
  }

  // 拖动功能
  function initDraggable() {
    const header = panelElement.querySelector('.td-panel-header');
    let isDragging = false;
    let startX, startY, startLeft, startTop;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('.td-panel-btn-icon')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = panelElement.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      panelElement.style.transition = 'none';
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      panelElement.style.left = `${startLeft + dx}px`;
      panelElement.style.top = `${startTop + dy}px`;
      panelElement.style.right = 'auto';
    });

    document.addEventListener('mouseup', () => {
      isDragging = false;
      panelElement.style.transition = '';
    });
  }

  // 获取当前设置
  function getSettings() {
    return {
      contentTypes: {
        tweets: document.getElementById('td-type-tweets').checked,
        replies: document.getElementById('td-type-replies').checked,
        reposts: document.getElementById('td-type-reposts').checked
      },
      timeRange: {
        from: document.getElementById('td-date-from').value || null,
        to: document.getElementById('td-date-to').value || null
      },
      keywords: {
        list: document.getElementById('td-keywords').value.split(',').map(k => k.trim()).filter(k => k),
        exclude: document.getElementById('td-exclude-keywords').checked
      },
      options: {
        speed: document.getElementById('td-speed').value,
        batchSize: parseInt(document.getElementById('td-batch-size').value)
      }
    };
  }

  // 显示状态
  function showStatus(message, type = 'info') {
    const status = document.getElementById('td-status');
    status.textContent = message;
    status.className = `td-status ${type}`;
    status.classList.remove('td-hidden');
  }

  // 隐藏状态
  function hideStatus() {
    document.getElementById('td-status').classList.add('td-hidden');
  }

  // 延迟函数
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 从推文元素提取推文 ID
  function extractTweetId(tweetElement) {
    const tweetLink = tweetElement.querySelector('a[href*="/status/"]');
    if (tweetLink) {
      const match = tweetLink.href.match(/\/status\/(\d+)/);
      if (match) return match[1];
    }
    const timeLink = tweetElement.querySelector('time')?.closest('a');
    if (timeLink) {
      const match = timeLink.href.match(/\/status\/(\d+)/);
      if (match) return match[1];
    }
    return null;
  }

  // 获取推文类型
  function getTweetType(tweetElement) {
    // 检查是否为转帖（多种检测方式）
    // 方式1: 检查 socialContext 标签
    const socialContext = tweetElement.querySelector('[data-testid="socialContext"]');
    if (socialContext) {
      const text = socialContext.textContent.toLowerCase();
      if (text.includes('repost') || text.includes('retweet') ||
          text.includes('转发') || text.includes('轉發') ||
          text.includes('转推') || text.includes('轉推')) {
        return 'repost';
      }
    }

    // 方式2: 检查是否有 unretweet 按钮（表示这是自己的转帖，可以取消）
    if (tweetElement.querySelector('[data-testid="unretweet"]')) {
      return 'repost';
    }

    // 方式3: 检查转发图标的状态
    const retweetButton = tweetElement.querySelector('[data-testid="retweet"]');
    if (retweetButton) {
      // 如果转发按钮是高亮状态，说明已经转发过
      const svg = retweetButton.querySelector('svg');
      if (svg) {
        const color = window.getComputedStyle(svg).color;
        // 绿色表示已转发（X 的转发高亮色）
        if (color.includes('0, 186, 124') || color.includes('rgb(0, 186, 124)') ||
            color.includes('0,186,124') || color.includes('00ba7c')) {
          return 'repost';
        }
      }
    }

    // 方式4: 检查是否有 "You reposted" 等文本
    const article = tweetElement.closest('article');
    if (article) {
      const spans = article.querySelectorAll('span');
      for (const span of spans) {
        const text = span.textContent.toLowerCase();
        if (text.includes('you reposted') || text.includes('你转发') ||
            text.includes('你轉發') || text.includes('你转推')) {
          return 'repost';
        }
      }
    }

    // 检查是否为回复
    const textContent = tweetElement.textContent;
    if (textContent.includes('Replying to') || textContent.includes('回复') || textContent.includes('回覆')) {
      return 'reply';
    }

    return 'tweet';
  }

  // 获取推文时间
  function getTweetTime(tweetElement) {
    const timeElement = tweetElement.querySelector('time');
    if (timeElement) {
      const datetime = timeElement.getAttribute('datetime');
      return datetime ? new Date(datetime) : null;
    }
    return null;
  }

  // 获取推文文本
  function getTweetText(tweetElement) {
    const textElement = tweetElement.querySelector('[data-testid="tweetText"]');
    return textElement ? textElement.textContent : '';
  }

  // 检查是否匹配过滤条件
  function matchesFilters(tweetElement, settings) {
    const type = getTweetType(tweetElement);
    const time = getTweetTime(tweetElement);
    const text = getTweetText(tweetElement);

    if (type === 'tweet' && !settings.contentTypes.tweets) return false;
    if (type === 'reply' && !settings.contentTypes.replies) return false;
    if (type === 'repost' && !settings.contentTypes.reposts) return false;

    if (settings.timeRange.from && time) {
      if (time < new Date(settings.timeRange.from)) return false;
    }
    if (settings.timeRange.to && time) {
      const toDate = new Date(settings.timeRange.to);
      toDate.setHours(23, 59, 59, 999);
      if (time > toDate) return false;
    }

    if (settings.keywords.list && settings.keywords.list.length > 0) {
      const hasKeyword = settings.keywords.list.some(keyword =>
        text.toLowerCase().includes(keyword.toLowerCase())
      );
      if (settings.keywords.exclude) {
        if (hasKeyword) return false;
      } else {
        if (!hasKeyword) return false;
      }
    }

    return true;
  }

  // 扫描推文
  async function handleScan() {
    const settings = getSettings();

    if (!settings.contentTypes.tweets && !settings.contentTypes.replies && !settings.contentTypes.reposts) {
      showStatus('请至少选择一种内容类型', 'error');
      return;
    }

    const scanBtn = document.getElementById('td-btn-scan');
    scanBtn.disabled = true;
    scanBtn.classList.add('td-loading');
    showStatus('正在扫描内容...', 'info');

    // 初始化认证
    try {
      await chrome.runtime.sendMessage({ action: 'initAuth' });
    } catch (e) {}

    scannedTweets = [];
    const speedConfig = SPEED_CONFIG[settings.options.speed];
    const seenIds = new Set();
    let lastScrollHeight = 0;
    let noNewCount = 0;

    while (noNewCount < 3) {
      const tweets = document.querySelectorAll('[data-testid="tweet"]');
      let newFound = false;

      for (const tweet of tweets) {
        const tweetId = extractTweetId(tweet);
        if (!tweetId || seenIds.has(tweetId)) continue;
        seenIds.add(tweetId);
        newFound = true;

        if (matchesFilters(tweet, settings)) {
          scannedTweets.push({
            id: tweetId,
            type: getTweetType(tweet),
            time: getTweetTime(tweet),
            text: getTweetText(tweet).substring(0, 100)
          });
        }
      }

      const currentHeight = document.documentElement.scrollHeight;
      if (currentHeight === lastScrollHeight && !newFound) {
        noNewCount++;
      } else {
        noNewCount = 0;
      }
      lastScrollHeight = currentHeight;

      if (scannedTweets.length >= 500) break;

      window.scrollBy(0, window.innerHeight);
      await delay(speedConfig.scrollDelay);
    }

    // 显示结果
    document.getElementById('td-scan-count').textContent = scannedTweets.length;
    document.getElementById('td-scan-result').classList.remove('td-hidden');
    document.getElementById('td-btn-delete').disabled = scannedTweets.length === 0;

    showStatus(`扫描完成，找到 ${scannedTweets.length} 条可删除内容`, 'success');
    scanBtn.disabled = false;
    scanBtn.classList.remove('td-loading');
  }

  // 删除推文
  async function handleDelete() {
    if (scannedTweets.length === 0) return;

    const settings = getSettings();
    const confirmMsg = `确定要删除这 ${scannedTweets.length} 条内容吗？\n此操作不可撤销！`;
    if (!confirm(confirmMsg)) return;

    isDeleting = true;
    shouldStop = false;

    document.getElementById('td-btn-scan').disabled = true;
    document.getElementById('td-btn-delete').disabled = true;
    document.getElementById('td-progress').classList.remove('td-hidden');
    document.getElementById('td-result').classList.add('td-hidden');

    showStatus('正在删除内容...', 'info');

    const speedConfig = SPEED_CONFIG[settings.options.speed];
    let deleted = 0;
    let failed = 0;
    let unreposted = 0; // 取消转发计数
    const total = scannedTweets.length;

    for (let i = 0; i < scannedTweets.length; i++) {
      if (shouldStop) break;

      const tweet = scannedTweets[i];
      const isRepost = tweet.type === 'repost';

      try {
        const action = isRepost ? 'unretweet' : 'deleteTweet';
        const response = await chrome.runtime.sendMessage({
          action: action,
          tweetId: tweet.id
        });

        if (response && response.success) {
          deleted++;
          if (isRepost) unreposted++;
          console.log(`[Tweet Deleter] ${isRepost ? '取消转发' : '删除'}成功: ${tweet.id}`);
        } else {
          failed++;
          console.log(`[Tweet Deleter] ${isRepost ? '取消转发' : '删除'}失败: ${tweet.id}`);
        }
      } catch (error) {
        failed++;
        console.error(`[Tweet Deleter] 操作异常: ${tweet.id}`, error);
      }

      // 更新进度
      const progress = ((deleted + failed) / total) * 100;
      document.getElementById('td-progress-fill').style.width = `${progress}%`;
      const progressText = unreposted > 0
        ? `已处理: ${deleted} / ${total} (含 ${unreposted} 个取消转发)`
        : `已删除: ${deleted} / ${total}`;
      document.getElementById('td-progress-text').textContent = progressText;

      await delay(speedConfig.deleteDelay);

      if ((i + 1) % settings.options.batchSize === 0) {
        await delay(speedConfig.deleteDelay * 3);
      }
    }

    // 显示结果
    isDeleting = false;
    document.getElementById('td-stat-total').textContent = total;
    document.getElementById('td-stat-success').textContent = deleted;
    document.getElementById('td-stat-failed').textContent = failed;
    document.getElementById('td-result').classList.remove('td-hidden');
    document.getElementById('td-progress').classList.add('td-hidden');

    document.getElementById('td-btn-scan').disabled = false;
    showStatus(shouldStop ? '已停止删除' : '删除完成！', shouldStop ? 'warning' : 'success');
  }

  // 停止删除
  function handleStop() {
    shouldStop = true;
  }

  // 切换面板显示
  function togglePanel() {
    if (panelElement) {
      panelElement.style.display = panelElement.style.display === 'none' ? 'flex' : 'none';
    }
  }

  // 获取面板 CSS（内联方式 - 科技风霓虹主题）
  function getPanelCSS() {
    return `
      @keyframes td-glow { 0%, 100% { box-shadow: 0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(6, 182, 212, 0.2); } 50% { box-shadow: 0 0 30px rgba(139, 92, 246, 0.5), 0 0 60px rgba(6, 182, 212, 0.3); } }
      @keyframes td-shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
      @keyframes td-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.7; transform: scale(0.98); } }
      @keyframes td-border-flow { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
      @keyframes td-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      #tweet-deleter-panel { position: fixed; top: 80px; right: 20px; width: 360px; max-height: 85vh; background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 27, 75, 0.95) 100%); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 2px solid transparent; border-radius: 20px; box-shadow: 0 0 20px rgba(139, 92, 246, 0.3), 0 0 40px rgba(6, 182, 212, 0.2), 0 25px 50px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1); z-index: 999999; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #e2e8f0; overflow: hidden; display: flex; flex-direction: column; animation: td-glow 3s ease-in-out infinite; }
      #tweet-deleter-panel::before { content: ''; position: absolute; top: -2px; left: -2px; right: -2px; bottom: -2px; background: linear-gradient(45deg, #8b5cf6, #06b6d4, #10b981, #8b5cf6); background-size: 300% 300%; border-radius: 22px; z-index: -1; animation: td-border-flow 4s ease infinite; }
      #tweet-deleter-panel::after { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 27, 75, 0.98) 100%); border-radius: 18px; z-index: -1; }
      #tweet-deleter-panel * { box-sizing: border-box; }
      .td-panel-header { position: relative; display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%); border-bottom: 1px solid rgba(139, 92, 246, 0.3); cursor: move; user-select: none; }
      .td-panel-title { display: flex; align-items: center; gap: 10px; font-size: 18px; font-weight: 700; background: linear-gradient(135deg, #a78bfa 0%, #22d3ee 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .td-panel-title-icon { font-size: 24px; filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.8)); animation: td-float 2s ease-in-out infinite; }
      .td-panel-header-right { display: flex; align-items: center; gap: 12px; }
      .td-lang-select { padding: 4px 8px; background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.4); border-radius: 8px; color: #a78bfa; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.3s; outline: none; }
      .td-lang-select:hover { background: rgba(139, 92, 246, 0.3); border-color: #8b5cf6; }
      .td-lang-select:focus { box-shadow: 0 0 10px rgba(139, 92, 246, 0.4); border-color: #8b5cf6; }
      .td-lang-select option { background: #1e1b4b; color: #e2e8f0; }
      .td-panel-actions { display: flex; gap: 8px; }
      .td-panel-btn-icon { width: 32px; height: 32px; border: 1px solid rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.1); color: #a78bfa; font-size: 18px; cursor: pointer; border-radius: 10px; display: flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      .td-panel-btn-icon:hover { background: rgba(139, 92, 246, 0.3); border-color: #8b5cf6; color: #fff; transform: scale(1.1); box-shadow: 0 0 15px rgba(139, 92, 246, 0.5); }
      .td-panel-body { padding: 20px; overflow-y: auto; flex: 1; }
      .td-panel-body::-webkit-scrollbar { width: 6px; }
      .td-panel-body::-webkit-scrollbar-track { background: rgba(139, 92, 246, 0.1); border-radius: 3px; }
      .td-panel-body::-webkit-scrollbar-thumb { background: linear-gradient(180deg, #8b5cf6, #06b6d4); border-radius: 3px; }
      #tweet-deleter-panel.minimized .td-panel-body, #tweet-deleter-panel.minimized .td-panel-footer { display: none; }
      #tweet-deleter-panel.minimized { width: auto; max-height: none; }
      .td-section { margin-bottom: 20px; }
      .td-section-title { font-size: 11px; font-weight: 700; color: #06b6d4; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1.5px; display: flex; align-items: center; gap: 8px; }
      .td-section-title::before { content: ''; width: 3px; height: 12px; background: linear-gradient(180deg, #8b5cf6, #06b6d4); border-radius: 2px; }
      .td-checkbox-group { display: flex; flex-wrap: wrap; gap: 10px; }
      .td-checkbox-item { display: flex; align-items: center; padding: 8px 16px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(100, 116, 139, 0.3); border-radius: 12px; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-size: 13px; font-weight: 500; }
      .td-checkbox-item:hover { border-color: rgba(139, 92, 246, 0.5); background: rgba(139, 92, 246, 0.1); transform: translateY(-2px); }
      .td-checkbox-item input { display: none; }
      .td-checkbox-item.checked { background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(6, 182, 212, 0.3) 100%); border-color: #8b5cf6; color: #fff; box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
      .td-time-inputs { display: flex; gap: 10px; margin-bottom: 10px; }
      .td-time-inputs input { flex: 1; padding: 10px 12px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(100, 116, 139, 0.3); border-radius: 10px; color: #e2e8f0; font-size: 12px; transition: all 0.3s; }
      .td-time-inputs input:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 15px rgba(139, 92, 246, 0.3); }
      .td-time-inputs input::-webkit-calendar-picker-indicator { filter: invert(1) brightness(2); cursor: pointer; opacity: 0.8; transition: opacity 0.3s; }
      .td-time-inputs input::-webkit-calendar-picker-indicator:hover { opacity: 1; }
      .td-quick-btns { display: flex; flex-wrap: wrap; gap: 8px; }
      .td-quick-btn { padding: 6px 14px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(100, 116, 139, 0.3); border-radius: 20px; color: #94a3b8; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
      .td-quick-btn:hover { border-color: #06b6d4; color: #22d3ee; background: rgba(6, 182, 212, 0.1); }
      .td-quick-btn.active { background: linear-gradient(135deg, #8b5cf6, #06b6d4); border-color: transparent; color: white; font-weight: 600; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.4); }
      .td-keyword-input { width: 100%; padding: 12px 16px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(100, 116, 139, 0.3); border-radius: 12px; color: #e2e8f0; font-size: 13px; margin-bottom: 8px; transition: all 0.3s; }
      .td-keyword-input:focus { outline: none; border-color: #8b5cf6; box-shadow: 0 0 20px rgba(139, 92, 246, 0.3); }
      .td-keyword-input::placeholder { color: #64748b; }
      .td-hint { font-size: 11px; color: #64748b; }
      .td-collapsible-header { display: flex; justify-content: space-between; align-items: center; cursor: pointer; padding: 10px 0; color: #a78bfa; transition: color 0.3s; }
      .td-collapsible-header:hover { color: #c4b5fd; }
      .td-collapsible-header .td-arrow { transition: transform 0.3s; font-size: 10px; }
      .td-collapsible.open .td-arrow { transform: rotate(180deg); }
      .td-collapsible-content { display: none; padding-top: 10px; }
      .td-collapsible.open .td-collapsible-content { display: block; }
      .td-option-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .td-option-row label { font-size: 12px; color: #cbd5e1; }
      .td-option-row select { padding: 6px 12px; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(100, 116, 139, 0.3); border-radius: 8px; color: #e2e8f0; font-size: 12px; cursor: pointer; transition: all 0.3s; }
      .td-option-row select:focus { outline: none; border-color: #8b5cf6; }
      .td-actions { display: flex; gap: 12px; margin-top: 20px; }
      .td-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 14px 20px; border: none; border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); text-transform: uppercase; letter-spacing: 0.5px; }
      .td-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }
      .td-btn-primary { background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%); color: white; box-shadow: 0 4px 20px rgba(139, 92, 246, 0.4); }
      .td-btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(139, 92, 246, 0.5); }
      .td-btn-secondary { background: rgba(30, 41, 59, 0.8); color: #e2e8f0; border: 1px solid rgba(100, 116, 139, 0.3); }
      .td-btn-secondary:hover:not(:disabled) { background: rgba(51, 65, 85, 0.8); border-color: #8b5cf6; transform: translateY(-2px); }
      .td-btn-danger { background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: white; box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4); }
      .td-btn-danger:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(239, 68, 68, 0.5); }
      .td-scan-result { position: relative; background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%); border: 2px solid #10b981; border-radius: 16px; padding: 20px; margin-top: 16px; text-align: center; overflow: hidden; }
      .td-scan-result::before { content: ''; position: absolute; top: 0; left: -100%; width: 200%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent); animation: td-shimmer 2s infinite; }
      .td-scan-result .td-count { font-size: 48px; font-weight: 800; background: linear-gradient(135deg, #10b981 0%, #22d3ee 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; line-height: 1; }
      .td-scan-result .td-label { font-size: 13px; color: #6ee7b7; margin-top: 8px; font-weight: 500; }
      .td-progress { margin-top: 16px; }
      .td-progress-bar { height: 8px; background: rgba(30, 41, 59, 0.8); border-radius: 4px; overflow: hidden; margin-bottom: 10px; }
      .td-progress-fill { height: 100%; background: linear-gradient(90deg, #8b5cf6, #06b6d4, #10b981); background-size: 200% 100%; border-radius: 4px; transition: width 0.3s; width: 0%; animation: td-shimmer 1.5s infinite linear; }
      .td-progress-text { display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; }
      .td-result { background: rgba(30, 41, 59, 0.6); border: 1px solid rgba(100, 116, 139, 0.2); border-radius: 16px; padding: 16px; margin-top: 16px; }
      .td-result-title { font-size: 12px; font-weight: 600; margin-bottom: 12px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 1px; }
      .td-result-stats { display: flex; justify-content: space-around; }
      .td-stat-item { text-align: center; }
      .td-stat-value { font-size: 28px; font-weight: 800; }
      .td-stat-value.total { background: linear-gradient(135deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .td-stat-value.success { background: linear-gradient(135deg, #10b981, #22d3ee); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .td-stat-value.failed { background: linear-gradient(135deg, #ef4444, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      .td-stat-label { font-size: 10px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 0.5px; }
      .td-status { padding: 12px 16px; border-radius: 12px; font-size: 13px; margin-top: 12px; font-weight: 500; display: flex; align-items: center; gap: 10px; }
      .td-status::before { content: ''; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .td-status.info { background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #a78bfa; }
      .td-status.info::before { background: #8b5cf6; box-shadow: 0 0 10px #8b5cf6; }
      .td-status.success { background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #6ee7b7; }
      .td-status.success::before { background: #10b981; box-shadow: 0 0 10px #10b981; }
      .td-status.error { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; }
      .td-status.error::before { background: #ef4444; box-shadow: 0 0 10px #ef4444; }
      .td-status.warning { background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3); color: #fcd34d; }
      .td-status.warning::before { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; }
      .td-hidden { display: none !important; }
      .td-loading { animation: td-pulse 1.5s infinite; }
      .td-panel-footer { padding: 12px 20px; border-top: 1px solid rgba(139, 92, 246, 0.2); text-align: center; font-size: 11px; color: #64748b; background: rgba(15, 23, 42, 0.5); }
      .td-panel-footer strong { color: #f59e0b; }
    `;
  }

  // 监听来自 background.js 的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'togglePanel') {
      togglePanel();
      sendResponse({ success: true });
    }
    return true;
  });

  // 初始化：创建面板（默认隐藏，等待用户点击图标显示）
  createPanel();
  // 默认隐藏面板，用户点击扩展图标后显示
  if (panelElement) {
    panelElement.style.display = 'none';
  }

  console.log('[Tweet Deleter] 悬浮面板已加载');
})();
