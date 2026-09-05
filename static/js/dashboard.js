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

  setTimeout(refreshIcons, 50);
}

// Initial Load
document.addEventListener('DOMContentLoaded', () => {
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

    container.innerHTML = posts.map(post => {
      const pId = String(post.id);
      const rule = rulesData[pId] || {};
      const ctaLink = rule.cta_link || '';
      const customReply = rule.custom_reply || '';
      const sendDm = rule.send_dm || false;
      const dmMessage = rule.dm_message || '';
      const captionText = post.caption || 'Tanpa Caption';

      return `
        <div class="supa-card" style="display: grid; grid-template-columns: 260px 1fr; gap: 24px; border-left: 3px solid ${ctaLink ? 'var(--primary)' : 'var(--border-color)'};">
          <!-- Post Summary -->
          <div>
            <div style="font-size: 11px; font-family: var(--font-mono); color: var(--ink-mute); margin-bottom: 6px;">
              Post ID: ${pId}
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
                <label class="form-label" style="display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="link" style="width: 14px; height: 14px; color: var(--primary);"></i> Custom Link (URL Tujuan / Landing Page / Tautan Khusus)
                </label>
                <input type="text" id="cta-link-${pId}" class="form-input" value="${ctaLink}" placeholder="contoh: https://domainanda.com/promo atau https://linktr.ee/...">
                <span style="font-size: 11px; color: var(--ink-mute-2); margin-top: 3px; display: block;">Tautan tujuan ini akan disisipkan bot ke DM / balasan secara otomatis.</span>
              </div>

              <!-- Custom Public Reply Template Override -->
              <div class="form-group" style="margin-bottom: 12px;">
                <label class="form-label" style="display: flex; align-items: center; gap: 6px;">
                  <i data-lucide="message-circle" style="width: 14px; height: 14px; color: var(--accent-blue);"></i> Custom Comment Reply (Opsional)
                </label>
                <input type="text" id="custom-reply-${pId}" class="form-input" value="${customReply}" placeholder="Kosongkan jika ingin memakai AI Gemini otomatis">
                <span style="font-size: 11px; color: var(--ink-mute-2); margin-top: 3px; display: block;">Jika diisi, bot akan memakai teks tetap ini. Jika kosong, AI yang menjawab.</span>
              </div>
            </div>

            <!-- Direct Message (DM) Automation Section -->
            <div style="padding: 12px 14px; background: var(--canvas-night-soft); border: 1px solid var(--border-color); border-radius: var(--radius-sm); margin-top: 6px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <label style="font-size: 13px; font-weight: 500; color: #FBBF24; display: flex; align-items: center; gap: 6px; cursor: pointer;">
                  <input type="checkbox" id="send-dm-${pId}" ${sendDm ? 'checked' : ''} style="accent-color: #F59E0B; cursor: pointer;">
                  <i data-lucide="mail" style="width: 14px; height: 14px; color: #FBBF24;"></i> Kirim DM Otomatis ke Inbox Komentator (Private Reply)
                </label>
                <span style="font-size: 11px; color: var(--ink-mute);">Instagram Direct Message</span>
              </div>

              <div class="form-group" style="margin-bottom: 0;">
                <input type="text" id="dm-message-${pId}" class="form-input" value="${dmMessage}" placeholder="Halo kak! Terima kasih sudah komentar. Ini info detail & tautan lengkapnya ya kak...">
              </div>
            </div>

            <div style="display: flex; justify-content: flex-end; margin-top: 14px;">
              <button class="btn-primary" onclick="savePostRule('${pId}')" id="btn-save-${pId}" style="display: inline-flex; align-items: center; gap: 6px;">
                <i data-lucide="save" style="width: 14px; height: 14px;"></i> Simpan Pengaturan Post Ini
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = '<div style="color: var(--danger); padding: 20px;">Gagal memuat aturan post: ' + err.message + '</div>';
  } finally {
    refreshIcons();
  }
}

// Save Single Post Rule
async function savePostRule(postId) {
  const btn = document.getElementById(`btn-save-${postId}`);
  const ctaLink = document.getElementById(`cta-link-${postId}`)?.value.trim() || '';
  const customReply = document.getElementById(`custom-reply-${postId}`)?.value.trim() || '';
  const sendDm = document.getElementById(`send-dm-${postId}`)?.checked || false;
  const dmMessage = document.getElementById(`dm-message-${postId}`)?.value.trim() || '';

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
        dm_message: dmMessage
      })
    });

    const data = await res.json();
    if (data.status === 'success') {
      showToast('Pengaturan postingan berhasil disimpan ke Supabase!', 'success');
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
