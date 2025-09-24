import { html } from '../utils/html-template'

export const subsidyMasterPage = html`
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>助成金マスター管理 - 社労士タスク管理システム</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
  <style>
    .subsidy-card {
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .subsidy-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .status-badge {
      font-size: 0.75rem;
    }
    .period-info {
      font-size: 0.85rem;
    }
    .stats-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .category-badge {
      font-size: 0.75rem;
    }
    .search-filters {
      background-color: #f8f9fa;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }
  </style>
</head>
<body>
  <!-- Navigation -->
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container">
      <a class="navbar-brand" href="/">
        <i class="bi bi-briefcase-fill me-2"></i>
        社労士タスク管理
      </a>
      <div class="navbar-nav ms-auto">
        <a class="nav-link" href="/subsidies">申請管理</a>
        <a class="nav-link active" href="/subsidy-master">助成金マスター</a>
        <a class="nav-link" href="/dashboard">ダッシュボード</a>
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <div class="container mt-4">
    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h2><i class="bi bi-database me-2"></i>助成金マスター管理</h2>
        <p class="text-muted mb-0">助成金情報の登録・編集・管理を行います</p>
      </div>
      <button class="btn btn-primary" onclick="showAddSubsidyModal()">
        <i class="bi bi-plus-lg me-1"></i>新規助成金登録
      </button>
    </div>

    <!-- Stats Cards -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="card stats-card">
          <div class="card-body text-center">
            <i class="bi bi-collection fs-1 mb-2"></i>
            <h4 id="totalSubsidies">-</h4>
            <small>登録助成金数</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-success text-white">
          <div class="card-body text-center">
            <i class="bi bi-check-circle fs-1 mb-2"></i>
            <h4 id="activeSubsidies">-</h4>
            <small>有効な助成金</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-info text-white">
          <div class="card-body text-center">
            <i class="bi bi-file-earmark-text fs-1 mb-2"></i>
            <h4 id="totalApplications">-</h4>
            <small>総申請数</small>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card bg-warning text-dark">
          <div class="card-body text-center">
            <i class="bi bi-trophy fs-1 mb-2"></i>
            <h4 id="successRate">-%</h4>
            <small>成功率</small>
          </div>
        </div>
      </div>
    </div>

    <!-- Search and Filters -->
    <div class="search-filters">
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">検索</label>
          <input type="text" class="form-control" id="searchInput" placeholder="助成金名、管理団体で検索...">
        </div>
        <div class="col-md-3">
          <label class="form-label">カテゴリ</label>
          <select class="form-select" id="categoryFilter">
            <option value="">全てのカテゴリ</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">ステータス</label>
          <select class="form-select" id="statusFilter">
            <option value="active">有効</option>
            <option value="inactive">無効</option>
            <option value="">全て</option>
          </select>
        </div>
        <div class="col-md-2">
          <label class="form-label">&nbsp;</label>
          <button class="btn btn-outline-primary w-100" onclick="searchSubsidies()">
            <i class="bi bi-search me-1"></i>検索
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div id="loading" class="text-center py-4">
      <div class="spinner-border" role="status">
        <span class="visually-hidden">読み込み中...</span>
      </div>
    </div>

    <!-- Subsidies Grid -->
    <div id="subsidiesGrid" class="row g-4" style="display: none;">
      <!-- Subsidies will be loaded here -->
    </div>

    <!-- Pagination -->
    <nav aria-label="Subsidies pagination" class="mt-4">
      <ul id="pagination" class="pagination justify-content-center">
        <!-- Pagination will be loaded here -->
      </ul>
    </nav>
  </div>

  <!-- Add/Edit Subsidy Modal -->
  <div class="modal fade" id="subsidyModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="subsidyModalTitle">助成金登録</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
          <form id="subsidyForm">
            <input type="hidden" id="subsidyId">
            
            <!-- Basic Information -->
            <div class="row mb-3">
              <div class="col-md-8">
                <label for="name" class="form-label">助成金名 <span class="text-danger">*</span></label>
                <input type="text" class="form-control" id="name" required>
              </div>
              <div class="col-md-4">
                <label for="category" class="form-label">カテゴリ <span class="text-danger">*</span></label>
                <select class="form-select" id="category" required>
                  <option value="">選択してください</option>
                  <option value="雇用系">雇用系</option>
                  <option value="育成・研修系">育成・研修系</option>
                  <option value="福利厚生系">福利厚生系</option>
                  <option value="創業・起業系">創業・起業系</option>
                  <option value="IT・デジタル系">IT・デジタル系</option>
                  <option value="環境・省エネ系">環境・省エネ系</option>
                  <option value="その他">その他</option>
                </select>
              </div>
            </div>

            <div class="mb-3">
              <label for="managing_organization" class="form-label">管理団体 <span class="text-danger">*</span></label>
              <input type="text" class="form-control" id="managing_organization" required 
                     placeholder="例：厚生労働省、経済産業省、都道府県労働局">
            </div>

            <div class="mb-3">
              <label for="description" class="form-label">説明</label>
              <textarea class="form-control" id="description" rows="3" 
                        placeholder="助成金の概要や目的を記入してください"></textarea>
            </div>

            <!-- Amount Information -->
            <div class="row mb-3">
              <div class="col-md-6">
                <label for="max_amount" class="form-label">最大支給額（円）</label>
                <input type="number" class="form-control" id="max_amount" min="0">
              </div>
              <div class="col-md-6">
                <label for="subsidy_rate" class="form-label">助成率（%）</label>
                <input type="number" class="form-control" id="subsidy_rate" min="0" max="100" step="0.1">
              </div>
            </div>

            <!-- Application Period -->
            <div class="mb-3">
              <label for="application_period_type" class="form-label">申請時期</label>
              <select class="form-select" id="application_period_type">
                <option value="anytime">随時</option>
                <option value="fixed">固定期間</option>
                <option value="periodic">定期</option>
              </select>
            </div>

            <div class="row mb-3" id="applicationPeriodDates" style="display: none;">
              <div class="col-md-6">
                <label for="application_start_date" class="form-label">申請開始日</label>
                <input type="date" class="form-control" id="application_start_date">
              </div>
              <div class="col-md-6">
                <label for="application_end_date" class="form-label">申請終了日</label>
                <input type="date" class="form-control" id="application_end_date">
              </div>
            </div>

            <div class="mb-3">
              <label for="url" class="form-label">参考URL</label>
              <input type="url" class="form-control" id="url" placeholder="https://example.com">
            </div>

            <!-- Requirements -->
            <div class="mb-3">
              <label for="requirements" class="form-label">申請要件</label>
              <textarea class="form-control" id="requirements" rows="4" 
                        placeholder="申請に必要な要件を記入してください（改行区切り）"></textarea>
            </div>

            <!-- Required Documents -->
            <div class="mb-3">
              <label for="required_documents" class="form-label">必要書類</label>
              <textarea class="form-control" id="required_documents" rows="4" 
                        placeholder="必要な書類を記入してください（改行区切り）"></textarea>
            </div>

            <div class="form-check">
              <input class="form-check-input" type="checkbox" id="is_active" checked>
              <label class="form-check-label" for="is_active">
                有効にする
              </label>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">キャンセル</button>
          <button type="button" class="btn btn-primary" onclick="saveSubsidy()">保存</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Subsidy Detail Modal -->
  <div class="modal fade" id="subsidyDetailModal" tabindex="-1">
    <div class="modal-dialog modal-xl">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="subsidyDetailTitle">助成金詳細</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body" id="subsidyDetailContent">
          <!-- Detail content will be loaded here -->
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    let currentPage = 1;
    let currentFilters = {};

    // Utility functions
    function escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML.replace(/'/g, '&#39;');
    }

    // Global functions (must be outside DOMContentLoaded for onclick to work)
    function showAddSubsidyModal() {
      try {
        console.log('showAddSubsidyModal called');
        
        // DOM要素の存在確認を行い、なければ少し待って再試行
        const checkAndShow = () => {
          const modalTitle = document.getElementById('subsidyModalTitle');
          const subsidyForm = document.getElementById('subsidyForm');
          const subsidyId = document.getElementById('subsidyId');
          const isActive = document.getElementById('is_active');
          const periodDates = document.getElementById('applicationPeriodDates');
          const modalElement = document.getElementById('subsidyModal');
          
          if (!modalTitle || !subsidyForm || !subsidyId || !isActive || !periodDates || !modalElement) {
            console.error('Required modal elements not found');
            alert('モーダル要素が見つかりません。ページを再読み込みしてください。');
            return false;
          }
          
          modalTitle.textContent = '新規助成金登録';
          subsidyForm.reset();
          subsidyId.value = '';
          isActive.checked = true;
          periodDates.style.display = 'none';
          
          // Bootstrap 5の場合
          if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
          } else {
            console.error('Bootstrap Modal not available');
            alert('Bootstrap Modal が利用できません。ページを再読み込みしてください。');
          }
          return true;
        };
        
        // 即座に試行し、失敗したら100ms後に再試行
        if (!checkAndShow()) {
          setTimeout(checkAndShow, 100);
        }
      } catch (error) {
        console.error('Error in showAddSubsidyModal:', error);
        alert('モーダル表示でエラーが発生しました: ' + error.message);
      }
    }

    // Make functions globally accessible immediately (before DOM is loaded)
    window.showAddSubsidyModal = showAddSubsidyModal;

    // Initialize page
    document.addEventListener('DOMContentLoaded', function() {
      loadSubsidies();
      loadCategories();
      
      // Setup filters
      document.getElementById('searchInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          searchSubsidies();
        }
      });
      
      // Setup period type change
      document.getElementById('application_period_type').addEventListener('change', function() {
        const periodDates = document.getElementById('applicationPeriodDates');
        if (this.value === 'fixed' || this.value === 'periodic') {
          periodDates.style.display = 'block';
        } else {
          periodDates.style.display = 'none';
        }
      });
      
      // Make additional functions globally accessible after DOM is loaded
      window.searchSubsidies = searchSubsidies;
      window.saveSubsidy = saveSubsidy;
      window.editSubsidy = editSubsidy;
      window.deleteSubsidy = deleteSubsidy;
      window.viewSubsidyDetail = viewSubsidyDetail;
      window.loadSubsidies = loadSubsidies;
    });

    async function loadCategories() {
      try {
        const response = await axios.get('/api/subsidies/master', {
          params: { limit: 1000 }
        });
        
        if (response.data.success) {
          const categorySelect = document.getElementById('categoryFilter');
          categorySelect.innerHTML = '<option value="">全てのカテゴリ</option>';
          
          response.data.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
          });
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      }
    }

    async function loadSubsidies(page = 1) {
      try {
        document.getElementById('loading').style.display = 'block';
        document.getElementById('subsidiesGrid').style.display = 'none';

        const params = {
          page: page,
          limit: 12,
          ...currentFilters
        };

        const response = await axios.get('/api/subsidies/master', { params });
        
        if (response.data.success) {
          displaySubsidies(response.data.subsidies);
          displayPagination(response.data.total, page, 12);
          updateStats(response.data);
          currentPage = page;
        } else {
          throw new Error(response.data.error);
        }
      } catch (error) {
        console.error('Error loading subsidies:', error);
        alert('助成金の読み込みに失敗しました: ' + error.message);
      } finally {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('subsidiesGrid').style.display = 'flex';
      }
    }

    function displaySubsidies(subsidies) {
      const grid = document.getElementById('subsidiesGrid');
      
      if (subsidies.length === 0) {
        grid.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted">助成金が見つかりませんでした</p></div>';
        return;
      }

      grid.innerHTML = subsidies.map(subsidy => 
        '<div class="col-md-6 col-lg-4">' +
          '<div class="card subsidy-card h-100">' +
            '<div class="card-body">' +
              '<div class="d-flex justify-content-between align-items-start mb-2">' +
                '<span class="badge category-badge" style="background-color: ' + getCategoryColor(subsidy.category) + '">' + subsidy.category + '</span>' +
                '<span class="badge status-badge ' + (subsidy.is_active ? 'bg-success' : 'bg-secondary') + '">' +
                  (subsidy.is_active ? '有効' : '無効') +
                '</span>' +
              '</div>' +
              
              '<h6 class="card-title">' + subsidy.name + '</h6>' +
              '<p class="card-text text-muted small">' + subsidy.managing_organization + '</p>' +
              
              (subsidy.description ? '<p class="card-text small">' + subsidy.description.substring(0, 100) + (subsidy.description.length > 100 ? '...' : '') + '</p>' : '') +
              
              '<div class="row text-center mt-3">' +
                '<div class="col-6">' +
                  '<small class="text-muted">申請数</small>' +
                  '<div><strong>' + (subsidy.application_count || 0) + '</strong></div>' +
                '</div>' +
                '<div class="col-6">' +
                  '<small class="text-muted">成功数</small>' +
                  '<div><strong>' + (subsidy.success_count || 0) + '</strong></div>' +
                '</div>' +
              '</div>' +
              
              (subsidy.max_amount ? '<div class="mt-2"><small class="text-success">最大 ' + formatAmount(subsidy.max_amount) + '円</small></div>' : '') +
            '</div>' +
            
            '<div class="card-footer bg-transparent">' +
              '<div class="btn-group w-100">' +
                '<button class="btn btn-outline-primary btn-sm" onclick="viewSubsidyDetail(' + subsidy.id + ')">' +
                  '<i class="bi bi-eye me-1"></i>詳細' +
                '</button>' +
                '<button class="btn btn-outline-secondary btn-sm" onclick="editSubsidy(' + subsidy.id + ')">' +
                  '<i class="bi bi-pencil me-1"></i>編集' +
                '</button>' +
                '<button class="btn btn-outline-danger btn-sm" onclick="deleteSubsidy(' + subsidy.id + ', ' + JSON.stringify(subsidy.name) + ', ' + subsidy.application_count + ')">' +
                  '<i class="bi bi-trash me-1"></i>削除' +
                '</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>'
      ).join('');
    }

    function updateStats(data) {
      const totalSubsidies = data.total || 0;
      const activeSubsidies = data.subsidies.filter(s => s.is_active).length;
      const totalApplications = data.subsidies.reduce((sum, s) => sum + (s.application_count || 0), 0);
      const totalSuccess = data.subsidies.reduce((sum, s) => sum + (s.success_count || 0), 0);
      const successRate = totalApplications > 0 ? Math.round((totalSuccess / totalApplications) * 100) : 0;

      document.getElementById('totalSubsidies').textContent = totalSubsidies;
      document.getElementById('activeSubsidies').textContent = activeSubsidies;
      document.getElementById('totalApplications').textContent = totalApplications;
      document.getElementById('successRate').textContent = successRate;
    }

    function displayPagination(total, currentPage, limit) {
      const totalPages = Math.ceil(total / limit);
      const pagination = document.getElementById('pagination');
      
      if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
      }

      let html = '';
      
      // Previous button
      html += '<li class="page-item ' + (currentPage === 1 ? 'disabled' : '') + '">' +
        '<a class="page-link" href="#" onclick="loadSubsidies(' + (currentPage - 1) + ')">前へ</a>' +
      '</li>';
      
      // Page numbers
      for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        html += '<li class="page-item ' + (i === currentPage ? 'active' : '') + '">' +
          '<a class="page-link" href="#" onclick="loadSubsidies(' + i + ')">' + i + '</a>' +
        '</li>';
      }
      
      // Next button
      html += '<li class="page-item ' + (currentPage === totalPages ? 'disabled' : '') + '">' +
        '<a class="page-link" href="#" onclick="loadSubsidies(' + (currentPage + 1) + ')">次へ</a>' +
      '</li>';
      
      pagination.innerHTML = html;
    }

    function searchSubsidies() {
      currentFilters = {
        search: document.getElementById('searchInput').value,
        category: document.getElementById('categoryFilter').value,
        status: document.getElementById('statusFilter').value
      };
      loadSubsidies(1);
    }

    async function editSubsidy(subsidyId) {
      try {
        const response = await axios.get('/api/subsidies/master/' + subsidyId);
        
        if (response.data.success) {
          const subsidy = response.data.subsidy;
          
          document.getElementById('subsidyModalTitle').textContent = '助成金編集';
          const element = document.getElementById('subsidyId');
            if (element) element.value = subsidy.id;
          const element = document.getElementById('name');
            if (element) element.value = subsidy.name || '';
          const element = document.getElementById('category');
            if (element) element.value = subsidy.category || '';
          const element = document.getElementById('managing_organization');
            if (element) element.value = subsidy.managing_organization || '';
          const element = document.getElementById('description');
            if (element) element.value = subsidy.description || '';
          const element = document.getElementById('max_amount');
            if (element) element.value = subsidy.max_amount || '';
          const element = document.getElementById('subsidy_rate');
            if (element) element.value = subsidy.subsidy_rate || '';
          const element = document.getElementById('application_period_type');
            if (element) element.value = subsidy.application_period_type || 'anytime';
          const element = document.getElementById('application_start_date');
            if (element) element.value = subsidy.application_start_date || '';
          const element = document.getElementById('application_end_date');
            if (element) element.value = subsidy.application_end_date || '';
          const element = document.getElementById('url');
            if (element) element.value = subsidy.url || '';
          const element = document.getElementById('requirements');
            if (element) element.value = subsidy.requirements || '';
          const element = document.getElementById('required_documents');
            if (element) element.value = subsidy.required_documents || '';
          document.getElementById('is_active').checked = subsidy.is_active;
          
          // Show period dates if needed
          const periodType = subsidy.application_period_type;
          if (periodType === 'fixed' || periodType === 'periodic') {
            document.getElementById('applicationPeriodDates').style.display = 'block';
          }
          
          const modal = new bootstrap.Modal(document.getElementById('subsidyModal'));
          modal.show();
        }
      } catch (error) {
        console.error('Error loading subsidy:', error);
        alert('助成金の読み込みに失敗しました');
      }
    }

    async function saveSubsidy() {
      try {
        const form = document.getElementById('subsidyForm');
        const formData = new FormData(form);
        const subsidyId = document.getElementById('subsidyId').value;
        
        const data = {
          name: document.getElementById('name').value,
          category: document.getElementById('category').value,
          managing_organization: document.getElementById('managing_organization').value,
          description: document.getElementById('description').value,
          max_amount: document.getElementById('max_amount').value ? parseInt(document.getElementById('max_amount').value) : null,
          subsidy_rate: document.getElementById('subsidy_rate').value ? parseFloat(document.getElementById('subsidy_rate').value) : null,
          application_period_type: document.getElementById('application_period_type').value,
          application_start_date: document.getElementById('application_start_date').value || null,
          application_end_date: document.getElementById('application_end_date').value || null,
          url: document.getElementById('url').value || null,
          requirements: document.getElementById('requirements').value || null,
          required_documents: document.getElementById('required_documents').value || null,
          is_active: document.getElementById('is_active').checked
        };

        let response;
        if (subsidyId) {
          response = await axios.put('/api/subsidies/master/' + subsidyId, data);
        } else {
          response = await axios.post('/api/subsidies/master', data);
        }
        
        if (response.data.success) {
          const modal = bootstrap.Modal.getInstance(document.getElementById('subsidyModal'));
          modal.hide();
          alert(response.data.message);
          loadSubsidies(currentPage);
        } else {
          throw new Error(response.data.error);
        }
      } catch (error) {
        console.error('Error saving subsidy:', error);
        const errorMsg = error.response?.data?.error || error.message;
        alert('保存に失敗しました: ' + errorMsg);
      }
    }

    async function deleteSubsidy(subsidyId, subsidyName, applicationCount) {
      if (applicationCount > 0) {
        alert('この助成金「' + subsidyName + '」には' + applicationCount + '件の申請があるため削除できません。無効化してください。');
        return;
      }
      
      if (!confirm('助成金「' + subsidyName + '」を削除しますか？この操作は取り消せません。')) {
        return;
      }

      try {
        const response = await axios.delete('/api/subsidies/master/' + subsidyId);
        
        if (response.data.success) {
          alert(response.data.message);
          loadSubsidies(currentPage);
        } else {
          throw new Error(response.data.error);
        }
      } catch (error) {
        console.error('Error deleting subsidy:', error);
        const errorMsg = error.response?.data?.error || error.message;
        alert('削除に失敗しました: ' + errorMsg);
      }
    }

    async function viewSubsidyDetail(subsidyId) {
      try {
        const response = await axios.get('/api/subsidies/master/' + subsidyId);
        
        if (response.data.success) {
          const subsidy = response.data.subsidy;
          
          document.getElementById('subsidyDetailTitle').textContent = subsidy.name;
          document.getElementById('subsidyDetailContent').innerHTML = 
            '<div class="row">' +
              '<div class="col-md-8">' +
                '<h6>基本情報</h6>' +
                '<table class="table">' +
                  '<tr><th>助成金名</th><td>' + subsidy.name + '</td></tr>' +
                  '<tr><th>カテゴリ</th><td><span class="badge" style="background-color: ' + getCategoryColor(subsidy.category) + '">' + subsidy.category + '</span></td></tr>' +
                  '<tr><th>管理団体</th><td>' + subsidy.managing_organization + '</td></tr>' +
                  '<tr><th>説明</th><td>' + (subsidy.description || '-') + '</td></tr>' +
                  '<tr><th>最大支給額</th><td>' + (subsidy.max_amount ? formatAmount(subsidy.max_amount) + '円' : '-') + '</td></tr>' +
                  '<tr><th>助成率</th><td>' + (subsidy.subsidy_rate ? subsidy.subsidy_rate + '%' : '-') + '</td></tr>' +
                  '<tr><th>申請時期</th><td>' + getApplicationPeriodText(subsidy) + '</td></tr>' +
                  '<tr><th>参考URL</th><td>' + (subsidy.url ? '<a href="' + subsidy.url + '" target="_blank">' + subsidy.url + '</a>' : '-') + '</td></tr>' +
                  '<tr><th>ステータス</th><td><span class="badge ' + (subsidy.is_active ? 'bg-success' : 'bg-secondary') + '">' + (subsidy.is_active ? '有効' : '無効') + '</span></td></tr>' +
                '</table>' +
                
                (subsidy.requirements ? 
                '<h6>申請要件</h6>' +
                '<div class="card">' +
                  '<div class="card-body">' +
                    '<pre style="white-space: pre-wrap;">' + subsidy.requirements + '</pre>' +
                  '</div>' +
                '</div>' : '') +
                
                (subsidy.required_documents ? 
                '<h6 class="mt-3">必要書類</h6>' +
                '<div class="card">' +
                  '<div class="card-body">' +
                    '<pre style="white-space: pre-wrap;">' + subsidy.required_documents + '</pre>' +
                  '</div>' +
                '</div>' : '') +
              '</div>' +
              
              '<div class="col-md-4">' +
                '<h6>統計情報</h6>' +
                '<div class="card">' +
                  '<div class="card-body">' +
                    '<div class="row text-center">' +
                      '<div class="col-6">' +
                        '<h4 class="text-primary">' + (subsidy.application_count || 0) + '</h4>' +
                        '<small>申請数</small>' +
                      '</div>' +
                      '<div class="col-6">' +
                        '<h4 class="text-success">' + (subsidy.success_count || 0) + '</h4>' +
                        '<small>成功数</small>' +
                      '</div>' +
                    '</div>' +
                    '<hr>' +
                    '<div class="text-center">' +
                      '<h4 class="text-warning">' + (subsidy.application_count > 0 ? Math.round((subsidy.success_count / subsidy.application_count) * 100) : 0) + '%</h4>' +
                      '<small>成功率</small>' +
                    '</div>' +
                    (subsidy.avg_received_amount ? 
                    '<hr>' +
                    '<div class="text-center">' +
                      '<h6 class="text-info">' + formatAmount(Math.round(subsidy.avg_received_amount)) + '円</h6>' +
                      '<small>平均受給額</small>' +
                    '</div>' : '') +
                  '</div>' +
                '</div>' +
                
                (subsidy.recent_applications && subsidy.recent_applications.length > 0 ? 
                '<h6 class="mt-3">最近の申請</h6>' +
                '<div class="list-group">' +
                  subsidy.recent_applications.slice(0, 5).map(app => 
                    '<div class="list-group-item">' +
                      '<div class="d-flex justify-content-between">' +
                        '<small><strong>' + app.client_name + '</strong></small>' +
                        '<small class="text-muted">' + formatDate(app.created_at) + '</small>' +
                      '</div>' +
                      '<small class="badge bg-secondary">' + getStatusText(app.status) + '</small>' +
                    '</div>'
                  ).join('') +
                '</div>' : '') +
              '</div>' +
            '</div>';
          
          const modal = new bootstrap.Modal(document.getElementById('subsidyDetailModal'));
          modal.show();
        }
      } catch (error) {
        console.error('Error loading subsidy detail:', error);
        alert('詳細の読み込みに失敗しました');
      }
    }

    // Utility functions
    function getCategoryColor(category) {
      const colors = {
        '雇用系': '#007bff',
        '育成・研修系': '#28a745',
        '福利厚生系': '#17a2b8',
        '創業・起業系': '#ffc107',
        'IT・デジタル系': '#6f42c1',
        '環境・省エネ系': '#20c997',
        'その他': '#6c757d'
      };
      return colors[category] || '#6c757d';
    }

    function formatAmount(amount) {
      return new Intl.NumberFormat('ja-JP').format(amount);
    }

    function formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('ja-JP');
    }

    function getApplicationPeriodText(subsidy) {
      const typeText = {
        'anytime': '随時',
        'fixed': '固定期間',
        'periodic': '定期'
      };
      
      let text = typeText[subsidy.application_period_type] || '随時';
      
      if (subsidy.application_start_date && subsidy.application_end_date) {
        text += ' (' + formatDate(subsidy.application_start_date) + ' ～ ' + formatDate(subsidy.application_end_date) + ')';
      }
      
      return text;
    }

    function getStatusText(status) {
      const statusTexts = {
        'planning': '計画中',
        'preparing': '準備中',
        'document_check': '書類確認中',
        'submitted': '申請済み',
        'under_review': '審査中',
        'approved': '承認',
        'rejected': '却下',
        'received': '受給済み',
        'cancelled': '取り下げ'
      };
      return statusTexts[status] || status;
    }
  </script>
</body>
</html>
`