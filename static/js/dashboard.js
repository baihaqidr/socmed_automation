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
  if (tabId === 'publish') {
    switchStudioSubTab('publisher');
  }
  if (tabId === 'storyrules') {
    switchTab('publish');
    switchStudioSubTab('storyrules');
    return;
  }
  if (tabId === 'scheduler') {
    switchTab('publish');
    switchStudioSubTab('scheduler');
    return;
  }

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
  setupDropzoneEvents();

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
      const cleanUser = String(activeAcc.username || '').replace(/^@+/, '').trim();
      currentActiveUsername = cleanUser;

      // Update UI Header & Targets
      const headerIg = document.getElementById('header-ig-username');
      const statUser = document.getElementById('stat-username');
      const currentAccLabel = document.getElementById('current-account-label');
      const publishTarget = document.getElementById('publish-account-target');
      const previewUsername = document.getElementById('preview-account-username');
      const previewCaptionUsername = document.getElementById('preview-caption-username');
      const previewReelsUsername = document.getElementById('preview-reels-username');
      const previewStoryUsername = document.getElementById('preview-story-username');
      const settingsAccId = document.getElementById('settings-account-id');

      if (headerIg) headerIg.innerText = cleanUser;
      if (statUser) statUser.innerText = `@${cleanUser}`;
      if (currentAccLabel) currentAccLabel.innerText = `@${cleanUser}`;
      if (publishTarget) publishTarget.innerText = `@${cleanUser}`;
      if (previewUsername) previewUsername.innerText = cleanUser;
      if (previewCaptionUsername) previewCaptionUsername.innerText = cleanUser;
      if (previewReelsUsername) previewReelsUsername.innerText = cleanUser;
      if (previewStoryUsername) previewStoryUsername.innerText = cleanUser;
      if (settingsAccId) settingsAccId.innerText = activeAcc.id;

      const listContainer = document.getElementById('ig-accounts-list');
      if (listContainer) {
        listContainer.innerHTML = data.accounts.map(acc => {
          const u = String(acc.username || '').replace(/^@+/, '').trim();
          return `
          <button class="dropdown-item ${acc.is_active ? 'active' : ''}" onclick="switchInstagramAccount('${acc.id}', '${u}')">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="at-sign" style="width: 14px; height: 14px; color: ${acc.is_active ? 'var(--primary)' : 'var(--ink-mute)'};"></i>
              <div style="display: flex; flex-direction: column;">
                <span style="font-weight: 600; font-size: 13px;">${u}</span>
                <span style="font-size: 11px; color: var(--ink-mute);">${acc.name} (${acc.media_count} Posts)</span>
              </div>
            </div>
            ${acc.is_active ? '<i data-lucide="check" style="width: 14px; height: 14px; color: var(--primary);"></i>' : ''}
          </button>
        `}).join('');
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
      window.latestFetchedPosts = data.data;
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
          <span class="pill-badge pill-green" style="font-size: 11px; padding: 3px 10px; display: inline-flex; align-items: center; gap: 5px; background: var(--primary-glow); color: var(--primary); border: 1px solid var(--primary);">
            <i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> ${savedCount} Postingan Aktif
          </span>
          <span class="pill-badge" style="font-size: 11px; padding: 3px 10px; display: inline-flex; align-items: center; gap: 5px; color: var(--ink-mute); border: 1px solid var(--border-subtle); background: var(--canvas-night);">
            <i data-lucide="circle-dashed" style="width: 12px; height: 12px;"></i> ${unsavedCount} Belum Diatur
          </span>
        </div>
        <div style="display: flex; gap: 6px;">
          <button type="button" class="btn-ghost filter-btn-post active" id="btn-filter-all" onclick="filterPostCards('all')" style="font-size: 11px; padding: 4px 10px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: var(--on-dark);">Semua (${posts.length})</button>
          <button type="button" class="btn-ghost filter-btn-post" id="btn-filter-saved" onclick="filterPostCards('saved')" style="font-size: 11px; padding: 4px 10px; border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--primary);">🔵 Hanya Aktif (${savedCount})</button>
          <button type="button" class="btn-ghost filter-btn-post" id="btn-filter-unsaved" onclick="filterPostCards('unsaved')" style="font-size: 11px; padding: 4px 10px; border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); color: var(--ink-mute);">⚪ Belum Diatur (${unsavedCount})</button>
        </div>
      </div>
    `;

    window._POSTS_CACHE_DATA = posts;
    window._RULES_CACHE_DATA = rulesData;

    const cardsHtml = posts.map(post => {
      const pId = String(post.id);
      const rule = rulesData[pId] || {};
      const ctaLink = rule.cta_link || '';
      const customReply = rule.custom_reply || '';
      const sendDm = rule.send_dm !== false;
      const buttonText = rule.button_text || 'Buka Link Akses';
      const triggerType = rule.trigger_type || 'any_word';
      const triggerKeywords = rule.trigger_keywords || '';
      const replyMode = rule.reply_mode || 'custom';
      const captionText = post.caption || 'Tanpa Caption';
      const thumbUrl = post.thumbnail_url || post.media_url || '/templates/image.png';

      const isSaved = Boolean(rule && (rule.cta_link || rule.send_dm || rule.custom_reply || rule.trigger_keywords));

      const cardBorder = isSaved
        ? 'border: 1.5px solid rgba(75, 147, 255, 0.45); border-left: 5px solid var(--primary); background: var(--primary-glow);'
        : 'border: 1px solid var(--border-color); border-left: 4px solid var(--border-subtle);';

      const statusBadge = isSaved
        ? `<span class="pill-badge pill-green" style="font-size: 11px; font-weight: 700; padding: 3px 10px; display: inline-flex; align-items: center; gap: 4px;">
             <i data-lucide="check-circle-2" style="width: 12px; height: 12px;"></i> AKTIF (Auto Flow)
           </span>`
        : `<span class="pill-badge" style="font-size: 11px; color: var(--ink-mute); background: var(--canvas-night-soft); border: 1px solid var(--border-subtle); padding: 3px 10px; display: inline-flex; align-items: center; gap: 4px;">
             <i data-lucide="circle-dashed" style="width: 12px; height: 12px;"></i> Belum Diatur
           </span>`;

      // Trigger Badge
      let triggerBadgeHtml = '';
      if (triggerType === 'specific_words' && triggerKeywords) {
        const kList = triggerKeywords.split(',').map(k => k.trim()).filter(Boolean);
        const tags = kList.slice(0, 4).map(k => `<span class="mc-tag-chip" style="font-size: 10px; padding: 1px 7px;">${k}</span>`).join(' ');
        const extra = kList.length > 4 ? `<span style="font-size: 10px; color: var(--ink-mute);">+${kList.length - 4} lainnya</span>` : '';
        triggerBadgeHtml = `
          <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            <span style="font-size: 12px; font-weight: 600; color: #60A5FA;">🔑 Kata Kunci:</span>
            ${tags} ${extra}
          </div>
        `;
      } else {
        triggerBadgeHtml = `
          <div style="font-size: 12px; color: var(--on-dark); display: flex; align-items: center; gap: 6px;">
            <span class="pill-badge pill-purple" style="font-size: 10px;">✨ Semua Komentar (Any word)</span>
          </div>
        `;
      }

      // Actions Summary
      const replySummary = (replyMode === 'none')
        ? '<span style="color: var(--ink-mute);">⚪ Balas Publik: Nonaktif</span>'
        : (replyMode === 'ai' ? '<span style="color: #FBBF24; display: inline-flex; align-items: center; gap: 4px;"><i data-lucide="sparkles" style="width: 11px; height: 11px;"></i> Gemini AI</span>' : `<span style="color: var(--on-dark);">💬 Balas: "${customReply ? (customReply.length > 35 ? customReply.slice(0, 35) + '...' : customReply) : 'Halo kak, link sudah dikirim...'}"</span>`);

      const dmSummary = sendDm
        ? `<span style="color: var(--primary); font-weight: 500;">✉️ DM: [ ${buttonText} ] ➡️ <span style="font-size: 11px; text-decoration: underline; color: var(--ink-mute);">${ctaLink ? ctaLink.replace('https://', '').slice(0, 25) : 'simplifyer.site'}</span></span>`
        : '<span style="color: var(--ink-mute);">⚪ DM: Nonaktif</span>';

      return `
        <div class="supa-card post-card-item" data-saved="${isSaved ? 'true' : 'false'}" style="display: flex; gap: 20px; align-items: stretch; margin-bottom: 16px; padding: 18px; ${cardBorder}">
          
          <!-- Left: Thumbnail & Post Meta -->
          <div style="width: 140px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: space-between;">
            <div style="width: 100%; height: 110px; border-radius: var(--radius-sm); overflow: hidden; background: #1a1a1a; position: relative;">
              <img src="${thumbUrl}" alt="Post Media" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='/templates/image.png'">
              <span class="pill-badge" style="position: absolute; bottom: 6px; right: 6px; font-size: 10px; background: rgba(0,0,0,0.75); color: #fff; padding: 2px 6px;">
                <i data-lucide="message-square" style="width: 10px; height: 10px;"></i> ${post.comments_count || 0}
              </span>
            </div>
            <a href="${post.permalink || '#'}" target="_blank" style="font-size: 11px; color: var(--ink-mute); text-decoration: none; display: inline-flex; align-items: center; gap: 4px; margin-top: 6px;">
              Buka di IG <i data-lucide="external-link" style="width: 11px; height: 11px;"></i>
            </a>
          </div>

          <!-- Center: Automation Flow Summary -->
          <div style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                ${statusBadge}
                <span style="font-size: 11px; font-family: var(--font-mono); color: var(--ink-mute-2);">ID: ${pId}</span>
              </div>
              <div style="font-size: 13px; font-weight: 500; color: var(--on-dark); line-height: 1.4; max-height: 38px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 12px;">
                ${captionText}
              </div>
            </div>

            <!-- Flow Step Badges -->
            <div style="background: var(--canvas-night-soft); border-radius: var(--radius-sm); border: 1px solid var(--border-subtle); padding: 10px 14px; display: flex; flex-direction: column; gap: 6px;">
              <div style="font-size: 11px; color: var(--ink-mute); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                ⚡ Alur Otomatisasi:
              </div>
              <div>${triggerBadgeHtml}</div>
              <div style="display: flex; align-items: center; gap: 16px; font-size: 12px; margin-top: 2px; flex-wrap: wrap;">
                <div>${replySummary}</div>
                <div>•</div>
                <div>${dmSummary}</div>
              </div>
            </div>
          </div>

          <!-- Right: Action CTA -->
          <div style="width: 190px; flex-shrink: 0; display: flex; flex-direction: column; justify-content: center; gap: 10px; border-left: 1px solid var(--border-color); padding-left: 18px;">
            <button type="button" class="btn-primary" onclick="openAutomationBuilder('${pId}')" style="width: 100%; justify-content: center; font-size: 12px; padding: 10px 12px;">
              <i data-lucide="sliders"></i> Atur Otomatisasi
            </button>
            ${isSaved ? `
              <button type="button" class="btn-ghost" onclick="deletePostRule('${pId}')" style="width: 100%; justify-content: center; color: var(--danger); font-size: 11px; border: 1px solid rgba(239, 68, 68, 0.25); padding: 5px 10px; border-radius: var(--radius-sm);">
                <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i> Hapus Aturan
              </button>
            ` : ''}
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
      card.style.display = 'flex';
    } else if (type === 'saved') {
      card.style.display = isSaved ? 'flex' : 'none';
    } else if (type === 'unsaved') {
      card.style.display = !isSaved ? 'flex' : 'none';
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
  const requestBtnText = document.getElementById(`req-btn-${postId}`)?.value.trim() || 'Kirim Linknya';
  const followBtnText = document.getElementById(`fol-btn-${postId}`)?.value.trim() || 'Sudah Follow';
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

// ============================================================================
// Unified Automation Studio Controller & Reactive Live Phone Simulator
// ============================================================================
let _MC_BUILDER_STATE = {
  postId: '',
  targetMode: 'specific', // 'specific' or 'any'
  conditionMode: 'any_word', // 'any_word' or 'specific_words'
  keywords: '',
  replyMode: 'custom', // 'custom', 'ai', 'none'
  customReply: '',
  sendDm: true,
  dmMessage: '',
  buttonText: 'Buka Link Akses',
  ctaLink: 'https://simplifyer.site/',
  requireFollow: false,
  previewTab: 'dm' // 'dm' or 'comments'
};

function openAutomationBuilder(postId) {
  const posts = window._POSTS_CACHE_DATA || [];
  const rules = window._RULES_CACHE_DATA || {};
  const isAny = (postId === 'any_post');
  
  const post = posts.find(p => String(p.id) === String(postId)) || {};
  const rule = rules[String(postId)] || (isAny ? rules['any_post'] || {} : {});

  _MC_BUILDER_STATE.postId = String(postId);
  _MC_BUILDER_STATE.targetMode = isAny ? 'any' : 'specific';
  _MC_BUILDER_STATE.conditionMode = rule.trigger_type || 'any_word';
  _MC_BUILDER_STATE.keywords = rule.trigger_keywords || '';
  _MC_BUILDER_STATE.replyMode = rule.reply_mode || (rule.custom_reply ? 'custom' : 'custom');
  _MC_BUILDER_STATE.customReply = rule.custom_reply || '';
  _MC_BUILDER_STATE.sendDm = rule.send_dm !== false;
  _MC_BUILDER_STATE.dmMessage = rule.dm_message || (
    "Halo kak! Makasih banyak ya udah mampir ke postingan kita 😊\n\n" +
    "Silakan klik tombol di bawah ini buat langsung akses info lengkapnya yaa.\n\n" +
    "Oiya kak, bantu follow akun kita juga ya biar bisa dapet lebih banyak insight & update menarik lainnya! Makasih banyak ✨"
  );
  _MC_BUILDER_STATE.buttonText = rule.button_text || 'Buka Link Akses';
  _MC_BUILDER_STATE.ctaLink = rule.cta_link || 'https://simplifyer.site/';
  _MC_BUILDER_STATE.requireFollow = rule.require_follow === true;

  // Set Post ID hidden input
  const hiddenInput = document.getElementById('mc-target-post-id');
  if (hiddenInput) hiddenInput.value = String(postId);
  
  // Title & Subtitle
  const modalTitle = document.getElementById('mc-modal-title');
  const modalSub = document.getElementById('mc-modal-subtitle');
  if (isAny) {
    if (modalTitle) modalTitle.textContent = 'Otomatisasi Universal (Semua Postingan)';
    if (modalSub) modalSub.textContent = 'Aturan ini akan membalas semua postingan yang belum diatur secara spesifik.';
    setMcTargetMode('any');
  } else {
    if (modalTitle) modalTitle.textContent = `Otomatisasi: ${post.caption ? post.caption.slice(0, 32) + '...' : 'Post ' + postId}`;
    if (modalSub) modalSub.textContent = `Instagram Post ID: ${postId}`;
    setMcTargetMode('specific');
  }

  // Thumbnail preview in Step 1
  const thumbWrap = document.getElementById('mc-target-post-thumb-wrap');
  const thumbImg = document.getElementById('mc-target-post-thumb');
  const thumbSummary = document.getElementById('mc-target-post-summary');
  const thumbSrc = post.thumbnail_url || post.media_url;
  if (!isAny && thumbSrc) {
    if (thumbWrap) thumbWrap.style.display = 'block';
    if (thumbImg) thumbImg.src = thumbSrc;
    if (thumbSummary) thumbSummary.textContent = post.caption ? post.caption.slice(0, 48) + '...' : 'Post ID: ' + postId;
  } else {
    if (thumbWrap) thumbWrap.style.display = 'none';
    if (thumbSummary) thumbSummary.textContent = isAny ? 'Berlaku di semua post & reels' : 'ID: ' + postId;
  }

  // Step 2: Trigger Condition
  setMcConditionMode(_MC_BUILDER_STATE.conditionMode);
  const kwInput = document.getElementById('mc-keywords-input');
  if (kwInput) kwInput.value = _MC_BUILDER_STATE.keywords;
  updateMcKeywordsPreview();

  // Step 3: Response Actions
  const chkPublic = document.getElementById('mc-enable-public-reply');
  if (chkPublic) chkPublic.checked = (_MC_BUILDER_STATE.replyMode !== 'none');
  toggleMcPublicReply(_MC_BUILDER_STATE.replyMode !== 'none');
  setMcReplyMode(_MC_BUILDER_STATE.replyMode);
  const txtCustom = document.getElementById('mc-custom-reply-text');
  if (txtCustom) txtCustom.value = _MC_BUILDER_STATE.customReply;

  const chkDm = document.getElementById('mc-enable-dm');
  if (chkDm) chkDm.checked = _MC_BUILDER_STATE.sendDm;
  toggleMcDm(_MC_BUILDER_STATE.sendDm);
  const txtDm = document.getElementById('mc-dm-message');
  if (txtDm) txtDm.value = _MC_BUILDER_STATE.dmMessage;
  const txtBtn = document.getElementById('mc-button-text');
  if (txtBtn) txtBtn.value = _MC_BUILDER_STATE.buttonText;
  const txtCta = document.getElementById('mc-cta-link');
  if (txtCta) txtCta.value = _MC_BUILDER_STATE.ctaLink;
  const chkFollow = document.getElementById('mc-require-follow');
  if (chkFollow) chkFollow.checked = _MC_BUILDER_STATE.requireFollow;

  // Show Modal & Refresh Phone Simulator
  const overlay = document.getElementById('mc-builder-overlay');
  if (overlay) overlay.classList.add('active');
  updateMcPhonePreview();
  refreshIcons();
}

function closeAutomationBuilder() {
  const overlay = document.getElementById('mc-builder-overlay');
  if (overlay) overlay.classList.remove('active');
}

function setMcTargetMode(mode) {
  _MC_BUILDER_STATE.targetMode = mode;
  const bSpecific = document.getElementById('mc-target-box-specific');
  const bAny = document.getElementById('mc-target-box-any');
  if (bSpecific) bSpecific.classList.toggle('active', mode === 'specific');
  if (bAny) bAny.classList.toggle('active', mode === 'any');
}

function setMcConditionMode(mode) {
  _MC_BUILDER_STATE.conditionMode = mode;
  const bAny = document.getElementById('mc-cond-box-any');
  const bSpecific = document.getElementById('mc-cond-box-specific');
  const kwWrap = document.getElementById('mc-keyword-input-wrap');
  if (bAny) bAny.classList.toggle('active', mode === 'any_word');
  if (bSpecific) bSpecific.classList.toggle('active', mode === 'specific_words');
  if (kwWrap) kwWrap.style.display = (mode === 'specific_words') ? 'block' : 'none';
  updateMcPhonePreview();
}

function updateMcKeywordsPreview() {
  const val = document.getElementById('mc-keywords-input')?.value || '';
  _MC_BUILDER_STATE.keywords = val;
  const chipsWrap = document.getElementById('mc-keywords-chips');
  if (!chipsWrap) return;
  const list = val.split(',').map(s => s.trim()).filter(Boolean);
  chipsWrap.innerHTML = list.map(s => `<span class="mc-tag-chip">🏷️ ${s}</span>`).join('');
  updateMcPhonePreview();
}

function toggleMcPublicReply(checked) {
  const details = document.getElementById('mc-public-reply-details');
  const badge = document.getElementById('mc-public-badge');
  if (details) {
    details.style.opacity = checked ? '1' : '0.35';
    details.style.pointerEvents = checked ? 'auto' : 'none';
  }
  if (badge) {
    badge.textContent = checked ? 'Aktif' : 'Nonaktif';
    badge.className = checked ? 'pill-badge pill-green' : 'pill-badge';
  }
  updateMcPhonePreview();
}

function setMcReplyMode(mode) {
  _MC_BUILDER_STATE.replyMode = mode;
  const radCustom = document.getElementById('mc-rep-mode-custom');
  const radAi = document.getElementById('mc-rep-mode-ai');
  if (radCustom) radCustom.checked = (mode === 'custom');
  if (radAi) radAi.checked = (mode === 'ai');
  const txtInput = document.getElementById('mc-custom-reply-text');
  if (txtInput) {
    txtInput.style.display = (mode === 'custom') ? 'block' : 'none';
  }
  updateMcPhonePreview();
}

function toggleMcDm(checked) {
  _MC_BUILDER_STATE.sendDm = checked;
  const details = document.getElementById('mc-dm-details');
  if (details) {
    details.style.opacity = checked ? '1' : '0.35';
    details.style.pointerEvents = checked ? 'auto' : 'none';
  }
  updateMcPhonePreview();
}

function switchPhonePreviewTab(tab) {
  _MC_BUILDER_STATE.previewTab = tab;
  const bDm = document.getElementById('phone-tab-btn-dm');
  const bComm = document.getElementById('phone-tab-btn-comments');
  if (bDm) bDm.classList.toggle('active', tab === 'dm');
  if (bComm) bComm.classList.toggle('active', tab === 'comments');
  updateMcPhonePreview();
}

function updateMcPhonePreview() {
  const container = document.getElementById('phone-preview-content');
  if (!container) return;

  const currentTab = _MC_BUILDER_STATE.previewTab || 'dm';
  const kw = _MC_BUILDER_STATE.keywords.split(',')[0]?.trim() || 'info';
  const userCommentText = (_MC_BUILDER_STATE.conditionMode === 'specific_words' && kw) ? `Mau ${kw} dong kak!` : 'Halo mau info lengkapnya dong kak!';
  
  const repMode = document.querySelector('input[name="mc-reply-mode"]:checked')?.value || 'custom';
  const customReply = document.getElementById('mc-custom-reply-text')?.value.trim();
  const botReplyText = (repMode === 'ai') 
    ? 'Halo kak @audiens! ✨ Terima kasih sudah tertarik, detail link lengkapnya sudah kami kirimkan ke DM kamu ya, silakan di-cek inbox-nya! 🙌'
    : (customReply || 'Halo kak @audiens, linknya sudah kami kirimkan via DM ya! Cek inbox yuk 🙌');
  
  const dmMsg = document.getElementById('mc-dm-message')?.value || '';
  const btnText = document.getElementById('mc-button-text')?.value.trim() || 'Buka Link Akses';
  const ctaUrl = document.getElementById('mc-cta-link')?.value.trim() || 'https://simplifyer.site/';
  const enablePublic = document.getElementById('mc-enable-public-reply')?.checked;
  const enableDm = document.getElementById('mc-enable-dm')?.checked;

  const rawUser = String(currentActiveUsername || 'produkly').replace(/^@+/, '').trim();

  if (currentTab === 'dm') {
    container.innerHTML = `
      <div class="ig-dm-container">
        <!-- Top Nav Bar -->
        <div class="ig-dm-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="cursor: pointer;">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            <div class="ig-story-ring" style="width: 32px; height: 32px; padding: 1.5px;">
              <div class="ig-story-inner" style="width: 100%; height: 100%; background: #262626; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 13px;">
                ${rawUser.charAt(0).toUpperCase()}
              </div>
            </div>
            <div style="display: flex; flex-direction: column;">
              <div style="display: flex; align-items: center; gap: 3px;">
                <span style="font-weight: 700; font-size: 12.5px; color: #fff; letter-spacing: -0.1px;">${rawUser}</span>
                <span class="ig-verified-badge">✓</span>
              </div>
              <div style="display: flex; align-items: center; gap: 4px; font-size: 10px; color: #8e8e8e;">
                <span style="width: 5px; height: 5px; border-radius: 50%; background: #10B981;"></span>
                <span>Aktif sekarang</span>
              </div>
            </div>
          </div>
          <div style="display: flex; align-items: center; gap: 14px; color: #ffffff;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="23 7 16 12 23 17 23 7"></polygon>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
            </svg>
          </div>
        </div>

        <!-- Chat Messages Scroll Area -->
        <div class="ig-dm-scrollable">
          <div class="ig-dm-date-pill">Hari ini 09:41</div>

          <!-- Private Reply Context Pill -->
          <div class="ig-dm-reply-context">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>Membalas komentar Anda di postingan</span>
          </div>

          <!-- Commenter Question Bubble (Left) -->
          <div class="ig-dm-commenter-bubble">
            ${userCommentText}
          </div>

          <!-- Automated Brand Message Card (Right) -->
          ${enableDm ? `
            <div class="ig-dm-card-bubble">
              <div class="ig-dm-card-text">
                ${dmMsg ? dmMsg.replace(/</g, '&lt;').replace(/>/g, '&gt;') : 'Halo kak! Terima kasih sudah tertarik 🙌 Detail link akses & informasinya ada di tombol bawah ini ya:'}
              </div>
              <div class="ig-dm-card-btn">
                <span>${btnText}</span>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                  <polyline points="15 3 21 3 21 9"></polyline>
                  <line x1="10" y1="14" x2="21" y2="3"></line>
                </svg>
              </div>
            </div>
            <div class="ig-dm-delivery-status">09:42 • Terkirim</div>
          ` : `
            <div style="padding: 16px; text-align: center; color: #737373; font-size: 11px; font-style: italic;">
              (Pesan DM dinonaktifkan)
            </div>
          `}
        </div>

        <!-- Chat Input Bottom Bar -->
        <div class="ig-dm-footer">
          <div style="width: 28px; height: 28px; border-radius: 50%; background: #0095F6; display: flex; align-items: center; justify-content: center; color: #fff; flex-shrink: 0;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </div>
          <div class="ig-dm-input-capsule">
            <span>Kirim pesan...</span>
            <div style="display: flex; align-items: center; gap: 8px; color: #888;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line></svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            </div>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </div>
      </div>
    `;
  } else {
    // Comments Sheet View
    const targetPost = (window._POSTS_CACHE_DATA || []).find(p => String(p.id) === String(_MC_BUILDER_STATE.postId));
    const captionSnippet = targetPost?.caption ? (targetPost.caption.slice(0, 75) + '...') : 'Postingan resmi dari akun Instagram Anda...';

    container.innerHTML = `
      <div class="ig-comments-container">
        <!-- Sheet Drag Handle & Header -->
        <div class="ig-comments-header">
          <div class="ig-drag-handle"></div>
          <div style="font-weight: 700; font-size: 13.5px; color: #fff;">Komentar</div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" style="position: absolute; right: 14px; top: 14px;">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </div>

        <!-- Comments Scroll Area -->
        <div class="ig-comments-scrollable">
          
          <!-- Post Author Caption Row -->
          <div class="ig-caption-row">
            <div class="ig-story-ring" style="width: 28px; height: 28px; padding: 1.5px;">
              <div class="ig-story-inner" style="width: 100%; height: 100%; background: #262626; display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 11px;">
                ${rawUser.charAt(0).toUpperCase()}
              </div>
            </div>
            <div style="flex: 1;">
              <div style="color: #fff; font-size: 12px; line-height: 1.35;">
                <span style="font-weight: 700; color: #fff; margin-right: 4px;">${rawUser}</span>
                <span class="ig-verified-badge" style="margin-right: 4px;">✓</span>
                <span style="color: #e5e5e5;">${captionSnippet}</span>
              </div>
              <div style="font-size: 10px; color: #737373; margin-top: 4px;">2 j</div>
            </div>
          </div>

          <!-- User Comment Row -->
          <div class="ig-comment-row">
            <div style="width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, #6366F1, #EC4899); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 11px; flex-shrink: 0;">
              A
            </div>
            <div style="flex: 1;">
              <div style="color: #fff; font-size: 12px; line-height: 1.35;">
                <span style="font-weight: 700; color: #fff; margin-right: 4px;">audiens_official</span>
                <span style="color: #f0f0f0;">${userCommentText}</span>
              </div>
              <div class="ig-comment-actions">
                <span>2 j</span>
                <span style="font-weight: 600; cursor: pointer;">Balas</span>
                <span style="font-weight: 600; cursor: pointer;">Kirim pesan</span>
              </div>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; color: #737373; padding-top: 2px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              <span style="font-size: 9px;">1</span>
            </div>
          </div>

          <!-- Nested Brand Reply (Threaded) -->
          ${enablePublic ? `
            <div class="ig-threaded-reply">
              <div style="width: 22px; height: 22px; border-radius: 50%; background: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; color: #fff; font-size: 10px; flex-shrink: 0;">
                ${rawUser.charAt(0).toUpperCase()}
              </div>
              <div style="flex: 1;">
                <div style="color: #fff; font-size: 11.5px; line-height: 1.35;">
                  <span style="font-weight: 700; color: #fff; margin-right: 3px;">${rawUser}</span>
                  <span class="ig-verified-badge" style="margin-right: 4px;">✓</span>
                  <span style="font-size: 9px; background: #262626; color: #8e8e8e; padding: 1px 4px; border-radius: 3px; margin-right: 4px;">Penulis</span>
                  <span style="color: #f0f0f0;">${botReplyText}</span>
                </div>
                <div class="ig-comment-actions">
                  <span>1 m</span>
                  <span style="font-weight: 600; cursor: pointer;">Suka</span>
                  <span style="font-weight: 600; cursor: pointer;">Balas</span>
                </div>
              </div>
              <div style="color: #737373; padding-top: 2px;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
              </div>
            </div>
          ` : `
            <div style="margin-left: 28px; padding: 8px 12px; font-size: 10.5px; color: #737373; font-style: italic; background: #181818; border-radius: 8px;">
              ⚪ Balasan komentar publik dinonaktifkan (hanya kirim pesan DM).
            </div>
          `}

        </div>

        <!-- Docked Comment Input Footer -->
        <div class="ig-comments-footer">
          <div class="ig-emoji-bar">
            <span>❤️</span><span>🙌</span><span>🔥</span><span>👏</span><span>😢</span><span>😍</span><span>😮</span><span>🎉</span>
          </div>
          <div class="ig-comment-input-row">
            <div style="width: 24px; height: 24px; border-radius: 50%; background: #333; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #888; flex-shrink: 0;">
              U
            </div>
            <div style="flex: 1; background: #262626; border-radius: 18px; padding: 6px 12px; font-size: 11.5px; color: #737373;">
              Tambahkan komentar...
            </div>
            <span style="color: #0095F6; font-weight: 600; font-size: 12px; opacity: 0.5; cursor: default;">Posting</span>
          </div>
        </div>

      </div>
    `;
  }
}

async function saveMcAutomation() {
  const btn = document.getElementById('btn-save-mc-automation');
  const origHtml = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width: 14px; height: 14px;"></i> Menyimpan...';
  refreshIcons();

  const postId = document.getElementById('mc-target-post-id').value;
  const isAny = (_MC_BUILDER_STATE.targetMode === 'any');
  const targetPostId = isAny ? 'any_post' : postId;

  const triggerType = _MC_BUILDER_STATE.conditionMode || 'any_word';
  const triggerKeywords = document.getElementById('mc-keywords-input')?.value.trim() || '';
  
  const enablePublic = document.getElementById('mc-enable-public-reply')?.checked;
  let replyMode = 'custom';
  if (!enablePublic) {
    replyMode = 'none';
  } else {
    replyMode = document.querySelector('input[name="mc-reply-mode"]:checked')?.value || 'custom';
  }
  const customReply = document.getElementById('mc-custom-reply-text')?.value.trim() || '';

  const sendDm = document.getElementById('mc-enable-dm')?.checked ?? true;
  const dmMessage = document.getElementById('mc-dm-message')?.value.trim() || '';
  const buttonText = document.getElementById('mc-button-text')?.value.trim() || 'Buka Link Akses';
  const ctaLink = document.getElementById('mc-cta-link')?.value.trim() || 'https://simplifyer.site/';
  const requireFollow = document.getElementById('mc-require-follow')?.checked ?? false;

  const payload = {
    post_id: targetPostId,
    trigger_type: triggerType,
    trigger_keywords: triggerKeywords,
    reply_mode: replyMode,
    custom_reply: customReply,
    send_dm: sendDm,
    dm_message: dmMessage,
    button_text: buttonText,
    cta_link: ctaLink,
    dm_format: 'button',
    use_smart_link: true,
    require_follow: requireFollow
  };

  try {
    const res = await fetch('/api/post-rules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.status === 'success') {
      showToast('Otomatisasi berhasil disimpan & aktif!', 'success');
      closeAutomationBuilder();
      await loadPostRulesView();
    } else {
      showToast('Gagal menyimpan: ' + (data.error || 'Terjadi kesalahan'), 'error');
    }
  } catch (err) {
    showToast('Terjadi kesalahan jaringan: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = origHtml;
    refreshIcons();
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

// ==========================================
// UNIFIED CONTENT & STORY STUDIO LOGIC
// ==========================================
let currentPublishTarget = 'IMAGE'; // 'IMAGE' or 'STORIES'
let currentPublishMode = 'now'; // 'now' or 'schedule'

function switchStudioSubTab(subTab) {
  document.querySelectorAll('.studio-pill').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.studio-panel').forEach(panel => panel.style.display = 'none');

  const btn = document.getElementById(`subtab-btn-${subTab}`);
  const panel = document.getElementById(`studio-panel-${subTab}`);

  if (btn) btn.classList.add('active');
  if (panel) panel.style.display = 'block';

  if (subTab === 'scheduler') {
    if (typeof loadScheduledPosts === 'function') loadScheduledPosts();
  } else if (subTab === 'storyrules') {
    if (typeof loadStoryRules === 'function') loadStoryRules();
  }
  refreshIcons();
}

function setPublishTarget(target) {
  currentPublishTarget = target;
  const btnFeed = document.getElementById('target-btn-feed');
  const btnReels = document.getElementById('target-btn-reels');
  const btnStory = document.getElementById('target-btn-story');
  const feedCard = document.getElementById('preview-feed-card');
  const reelsCard = document.getElementById('preview-reels-card');
  const storyCard = document.getElementById('preview-story-card');
  const badge = document.getElementById('preview-mode-badge');
  const captionHint = document.getElementById('caption-target-hint');
  const btnPublishLabel = document.getElementById('btn-publish-label');

  // Reset active buttons
  if (btnFeed) btnFeed.classList.remove('active');
  if (btnReels) btnReels.classList.remove('active');
  if (btnStory) btnStory.classList.remove('active');

  // Hide all cards first
  if (feedCard) feedCard.style.display = 'none';
  if (reelsCard) reelsCard.style.display = 'none';
  if (storyCard) storyCard.style.display = 'none';

  if (target === 'STORIES') {
    if (btnStory) btnStory.classList.add('active');
    if (storyCard) storyCard.style.display = 'flex';
    if (badge) {
      badge.innerText = 'Story Format (9:16)';
      badge.className = 'pill-badge pill-yellow';
    }
    if (captionHint) captionHint.innerText = 'Opsional untuk Story (Hanya media visual yang tayang di Story)';
    if (btnPublishLabel) btnPublishLabel.innerText = currentPublishMode === 'now' ? 'Publish ke Instagram Story Sekarang' : 'Jadwalkan Instagram Story';
  } else if (target === 'REELS') {
    if (btnReels) btnReels.classList.add('active');
    if (reelsCard) reelsCard.style.display = 'flex';
    if (badge) {
      badge.innerText = 'Reels Format (9:16)';
      badge.className = 'pill-badge pill-pink';
    }
    if (captionHint) captionHint.innerText = 'Diperlukan untuk Reels';
    if (btnPublishLabel) btnPublishLabel.innerText = currentPublishMode === 'now' ? 'Publish ke Instagram Reels Sekarang' : 'Jadwalkan Instagram Reels';
  } else {
    // Default: Feed
    if (btnFeed) btnFeed.classList.add('active');
    if (feedCard) feedCard.style.display = 'block';
    if (badge) {
      badge.innerText = 'Feed Format (3:4)';
      badge.className = 'pill-badge pill-green';
    }
    if (captionHint) captionHint.innerText = 'Diperlukan untuk Feed';
    if (btnPublishLabel) btnPublishLabel.innerText = currentPublishMode === 'now' ? 'Publish ke Feed Instagram Sekarang' : 'Jadwalkan Feed Post';
  }
  refreshIcons();
}

function togglePublishScheduleMode(mode) {
  currentPublishMode = mode;
  const schedWrap = document.getElementById('publish-schedule-datetime-wrap');
  const btnPublishLabel = document.getElementById('btn-publish-label');
  
  let targetName = 'Feed Instagram';
  if (currentPublishTarget === 'STORIES') targetName = 'Instagram Story';
  else if (currentPublishTarget === 'REELS') targetName = 'Instagram Reels';
  
  if (mode === 'schedule') {
    if (schedWrap) schedWrap.style.display = 'block';
    if (btnPublishLabel) btnPublishLabel.innerText = `Jadwalkan ${targetName}`;
  } else {
    if (schedWrap) schedWrap.style.display = 'none';
    if (btnPublishLabel) btnPublishLabel.innerText = `Publish ke ${targetName} Sekarang`;
  }
}

// Trigger File Picker
function triggerFilePicker() {
  const fileInput = document.getElementById('publish-file-picker');
  if (fileInput) fileInput.click();
}

// Handle File Selection (Upload to Cloud + Live Preview)
async function handleFileSelect(e) {
  const file = e.target.files ? e.target.files[0] : null;
  if (!file) return;

  // Local object preview immediately
  const objectUrl = URL.createObjectURL(file);
  updateComposerMediaPreview(objectUrl);

  const progress = document.getElementById('upload-progress-text');
  if (progress) {
    progress.style.display = 'block';
    progress.innerHTML = `<i data-lucide="loader-2" class="lucide-spin" style="width: 12px; height: 12px; vertical-align: middle;"></i> Mengunggah ${file.name} ke cloud hosting...`;
    refreshIcons();
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();

    if (data.status === 'success' && data.url) {
      document.getElementById('publish-image-input').value = data.url;
      if (progress) {
        progress.innerHTML = `✅ File terunggah aman: <span style="font-family: monospace; color: var(--ink-strong);">${data.url}</span>`;
      }
      showToast('Gambar berhasil diunggah dan siap dipublish!', 'success');
    } else {
      if (progress) {
        progress.innerHTML = `<span style="color: var(--danger);">❌ ${data.error || 'Gagal upload file'}</span>`;
      }
      showToast(data.error || 'Gagal mengunggah file.', 'error');
    }
  } catch (err) {
    if (progress) progress.innerHTML = '<span style="color: var(--danger);">❌ Terjadi kesalahan jaringan saat upload</span>';
    showToast('Gagal menghubungi endpoint upload.', 'error');
  } finally {
    refreshIcons();
  }
}

function handleImageUrlInput(url) {
  updateComposerMediaPreview(url.trim());
}

function updateComposerMediaPreview(url) {
  const feedBox = document.getElementById('preview-image-box');
  const reelsBox = document.getElementById('preview-reels-media-box');
  const storyBox = document.getElementById('preview-story-media-box');

  if (!url) {
    if (feedBox) feedBox.innerHTML = '<i data-lucide="image" style="width: 36px; height: 36px; opacity: 0.4;"></i>';
    if (reelsBox) reelsBox.innerHTML = '<i data-lucide="clapperboard" style="width: 38px; height: 38px; opacity: 0.35;"></i>';
    if (storyBox) storyBox.innerHTML = '<i data-lucide="sparkles" style="width: 36px; height: 36px; opacity: 0.35;"></i>';
    refreshIcons();
    return;
  }

  const imgHtml = `<img src="${url}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src=''; this.alt='Gagal memuat gambar';">`;
  if (feedBox) feedBox.innerHTML = imgHtml;
  if (reelsBox) reelsBox.innerHTML = imgHtml;
  if (storyBox) storyBox.innerHTML = imgHtml;
}

function updatePreviewCaption(text) {
  const capBox = document.getElementById('preview-caption-box');
  const reelsCapBox = document.getElementById('preview-reels-caption-box');
  const clean = text.trim();
  if (capBox) {
    capBox.innerText = clean ? clean : 'Preview caption akan tampil di sini...';
  }
  if (reelsCapBox) {
    reelsCapBox.innerText = clean ? clean : 'Preview caption postingan reels akan tampil di sini...';
  }
}

// Media Library: Pilih dari Postingan Lama
function openMediaLibraryModal() {
  const modal = document.getElementById('media-library-modal');
  const grid = document.getElementById('media-library-grid');
  if (!modal || !grid) return;

  grid.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px; text-align: center; grid-column: 1/-1; padding: 30px;">Memuat media dari postingan...</div>';
  modal.style.display = 'flex';

  if (window.latestFetchedPosts && window.latestFetchedPosts.length > 0) {
    renderMediaLibraryGrid(window.latestFetchedPosts);
  } else {
    fetch('/api/posts?limit=50')
      .then(res => res.json())
      .then(data => {
        const posts = data.data || data.posts || [];
        window.latestFetchedPosts = posts;
        renderMediaLibraryGrid(posts);
      })
      .catch(() => {
        grid.innerHTML = '<div style="color: var(--danger); font-size: 13px; text-align: center; grid-column: 1/-1; padding: 20px;">Gagal memuat daftar postingan.</div>';
      });
  }
  refreshIcons();
}

function renderMediaLibraryGrid(posts) {
  const grid = document.getElementById('media-library-grid');
  if (!grid) return;

  if (!posts || posts.length === 0) {
    grid.innerHTML = '<div style="color: var(--ink-mute); font-size: 13px; text-align: center; grid-column: 1/-1; padding: 30px;">Tidak ada postingan yang ditemukan.</div>';
    return;
  }

  grid.innerHTML = posts.map(p => {
    const mediaUrl = p.media_url || p.thumbnail_url || '';
    const caption = (p.caption || '').replace(/"/g, '&quot;');
    const cleanCap = (p.caption || 'Tanpa caption').slice(0, 45);
    return `
      <div class="media-grid-item" onclick="selectMediaFromOldPost('${mediaUrl}', '${caption}')" title="${cleanCap}">
        <img src="${mediaUrl}" loading="lazy" alt="Media" onerror="this.src='';">
        <div class="media-grid-overlay">
          <div class="media-grid-caption">${cleanCap}</div>
          <button type="button" class="btn-primary" style="margin-top: 4px; padding: 2px 8px; font-size: 10px; border-radius: 10px; width: 100%; justify-content: center;">
            Pilih Media
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function closeMediaLibraryModal() {
  const modal = document.getElementById('media-library-modal');
  if (modal) modal.style.display = 'none';
}

function selectMediaFromOldPost(mediaUrl, caption) {
  if (!mediaUrl) {
    showToast('Media tidak memiliki URL valid.', 'warning');
    return;
  }

  document.getElementById('publish-image-input').value = mediaUrl;
  updateComposerMediaPreview(mediaUrl);

  const capInput = document.getElementById('publish-caption-input');
  if (capInput && !capInput.value.trim() && caption) {
    capInput.value = caption;
    updatePreviewCaption(caption);
  }

  closeMediaLibraryModal();
  showToast('Media dari postingan lama berhasil dipilih! Anda bisa langsung publish ke Feed atau Story.', 'success');
}

// Execute Publish Sekarang or Jadwalkan
async function executePublishOrSchedule() {
  const imageInput = document.getElementById('publish-image-input').value.trim();
  const caption = document.getElementById('publish-caption-input').value.trim();
  const btn = document.getElementById('btn-publish');

  if (!imageInput) {
    showToast('Harap pilih gambar terlebih dahulu (Browse file dari komputer, atau pilih dari postingan lama).', 'warning');
    return;
  }

  if ((currentPublishTarget === 'IMAGE' || currentPublishTarget === 'REELS') && !caption) {
    showToast(`Harap masukkan caption untuk ${currentPublishTarget === 'REELS' ? 'Reels' : 'Feed Post'}.`, 'warning');
    return;
  }

  if (currentPublishMode === 'schedule') {
    const schedTime = document.getElementById('publish-sched-datetime').value;
    if (!schedTime) {
      showToast('Harap tentukan tanggal dan jam tayang jadwal.', 'warning');
      return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width: 14px; height: 14px;"></i> Menjadwalkan...';
    refreshIcons();

    try {
      const res = await fetch('/api/scheduled-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageInput,
          caption: caption,
          scheduled_at: schedTime,
          media_type: currentPublishTarget
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast('Postingan berhasil dijadwalkan!', 'success');
        switchStudioSubTab('scheduler');
      } else {
        showToast(`Gagal menjadwalkan: ${data.error || 'Terjadi kesalahan'}`, 'error');
      }
    } catch (err) {
      showToast('Gagal menghubungi server scheduler.', 'error');
    } finally {
      btn.disabled = false;
      refreshIcons();
    }
  } else {
    // Mode Now
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="lucide-spin" style="width: 14px; height: 14px;"></i> Memproses & Mengunggah ke Meta API...';
    refreshIcons();

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_input: imageInput,
          caption: caption,
          media_type: currentPublishTarget
        })
      });
      const data = await res.json();

      if (data.id) {
        let dest = 'Instagram Feed';
        if (currentPublishTarget === 'STORIES') dest = 'Instagram Story';
        else if (currentPublishTarget === 'REELS') dest = 'Instagram Reels';
        showToast(`Sukses publish ke ${dest}! Media ID: ${data.id}`, 'success');
        document.getElementById('publish-image-input').value = '';
        document.getElementById('publish-caption-input').value = '';
        updateComposerMediaPreview('');
        updatePreviewCaption('');
        const progress = document.getElementById('upload-progress-text');
        if (progress) progress.style.display = 'none';
        loadDashboardData();
      } else {
        showToast(`Gagal publish: ${JSON.stringify(data.error || data.details || data)}`, 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan saat mempublish ke Instagram.', 'error');
    } finally {
      btn.disabled = false;
      setPublishTarget(currentPublishTarget);
      refreshIcons();
    }
  }
}

// Alias for compatibility
const publishPost = executePublishOrSchedule;

// Setup Drag & Drop Listeners
function setupDropzoneEvents() {
  const dropzone = document.getElementById('upload-dropzone');
  if (!dropzone) return;

  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files && files.length > 0) {
      handleFileSelect({ target: { files: files } });
    }
  }, false);
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
            <div style="width: 24px; height: 24px; border-radius: 50%; background: linear-gradient(135deg, var(--primary), #818CF8); display: flex; align-items: center; justify-content: center; color: #FFF; font-weight: 700; font-size: 11px; flex-shrink: 0;">
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
