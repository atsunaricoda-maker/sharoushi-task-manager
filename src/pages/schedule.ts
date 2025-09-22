export function getSchedulePage(userName: string, userRole: string): string {
  return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>カレンダー - 社労士事務所タスク管理</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/locale/ja.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/plugin/relativeTime.js"></script>
    <style>
        /* Calendar Styles */
        .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px;
            background-color: #e5e7eb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .calendar-day {
            background-color: white;
            min-height: 120px;
            padding: 8px;
            position: relative;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .calendar-day:hover {
            background-color: #f8fafc;
        }
        
        .calendar-day.other-month {
            background-color: #f9fafb;
            color: #9ca3af;
        }
        
        .calendar-day.today {
            background-color: #eff6ff;
            border: 2px solid #3b82f6;
        }
        
        .day-number {
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
        }
        
        .calendar-event {
            background: #3b82f6;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 12px;
            margin-bottom: 2px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .calendar-event:hover {
            background: #2563eb;
        }
        
        .calendar-event.meeting {
            background: #10b981;
        }
        
        .calendar-event.meeting:hover {
            background: #059669;
        }
        
        .calendar-event.deadline {
            background: #ef4444;
        }
        
        .calendar-event.deadline:hover {
            background: #dc2626;
        }
        
        .calendar-event.visit {
            background: #8b5cf6;
        }
        
        .calendar-event.visit:hover {
            background: #7c3aed;
        }
        
        /* Toast notifications */
        .toast {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1050;
            min-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(400px);
            transition: transform 0.3s ease;
        }
        .toast.show { transform: translateX(0); }
        .toast.success { background-color: #10b981; }
        .toast.error { background-color: #ef4444; }
        .toast.info { background-color: #3b82f6; }
        .toast.warning { background-color: #f59e0b; }
        
        /* Modal styles */
        .modal { 
            display: none; 
            position: fixed; 
            z-index: 1000; 
            left: 0; 
            top: 0; 
            width: 100%; 
            height: 100%; 
            background-color: rgba(0,0,0,0.5); 
        }
        .modal.active { 
            display: flex; 
            align-items: center; 
            justify-content: center; 
        }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-8">
                    <h1 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-calendar mr-2 text-blue-600"></i>
                        カレンダー
                    </h1>
                    <nav class="flex space-x-4">
                        <a href="/" class="px-3 py-2 text-gray-700 hover:text-gray-900">
                            <i class="fas fa-home mr-1"></i>ダッシュボード
                        </a>
                        <a href="/clients" class="px-3 py-2 text-gray-700 hover:text-gray-900">
                            <i class="fas fa-building mr-1"></i>顧問先
                        </a>
                        <a href="/calendar" class="px-3 py-2 text-blue-600 font-medium">
                            <i class="fas fa-calendar mr-1"></i>カレンダー
                        </a>
                        <a href="/reports" class="px-3 py-2 text-gray-700 hover:text-gray-900">
                            <i class="fas fa-chart-bar mr-1"></i>レポート
                        </a>
                    </nav>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-gray-600">
                        <i class="fas fa-user-circle mr-1"></i>${userName}
                    </span>
                    <button onclick="window.location.href='/auth/logout'" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-sign-out-alt"></i>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Calendar Controls -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
            <div class="flex justify-between items-center mb-6">
                <div class="flex items-center space-x-4">
                    <button onclick="previousMonth()" class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <h2 id="currentMonthYear" class="text-2xl font-bold text-gray-900">2025年1月</h2>
                    <button onclick="nextMonth()" class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                <div class="flex space-x-2">
                    <button onclick="goToToday()" class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">
                        今日
                    </button>
                    <button onclick="openNewEventModal()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                        <i class="fas fa-plus mr-2"></i>新規予定
                    </button>
                </div>
            </div>
            
            <!-- Quick Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div class="bg-blue-50 rounded-lg p-4">
                    <div class="text-sm text-blue-600 mb-1">今日の予定</div>
                    <div class="text-2xl font-bold text-blue-800" id="todayEvents">0件</div>
                </div>
                <div class="bg-green-50 rounded-lg p-4">
                    <div class="text-sm text-green-600 mb-1">今週の面談</div>
                    <div class="text-2xl font-bold text-green-800" id="weekMeetings">0件</div>
                </div>
                <div class="bg-orange-50 rounded-lg p-4">
                    <div class="text-sm text-orange-600 mb-1">来週の期限</div>
                    <div class="text-2xl font-bold text-orange-800" id="nextWeekDeadlines">0件</div>
                </div>
                <div class="bg-purple-50 rounded-lg p-4">
                    <div class="text-sm text-purple-600 mb-1">月間訪問</div>
                    <div class="text-2xl font-bold text-purple-800" id="monthlyVisits">0件</div>
                </div>
            </div>
        </div>

        <!-- Calendar Grid -->
        <div class="bg-white rounded-lg shadow p-6">
            <!-- Calendar Header -->
            <div class="calendar-grid mb-4">
                <div class="calendar-day text-center font-semibold text-gray-600 bg-gray-50 min-h-0 py-3">日</div>
                <div class="calendar-day text-center font-semibold text-gray-600 bg-gray-50 min-h-0 py-3">月</div>
                <div class="calendar-day text-center font-semibold text-gray-600 bg-gray-50 min-h-0 py-3">火</div>
                <div class="calendar-day text-center font-semibold text-gray-600 bg-gray-50 min-h-0 py-3">水</div>
                <div class="calendar-day text-center font-semibold text-gray-600 bg-gray-50 min-h-0 py-3">木</div>
                <div class="calendar-day text-center font-semibold text-gray-600 bg-gray-50 min-h-0 py-3">金</div>
                <div class="calendar-day text-center font-semibold text-gray-600 bg-gray-50 min-h-0 py-3">土</div>
            </div>
            
            <!-- Calendar Body -->
            <div id="calendarGrid" class="calendar-grid">
                <!-- Calendar days will be generated here -->
            </div>
        </div>
    </main>

    <!-- New Event Modal -->
    <div id="newEventModal" class="modal">
        <div class="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4">
            <div class="px-6 py-4 border-b flex justify-between items-center">
                <h3 id="eventModalTitle" class="text-lg font-semibold">新規予定登録</h3>
                <button onclick="closeEventModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="p-6">
                <form id="newEventForm" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">予定名 <span class="text-red-500">*</span></label>
                            <input type="text" name="title" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">予定タイプ</label>
                            <select name="entry_type" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                                <option value="meeting">顧問先面談</option>
                                <option value="visit">顧問先訪問</option>
                                <option value="deadline">手続き期限</option>
                                <option value="other">その他</option>
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">顧問先</label>
                        <select name="client_id" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                            <option value="">選択してください</option>
                            <!-- Options will be populated by JavaScript -->
                        </select>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700">開始日時 <span class="text-red-500">*</span></label>
                            <input type="datetime-local" name="start_time" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700">終了日時</label>
                            <input type="datetime-local" name="end_time" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                        </div>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">場所</label>
                        <input type="text" name="location" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700">詳細</label>
                        <textarea name="description" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
                    </div>
                    
                    <div class="flex justify-between pt-4">
                        <div>
                            <button type="button" id="deleteEventBtn" onclick="deleteCurrentEvent()" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700" style="display: none;">
                                <i class="fas fa-trash mr-2"></i>削除
                            </button>
                        </div>
                        <div class="flex space-x-3">
                            <button type="button" onclick="closeEventModal()" class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                                キャンセル
                            </button>
                            <button type="submit" id="submitEventBtn" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                                登録
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        dayjs.locale('ja');
        dayjs.extend(window.dayjs_plugin_relativeTime);

        let currentDate = dayjs();
        let scheduleEvents = [];
        let clients = [];
        let currentEditingEventId = null;

        // Toast notification system
        function showToast(message, type = 'info', duration = 3000) {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            toast.innerHTML = `
                <div class="flex items-center justify-between">
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            
            document.body.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 100);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        // Add axios interceptor for authentication errors
        axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && error.response.status === 401) {
                    console.log('Authentication required, redirecting to login');
                    window.location.href = '/login';
                    return Promise.reject(error);
                }
                return Promise.reject(error);
            }
        );

        // Initialize
        document.addEventListener('DOMContentLoaded', async () => {
            // Development auth disabled in production - use Google OAuth only
            console.log('Initializing schedule page with production authentication');
            
            loadClients();
            loadScheduleEvents();
            renderCalendar();
            updateStats();
        });

        // Load clients for dropdown
        async function loadClients() {
            try {
                const response = await axios.get('/api/clients');
                clients = response.data.clients || [];
                
                // Populate client dropdown in modal
                const clientSelect = document.querySelector('select[name="client_id"]');
                clientSelect.innerHTML = '<option value="">選択してください</option>';
                clients.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = client.name;
                    clientSelect.appendChild(option);
                });
            } catch (error) {
                console.error('Failed to load clients:', error);
                showToast('顧問先の読み込みに失敗しました', 'error');
            }
        }

        // Load schedule events
        async function loadScheduleEvents() {
            try {
                const startOfMonth = currentDate.startOf('month').format('YYYY-MM-DD');
                const endOfMonth = currentDate.endOf('month').format('YYYY-MM-DD');
                
                console.log(`Loading schedule events: ${startOfMonth} to ${endOfMonth}`);
                const response = await axios.get(`/api/schedule?start_date=${startOfMonth}&end_date=${endOfMonth}`);
                console.log('Schedule response:', response.data);
                scheduleEvents = response.data || [];
                
                renderCalendar();
                updateStats();
            } catch (error) {
                console.error('Failed to load schedule:', error);
                console.error('Error details:', error.response?.data);
                scheduleEvents = [];
                renderCalendar();
                showToast(`スケジュール読み込みエラー: ${error.response?.data?.error || error.message}`, 'error', 5000);
            }
        }

        // Render calendar grid
        function renderCalendar() {
            const calendarGrid = document.getElementById('calendarGrid');
            const monthYear = document.getElementById('currentMonthYear');
            
            // Update month/year display
            monthYear.textContent = currentDate.format('YYYY年MM月');
            
            // Get calendar dates
            const startOfMonth = currentDate.startOf('month');
            const endOfMonth = currentDate.endOf('month');
            const startOfCalendar = startOfMonth.startOf('week');
            const endOfCalendar = endOfMonth.endOf('week');
            
            // Clear previous calendar
            calendarGrid.innerHTML = '';
            
            let date = startOfCalendar;
            
            while (date.isBefore(endOfCalendar) || date.isSame(endOfCalendar, 'day')) {
                const isCurrentMonth = date.isSame(currentDate, 'month');
                const isToday = date.isSame(dayjs(), 'day');
                const dayEvents = getDayEvents(date);
                
                let dayClass = 'calendar-day';
                if (!isCurrentMonth) dayClass += ' other-month';
                if (isToday) dayClass += ' today';
                
                // Create day element
                const dayDiv = document.createElement('div');
                dayDiv.className = dayClass;
                dayDiv.setAttribute('data-date', date.format('YYYY-MM-DD'));
                dayDiv.addEventListener('click', () => selectDate(date.format('YYYY-MM-DD')));
                
                // Add day number
                const dayNumber = document.createElement('div');
                dayNumber.className = 'day-number';
                dayNumber.textContent = date.format('D');
                dayDiv.appendChild(dayNumber);
                
                // Add events
                dayEvents.forEach(event => {
                    const eventDiv = document.createElement('div');
                    eventDiv.className = `calendar-event ${event.entry_type || 'other'}`;
                    eventDiv.textContent = event.title.length > 12 ? event.title.substring(0, 12) + '...' : event.title;
                    eventDiv.title = `${event.title}${event.client_name ? '\\n顧問先: ' + event.client_name : ''}\\n${dayjs(event.start_time).format('HH:mm')}${event.end_time ? ' - ' + dayjs(event.end_time).format('HH:mm') : ''}`;
                    
                    // Add click handler for editing
                    eventDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        console.log('Event clicked, opening edit modal for event ID:', event.id);
                        editEvent(event.id);
                    });
                    
                    dayDiv.appendChild(eventDiv);
                });
                
                calendarGrid.appendChild(dayDiv);
                date = date.add(1, 'day');
            }
        }

        // Get events for a specific day
        function getDayEvents(date) {
            return scheduleEvents.filter(event => {
                const eventDate = dayjs(event.start_time);
                return eventDate.isSame(date, 'day');
            });
        }

        // Calendar navigation
        function previousMonth() {
            currentDate = currentDate.subtract(1, 'month');
            loadScheduleEvents();
        }

        function nextMonth() {
            currentDate = currentDate.add(1, 'month');
            loadScheduleEvents();
        }

        function goToToday() {
            currentDate = dayjs();
            loadScheduleEvents();
        }

        // Select date (for creating new events)
        function selectDate(dateString) {
            const selectedDate = dayjs(dateString);
            document.querySelector('input[name="start_time"]').value = selectedDate.format('YYYY-MM-DDTHH:mm');
            document.querySelector('input[name="end_time"]').value = selectedDate.add(1, 'hour').format('YYYY-MM-DDTHH:mm');
            openNewEventModal();
        }

        // Update statistics
        function updateStats() {
            const today = dayjs();
            const todayEvents = scheduleEvents.filter(e => dayjs(e.start_time).isSame(today, 'day'));
            const weekStart = today.startOf('week');
            const weekEnd = today.endOf('week');
            const weekMeetings = scheduleEvents.filter(e => {
                const eventDate = dayjs(e.start_time);
                return eventDate.isAfter(weekStart) && eventDate.isBefore(weekEnd) && 
                       (e.entry_type === 'meeting' || e.entry_type === 'visit');
            });
            
            const nextWeekStart = today.add(1, 'week').startOf('week');
            const nextWeekEnd = today.add(1, 'week').endOf('week');
            const nextWeekDeadlines = scheduleEvents.filter(e => {
                const eventDate = dayjs(e.start_time);
                return eventDate.isAfter(nextWeekStart) && eventDate.isBefore(nextWeekEnd) && 
                       e.entry_type === 'deadline';
            });
            
            const monthStart = currentDate.startOf('month');
            const monthEnd = currentDate.endOf('month');
            const monthlyVisits = scheduleEvents.filter(e => {
                const eventDate = dayjs(e.start_time);
                return eventDate.isAfter(monthStart) && eventDate.isBefore(monthEnd) && 
                       e.entry_type === 'visit';
            });

            document.getElementById('todayEvents').textContent = `${todayEvents.length}件`;
            document.getElementById('weekMeetings').textContent = `${weekMeetings.length}件`;
            document.getElementById('nextWeekDeadlines').textContent = `${nextWeekDeadlines.length}件`;
            document.getElementById('monthlyVisits').textContent = `${monthlyVisits.length}件`;
        }

        // Modal functions
        function openNewEventModal() {
            currentEditingEventId = null;
            document.getElementById('eventModalTitle').textContent = '新規予定登録';
            document.getElementById('submitEventBtn').textContent = '登録';
            document.getElementById('deleteEventBtn').style.display = 'none';
            document.getElementById('newEventModal').classList.add('active');
        }

        function closeEventModal() {
            document.getElementById('newEventModal').classList.remove('active');
            document.getElementById('newEventForm').reset();
            currentEditingEventId = null;
        }

        // Event form submission
        document.getElementById('newEventForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalText = submitButton.textContent;
            const isEditing = currentEditingEventId !== null;
            
            submitButton.disabled = true;
            submitButton.innerHTML = `<span class="loading-spinner"></span> ${isEditing ? '更新中...' : '登録中...'}`;
            
            const formData = new FormData(e.target);
            const eventData = Object.fromEntries(formData);
            
            // user_id will be automatically set by the server from auth context
            console.log('Submitting event data:', eventData, 'isEditing:', isEditing);
            
            try {
                let response;
                if (isEditing) {
                    // Update existing event
                    response = await axios.put(`/api/schedule/${currentEditingEventId}`, eventData);
                    console.log('Schedule update response:', response.data);
                } else {
                    // Create new event
                    response = await axios.post('/api/schedule', eventData);
                    console.log('Schedule creation response:', response.data);
                }
                
                closeEventModal();
                await loadScheduleEvents();
                showToast(response.data.message || (isEditing ? '予定を更新しました' : '予定を登録しました'), 'success');
            } catch (error) {
                console.error('Error saving event:', error);
                const errorMsg = error.response?.data?.error || (isEditing ? '予定の更新に失敗しました' : '予定の登録に失敗しました');
                const debugInfo = error.response?.data?.debug ? ` (詳細: ${error.response.data.debug})` : '';
                showToast(errorMsg + debugInfo, 'error', 5000);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = originalText;
            }
        });

        // Edit existing event
        async function editEvent(eventId) {
            try {
                console.log('editEvent function called with ID:', eventId);
                
                if (!eventId) {
                    console.error('No event ID provided to editEvent');
                    showToast('予定IDが見つかりません', 'error');
                    return;
                }
                
                console.log('Loading event for edit:', eventId);
                const response = await axios.get(`/api/schedule/${eventId}`);
                console.log('Event data loaded:', response.data);
                const event = response.data;
                
                // Set modal to edit mode
                currentEditingEventId = eventId;
                console.log('Set currentEditingEventId to:', currentEditingEventId);
                
                document.getElementById('eventModalTitle').textContent = '予定編集';
                document.getElementById('submitEventBtn').textContent = '更新';
                document.getElementById('deleteEventBtn').style.display = 'block';
                
                // Populate form with existing data
                const form = document.getElementById('newEventForm');
                form.querySelector('input[name="title"]').value = event.title || '';
                form.querySelector('select[name="entry_type"]').value = event.entry_type || 'other';
                form.querySelector('select[name="client_id"]').value = event.client_id || '';
                form.querySelector('input[name="start_time"]').value = event.start_time ? dayjs(event.start_time).format('YYYY-MM-DDTHH:mm') : '';
                form.querySelector('input[name="end_time"]').value = event.end_time ? dayjs(event.end_time).format('YYYY-MM-DDTHH:mm') : '';
                form.querySelector('input[name="location"]').value = event.location || '';
                form.querySelector('textarea[name="description"]').value = event.description || '';
                
                console.log('Form populated, opening modal');
                
                // Open modal
                document.getElementById('newEventModal').classList.add('active');
                
                console.log('Edit modal opened successfully');
                
            } catch (error) {
                console.error('Failed to load event for editing:', error);
                console.error('Error response:', error.response?.data);
                const errorMsg = error.response?.data?.error || '予定の読み込みに失敗しました';
                const debugInfo = error.response?.data?.debug ? ` (詳細: ${error.response.data.debug})` : '';
                showToast(errorMsg + debugInfo, 'error');
            }
        }

        // Delete current event
        async function deleteCurrentEvent() {
            console.log('Delete button clicked, currentEditingEventId:', currentEditingEventId);
            
            if (!currentEditingEventId) {
                console.error('No event ID available for deletion');
                showToast('削除対象の予定が選択されていません', 'error');
                return;
            }
            
            const confirmed = confirm('この予定を削除してもよろしいですか？');
            if (!confirmed) {
                console.log('User cancelled deletion');
                return;
            }
            
            console.log('Attempting to delete event:', currentEditingEventId);
            
            try {
                const response = await axios.delete(`/api/schedule/${currentEditingEventId}`);
                console.log('Event deleted successfully:', response.data);
                
                closeEventModal();
                await loadScheduleEvents();
                showToast(response.data.message || '予定を削除しました', 'success');
            } catch (error) {
                console.error('Failed to delete event:', error);
                console.error('Error details:', error.response?.data);
                const errorMsg = error.response?.data?.error || '予定の削除に失敗しました';
                const debugInfo = error.response?.data?.debug ? ` (詳細: ${error.response.data.debug})` : '';
                showToast(errorMsg + debugInfo, 'error');
            }
        }

        // Add loading spinner CSS
        const style = document.createElement('style');
        style.textContent = `
            .loading-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                border: 2px solid #ffffff;
                border-radius: 50%;
                border-top-color: transparent;
                animation: spin 1s ease-in-out infinite;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(style);
    </script>
</body>
</html>
  `;
}