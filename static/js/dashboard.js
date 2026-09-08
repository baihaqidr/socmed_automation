// ==========================================================================
// SOCMED AUTOMATION (SUPABASE STUDIO ENGINE) JS
// Multi-Account Switcher (Gmail + Instagram) + 100% Lucide Icons
// ==========================================================================

let currentActiveAccountId = "17841466987503898";
let currentActiveUsername = "sarangestate";
let currentActiveEmail = "baihaqidr@gmail.com";

// Helper to trigger Lucide Icons render across dynamic elements
function refreshIcons() {
  if (window.lucide && typeof window.lucide.createIcons === 'function') {
    window.lucide.createIcons();
  }
}

// Switch Tab Navigation
function switchTab(tabId) {
  document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-item button').forEach(el => el.classList.remove('active'));
  
  const targetTab = document.getElementById(`tab-${tabId}`);
  if (targetTab) {
    targetTab.classList.add('active');
  }

  // Set active nav button
  const buttons = document.querySelectorAll('.nav-item button');
  buttons.forEach(btn => {
    if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
      btn.classList.add('active');
    }
  });

  if (tabId === 'dashboard') loadDashboardData();
  if (tabId === 'postrules') loadPostRulesView();
  if (tabId === 'autoreply') loadRulesData();
  if (tabId === 'inbox') loadInboxComments();
  if (tabId === 'insights') loadInsightsData();
  if (tabId === 'storyrules') loadStoryRules();
  if (tabId === 'scheduler') loadScheduledPosts();

  setTimeout(refreshIcons, 50);
}

// Theme Switcher Logic (Supabase Light / Dark Mode)
function initTheme() {
  const savedTheme = localStorage.getItem('supabase_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  document.body.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  document.body.setAttribute('data-theme', newTheme);
  localStorage.setItem('supabase_theme', newTheme);
  updateThemeIcon(newTheme);
  refreshIcons();
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle-btn');
  if (!btn) return;
  const sunIcon = btn.querySelector('.sun-icon');
  const moonIcon = btn.querySelector('.moon-icon');
  if (sunIcon && moonIcon) {
    if (theme === 'light') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'inline-block';
    } else {
      sunIcon.style.display = 'inline-block';
      moonIcon.style.display = 'none';
    }
  }
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  refreshIcons();
  loadUserProfiles();
  loadInstagramAccounts();
  loadDashboardData();
  setupLivePreview();

  // Close dropdowns on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('#gmail-dropdown-wrapper')) {
      document.getElementById('gmail-dropdown-menu')?.classList.remove('active');
    }
    if (!e.target.closest('#ig-dropdown-wrapper')) {
      document.getElementById('ig-dropdown-menu')?.classList.remove('active');
    }
  });
});

// Toggle Gmail Switcher Dropdown
function toggleGmailDropdown(event) {
  event.stopPropagation();
  const menu = document.getElementById('gmail-dropdown-menu');
  const igMenu = document.getElementById('ig-dropdown-menu');
  if (igMenu) igMenu.classList.remove('active');
  if (menu) menu.classList.toggle('active');
}

// Toggle Instagram Switcher Dropdown
function toggleIgDropdown(event) {
  event.stopPropagation();
  const menu = document.getElementById('ig-dropdown-menu');
  const gmailMenu = document.getElementById('gmail-dropdown-menu');
  if (gmailMenu) gmailMenu.classList.remove('active');
  if (menu) menu.classList.toggle('active');
}

// 1. Fetch & Render Gmail Profiles
async function loadUserProfiles() {
  try {
    const res = await fetch('/api/user-profiles');
    const data = await res.json();
    
    if (data.users) {
      currentActiveEmail = data.active_email;
      const activeUser = data.users.find(u => u.is_active) || data.users[0];
      
      const headerAvatar = document.getElementById('header-user-avatar');
      const headerName = document.getElementById('header-user-name');
      const headerPlan = document.getElementById('header-user-plan');
      
      if (headerAvatar) headerAvatar.innerText = activeUser.avatar || 'B';
      if (headerName) headerName.innerText = activeUser.name || 'baihaqidr';
      if (headerPlan) headerPlan.innerText = activeUser.plan || 'FREE';

      const listContainer = document.getElementById('gmail-accounts-list');
      if (listContainer) {
        listContainer.innerHTML = data.users.map(user => `
          <button class="dropdown-item ${user.is_active ? 'active' : ''}" onclick="switchUserAccount('${user.email}')">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="user-avatar-sm" style="background: ${user.is_active ? 'var(--primary)' : '#333333'}; color: ${user.is_active ? 'var(--on-primary)' : '#AAAAAA'}; font-size: 10px;">${user.avatar}</span>
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 500; font-size: 13px;">${user.name}</span>
                <span style="font-size: 11px; color: var(--ink-mute); font-family: var(--font-mono);">${user.email}</span>
              </div>
            </div>
            ${user.is_active ? '<i data-lucide="check" style="width: 14px; height: 14px; color: var(--primary);"></i>' : `<span class="pill-badge pill-green" style="font-size: 10px;">${user.plan}</span>`}
          </button>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading user profiles:', err);
  } finally {
    refreshIcons();
  }
}

// Switch User Gmail Account
async function switchUserAccount(email) {
  try {
    const res = await fetch('/api/switch-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(`Beralih ke workspace: ${email}`, 'success');
      document.getElementById('gmail-dropdown-menu')?.classList.remove('active');
      loadUserProfiles();
    }
  } catch (err) {
    showToast('Gagal beralih workspace.', 'error');
  }
}

// 2. Fetch & Render Instagram Accounts
async function loadInstagramAccounts() {
  try {
    const res = await fetch('/api/accounts');
    const data = await res.json();
    
    if (data.accounts) {
      currentActiveAccountId = data.active_account_id;
      const activeAcc = data.accounts.find(a => a.is_active) || data.accounts[0];
      currentActiveUsername = activeAcc.username;

      // Update UI Header & Targets
      const headerIg = document.getElementById('header-ig-username');
      const statUser = document.getElementById('stat-username');
      const currentAccLabel = document.getElementById('current-account-label');
      const publishTarget = document.getElementById('publish-account-target');
      const previewUsername = document.getElementById('preview-account-username');
      const settingsAccId = document.getElementById('settings-account-id');

      if (headerIg) headerIg.innerText = `@${activeAcc.username}`;
      if (statUser) statUser.innerText = `@${activeAcc.username}`;
      if (currentAccLabel) currentAccLabel.innerText = `@${activeAcc.username}`;
      if (publishTarget) publishTarget.innerText = `@${activeAcc.username}`;
      if (previewUsername) previewUsername.innerText = activeAcc.username;
      if (settingsAccId) settingsAccId.innerText = activeAcc.id;

      const listContainer = document.getElementById('ig-accounts-list');
      if (listContainer) {
        listContainer.innerHTML = data.accounts.map(acc => `
          <button class="dropdown-item ${acc.is_active ? 'active' : ''}" onclick="switchInstagramAccount('${acc.id}', '${acc.username}')">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="at-sign" style="width: 14px; height: 14px; color: ${acc.is_active ? 'var(--primary)' : 'var(--ink-mute)'};"></i>
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 600; font-size: 13px;">@${acc.username}</span>
                <span style="font-size: 11px; color: var(--ink-mute);">${acc.name} (${acc.media_count} Posts)</span>
              </div>
            </div>
            ${acc.is_active ? '<i data-lucide="check" style="width: 14px; height: 14px; color: var(--primary);"></i>' : ''}
          </button>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Error loading Instagram accounts:', err);
  } finally {
    refreshIcons();
  }
}

// Switch Instagram Account
async function switchInstagramAccount(accountId, username) {
  try {
    const res = await fetch('/api/switch-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ account_id: accountId })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast(`Akun Instagram aktif beralih ke: @${username}`, 'success');
      document.getElementById('ig-dropdown-menu')?.classList.remove('active');
      
      // Reload all account data
      await loadInstagramAccounts();
      await loadDashboardData();
      
      // If currently on other tabs, reload them
      const activeTab = document.querySelector('.tab-view.active')?.id;
      if (activeTab === 'tab-postrules') loadPostRulesView();
      if (activeTab === 'tab-inbox') loadInboxComments();
    }
  } catch (err) {
    showToast('Gagal beralih akun Instagram.', 'error');
  }
}

// 3. Fetch Dashboard Overview
async function loadDashboardData() {
  try {
    const res = await fetch('/api/account');
    const data = await res.json();
    
    if (data.id) {
      document.getElementById('stat-username').innerText = `@${data.username}`;
      document.getElementById('stat-media-count').innerText = data.media_count || 0;
    }
    
    loadPostsFeed();
  } catch (err) {
    console.error('Error loading account data:', err);
  }
}

// Fetch Posts Feed for Dashboard Tab
async function loadPostsFeed() {
  const container = document.getElementById('dashboard-posts-container');
  if (!container) return;

  try {
    container.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px;">Memuat data postingan...</div>';
    const res = await fetch('/api/posts?limit=50');
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      document.getElementById('post-count-badge').innerText = `${data.data.length} Posts`;
      
      container.innerHTML = data.data.map(post => `
        <div class="supa-card post-card" style="padding: 16px;">
          <div style="font-size: 11px; color: var(--ink-mute); margin-bottom: 8px; font-family: var(--font-mono); display: flex; justify-content: space-between;">
            <span>ID: ${post.id}</span>
            <span style="color: var(--primary); font-weight: 500;">${new Date(post.timestamp).toLocaleDateString('id-ID')}</span>
          </div>
          <div class="post-caption">
            ${post.caption ? post.caption : 'Tanpa Caption'}
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
            <span style="font-size: 12px; color: var(--primary); font-weight: 500; display: inline-flex; align-items: center; gap: 6px;">
              <i data-lucide="message-square" style="width: 14px; height: 14px;"></i> ${post.comments_count || 0} Komentar
            </span>
            <a href="${post.permalink || '#'}" target="_blank" style="font-size: 12px; color: var(--ink-mute); text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
              Lihat di IG <i data-lucide="external-link" style="width: 13px; height: 13px;"></i>
            </a>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px;">Belum ada postingan di akun ini.</div>';
      document.getElementById('post-count-badge').innerText = `0 Posts`;
    }
  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger); font-size: 13px;">Gagal memuat postingan.</div>';
  } finally {
    refreshIcons();
  }
}

// Load Post Custom Rules & DM Links View
async function loadPostRulesView() {
  const container = document.getElementById('post-rules-cards-container');
  if (!container) return;

  container.innerHTML = '<div style="color: var(--ink-mute); padding: 20px;">Memuat seluruh postingan dan konfigurasi...</div>';

  try {
    const [postsRes, rulesRes] = await Promise.all([
      fetch('/api/posts?limit=50'),
      fetch('/api/post-rules')
    ]);

    const postsData = await postsRes.json();
    const rulesData = await rulesRes.json();
    const posts = postsData.data || [];

    if (posts.length === 0) {
      container.innerHTML = '<div class="supa-card" style="color: var(--ink-mute);">Tidak ada postingan ditemukan di akun ini.</div>';
      return;
    }

    const savedCount = posts.filter(p => {
      const r = rulesData[String(p.id)];
      return Boolean(r && (r.cta_link || r.send_dm || r.custom_reply || r.require_follow));
    }).length;
    const unsavedCount = posts.length - savedCount;

    // Header Status Filter Bar
    const filterBarHtml = `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; padding: 12px 18px; background: var(--canvas-night-soft); border-radius: var(--radius-sm); border: 1px solid var(--border-color); flex-wrap: wrap; gap: 12px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 13px; font-weight: 600; color: var(--on-dark);">Total: ${posts.length} Post</span>
          <span class="pill-badge pill-green" style="font-size: 11px; padding: 3px 10px; display: inline-flex; align-items: center; gap: 5px; background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.35);">
            <i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> ${savedCount} Postingan Aktif
          </span>
          <span class="pill-badge" style="font-size: 11px; padding: 3px 10px; display: inline-flex; align-items: center; gap: 5px; color: var(--ink-mute); border: 1px solid var(--border-subtle); background: var(--canvas-night);">
            <i data-lucide="circle-dashed" style="width: 12px; height: 12px;"></i> ${unsavedCount} Belum Diatur
          </span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn-ghost filter-btn-post active" id="btn-filter-all" onclick="filterPostCards('all')" style="font-size: 11px; padding: 4px 10px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: var(--on-dark);">Semua (${posts.length})</button>
          <button type="button" class="btn-ghost filter-btn-post" id="btn-filter-saved" onclick="filterPostCards('saved')" style="font-size: 11px; padding: 4px 10px; border: 1px solid rgba(16, 185, 129, 0.35); border-radius: var(--radius-sm); color: #10B981;">🟢 Hanya Aktif (${savedCount})</button>
          <button type="button" class="btn-ghost filter-btn-post" id="btn-filter-unsaved" onclick="filterPostCards('unsaved')" style="font-size: 11px; padding: 4px 10px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: var(--ink-mute);">⚪ Belum Diatur (${unsavedCount})</button>
        </div>
      </div>
    `;

    const cardsHtml = posts.map(post => {
      const pId = String(post.id);
      const rule = rulesData[pId] || {};
      const ctaLink = rule.cta_link || '';
      const customReply = rule.custom_reply || '';
      const sendDm = rule.send_dm || false;
      const dmMessage = rule.dm_message || '';
      const buttonText = rule.button_text || 'Ini link aksesnya';
      const dmFormat = rule.dm_format || 'card';
      const useSmartLink = rule.use_smart_link !== false;
      const requireFollow = rule.require_follow === true;
      const followPrompt = rule.follow_prompt || '';
      const notFollowingMsg = rule.not_following_msg || '';
      const requestBtnText = rule.request_btn_text || 'Send me the link';
      const followBtnText = rule.follow_btn_text || 'Following';
      const introDmMessage = rule.intro_dm_message || '';
      const captionText = post.caption || 'Tanpa Caption';

      // Distinguish saved vs unsaved
      const isSaved = Boolean(rule && (rule.cta_link || rule.send_dm || rule.custom_reply || rule.require_follow));

      const cardBorder = isSaved
        ? 'border: 1.5px solid rgba(16, 185, 129, 0.45); border-left: 6px solid #10B981; background: rgba(16, 185, 129, 0.015); box-shadow: 0 4px 20px rgba(16, 185, 129, 0.06);'
        : 'border: 1px dashed var(--border-color); border-left: 4px solid var(--border-color); opacity: 0.92;';

      const statusBadgeHtml = isSaved
        ? `<span class="pill-badge pill-green" style="font-size: 11px; font-weight: 700; padding: 3px 10px; background: rgba(16, 185, 129, 0.15); color: #10B981; border: 1px solid rgba(16, 185, 129, 0.35); display: inline-flex; align-items: center; gap: 5px;">
             <i data-lucide="check-circle-2" style="width: 13px; height: 13px;"></i> AKTIF & TERSIMPAN
           </span>`
        : `<span class="pill-badge" style="font-size: 11px; font-weight: 500; color: var(--ink-mute); background: var(--canvas-night-soft); border: 1px solid var(--border-subtle); padding: 3px 10px; display: inline-flex; align-items: center; gap: 5px;">
             <i data-lucide="circle-dashed" style="width: 13px; height: 13px;"></i> Belum Diatur
           </span>`;

      const bottomBarHtml = isSaved
        ? `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 12px; border-top: 1px solid rgba(16, 185, 129, 0.2);">
            <div style="font-size: 12px; color: #10B981; font-weight: 500; display: flex; align-items: center; gap: 6px;">
              <i data-lucide="check-check" style="width: 15px; height: 15px;"></i> Aturan postingan ini aktif tersimpan di Supabase
            </div>
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn-ghost" onclick="deletePostRule('${pId}')" style="color: var(--danger); font-size: 12px; padding: 6px 12px; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 6px;" title="Reset dan hapus aturan post ini">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Hapus Aturan
              </button>
              <button type="button" class="btn-primary" onclick="savePostRule('${pId}')" id="btn-save-${pId}" style="display: inline-flex; align-items: center; gap: 6px; background: #10B981; border-color: #10B981;">
                <i data-lucide="save" style="width: 14px; height: 14px;"></i> Update Pengaturan Post
              </button>
            </div>
          </div>
        `
        : `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 14px; padding-top: 12px; border-top: 1px dashed var(--border-color);">
            <div style="font-size: 12px; color: var(--ink-mute); display: flex; align-items: center; gap: 6px;">
              <i data-lucide="info" style="width: 14px; height: 14px;"></i> Belum ada aturan khusus (menggunakan balasan AI umum)
            </div>
            <button type="button" class="btn-primary" onclick="savePostRule('${pId}')" id="btn-save-${pId}" style="display: inline-flex; align-items: center; gap: 6px;">
              <i data-lucide="save" style="width: 14px; height: 14px;"></i> Simpan Pengaturan Post Ini
            </button>
          </div>
        `;

      return `
        <div class="supa-card post-card-item" data-saved="${isSaved ? 'true' : 'false'}" style="display: grid; grid-template-columns: 260px 1fr; gap: 24px; margin-bottom: 20px; ${cardBorder}">
          <!-- Post Summary -->
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
              ${statusBadgeHtml}
              <span style="font-size: 11px; font-family: var(--font-mono); color: var(--ink-mute-2);">ID: ${pId}</span>
            </div>
            <div style="font-size: 13px; font-weight: 500; color: var(--on-dark); margin-bottom: 10px; line-height: 1.4; max-height: 110px; overflow-y: auto; padding: 10px; background: var(--canvas-night-soft); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle);">
              ${captionText}
            </div>
            <div style="display: flex; gap: 10px; align-items: center; margin-top: 10px;">
              <span class="pill-badge ${post.comments_count > 0 ? 'pill-green' : 'pill-purple'}" style="display: inline-flex; align-items: center; gap: 6px;">
                <i data-lucide="message-square" style="width: 13px; height: 13px;"></i> ${post.comments_count || 0} Komentar
              </span>
              <a href="${post.permalink || '#'}" target="_blank" style="font-size: 12px; color: var(--ink-mute); text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                Buka Post <i data-lucide="external-link" style="width: 13px; height: 13px;"></i>
              </a>
            </div>
          </div>

          <!-- Configuration Form -->
          <div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <!-- Custom Destination URL Link -->
              <div class="form-group" style="margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                  <label class="form-label" style="display: flex; align-items: center; gap: 6px; margin-bottom: 0;">
                    <i data-lucide="link" style="width: 14px; height: 14px; color: var(--primary);"></i> Custom Link (URL Tujuan)
                  </label>
                  <button type="button" onclick="testOgCardPreview('${pId}')" class="btn-ghost" style="font-size: 11px; padding: 2px 8px; height: 22px; color: var(--accent-blue); display: inline-flex; align-items: center; gap: 4px;" title="Lihat kartu preview uncropped">
                    <i data-lucide="external-link" style="width: 12px; height: 12px;"></i> Test Preview Card
                  </button>
                </div>
                <input type="text" id="cta-link-${pId}" class="form-input" value="${ctaLink}" placeholder="contoh: https://domainanda.com/promo atau https://linktr.ee/...">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 5px;">
                  <label style="font-size: 11px; color: var(--on-dark); display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="checkbox" id="smart-link-${pId}" ${useSmartLink ? 'checked' : ''} style="accent-color: var(--accent-blue); cursor: pointer;">
                    <span>🛡️ <strong>Anti-Krop Smart Card</strong>: Thumbnail pas tanpa kepotong</span>
                  </label>
                  <span style="font-size: 10px; color: var(--ink-mute-2);">1200x630 Pas</span>
                </div>
              </div>

              <!-- Custom Public Reply -->
              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label" style="display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="message-circle" style="width: 14px; height: 14px; color: var(--accent-blue);"></i> Custom Comment Reply (Opsional)
                </label>
                <input type="text" id="custom-reply-${pId}" class="form-input" value="${customReply}" placeholder="Kosongkan jika ingin memakai AI Gemini otomatis">
                <span style="font-size: 11px; color: var(--ink-mute-2); margin-top: 3px; display: block;">Jika diisi, bot akan memakai teks tetap ini. Jika kosong, AI yang menjawab.</span>
              </div>
            </div>

            <!-- Workflow Pre-Step: Follow Gatekeeper (Optional) -->
            <div style="padding: 12px 14px; background: rgba(59, 130, 246, 0.04); border: 1px dashed var(--primary); border-radius: var(--radius-sm); margin-top: 6px; margin-bottom: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <label style="font-size: 13px; font-weight: 600; color: var(--primary); display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="checkbox" id="require-follow-${pId}" ${requireFollow ? 'checked' : ''} onchange="document.getElementById('follow-settings-${pId}').style.display = this.checked ? 'block' : 'none'" style="accent-color: var(--primary); cursor: pointer;">
                  <i data-lucide="user-check" style="width: 15px; height: 15px;"></i> 🛡️ Pre-Step: Wajib Cek Follow (Follow Gatekeeper)
                </label>
                <span class="pill-badge pill-purple" style="font-size: 10px;">Tahap Verifikasi Awal</span>
              </div>
              
              <div id="follow-settings-${pId}" style="display: ${requireFollow ? 'block' : 'none'}; margin-top: 10px;">
                <!-- 2-Step Interactive Button Flow Info Card -->
                <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: var(--radius-sm); padding: 10px 14px; font-size: 11px; color: var(--on-dark); line-height: 1.5;">
                  <div style="font-weight: 700; color: #10B981; display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                    <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i> 2-Step Interactive Button Flow (100% Bebas Ngetik Manual):
                  </div>
                  <div style="color: var(--on-dark-bright); margin-bottom: 6px;">
                    User tidak perlu mengetik kata "SUDAH"! Cukup sentuh tombol interaktif di dalam DM:
                  </div>
                  <div style="font-family: var(--font-mono); font-size: 10px; background: var(--canvas-night); padding: 6px 10px; border-radius: 4px; border: 1px solid var(--border-subtle); color: var(--ink-mute);">
                    DM 1: Sapaan ➡️ <strong>[ ${requestBtnText} ]</strong> ➡️ DM 2: Minta Follow ➡️ <strong>[ ${followBtnText} ]</strong> ➡️ 🔓 Link Unlocked!
                  </div>
                </div>

                <!-- Interactive Button Labels Configuration -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                  <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 11px; color: var(--on-dark); margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                      <i data-lucide="hand" style="width: 12px; height: 12px; color: var(--primary);"></i> Label Tombol DM 1 (Minta Link)
                    </label>
                    <input type="text" id="req-btn-${pId}" class="form-input" value="${requestBtnText}" placeholder="Default: Send me the link">
                    <span style="font-size: 10px; color: var(--ink-mute-2); margin-top: 2px; display: block;">Teks tombol di pesan DM pertama</span>
                  </div>
                  <div class="form-group" style="margin-bottom: 0;">
                    <label style="font-size: 11px; color: var(--on-dark); margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                      <i data-lucide="user-check" style="width: 12px; height: 12px; color: #10B981;"></i> Label Tombol DM 2 (Konfirmasi Follow)
                    </label>
                    <input type="text" id="fol-btn-${pId}" class="form-input" value="${followBtnText}" placeholder="Default: Following">
                    <span style="font-size: 10px; color: var(--ink-mute-2); margin-top: 2px; display: block;">Teks tombol konfirmasi verifikasi follow</span>
                  </div>
                </div>

                <!-- Optional Customization Details -->
                <details style="margin-top: 10px;">
                  <summary style="font-size: 11px; font-weight: 500; color: var(--primary); cursor: pointer; user-select: none; display: inline-flex; align-items: center; gap: 4px;">
                    <span>✏️ Sesuaikan teks pesan DM (Opsional)</span>
                  </summary>
                  <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--border-subtle);">
                    <div class="form-group" style="margin-bottom: 0;">
                      <label style="font-size: 11px; color: var(--ink-mute); margin-bottom: 4px; display: block;">Teks DM 1 (Sapaan Awal)</label>
                      <input type="text" id="intro-dm-${pId}" class="form-input" value="${introDmMessage}" placeholder="Default: Hey there! Click below...">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label style="font-size: 11px; color: var(--ink-mute); margin-bottom: 4px; display: block;">Teks DM 2 (Minta Follow)</label>
                      <input type="text" id="follow-prompt-${pId}" class="form-input" value="${followPrompt}" placeholder="Default: Nearly there! Link is for followers...">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                      <label style="font-size: 11px; color: var(--ink-mute); margin-bottom: 4px; display: block;">Teks Jika Belum Follow</label>
                      <input type="text" id="not-following-msg-${pId}" class="form-input" value="${notFollowingMsg}" placeholder="Default: Nearly there kak! Kamu belum follow...">
                    </div>
                  </div>
                </details>
              </div>
            </div>

            <!-- Direct Message (DM) Delivery Automation Section -->
            <div style="padding: 12px 14px; background: var(--canvas-night-soft); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-top: 6px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <label style="font-size: 13px; font-weight: 500; color: #FBBF24; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="checkbox" id="send-dm-${pId}" ${sendDm ? 'checked' : ''} style="accent-color: #F59E0B; cursor: pointer;">
                  <i data-lucide="mail" style="width: 14px; height: 14px; color: #FBBF24;"></i> Kirim DM Otomatis (Private Reply)
                </label>
                <span style="font-size: 11px; color: var(--ink-mute);">Instagram Private DM</span>
              </div>

              <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 10px;">
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 11px; color: var(--primary); margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                    <i data-lucide="layout" style="width: 12px; height: 12px;"></i> Tipe Format DM
                  </label>
                  <select id="dm-format-${pId}" class="form-input" style="height: 38px; font-size: 12px;">
                    <option value="card" ${dmFormat === 'card' ? 'selected' : ''}>💻 Universal Link Card (Preview + 100% Clickable Desktop & HP)</option>
                    <option value="button" ${dmFormat === 'button' ? 'selected' : ''}>📱 Tombol Button Template (Khusus Aplikasi HP)</option>
                  </select>
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 11px; color: var(--ink-mute); margin-bottom: 4px; display: block;">Teks Pesan DM</label>
                  <input type="text" id="dm-message-${pId}" class="form-input" value="${dmMessage}" placeholder="Halo kak! Ini link aksesnya ya...">
                </div>
                <div class="form-group" style="margin-bottom: 0;">
                  <label style="font-size: 11px; color: var(--ink-mute); margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                    <i data-lucide="mouse-pointer-click" style="width: 12px; height: 12px;"></i> Label Tombol (Mode Button)
                  </label>
                  <input type="text" id="btn-text-${pId}" class="form-input" value="${buttonText}" placeholder="contoh: Ini link aksesnya">
                </div>
              </div>
            </div>

            <!-- Card Bottom Bar (Saved vs Unsaved) -->
            ${bottomBarHtml}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = filterBarHtml + cardsHtml;

  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger); padding: 20px;">Gagal memuat aturan post: ' + err.message + '</div>';
  } finally {
    refreshIcons();
  }
}

// Filter post cards by saved/unsaved state
function filterPostCards(type) {
  const cards = document.querySelectorAll('.post-card-item');
  document.querySelectorAll('.filter-btn-post').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-filter-${type}`);
  if (activeBtn) activeBtn.classList.add('active');

  cards.forEach(card => {
    const isSaved = card.getAttribute('data-saved') === 'true';
    if (type === 'all') {
      card.style.display = 'grid';
    } else if (type === 'saved') {
      card.style.display = isSaved ? 'grid' : 'none';
    } else if (type === 'unsaved') {
      card.style.display = !isSaved ? 'grid' : 'none';
    }
  });
}

// Delete / Reset Single Post Rule
async function deletePostRule(postId) {
  if (!confirm('Apakah kamu yakin ingin mereset dan menghapus pengaturan kustom untuk postingan ini?')) return;
  try {
    const res = await fetch('/api/post-rules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: postId })
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast('Pengaturan postingan berhasil direset ke default!', 'success');
      await loadPostRulesView();
    } else {
      showToast('Gagal mereset: ' + (data.error || 'Terjadi kesalahan'), 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan jaringan.', 'error');
  }
}

// Preview uncropped OG card helper
function testOgCardPreview(postId) {
  const ctaLink = document.getElementById(`cta-link-${postId}`)?.value.trim();
  if (!ctaLink) {
    showToast('Masukkan URL tujuan terlebih dahulu!', 'error');
    return;
  }
  const previewUrl = `/l?u=${encodeURIComponent(ctaLink)}`;
  window.open(previewUrl, '_blank');
}

// Save Single Post Rule
async function savePostRule(postId) {
  const btn = document.getElementById(`btn-save-${postId}`);
  const ctaLink = document.getElementById(`cta-link-${postId}`)?.value.trim() || '';
  const customReply = document.getElementById(`custom-reply-${postId}`)?.value.trim() || '';
  const sendDm = document.getElementById(`send-dm-${postId}`)?.checked || false;
  const dmMessage = document.getElementById(`dm-message-${postId}`)?.value.trim() || '';
  const buttonText = document.getElementById(`btn-text-${postId}`)?.value.trim() || 'Ini link aksesnya';
  const dmFormat = document.getElementById(`dm-format-${postId}`)?.value || 'card';
  const useSmartLink = document.getElementById(`smart-link-${postId}`) ? document.getElementById(`smart-link-${postId}`).checked : true;
  const requireFollow = document.getElementById(`require-follow-${postId}`) ? document.getElementById(`require-follow-${postId}`).checked : false;
  const followPrompt = document.getElementById(`follow-prompt-${postId}`)?.value.trim() || '';
  const notFollowingMsg = document.getElementById(`not-following-msg-${postId}`)?.value.trim() || '';
  const requestBtnText = document.getElementById(`req-btn-${postId}`)?.value.trim() || 'Send me the link';
  const followBtnText = document.getElementById(`fol-btn-${postId}`)?.value.trim() || 'Following';
  const introDmMessage = document.getElementById(`intro-dm-${postId}`)?.value.trim() || '';

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width: 14px; height: 14px;"></i> Menyimpan...';
    refreshIcons();
  }

  try {
    const res = await fetch('/api/post-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: postId,
        cta_link: ctaLink,
        custom_reply: customReply,
        send_dm: sendDm,
        dm_message: dmMessage,
        button_text: buttonText,
        dm_format: dmFormat,
        use_smart_link: useSmartLink,
        require_follow: requireFollow,
        follow_prompt: followPrompt,
        not_following_msg: notFollowingMsg,
        request_btn_text: requestBtnText,
        follow_btn_text: followBtnText,
        intro_dm_message: introDmMessage
      })
    });

    const data = await res.json();
    if (data.status === 'success') {
      showToast('Pengaturan postingan berhasil disimpan ke Supabase!', 'success');
      await loadPostRulesView();
    } else {
      showToast('Gagal menyimpan: ' + (data.error || 'Terjadi kesalahan'), 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan jaringan.', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i data-lucide="save" style="width: 14px; height: 14px;"></i> Simpan Pengaturan Post Ini';
      refreshIcons();
    }
  }
}

// Load Auto-Reply Rules (Keyword List)
async function loadRulesData() {
  const container = document.getElementById('rules-container');
  if (!container) return;

  try {
    const res = await fetch('/api/rules');
    const rules = await res.json();

    container.innerHTML = Object.entries(rules).map(([keyword, reply]) => `
      <div style="padding: 12px 14px; background: var(--canvas-night-soft); border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span class="pill-badge pill-purple">${keyword}</span>
            <span style="font-size: 11px; color: var(--ink-mute-2);">Trigger Match</span>
          </div>
          <p style="font-size: 13px; color: var(--on-dark); line-height: 1.5;">${reply}</p>
        </div>
        <button class="btn-secondary" onclick="deleteRule('${keyword}')" style="color: var(--danger); padding: 6px 10px; border-color: rgba(239, 68, 68, 0.3); display: inline-flex; align-items: center;">
          <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
        </button>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger);">Gagal memuat aturan.</div>';
  } finally {
    refreshIcons();
  }
}

// Reset Rules to General Defaults
async function resetGeneralRules() {
  if (!confirm("Apakah Anda yakin ingin mereset aturan di Supabase ke Aturan General Universal?")) return;
  try {
    const res = await fetch('/api/reset-rules', { method: 'POST' });
    const data = await res.json();
    if (data.status === 'success') {
      showToast("Aturan di Supabase berhasil direset ke Aturan General Universal!", "success");
      loadRulesData();
    }
  } catch (err) {
    showToast("Gagal mereset aturan.", "error");
  }
}

// Add Keyword Rule
async function addRule() {
  const keyword = document.getElementById('new-keyword').value.trim();
  const reply = document.getElementById('new-reply').value.trim();

  if (!keyword || !reply) {
    showToast('Harap isi kata kunci dan template balasan.', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, reply })
    });

    const data = await res.json();
    if (data.status === 'success') {
      showToast(`Aturan untuk kata "${keyword}" berhasil disimpan ke Supabase!`, 'success');
      document.getElementById('new-keyword').value = '';
      document.getElementById('new-reply').value = '';
      loadRulesData();
    }
  } catch (err) {
    showToast('Gagal menambahkan aturan.', 'error');
  }
}

// Delete Keyword Rule
async function deleteRule(keyword) {
  if (!confirm(`Hapus aturan untuk kata kunci "${keyword}"?`)) return;

  try {
    const res = await fetch('/api/rules', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword })
    });

    const data = await res.json();
    if (data.status === 'success') {
      showToast(`Aturan "${keyword}" berhasil dihapus.`, 'success');
      loadRulesData();
    }
  } catch (err) {
    showToast('Gagal menghapus aturan.', 'error');
  }
}

// Test AI Reply
async function testAIReply() {
  const input = document.getElementById('ai-test-input');
  const output = document.getElementById('ai-test-output');
  if (!input || !output) return;

  const commentText = input.value.trim();
  if (!commentText) {
    showToast('Ketik contoh pertanyaan terlebih dahulu.', 'warning');
    return;
  }

  output.style.display = 'block';
  output.innerHTML = '<div style="display: flex; align-items: center; gap: 8px;"><i data-lucide="loader-2" class="lucide-spin" style="width: 14px; height: 14px;"></i> Gemini 3.6 Flash sedang berpikir...</div>';
  refreshIcons();

  try {
    const res = await fetch('/api/ai-reply-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment: commentText, username: 'calon_pembeli' })
    });

    const data = await res.json();
    if (data.status === 'success') {
      output.innerHTML = `
        <div style="font-size: 11px; color: #FBBF24; font-weight: 600; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
          <i data-lucide="sparkles" style="width: 14px; height: 14px;"></i> RESPONS GEMINI AI:
        </div>
        <div style="color: var(--on-dark-bright);">${data.ai_reply}</div>
      `;
    } else {
      output.innerHTML = `<span style="color: var(--danger);">${data.ai_reply}</span>`;
    }
  } catch (err) {
    output.innerHTML = '<span style="color: var(--danger);">Gagal menghubungi endpoint AI.</span>';
  } finally {
    refreshIcons();
  }
}

// Publish Post
async function publishPost() {
  const imageInput = document.getElementById('publish-image-input').value.trim();
  const caption = document.getElementById('publish-caption-input').value.trim();
  const btn = document.getElementById('btn-publish');

  if (!imageInput) {
    showToast('Harap masukkan URL gambar atau path file lokal.', 'warning');
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width: 14px; height: 14px;"></i> Sedang Memproses & Mengunggah...';
  refreshIcons();

  try {
    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_input: imageInput, caption: caption })
    });

    const data = await res.json();

    if (data.id) {
      showToast(`Sukses publish ke Instagram! Media ID: ${data.id}`, 'success');
      document.getElementById('publish-image-input').value = '';
      document.getElementById('publish-caption-input').value = '';
      loadDashboardData();
    } else {
      showToast(`Gagal: ${JSON.stringify(data.error || data)}`, 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan saat mempublish.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="send" style="width: 14px; height: 14px;"></i> Publish ke Feed Instagram Sekarang';
    refreshIcons();
  }
}

// Run Auto-Reply Scan Across All Posts
async function runAutoReplyScan() {
  const btn = document.getElementById('btn-scan');
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width: 14px; height: 14px;"></i> Memindai...';
  refreshIcons();

  try {
    const res = await fetch('/api/auto-reply-scan', { method: 'POST' });
    const data = await res.json();

    if (data.status === 'success') {
      const msg = `Scan Selesai! ${data.total_scanned_posts} postingan dipindai, ${data.total_new_replies} balasan terkirim.`;
      showToast(msg, 'success');
      loadInboxComments();
    } else {
      showToast('Gagal memindai komentar.', 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan saat scan.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i data-lucide="scan-line" style="width: 14px; height: 14px;"></i> Scan Comments';
    refreshIcons();
  }
}

// Load Inbox Comments
async function loadInboxComments() {
  const container = document.getElementById('inbox-comments-container');
  if (!container) return;

  container.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px;">Memuat komentar terbaru...</div>';

  try {
    const res = await fetch('/api/inbox-comments');
    const data = await res.json();

    if (data.data && data.data.length > 0) {
      container.innerHTML = data.data.map(comment => `
        <div style="padding: 14px 16px; background: var(--canvas-night-soft); border: 1px solid var(--border-color); border-radius: var(--radius-sm);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-weight: 600; color: var(--primary); font-size: 13px;">@${comment.username || 'user'}</span>
              <span style="font-size: 11px; color: var(--ink-mute-2); font-family: var(--font-mono);">${new Date(comment.timestamp).toLocaleString('id-ID')}</span>
            </div>
            <span class="pill-badge ${comment.is_replied ? 'pill-green' : 'pill-purple'}" style="display: inline-flex; align-items: center; gap: 4px;">
              ${comment.is_replied 
                ? '<i data-lucide="check-circle-2" style="width: 13px; height: 13px;"></i> Sudah Dibalas' 
                : '<i data-lucide="clock" style="width: 13px; height: 13px;"></i> Belum Dibalas'}
            </span>
          </div>

          <p style="font-size: 13px; color: var(--on-dark); margin-bottom: 12px; line-height: 1.5;">${comment.text}</p>

          <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 10px;">
            <a href="${comment.post_permalink || '#'}" target="_blank" style="font-size: 12px; color: var(--ink-mute); text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
              Buka Postingan Terkait <i data-lucide="external-link" style="width: 13px; height: 13px;"></i>
            </a>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px;">Belum ada komentar masuk.</div>';
    }
  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger); font-size: 13px;">Gagal memuat inbox komentar.</div>';
  } finally {
    refreshIcons();
  }
}

// Live Preview Setup
function setupLivePreview() {
  const imgInput = document.getElementById('publish-image-input');
  const capInput = document.getElementById('publish-caption-input');
  const imgBox = document.getElementById('preview-image-box');
  const capBox = document.getElementById('preview-caption-box');

  if (imgInput && imgBox) {
    imgInput.addEventListener('input', (e) => {
      const val = e.target.value.trim();
      if (val.startsWith('http://') || val.startsWith('https://')) {
        imgBox.innerHTML = `<img src="${val}" style="width: 100%; height: 100%; object-fit: cover;">`;
      } else if (val) {
        imgBox.innerHTML = `<div style="text-align: center; padding: 20px;"><i data-lucide="file-image" style="width: 32px; height: 32px; color: var(--primary);"></i><div style="font-size: 11px; margin-top: 6px; color: var(--ink-mute);">File Lokal: ${val.split('\\').pop()}</div></div>`;
        refreshIcons();
      } else {
        imgBox.innerHTML = '<i data-lucide="image" style="width: 32px; height: 32px; color: var(--ink-mute-2);"></i>';
        refreshIcons();
      }
    });
  }

  if (capInput && capBox) {
    capInput.addEventListener('input', (e) => {
      capBox.innerText = e.target.value || 'Preview caption akan tampil di sini...';
    });
  }
}

// Connect Account Modal Functions
function showConnectModal() {
  document.getElementById('connect-modal')?.classList.add('active');
  refreshIcons();
}

function closeConnectModal() {
  document.getElementById('connect-modal')?.classList.remove('active');
}

async function submitConnectAccount() {
  const inputId = document.getElementById('modal-account-id')?.value.trim();
  if (!inputId) {
    showToast('Harap masukkan ID Akun Instagram.', 'warning');
    return;
  }
  closeConnectModal();
  await switchInstagramAccount(inputId, 'akun_baru');
}

function promptAddGmail() {
  const email = prompt('Masukkan alamat email Gmail workspace baru:');
  if (email && email.includes('@')) {
    switchUserAccount(email.trim());
  }
}

function focusSearch() {
  showToast('Fitur pencarian global aktif. Ketik menu yang ingin dicari.', 'info');
}

// Toast Notifications
function showToast(message, type = 'info') {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 10px 18px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 500;
      color: #fff;
      z-index: 9999;
      box-shadow: 0 10px 30px rgba(0,0,0,0.6);
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    document.body.appendChild(toast);
  }

  if (type === 'success') {
    toast.style.background = 'var(--canvas-night-soft)';
    toast.style.border = '1px solid var(--primary)';
    toast.innerHTML = `<i data-lucide="check-circle" style="width: 15px; height: 15px; color: var(--primary);"></i> <span style="color: var(--on-dark-bright);">${message}</span>`;
  } else if (type === 'error') {
    toast.style.background = 'var(--canvas-night-soft)';
    toast.style.border = '1px solid var(--danger)';
    toast.innerHTML = `<i data-lucide="alert-triangle" style="width: 15px; height: 15px; color: var(--danger);"></i> <span style="color: var(--on-dark-bright);">${message}</span>`;
  } else if (type === 'warning') {
    toast.style.background = 'var(--canvas-night-soft)';
    toast.style.border = '1px solid var(--accent-amber)';
    toast.innerHTML = `<i data-lucide="alert-circle" style="width: 15px; height: 15px; color: var(--accent-amber);"></i> <span style="color: var(--on-dark-bright);">${message}</span>`;
  } else {
    toast.style.background = 'var(--canvas-night-soft)';
    toast.style.border = '1px solid var(--border-color)';
    toast.innerHTML = `<i data-lucide="info" style="width: 15px; height: 15px; color: var(--accent-blue);"></i> <span style="color: var(--on-dark-bright);">${message}</span>`;
  }

  refreshIcons();

  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
  }, 3500);
}

// ==========================================
// NEW MODULE 1: INSIGHTS & ANALYTICS
// ==========================================
async function loadInsightsData() {
  const reachEl = document.getElementById('insight-reach');
  const impEl = document.getElementById('insight-impressions');
  const viewsEl = document.getElementById('insight-views');
  const engEl = document.getElementById('insight-engagement');
  const container = document.getElementById('insights-top-posts-container');

  if (!container) return;
  container.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px;">Memuat data analitik postingan...</div>';

  try {
    const res = await fetch('/api/insights');
    const data = await res.json();

    if (reachEl) reachEl.innerText = Number(data.reach || 0).toLocaleString();
    if (impEl) impEl.innerText = Number(data.impressions || 0).toLocaleString();
    if (viewsEl) viewsEl.innerText = Number(data.profile_views || 0).toLocaleString();
    if (engEl) engEl.innerText = (data.total_likes + data.total_comments).toLocaleString();

    if (data.top_posts && data.top_posts.length > 0) {
      container.innerHTML = data.top_posts.map((post, idx) => `
        <div style="padding: 12px 16px; background: var(--canvas-night-soft); border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
            <div style="width: 26px; height: 26px; border-radius: var(--radius-full); background: var(--card-surface); color: var(--primary); font-weight: 700; font-size: 12px; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-color);">
              #${idx + 1}
            </div>
            <div style="flex: 1;">
              <div style="font-size: 13px; font-weight: 500; color: var(--on-dark); display: -webkit-box; -webkit-line-clamp: 1; line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">
                ${post.caption || 'Postingan Tanpa Caption'}
              </div>
              <div style="font-size: 11px; color: var(--ink-mute); margin-top: 2px;">Post ID: ${post.id}</div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 16px;">
            <span style="font-size: 12px; color: var(--accent-amber); display: inline-flex; align-items: center; gap: 4px;">
              <i data-lucide="heart" style="width: 13px; height: 13px;"></i> ${post.like_count || 0}
            </span>
            <span style="font-size: 12px; color: var(--primary); display: inline-flex; align-items: center; gap: 4px;">
              <i data-lucide="message-square" style="width: 13px; height: 13px;"></i> ${post.comments_count || 0}
            </span>
            <a href="${post.permalink || '#'}" target="_blank" class="btn-secondary" style="padding: 4px 8px; font-size: 11px;">
              Buka <i data-lucide="external-link" style="width: 12px; height: 12px;"></i>
            </a>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px;">Belum ada postingan untuk dianalisis.</div>';
    }
  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger); font-size: 13px;">Gagal memuat analitik.</div>';
  } finally {
    refreshIcons();
  }
}

// ==========================================
// NEW MODULE 2: COMPETITOR SPY & HASHTAG SCRAPER
// ==========================================
window.rawScraperPosts = [];
window.currentCompetitorUsername = null;
window.currentScraperHashtag = null;

function applyScraperSortFilter() {
  const container = document.getElementById('scraper-results-container');
  if (!container || !window.rawScraperPosts) return;

  const filterType = document.getElementById('scraper-filter-type')?.value || 'ALL';
  const sortBy = document.getElementById('scraper-sort-by')?.value || 'ENGAGEMENT';

  // 1. Filter by content format
  let filtered = window.rawScraperPosts.filter(p => {
    if (filterType === 'ALL') return true;
    const type = (p.media_type || '').toUpperCase();
    if (filterType === 'VIDEO') return type === 'VIDEO' || type === 'REELS';
    if (filterType === 'CAROUSEL_ALBUM') return type === 'CAROUSEL_ALBUM' || type === 'CAROUSEL';
    if (filterType === 'IMAGE') return type === 'IMAGE' || type === 'SINGLE';
    return true;
  });

  // 2. Sort by selected metric
  filtered.sort((a, b) => {
    const likesA = Number(a.like_count || 0);
    const likesB = Number(b.like_count || 0);
    const commsA = Number(a.comments_count || 0);
    const commsB = Number(b.comments_count || 0);
    const engA = likesA + commsA * 2;
    const engB = likesB + commsB * 2;

    if (sortBy === 'LIKES') return likesB - likesA;
    if (sortBy === 'COMMENTS') return commsB - commsA;
    if (sortBy === 'NEWEST') return new Date(b.timestamp || 0) - new Date(a.timestamp || 0);
    return engB - engA; // ENGAGEMENT default
  });

  if (filtered.length === 0) {
    container.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px; grid-column: 1 / -1; text-align: center; padding: 30px;">Tidak ada postingan dengan format ini.</div>';
    return;
  }

  container.innerHTML = filtered.map(p => {
    const rawImg = p.thumbnail_url || p.media_url || '';
    const proxiedImg = rawImg ? `/api/proxy-image?url=${encodeURIComponent(rawImg)}` : '';
    const mediaType = (p.media_type || '').toUpperCase();
    const authorUsername = p.username || (p.owner && p.owner.username) || window.currentCompetitorUsername || 'instagram_creator';

    let targetLink = p.permalink || '';
    if (!targetLink || targetLink === 'https://instagram.com' || targetLink === 'https://instagram.com/') {
      if (authorUsername && authorUsername !== 'instagram_creator') {
        targetLink = `https://www.instagram.com/${authorUsername}/`;
      } else if (window.currentScraperHashtag) {
        const cleanTag = (window.currentScraperHashtag || '').replace(/#/g, '').replace(/\s+/g, '').toLowerCase();
        targetLink = `https://www.instagram.com/explore/tags/${cleanTag}/`;
      } else {
        targetLink = `https://www.instagram.com/explore/`;
      }
    }

    let badgeHtml = '';
    if (mediaType === 'VIDEO' || mediaType === 'REELS') {
      badgeHtml = `<span style="position: absolute; top: 8px; right: 8px; background: rgba(239, 68, 68, 0.9); color: #FFF; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; backdrop-filter: blur(4px); display: flex; align-items: center; gap: 4px; z-index: 2; letter-spacing: 0.3px;"><i data-lucide="video" style="width: 12px; height: 12px;"></i> REELS</span>`;
    } else if (mediaType === 'CAROUSEL_ALBUM' || mediaType === 'CAROUSEL') {
      badgeHtml = `<span style="position: absolute; top: 8px; right: 8px; background: rgba(59, 130, 246, 0.9); color: #FFF; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; backdrop-filter: blur(4px); display: flex; align-items: center; gap: 4px; z-index: 2; letter-spacing: 0.3px;"><i data-lucide="layers" style="width: 12px; height: 12px;"></i> CAROUSEL</span>`;
    } else {
      badgeHtml = `<span style="position: absolute; top: 8px; right: 8px; background: rgba(16, 185, 129, 0.9); color: #FFF; font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px; backdrop-filter: blur(4px); display: flex; align-items: center; gap: 4px; z-index: 2; letter-spacing: 0.3px;"><i data-lucide="image" style="width: 12px; height: 12px;"></i> SINGLE POST</span>`;
    }

    const likes = Number(p.like_count || 0);
    const comments = Number(p.comments_count || 0);
    const engagementScore = likes + comments;

    return `
    <div class="supa-card" style="padding: 16px; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
      <div>
        <!-- AUTHOR HEADER -->
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle);">
          <a href="https://www.instagram.com/${authorUsername}/" target="_blank" style="display: flex; align-items: center; gap: 8px; text-decoration: none; overflow: hidden;">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, #10B981, #3B82F6); display: flex; align-items: center; justify-content: center; color: #FFF; font-weight: 700; font-size: 11px; flex-shrink: 0;">
              ${authorUsername[0].toUpperCase()}
            </div>
            <span style="font-size: 12px; font-weight: 600; color: var(--on-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
              @${authorUsername}
            </span>
          </a>
          <span style="font-size: 10px; color: var(--ink-mute-2);">
            ${p.timestamp ? new Date(p.timestamp).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
          </span>
        </div>

        <div style="width: 100%; height: 170px; border-radius: var(--radius-sm); margin-bottom: 10px; overflow: hidden; background: var(--bg-tertiary); position: relative; border: 1px solid var(--border-color);">
          ${badgeHtml}
          ${rawImg ? `
            <img src="${rawImg}" 
                 referrerpolicy="no-referrer" 
                 loading="lazy" 
                 onerror="if(!this.dataset.proxied){this.dataset.proxied='true'; this.src='${proxiedImg}';}else{this.style.display='none'; this.nextElementSibling.style.display='flex';}" 
                 style="width: 100%; height: 100%; object-fit: cover;">
            <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1)); flex-direction: column; gap: 6px;">
              <i data-lucide="instagram" style="width: 24px; height: 24px; color: var(--primary);"></i>
              <span style="font-size: 10px; color: var(--ink-mute);">Post Instagram</span>
            </div>
          ` : `
            <div style="display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.1)); flex-direction: column; gap: 6px;">
              <i data-lucide="instagram" style="width: 24px; height: 24px; color: var(--primary);"></i>
              <span style="font-size: 10px; color: var(--ink-mute);">Post Instagram</span>
            </div>
          `}
        </div>
        <div style="font-size: 12px; color: var(--on-dark); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 3; line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 12px;">
          ${p.caption || 'Tanpa Caption'}
        </div>
      </div>

      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border-subtle); margin-bottom: 8px;">
          <div style="display: flex; gap: 10px; font-size: 11px; color: var(--ink-mute); font-weight: 600;">
            <span title="Total Likes">❤️ ${likes.toLocaleString()}</span>
            <span title="Total Komentar">💬 ${comments.toLocaleString()}</span>
          </div>
          <span style="font-size: 10px; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3); padding: 2px 6px; border-radius: 4px; color: var(--primary); font-weight: 600;" title="Total Interaksi">
            🔥 ${engagementScore.toLocaleString()}
          </span>
        </div>

        <div style="display: flex; align-items: center; justify-content: flex-end;">
          <a href="${targetLink}" target="_blank" style="font-size: 11px; color: var(--primary); text-decoration: none; font-weight: 600; display: inline-flex; align-items: center; gap: 3px;">
            Buka di Instagram ↗
          </a>
        </div>
      </div>
    </div>
    `;
  }).join('');

  refreshIcons();
}

async function searchHashtag() {
  const input = document.getElementById('scraper-hashtag-input');
  const container = document.getElementById('scraper-results-container');
  const title = document.getElementById('scraper-results-title');

  if (!input || !container) return;
  const q = input.value.trim().replace('#', '');
  if (!q) {
    showToast('Ketik kata kunci hashtag terlebih dahulu.', 'warning');
    return;
  }

  window.currentScraperHashtag = q;
  window.currentCompetitorUsername = null;

  container.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px; grid-column: 1 / -1;">Me-scrape postingan viral hashtag #' + q + '...</div>';

  try {
    const res = await fetch(`/api/scraper/hashtag?q=${encodeURIComponent(q)}`);
    const data = await res.json();

    if (title) title.innerText = `Hasil Scraping Hashtag #${data.hashtag}`;

    if (data.data && data.data.length > 0) {
      window.rawScraperPosts = data.data;
      applyScraperSortFilter();
      if (data.is_sandbox && data.notice) {
        showToast('⚠️ Meta Token Expired. Menampilkan data riset simulasi dinamis.', 'warning');
      }
    } else {
      window.rawScraperPosts = [];
      container.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px; grid-column: 1 / -1;">Tidak ada postingan ditemukan untuk hashtag ini.</div>';
    }
  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger); font-size: 13px; grid-column: 1 / -1;">Gagal melakukan scraping hashtag.</div>';
  } finally {
    refreshIcons();
  }
}

async function spyCompetitor() {
  const input = document.getElementById('scraper-competitor-input');
  const container = document.getElementById('scraper-results-container');
  const title = document.getElementById('scraper-results-title');

  if (!input || !container) return;
  const username = input.value.trim().replace('@', '');
  if (!username) {
    showToast('Ketik username kompetitor terlebih dahulu.', 'warning');
    return;
  }

  window.currentCompetitorUsername = username;
  window.currentScraperHashtag = null;

  container.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px; grid-column: 1 / -1;">Mengintip data akun @' + username + '...</div>';

  try {
    const res = await fetch(`/api/scraper/competitor?username=${encodeURIComponent(username)}`);
    const data = await res.json();

    if (title) title.innerText = `Hasil Riset Kompetitor @${data.username} (${Number(data.followers_count || 0).toLocaleString()} Followers)`;

    if (data.posts && data.posts.length > 0) {
      window.rawScraperPosts = data.posts;
      applyScraperSortFilter();
    } else {
      window.rawScraperPosts = [];
      container.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px; grid-column: 1 / -1;">Tidak ada postingan ditemukan untuk akun ini.</div>';
    }
  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger); font-size: 13px; grid-column: 1 / -1;">Gagal mengintip data kompetitor.</div>';
  } finally {
    refreshIcons();
  }
}

// ==========================================
// NEW MODULE 3: STORY MENTIONS AUTO-DM
// ==========================================
async function loadStoryRules() {
  try {
    const res = await fetch('/api/story-rules');
    const rule = await res.json();

    const activeCheck = document.getElementById('story-rule-active');
    const msgInput = document.getElementById('story-rule-message');
    const voucherInput = document.getElementById('story-rule-voucher');
    const linkInput = document.getElementById('story-rule-link');

    if (activeCheck) activeCheck.checked = rule.is_active !== false;
    if (msgInput) msgInput.value = rule.dm_message || '';
    if (voucherInput) voucherInput.value = rule.voucher_code || '';
    if (linkInput) linkInput.value = rule.cta_link || '';
  } catch (err) {
    console.error('Error loading story rules:', err);
  }
}

async function saveStoryRules() {
  const activeCheck = document.getElementById('story-rule-active')?.checked || false;
  const msgInput = document.getElementById('story-rule-message')?.value.trim() || '';
  const voucherInput = document.getElementById('story-rule-voucher')?.value.trim() || '';
  const linkInput = document.getElementById('story-rule-link')?.value.trim() || '';

  if (!msgInput) {
    showToast('Harap isi pesan DM terima kasih.', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/story-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        is_active: activeCheck,
        dm_message: msgInput,
        voucher_code: voucherInput,
        cta_link: linkInput
      })
    });

    const data = await res.json();
    if (data.status === 'success') {
      showToast('Pengaturan Story Mention Auto-DM berhasil disimpan!', 'success');
    }
  } catch (err) {
    showToast('Gagal menyimpan aturan Story Mention.', 'error');
  }
}

// ==========================================
// NEW MODULE 4: BULK CONTENT SCHEDULER & REELS
// ==========================================
async function loadScheduledPosts() {
  const container = document.getElementById('sched-queue-container');
  const countBadge = document.getElementById('sched-queue-count');

  if (!container) return;

  try {
    const res = await fetch('/api/scheduled-posts');
    const data = await res.json();
    const posts = data.data || [];

    if (countBadge) countBadge.innerText = `${posts.length} Terjadwal`;

    if (posts.length > 0) {
      container.innerHTML = posts.map(p => `
        <div style="padding: 12px 14px; background: var(--canvas-night-soft); border: 1px solid var(--border-color); border-radius: var(--radius-sm); display: flex; align-items: center; justify-content: space-between; gap: 12px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
              <span class="pill-badge pill-blue">${p.media_type || 'IMAGE'}</span>
              <span style="font-size: 11px; color: var(--accent-amber); font-weight: 600;">📅 ${p.scheduled_at}</span>
            </div>
            <p style="font-size: 13px; color: var(--on-dark); display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 2px;">
              ${p.caption || 'Tanpa Caption'}
            </p>
            <div style="font-size: 11px; color: var(--ink-mute); word-break: break-all;">URL: ${p.image_url}</div>
          </div>
          <button class="btn-secondary" onclick="cancelScheduledPost('${p.id}')" style="color: var(--danger); padding: 6px 10px;">
            <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px;">Belum ada postingan yang dijadwalkan dalam antrean.</div>';
    }
  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger); font-size: 13px;">Gagal memuat antrean jadwal.</div>';
  } finally {
    refreshIcons();
  }
}

async function submitSchedulePost() {
  const mediaType = document.getElementById('sched-media-type')?.value || 'IMAGE';
  const imageUrl = document.getElementById('sched-image-url')?.value.trim() || '';
  const caption = document.getElementById('sched-caption')?.value.trim() || '';
  const schedTime = document.getElementById('sched-time')?.value || '';

  if (!imageUrl || !schedTime) {
    showToast('Harap isi URL foto/video dan waktu tayang postingan.', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/scheduled-posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        media_type: mediaType,
        image_url: imageUrl,
        caption: caption,
        scheduled_at: schedTime
      })
    });

    const data = await res.json();
    if (data.status === 'success') {
      showToast('Postingan berhasil ditambahkan ke antrean jadwal!', 'success');
      document.getElementById('sched-image-url').value = '';
      document.getElementById('sched-caption').value = '';
      document.getElementById('sched-time').value = '';
      loadScheduledPosts();
    }
  } catch (err) {
    showToast('Gagal menjadwalkan postingan.', 'error');
  }
}

async function cancelScheduledPost(postId) {
  if (!confirm('Hapus postingan dari antrean jadwal?')) return;

  try {
    const res = await fetch('/api/scheduled-posts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: postId })
    });

    const data = await res.json();
    if (data.status === 'success') {
      showToast('Postingan berhasil dihapus dari antrean.', 'success');
      loadScheduledPosts();
    }
  } catch (err) {
    showToast('Gagal menghapus postingan terjadwal.', 'error');
  }
}

// ==========================================
// AUTOMATIC SCANNER (Dashboard Active Watcher)
// ==========================================
let autoScanInterval = null;
function startAutoScanner() {
  if (autoScanInterval) clearInterval(autoScanInterval);
  
  // Run gentle background scan every 25 seconds
  autoScanInterval = setInterval(async () => {
    try {
      const res = await fetch('/api/auto-reply-scan', { method: 'POST' });
      const data = await res.json();
      if (data && data.total_new_replies > 0) {
        showToast(`⚡ Bot otomatis membalas ${data.total_new_replies} komentar & mengirim ${data.total_dms_sent} DM!`, 'success');
        if (typeof loadInboxComments === 'function') loadInboxComments();
      }
    } catch (e) {
      // Silent fail in background
    }
  }, 25000);
}

// Start auto scanner on dashboard boot
if (typeof window !== 'undefined') {
  setTimeout(startAutoScanner, 5000);
}
