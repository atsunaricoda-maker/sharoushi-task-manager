/**
 * Calendar Page
 * Google Calendar連携の管理画面
 */

export function getCalendarPage(userName: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>カレンダー連携 - 労務管理タスクシステム</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href='https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.css' rel='stylesheet' />
        <script src='https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/main.min.js'></script>
        <script src='https://cdn.jsdelivr.net/npm/fullcalendar@5.11.3/locales/ja.js'></script>
    </head>
    <body class="bg-gray-50">
        <!-- ナビゲーション -->
        <nav class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <h1 class="text-xl font-bold text-gray-800">労務管理タスクシステム</h1>
                        </div>
                        <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <a href="/" class="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-home mr-1"></i> ダッシュボード
                            </a>
                            <a href="/clients" class="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-building mr-1"></i> 顧客管理
                            </a>
                            <a href="/reports" class="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-file-alt mr-1"></i> レポート
                            </a>
                            <a href="/gmail" class="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-envelope mr-1"></i> Gmail
                            </a>
                            <a href="/calendar" class="border-b-2 border-blue-500 text-gray-900 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-calendar mr-1"></i> カレンダー
                            </a>
                            <a href="/settings" class="text-gray-500 hover:text-gray-700 inline-flex items-center px-1 pt-1 text-sm font-medium">
                                <i class="fas fa-cog mr-1"></i> 設定
                            </a>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="text-gray-700 mr-4">
                            <i class="fas fa-user mr-1"></i> ${userName}
                        </span>
                        <button onclick="logout()" class="text-gray-500 hover:text-gray-700">
                            <i class="fas fa-sign-out-alt"></i> ログアウト
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <div class="max-w-7xl mx-auto px-4 py-8">
            <!-- ツールバー -->
            <div class="bg-white rounded-lg shadow mb-6 p-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <button onclick="syncWithCalendar()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            <i class="fas fa-sync mr-2"></i>同期
                        </button>
                        <button onclick="showQuickAddModal()" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                            <i class="fas fa-plus mr-2"></i>クイック追加
                        </button>
                        <select id="calendarSelect" onchange="changeCalendar()" 
                            class="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                            <option value="primary">メインカレンダー</option>
                        </select>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-2">
                            <span class="w-3 h-3 bg-red-500 rounded-full"></span>
                            <span class="text-sm">高優先度</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="w-3 h-3 bg-yellow-500 rounded-full"></span>
                            <span class="text-sm">中優先度</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="w-3 h-3 bg-green-500 rounded-full"></span>
                            <span class="text-sm">低優先度</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- カレンダー表示 -->
            <div class="bg-white rounded-lg shadow p-6">
                <div id="calendar"></div>
            </div>

            <!-- サイドバー：今日のタスク -->
            <div class="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2">
                    <!-- イベント詳細パネル -->
                    <div id="eventDetails" class="bg-white rounded-lg shadow p-6 hidden">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">イベント詳細</h3>
                        <div id="eventDetailsContent"></div>
                    </div>
                </div>
                <div>
                    <!-- 今日のタスク -->
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">
                            <i class="fas fa-tasks mr-2"></i>今日のタスク
                        </h3>
                        <div id="todayTasksList" class="space-y-3">
                            <div class="text-gray-500 text-sm">読み込み中...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- クイック追加モーダル -->
        <div id="quickAddModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 class="text-lg font-medium text-gray-900 mb-4">クイック追加</h3>
                <form onsubmit="quickAddEvent(event)">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700">自然言語で入力</label>
                        <input type="text" id="quickAddText" required
                            class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="例: 明日午後3時に会議">
                        <small class="text-gray-500">日時と内容を自然な日本語で入力してください</small>
                    </div>
                    <div class="flex justify-end space-x-3">
                        <button type="button" onclick="closeQuickAddModal()" 
                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                            キャンセル
                        </button>
                        <button type="submit" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            追加
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- イベント作成/編集モーダル -->
        <div id="eventModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
                <h3 class="text-lg font-medium text-gray-900 mb-4" id="eventModalTitle">イベント作成</h3>
                <form id="eventForm" onsubmit="saveEvent(event)">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700">タイトル</label>
                            <input type="text" id="eventTitle" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">開始日時</label>
                            <input type="datetime-local" id="eventStart" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700">終了日時</label>
                            <input type="datetime-local" id="eventEnd" required
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        </div>
                        
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700">説明</label>
                            <textarea id="eventDescription" rows="3"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
                        </div>
                        
                        <div class="col-span-2">
                            <label class="block text-sm font-medium text-gray-700">場所</label>
                            <input type="text" id="eventLocation"
                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        </div>
                        
                        <div class="col-span-2">
                            <label class="flex items-center">
                                <input type="checkbox" id="createTaskFromEvent" class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                <span class="ml-2 text-sm text-gray-700">このイベントからタスクを作成</span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="mt-6 flex justify-end space-x-3">
                        <button type="button" onclick="closeEventModal()" 
                            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                            キャンセル
                        </button>
                        <button type="button" id="deleteEventBtn" onclick="deleteEvent()" 
                            class="hidden px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                            削除
                        </button>
                        <button type="submit" 
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            保存
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let calendar;
            let currentEventId = null;
            let selectedCalendarId = 'primary';
            
            // 初期化
            document.addEventListener('DOMContentLoaded', function() {
                initializeCalendar();
                loadCalendarList();
                loadTodayTasks();
            });
            
            // カレンダー初期化
            function initializeCalendar() {
                const calendarEl = document.getElementById('calendar');
                calendar = new FullCalendar.Calendar(calendarEl, {
                    initialView: 'dayGridMonth',
                    locale: 'ja',
                    headerToolbar: {
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
                    },
                    events: async (info, successCallback, failureCallback) => {
                        try {
                            const response = await axios.get('/api/calendar/events', {
                                params: {
                                    start: info.start.toISOString().split('T')[0],
                                    end: info.end.toISOString().split('T')[0]
                                }
                            });
                            
                            const events = response.data.events.map(event => ({
                                id: event.id,
                                title: event.title,
                                start: event.start_datetime,
                                end: event.end_datetime,
                                allDay: event.all_day === 1,
                                description: event.description,
                                location: event.location,
                                backgroundColor: getEventColor(event),
                                extendedProps: {
                                    description: event.description,
                                    location: event.location
                                }
                            }));
                            
                            successCallback(events);
                        } catch (error) {
                            console.error('Failed to load events:', error);
                            failureCallback(error);
                        }
                    },
                    eventClick: function(info) {
                        showEventDetails(info.event);
                    },
                    dateClick: function(info) {
                        openEventModal(info.date);
                    },
                    editable: true,
                    eventDrop: async function(info) {
                        try {
                            await updateEventDateTime(info.event);
                        } catch (error) {
                            info.revert();
                            alert('イベントの更新に失敗しました');
                        }
                    }
                });
                calendar.render();
            }
            
            // カレンダーリスト読み込み
            async function loadCalendarList() {
                try {
                    const response = await axios.get('/api/calendar/list');
                    const calendars = response.data.calendars;
                    
                    const select = document.getElementById('calendarSelect');
                    select.innerHTML = calendars.map(cal => 
                        \`<option value="\${cal.id}" \${cal.isPrimary ? 'selected' : ''}>\${cal.name}</option>\`
                    ).join('');
                } catch (error) {
                    console.error('Failed to load calendars:', error);
                }
            }
            
            // 今日のタスク読み込み
            async function loadTodayTasks() {
                try {
                    const today = new Date();
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    
                    const response = await axios.get('/api/calendar/events', {
                        params: {
                            start: today.toISOString().split('T')[0],
                            end: tomorrow.toISOString().split('T')[0]
                        }
                    });
                    
                    const taskEvents = response.data.events.filter(e => e.title.includes('[タスク]'));
                    
                    const listEl = document.getElementById('todayTasksList');
                    if (taskEvents.length === 0) {
                        listEl.innerHTML = '<div class="text-gray-500 text-sm">今日のタスクはありません</div>';
                        return;
                    }
                    
                    listEl.innerHTML = taskEvents.map(event => \`
                        <div class="border-l-4 border-blue-500 pl-3 py-2">
                            <div class="font-medium text-sm">\${escapeHtml(event.title.replace('[タスク]', '').trim())}</div>
                            <div class="text-xs text-gray-500">\${formatTimeFromDateTime(event.start_datetime)}</div>
                        </div>
                    \`).join('');
                } catch (error) {
                    console.error('Failed to load today tasks:', error);
                }
            }
            
            // カレンダーとの同期
            async function syncWithCalendar() {
                if (!confirm('タスクとカレンダーを双方向で同期しますか？')) return;
                
                try {
                    const response = await axios.post('/api/calendar/full-sync');
                    alert(response.data.message);
                    calendar.refetchEvents();
                    loadTodayTasks();
                } catch (error) {
                    console.error('Sync failed:', error);
                    alert('同期に失敗しました: ' + (error.response?.data?.message || error.message));
                }
            }
            
            // クイック追加
            async function quickAddEvent(event) {
                event.preventDefault();
                
                const text = document.getElementById('quickAddText').value;
                
                try {
                    const response = await axios.post('/api/calendar/quick-add', {
                        text,
                        calendarId: selectedCalendarId
                    });
                    
                    alert('イベントを追加しました');
                    closeQuickAddModal();
                    calendar.refetchEvents();
                    document.getElementById('quickAddText').value = '';
                } catch (error) {
                    console.error('Failed to quick add:', error);
                    alert('追加に失敗しました: ' + (error.response?.data?.message || error.message));
                }
            }
            
            // イベント詳細表示
            function showEventDetails(event) {
                const panel = document.getElementById('eventDetails');
                const content = document.getElementById('eventDetailsContent');
                
                content.innerHTML = \`
                    <h4 class="font-medium text-lg mb-2">\${escapeHtml(event.title)}</h4>
                    <div class="space-y-2 text-sm">
                        <div><i class="fas fa-clock mr-2"></i>\${formatDateTime(event.start)} - \${formatDateTime(event.end)}</div>
                        \${event.extendedProps.location ? \`<div><i class="fas fa-map-marker-alt mr-2"></i>\${escapeHtml(event.extendedProps.location)}</div>\` : ''}
                        \${event.extendedProps.description ? \`<div class="mt-3 p-3 bg-gray-50 rounded">\${escapeHtml(event.extendedProps.description)}</div>\` : ''}
                    </div>
                    <div class="mt-4 flex space-x-2">
                        <button onclick="editEvent('\${event.id}')" class="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                            <i class="fas fa-edit mr-1"></i>編集
                        </button>
                        \${event.title.includes('[タスク]') ? '' : \`
                            <button onclick="createTaskFromCalendarEvent('\${event.id}')" class="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                                <i class="fas fa-tasks mr-1"></i>タスク作成
                            </button>
                        \`}
                    </div>
                \`;
                
                panel.classList.remove('hidden');
            }
            
            // イベント色取得
            function getEventColor(event) {
                if (event.title.includes('[タスク]')) {
                    if (event.title.includes('[完了]')) return '#10b981';
                    if (event.colorId === '11') return '#ef4444';
                    if (event.colorId === '5') return '#eab308';
                    if (event.colorId === '10') return '#22c55e';
                }
                return '#3b82f6';
            }
            
            // モーダル操作
            function showQuickAddModal() {
                document.getElementById('quickAddModal').classList.remove('hidden');
            }
            
            function closeQuickAddModal() {
                document.getElementById('quickAddModal').classList.add('hidden');
            }
            
            function openEventModal(date) {
                currentEventId = null;
                document.getElementById('eventModalTitle').textContent = 'イベント作成';
                document.getElementById('deleteEventBtn').classList.add('hidden');
                document.getElementById('eventForm').reset();
                
                if (date) {
                    const startDate = new Date(date);
                    const endDate = new Date(date);
                    endDate.setHours(endDate.getHours() + 1);
                    
                    document.getElementById('eventStart').value = formatDateTimeLocal(startDate);
                    document.getElementById('eventEnd').value = formatDateTimeLocal(endDate);
                }
                
                document.getElementById('eventModal').classList.remove('hidden');
            }
            
            function closeEventModal() {
                document.getElementById('eventModal').classList.add('hidden');
                currentEventId = null;
            }
            
            // イベント編集
            async function editEvent(eventId) {
                try {
                    const response = await axios.get(\`/api/calendar/events/\${eventId}\`);
                    const event = response.data.event;
                    
                    // モーダルのタイトルを変更
                    document.getElementById('eventModalTitle').textContent = 'イベント編集';
                    document.getElementById('deleteEventBtn').classList.remove('hidden');
                    
                    // フォームに既存データを入力
                    document.getElementById('eventTitle').value = event.title || '';
                    document.getElementById('eventDescription').value = event.description || '';
                    document.getElementById('eventLocation').value = event.location || '';
                    
                    // 日時の設定
                    if (event.start_datetime) {
                        const startDate = new Date(event.start_datetime);
                        document.getElementById('eventStart').value = formatDateTimeLocal(startDate);
                    }
                    if (event.end_datetime) {
                        const endDate = new Date(event.end_datetime);
                        document.getElementById('eventEnd').value = formatDateTimeLocal(endDate);
                    }
                    
                    // 現在編集中のイベントIDを保存
                    currentEventId = eventId;
                    
                    // モーダルを表示
                    document.getElementById('eventModal').classList.remove('hidden');
                } catch (error) {
                    console.error('Failed to load event for editing:', error);
                    alert('イベント情報の取得に失敗しました');
                }
            }
            
            // イベント削除
            async function deleteEvent() {
                if (!currentEventId) return;
                
                if (!confirm('このイベントを削除しますか？')) return;
                
                try {
                    await axios.delete(\`/api/calendar/events/\${currentEventId}\`);
                    alert('イベントを削除しました');
                    closeEventModal();
                    calendar.refetchEvents();
                    loadTodayTasks();
                } catch (error) {
                    console.error('Failed to delete event:', error);
                    alert('イベントの削除に失敗しました: ' + (error.response?.data?.message || error.message));
                }
            }
            
            // イベント保存
            async function saveEvent(event) {
                event.preventDefault();
                
                const formData = new FormData(event.target);
                const eventData = {
                    title: document.getElementById('eventTitle').value,
                    description: document.getElementById('eventDescription').value,
                    location: document.getElementById('eventLocation').value,
                    start_datetime: document.getElementById('eventStart').value,
                    end_datetime: document.getElementById('eventEnd').value,
                    all_day: false // 現在は終日イベントは未対応
                };
                
                if (!eventData.title || !eventData.start_datetime || !eventData.end_datetime) {
                    alert('タイトル、開始時間、終了時間は必須です');
                    return;
                }
                
                try {
                    if (currentEventId) {
                        // 編集モード
                        await axios.put(\`/api/calendar/events/\${currentEventId}\`, eventData);
                        alert('イベントを更新しました');
                    } else {
                        // 新規作成モード
                        await axios.post('/api/calendar/events', eventData);
                        alert('イベントを作成しました');
                    }
                    
                    closeEventModal();
                    calendar.refetchEvents();
                    loadTodayTasks();
                } catch (error) {
                    console.error('Failed to save event:', error);
                    alert('イベントの保存に失敗しました: ' + (error.response?.data?.message || error.message));
                }
            }

            // カレンダーイベントからタスク作成
            async function createTaskFromCalendarEvent(eventId) {
                if (!confirm('このイベントからタスクを作成しますか？')) return;
                
                try {
                    const response = await axios.post(\`/api/calendar/create-task-from-event/\${eventId}\`);
                    alert('タスクを作成しました');
                    calendar.refetchEvents();
                } catch (error) {
                    console.error('Failed to create task:', error);
                    alert('タスク作成に失敗しました: ' + (error.response?.data?.message || error.message));
                }
            }
            
            // ユーティリティ関数
            function escapeHtml(text) {
                if (!text) return '';
                const map = {
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    '"': '&quot;',
                    "'": '&#039;'
                };
                return text.toString().replace(/[&<>"']/g, m => map[m]);
            }
            
            function formatDateTime(date) {
                if (!date) return '';
                const d = new Date(date);
                return d.toLocaleDateString('ja-JP') + ' ' + d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            }
            
            function formatTime(date) {
                if (!date.dateTime) return '終日';
                const d = new Date(date.dateTime);
                return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            }
            
            function formatTimeFromDateTime(datetime) {
                if (!datetime) return '終日';
                const d = new Date(datetime);
                return d.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
            }
            
            function formatDateTimeLocal(date) {
                const d = new Date(date);
                d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
                return d.toISOString().slice(0, 16);
            }
            
            function changeCalendar() {
                selectedCalendarId = document.getElementById('calendarSelect').value;
                calendar.refetchEvents();
            }
            
            function logout() {
                if (confirm('ログアウトしますか？')) {
                    window.location.href = '/logout';
                }
            }
        </script>
    </body>
    </html>
  `
}