from flask import Flask, render_template, jsonify, request
import requests
import json
import time
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

app = Flask(__name__)

# Ensure UTF-8 output encoding for Windows terminal
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# ==========================================
# CONFIGURATION & CREDENTIALS
# ==========================================
INSTAGRAM_ACCOUNT_ID = os.environ.get("INSTAGRAM_ACCOUNT_ID", "17841466987503898")
ACCESS_TOKEN = os.environ.get("META_ACCESS_TOKEN", "EAGHy3jJfJscBSYs6l3B6Bwly4yEsB3fSHfNPwF22Ftlvpsv3CZBLHqrvcrNU07FZAD1KM1WLvO4HrDAw257snRzMOVIZAMUegfj4h77P1N6HYdoWyZAmIrSxiG7YpoJ3MgljZAl7jA6pHNzTux0b7kQNSPfAdehS3EIhoPbnXqmChB90pH4mmifoWJOySkQ4s")
APP_ID = os.environ.get("APP_ID", "27570108882691783")
APP_SECRET = os.environ.get("APP_SECRET", "9426751dfaec5d047d1e568a20899d8a")
GRAPH_URL = "https://graph.facebook.com/v20.0"

# Supabase Client Initialization
SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

supabase_client = None
if SUPABASE_URL and SUPABASE_KEY:
    try:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("[DATABASE] Supabase client successfully initialized.")
    except Exception as e:
        print(f"[DATABASE WARNING] Failed to initialize Supabase client: {e}")

# Gemini AI Configuration
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

RULES_FILE = "rules.json"
REPLIED_COMMENTS_FILE = "replied_comments.json"
POST_RULES_FILE = "post_rules.json"

# Multi-Account Registry
KNOWN_INSTAGRAM_ACCOUNTS = [
    {"id": "17841466987503898", "username": "sarangestate", "name": "Sarang Estate", "category": "Real Estate / Property"},
    {"id": "17841448570126268", "username": "produkly", "name": "Produkly", "category": "Digital Products"},
    {"id": "17841474608292986", "username": "murahnesia", "name": "Murahnesia", "category": "E-Commerce / Promo"}
]

KNOWN_GMAIL_USERS = [
    {"email": "baihaqidr@gmail.com", "name": "baihaqidr", "plan": "FREE", "avatar": "B", "role": "Organization Owner"},
    {"email": "admin.socmed@gmail.com", "name": "Admin Socmed", "plan": "PRO", "avatar": "A", "role": "Team Admin"},
    {"email": "baihaqi.workspace@gmail.com", "name": "Baihaqi Workspace", "plan": "TEAM", "avatar": "W", "role": "Developer"}
]


# ==========================================
# DATABASE HELPER FUNCTIONS (SUPABASE + FALLBACK)
# ==========================================
def get_app_setting(setting_key, default_val=""):
    """Get setting value from Supabase app_settings table."""
    if supabase_client:
        try:
            res = supabase_client.table("app_settings").select("value").eq("key", setting_key).execute()
            if res.data:
                return res.data[0]["value"]
        except Exception:
            pass
    return default_val


def set_app_setting(setting_key, setting_val):
    """Save setting value to Supabase app_settings table."""
    if supabase_client:
        try:
            supabase_client.table("app_settings").upsert({
                "key": setting_key,
                "value": str(setting_val)
            }, on_conflict="key").execute()
            return True
        except Exception as e:
            print(f"[SUPABASE ERROR] set_app_setting failed: {e}")
    return False


def get_active_account_id():
    """Get currently active Instagram Account ID."""
    active_id = get_app_setting("INSTAGRAM_ACCOUNT_ID", INSTAGRAM_ACCOUNT_ID)
    return active_id or INSTAGRAM_ACCOUNT_ID


def get_active_user_email():
    """Get currently active Gmail / User Workspace."""
    active_email = get_app_setting("ACTIVE_USER_EMAIL", "baihaqidr@gmail.com")
    return active_email or "baihaqidr@gmail.com"


def load_rules():
    """Load auto-reply rules from Supabase (or fallback to local JSON)."""
    if supabase_client:
        try:
            res = supabase_client.table("rules").select("*").eq("is_active", True).execute()
            if res.data:
                return {row["keyword"].lower(): row["reply_message"] for row in res.data}
        except Exception as e:
            print(f"[SUPABASE ERROR] load_rules failed: {e}")

    if os.path.exists(RULES_FILE):
        try:
            with open(RULES_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass

    return {
        "harga": "Halo kak! Info harga & pricelist lengkap sudah kami kirim ke DM ya atau bisa cek link di bio 😊",
        "lokasi": "Lokasinya sangat strategis di Ciracas kak, detail lengkapnya sudah kami kirim ke DM ya! Yuk survey minggu ini!",
        "spesifikasi": "Rumah mewah 2 lantai, LT 65m2 LB 65m2 siap huni kak! Info lengkapnya sudah kami kirimkan ke DM ya!"
    }


def save_rules(rules):
    """Save auto-reply rules to Supabase and local file."""
    if supabase_client:
        try:
            for kw, reply in rules.items():
                supabase_client.table("rules").upsert({
                    "keyword": kw.lower(),
                    "reply_message": reply,
                    "is_active": True
                }, on_conflict="keyword").execute()
        except Exception as e:
            print(f"[SUPABASE ERROR] save_rules failed: {e}")

    try:
        with open(RULES_FILE, 'w', encoding='utf-8') as f:
            json.dump(rules, f, indent=2, ensure_ascii=False)
    except Exception:
        pass


def delete_rule_db(keyword):
    """Delete a rule from Supabase and local file."""
    if supabase_client:
        try:
            supabase_client.table("rules").delete().eq("keyword", keyword.lower()).execute()
        except Exception as e:
            print(f"[SUPABASE ERROR] delete_rule failed: {e}")


def load_post_rules():
    """Load per-post custom rules & CTA links from Supabase or fallback JSON."""
    if supabase_client:
        try:
            res = supabase_client.table("post_rules").select("*").eq("is_active", True).execute()
            if res.data:
                return {row["post_id"]: row for row in res.data}
        except Exception as e:
            print(f"[SUPABASE ERROR] load_post_rules failed: {e}")

    if os.path.exists(POST_RULES_FILE):
        try:
            with open(POST_RULES_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_post_rule_db(post_id, cta_link="", custom_reply="", send_dm=False, dm_message="", post_caption_preview=""):
    """Save custom automation rule for a specific post."""
    data = {
        "post_id": str(post_id),
        "cta_link": cta_link,
        "custom_reply": custom_reply,
        "send_dm": bool(send_dm),
        "dm_message": dm_message,
        "post_caption_preview": post_caption_preview,
        "is_active": True
    }
    if supabase_client:
        try:
            supabase_client.table("post_rules").upsert(data, on_conflict="post_id").execute()
        except Exception as e:
            print(f"[SUPABASE ERROR] save_post_rule_db failed: {e}")

    post_rules = load_post_rules()
    post_rules[str(post_id)] = data
    try:
        with open(POST_RULES_FILE, 'w', encoding='utf-8') as f:
            json.dump(post_rules, f, indent=2, ensure_ascii=False)
    except Exception:
        pass
    return data


def delete_post_rule_db(post_id):
    """Delete custom post rule."""
    if supabase_client:
        try:
            supabase_client.table("post_rules").delete().eq("post_id", str(post_id)).execute()
        except Exception as e:
            print(f"[SUPABASE ERROR] delete_post_rule_db failed: {e}")

    post_rules = load_post_rules()
    if str(post_id) in post_rules:
        del post_rules[str(post_id)]
        try:
            with open(POST_RULES_FILE, 'w', encoding='utf-8') as f:
                json.dump(post_rules, f, indent=2, ensure_ascii=False)
        except Exception:
            pass


def load_replied_comments():
    """Load set of already replied comment IDs."""
    if supabase_client:
        try:
            res = supabase_client.table("replied_comments").select("comment_id").execute()
            if res.data:
                return set(row["comment_id"] for row in res.data)
        except Exception as e:
            print(f"[SUPABASE ERROR] load_replied_comments failed: {e}")

    if os.path.exists(REPLIED_COMMENTS_FILE):
        try:
            with open(REPLIED_COMMENTS_FILE, 'r', encoding='utf-8') as f:
                return set(json.load(f))
        except Exception:
            pass
    return set()


def record_replied_comment(comment_id, post_id="", username="", comment_text="", reply_text=""):
    """Record a newly replied comment to Supabase and local file."""
    if supabase_client:
        try:
            supabase_client.table("replied_comments").upsert({
                "comment_id": comment_id,
                "post_id": post_id,
                "username": username,
                "comment_text": comment_text,
                "reply_text": reply_text
            }, on_conflict="comment_id").execute()
        except Exception as e:
            print(f"[SUPABASE ERROR] record_replied_comment failed: {e}")

    replied_set = load_replied_comments()
    replied_set.add(comment_id)
    try:
        with open(REPLIED_COMMENTS_FILE, 'w', encoding='utf-8') as f:
            json.dump(list(replied_set), f)
    except Exception:
        pass


def log_published_post(media_id, caption, image_url):
    """Log published post to Supabase."""
    if supabase_client:
        try:
            supabase_client.table("posts_log").insert({
                "media_id": media_id,
                "caption": caption,
                "image_url": image_url,
                "status": "published"
            }).execute()
        except Exception as e:
            print(f"[SUPABASE ERROR] log_published_post failed: {e}")


# ==========================================
# FILE UPLOAD & CLOUD HOSTING
# ==========================================
def upload_local_file_to_cloud(file_path):
    file_path = file_path.strip('"').strip("'").strip()
    if not os.path.exists(file_path):
        return None

    file_name = os.path.basename(file_path)
    
    # Primary Host: Uguu.se
    try:
        with open(file_path, 'rb') as f:
            res = requests.post(
                'https://uguu.se/upload',
                files={'files[]': (file_name, f)},
                timeout=15
            )
        data = res.json()
        if res.status_code == 200 and data.get('success') and data.get('files'):
            return data['files'][0]['url']
    except Exception:
        pass

    # Fallback Host: Catbox
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        with open(file_path, 'rb') as f:
            res = requests.post(
                'https://catbox.moe/user/api.php',
                data={'reqtype': 'fileupload'},
                files={'fileToUpload': (file_name, f)},
                headers=headers,
                timeout=15
            )
        if res.status_code == 200 and res.text.strip().startswith('http'):
            return res.text.strip()
    except Exception:
        pass

    return None


# ==========================================
# INSTAGRAM GRAPH API ACTIONS
# ==========================================
def get_account_info(target_id=None):
    acc_id = target_id or get_active_account_id()
    url = f"{GRAPH_URL}/{acc_id}"
    params = {
        "fields": "id,username,name,media_count,profile_picture_url",
        "access_token": ACCESS_TOKEN
    }
    return requests.get(url, params=params).json()


def get_all_posts(limit=100, target_id=None):
    """Fetch all posts from active Instagram account with pagination."""
    acc_id = target_id or get_active_account_id()
    all_posts = []
    url = f"{GRAPH_URL}/{acc_id}/media"
    params = {
        "fields": "id,caption,media_type,media_url,permalink,timestamp,comments_count",
        "limit": min(limit, 50),
        "access_token": ACCESS_TOKEN
    }
    
    req_url = url
    req_params = params
    
    while req_url:
        try:
            res = requests.get(req_url, params=req_params, timeout=15).json()
            if "data" in res:
                all_posts.extend(res["data"])
            
            paging = res.get("paging", {})
            next_url = paging.get("next")
            
            if next_url and len(all_posts) < limit:
                req_url = next_url
                req_params = None  # Next URL already contains query params
            else:
                break
        except Exception as e:
            print(f"[GRAPH API ERROR] get_all_posts error: {e}")
            break
            
    return all_posts


def get_recent_posts(limit=25):
    """Get recent posts (defaults to 25 items)."""
    return {"data": get_all_posts(limit=limit)}


def get_post_comments(media_id):
    url = f"{GRAPH_URL}/{media_id}/comments"
    params = {
        "fields": "id,text,username,timestamp,replies{id,text,username,timestamp}",
        "access_token": ACCESS_TOKEN
    }
    return requests.get(url, params=params).json()


def reply_to_comment(comment_id, message):
    """Send public comment reply."""
    url = f"{GRAPH_URL}/{comment_id}/replies"
    data = {
        "message": message,
        "access_token": ACCESS_TOKEN
    }
    return requests.post(url, data=data).json()


def send_private_dm(comment_id, message):
    """Send Direct Message (Private Reply) to commenter."""
    acc_id = get_active_account_id()
    # Attempt 1: Instagram Messaging Send API
    try:
        url = f"{GRAPH_URL}/{acc_id}/messages"
        payload = {
            "recipient": {"comment_id": comment_id},
            "message": {"text": message},
            "access_token": ACCESS_TOKEN
        }
        res = requests.post(url, json=payload, timeout=10).json()
        if "message_id" in res or "recipient_id" in res:
            return {"status": "success", "result": res}
    except Exception:
        pass

    # Attempt 2: Comment Messages Endpoint
    try:
        url = f"{GRAPH_URL}/{comment_id}/messages"
        data = {
            "message": message,
            "access_token": ACCESS_TOKEN
        }
        res = requests.post(url, data=data, timeout=10).json()
        if "id" in res or "success" in res:
            return {"status": "success", "result": res}
    except Exception:
        pass

    return {"status": "failed", "note": "Private reply requires instagram_manage_messages permission"}


def create_and_publish_image_post(image_input, caption):
    acc_id = get_active_account_id()
    image_input = image_input.strip('"').strip("'").strip()
    
    if not image_input.startswith("http://") and not image_input.startswith("https://"):
        public_url = upload_local_file_to_cloud(image_input)
        if not public_url:
            return {"error": "Gagal mengunggah file gambar lokal ke cloud."}
        image_url = public_url
    else:
        image_url = image_input

    container_url = f"{GRAPH_URL}/{acc_id}/media"
    container_data = {
        "image_url": image_url,
        "caption": caption,
        "access_token": ACCESS_TOKEN
    }
    container_res = requests.post(container_url, data=container_data).json()

    if "id" not in container_res:
        return {"error": "Gagal membuat kontainer media Instagram.", "details": container_res}

    creation_id = container_res["id"]
    time.sleep(3)

    publish_url = f"{GRAPH_URL}/{acc_id}/media_publish"
    publish_data = {
        "creation_id": creation_id,
        "access_token": ACCESS_TOKEN
    }
    publish_res = requests.post(publish_url, data=publish_data).json()
    
    if "id" in publish_res:
        log_published_post(publish_res["id"], caption, image_url)
        
    return publish_res


# ==========================================
# GEMINI AI SMART ENGINE
# ==========================================
def generate_ai_reply(comment_text, username="", post_caption="", cta_link="", send_dm=False):
    """Generate intelligent contextual reply using Google Gemini AI, considering comment, post caption, and custom link."""
    gemini_key = GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY") or get_app_setting("gemini_api_key", "")
    if not gemini_key:
        return None
        
    caption_context = f"\n- Konteks Konten Postingan yang sedang dikomentari:\n  \"{post_caption}\"" if post_caption else ""
    
    if send_dm or cta_link:
        cta_direction = "Beri tahu pengguna bahwa info detail & tautan akses sudah dikirimkan langsung ke DM mereka (atau bisa cek link di bio)."
        dm_instruction = "2. Informasikan secara ramah bahwa detail lengkapnya sudah dikirimkan ke DM / Inbox mereka."
    else:
        cta_direction = "Jawab pertanyaan audiens secara langsung, jelas, dan ramah sesuai konten postingan. Boleh sarankan untuk cek link di bio jika ingin melihat katalog/info lengkap."
        dm_instruction = "2. Jawab informasinya secara langsung di komentar. JANGAN mengklaim sudah mengirim DM jika pengguna tidak meminta link khusus."

    system_prompt = f"""Kamu adalah Customer Service AI resmi dari akun Instagram bisnis.
Tugasmu adalah membalas komentar prospek/audiens di Instagram secara ramah, santun, natural, bersahabat, dan profesional.

KNOWLEDGE BASE & KONTEKS POSTINGAN:{caption_context}
- Sikap: Jawab pertanyaan dengan ramah, antusias, dan informatif sesuai konteks postingan di atas. Jika ditanya hal santai/humor, tanggapi dengan nada ceria/sopan.
- Arahan Call to Action: {cta_direction}

ATURAN MENJAWAB DI KOMENTAR INSTAGRAM (PENTING):
1. JANGAN PERNAH menaruh link URL mentah (seperti https://...) di dalam balasan komentar, karena link di kolom komentar Instagram TIDAK BISA DIKLIK oleh pengguna di aplikasi mobile.
{dm_instruction}
3. Jawab dengan ringkas dan padat (maksimal 2 kalimat saja agar nyaman dibaca di kolom komentar).
4. Gunakan sapaan ramah "Halo kak @{username if username else 'user'}!" atau "Halo kak!".
5. Gunakan 1-2 emoji yang relevan (😊, ✨, 👍).
6. Jawab HANYA teks balasan Instagram saja tanpa tanda kutip.

Komentar dari @{username if username else 'user'}:
"{comment_text}"

Balasan Komentar Instagram:"""

    for model_name in ["gemini-3.7-flash", "gemini-3.8-flash"]:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={gemini_key}"
            payload = {"contents": [{"parts": [{"text": system_prompt}]}]}
            res = requests.post(url, json=payload, timeout=15)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts:
                        return parts[0].get("text", "").strip()
        except Exception as e:
            print(f"[GEMINI AI ERROR] Failed with model {model_name}: {e}")
            
    return None


# ==========================================
# FLASK WEB ROUTES
# ==========================================
@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/health')
def api_health():
    return jsonify({
        "status": "healthy",
        "supabase_connected": supabase_client is not None,
        "gemini_ai_configured": bool(GEMINI_API_KEY or get_app_setting("gemini_api_key")),
        "active_account_id": get_active_account_id(),
        "active_user": get_active_user_email()
    })


@app.route('/api/account')
def api_account():
    return jsonify(get_account_info())


@app.route('/api/accounts')
def api_accounts():
    """Get all connected Instagram accounts with live status."""
    active_id = get_active_account_id()
    account_list = []
    
    for acc in KNOWN_INSTAGRAM_ACCOUNTS:
        info = get_account_info(target_id=acc["id"])
        is_active = (acc["id"] == active_id)
        account_list.append({
            "id": acc["id"],
            "username": info.get("username", acc["username"]),
            "name": info.get("name", acc["name"]),
            "category": acc["category"],
            "media_count": info.get("media_count", 0),
            "profile_picture_url": info.get("profile_picture_url", ""),
            "is_active": is_active,
            "status": "connected" if "username" in info else "error"
        })
        
    return jsonify({
        "active_account_id": active_id,
        "accounts": account_list
    })


@app.route('/api/switch-account', methods=['POST'])
def api_switch_account():
    """Switch active Instagram account."""
    data = request.get_json() or {}
    account_id = str(data.get('account_id', '')).strip()
    
    if not account_id:
        return jsonify({"error": "Missing account_id"}), 400
        
    # Save to Supabase app_settings
    set_app_setting("INSTAGRAM_ACCOUNT_ID", account_id)
    info = get_account_info(target_id=account_id)
    
    return jsonify({
        "status": "success",
        "active_account_id": account_id,
        "username": info.get("username", "unknown"),
        "media_count": info.get("media_count", 0)
    })


@app.route('/api/user-profiles')
def api_user_profiles():
    """Get available Gmail / User Workspace Profiles."""
    active_email = get_active_user_email()
    users = []
    for u in KNOWN_GMAIL_USERS:
        u_copy = dict(u)
        u_copy["is_active"] = (u["email"] == active_email)
        users.append(u_copy)
        
    return jsonify({
        "active_email": active_email,
        "users": users
    })


@app.route('/api/switch-user', methods=['POST'])
def api_switch_user():
    """Switch active Gmail / Workspace User."""
    data = request.get_json() or {}
    email = str(data.get('email', '')).strip()
    
    if not email:
        return jsonify({"error": "Missing email"}), 400
        
    set_app_setting("ACTIVE_USER_EMAIL", email)
    return jsonify({
        "status": "success",
        "active_email": email
    })


@app.route('/api/posts')
def api_posts():
    limit = request.args.get('limit', 25, type=int)
    return jsonify({"data": get_all_posts(limit=limit)})


@app.route('/api/post-rules', methods=['GET', 'POST', 'DELETE'])
def api_post_rules():
    post_rules = load_post_rules()
    if request.method == 'GET':
        return jsonify(post_rules)
        
    data = request.get_json() or {}
    post_id = str(data.get('post_id', '')).strip()
    
    if request.method == 'POST':
        if not post_id:
            return jsonify({"error": "Missing post_id"}), 400
        saved = save_post_rule_db(
            post_id=post_id,
            cta_link=data.get('cta_link', ''),
            custom_reply=data.get('custom_reply', ''),
            send_dm=data.get('send_dm', False),
            dm_message=data.get('dm_message', ''),
            post_caption_preview=data.get('post_caption_preview', '')
        )
        return jsonify({"status": "success", "rule": saved})
        
    if request.method == 'DELETE':
        if not post_id:
            return jsonify({"error": "Missing post_id"}), 400
        delete_post_rule_db(post_id)
        return jsonify({"status": "success", "message": f"Deleted rule for post {post_id}"})


@app.route('/api/rules', methods=['GET', 'POST', 'DELETE'])
def api_rules():
    rules = load_rules()
    if request.method == 'GET':
        return jsonify(rules)
    
    data = request.get_json() or {}
    keyword = data.get('keyword', '').strip().lower()
    
    if request.method == 'POST':
        reply = data.get('reply', '').strip()
        if keyword and reply:
            rules[keyword] = reply
            save_rules(rules)
            return jsonify({"status": "success", "rules": rules})
        return jsonify({"error": "Missing keyword or reply"}), 400
        
    if request.method == 'DELETE':
        if keyword in rules:
            del rules[keyword]
            delete_rule_db(keyword)
            return jsonify({"status": "success", "rules": rules})
        return jsonify({"error": "Keyword not found"}), 404


@app.route('/api/publish', methods=['POST'])
def api_publish():
    data = request.get_json() or {}
    image_input = data.get('image_input', '')
    caption = data.get('caption', '')
    res = create_and_publish_image_post(image_input, caption)
    return jsonify(res)


@app.route('/api/auto-reply-scan', methods=['GET', 'POST'])
def api_auto_reply_scan():
    rules = load_rules()
    post_rules = load_post_rules()
    replied_ids = load_replied_comments()
    
    total_replied = 0
    total_dms_sent = 0
    total_scanned_posts = 0
    details = []
    
    # Scan across ALL connected Instagram accounts
    for acc in KNOWN_INSTAGRAM_ACCOUNTS:
        acc_id = acc["id"]
        acc_username = acc["username"].lower()
        
        # Fetch posts for this account
        posts = get_all_posts(limit=50, target_id=acc_id)
        total_scanned_posts += len(posts)
        
        for post in posts:
            if post.get("comments_count", 0) == 0:
                continue
                
            p_id = str(post["id"])
            post_caption = post.get("caption", "")
            post_rule = post_rules.get(p_id, {})
            post_cta_link = post_rule.get("cta_link", "")
            post_custom_reply = post_rule.get("custom_reply", "")
            post_send_dm = post_rule.get("send_dm", False)
            post_dm_message = post_rule.get("dm_message", "")
            
            comments_data = get_post_comments(post["id"])
            if "data" in comments_data:
                for comment in comments_data["data"]:
                    c_id = comment["id"]
                    c_user = comment.get("username", "").lower()
                    
                    # 1. Skip if own account (dynamic based on current scanned account)
                    if c_user == acc_username:
                        continue

                    # 2. Skip if already in replied database
                    if c_id in replied_ids:
                        continue
                    
                    # 3. Skip if comment already has existing replies on Instagram
                    existing_replies = comment.get("replies", {}).get("data", []) if isinstance(comment.get("replies"), dict) else []
                    if existing_replies:
                        record_replied_comment(
                            comment_id=c_id,
                            post_id=p_id,
                            username=comment.get("username", ""),
                            comment_text=comment.get("text", ""),
                            reply_text="[Existing Instagram Reply]"
                        )
                        replied_ids.add(c_id)
                        continue

                    # 4. Determine final reply
                    raw_text = comment.get("text", "").strip()
                    lower_text = raw_text.lower()
                    final_reply = None
                    reply_source = "Rule"
                    
                    # Priority A: Specific Post Custom Reply Override
                    if post_custom_reply:
                        final_reply = post_custom_reply
                        reply_source = "Post Custom Rule"

                    # Priority B: Global Keyword Rule
                    if not final_reply:
                        for kw, reply_msg in rules.items():
                            if kw.lower() in lower_text:
                                final_reply = reply_msg
                                reply_source = f"Rule ({kw})"
                                break

                    # Priority C: Intelligent Gemini AI Fallback
                    if not final_reply and len(raw_text) >= 2:
                        ai_generated = generate_ai_reply(
                            comment_text=raw_text,
                            username=comment.get("username", ""),
                            post_caption=post_caption,
                            cta_link=post_cta_link,
                            send_dm=post_send_dm
                        )
                        if ai_generated:
                            final_reply = ai_generated
                            reply_source = "Gemini AI"

                    # 5. Send public reply & Send Clickable Link via Direct Message (DM)
                    if final_reply:
                        res = reply_to_comment(c_id, final_reply)
                        if "id" in res:
                            dm_status = "Not Sent"
                            
                            # Send Clickable Link directly via DM (Private Reply)
                            dm_content = post_dm_message if (post_send_dm and post_dm_message) else ""
                            if not dm_content and post_cta_link:
                                dm_content = f"Halo kak @{comment.get('username', '')}! Terima kasih sudah tertarik dengan listing ini. 😊\n\nUntuk info detail & panduan lengkap, silakan buka tautan berikut:\n{post_cta_link}"
                            elif dm_content and post_cta_link and post_cta_link not in dm_content:
                                dm_content += f"\n\nTautan Akses: {post_cta_link}"

                            if dm_content:
                                dm_res = send_private_dm(c_id, dm_content)
                                dm_status = dm_res.get("status", "sent")
                                if dm_status == "success":
                                    total_dms_sent += 1

                            record_replied_comment(
                                comment_id=c_id,
                                post_id=p_id,
                                username=comment.get("username", ""),
                                comment_text=raw_text,
                                reply_text=f"[{reply_source}] {final_reply}"
                            )
                            replied_ids.add(c_id)
                            total_replied += 1
                            details.append({
                                "target_account": acc_username,
                                "comment_id": c_id,
                                "post_id": p_id,
                                "username": comment.get("username", ""),
                                "source": reply_source,
                                "reply_text": final_reply,
                                "dm_status": dm_status,
                                "reply_id": res["id"]
                            })

    return jsonify({
        "status": "success",
        "total_scanned_posts": total_scanned_posts,
        "total_new_replies": total_replied,
        "total_dms_sent": total_dms_sent,
        "details": details
    })


@app.route('/api/ai-reply-test', methods=['POST'])
def api_ai_reply_test():
    data = request.get_json() or {}
    test_comment = data.get('comment', 'Min, ada promo bebas biaya apa aja bulan ini?')
    test_user = data.get('username', 'calon_pembeli')
    test_caption = data.get('caption', 'Promo Rumah Ciracas 2 Lantai')
    test_link = data.get('cta_link', 'https://sarangestate.id/link/promo-spesial')
    ai_reply = generate_ai_reply(test_comment, test_user, test_caption, test_link)
    return jsonify({
        "status": "success" if ai_reply else "error",
        "input_comment": test_comment,
        "ai_reply": ai_reply or "Gagal membuat balasan AI (Pastikan GEMINI_API_KEY valid)."
    })


@app.route('/api/cron/scan')
def api_cron_scan():
    """Vercel Cron / Scheduler Endpoint (Runs auto scan)."""
    return api_auto_reply_scan()


@app.route('/api/inbox-comments')
def api_inbox_comments():
    all_posts = get_all_posts(limit=25)
    all_comments = []
    replied_ids = load_replied_comments()
    
    for post in all_posts:
        if post.get("comments_count", 0) == 0:
            continue
        c_data = get_post_comments(post["id"])
        if "data" in c_data:
            for c in c_data["data"]:
                c["is_replied"] = c["id"] in replied_ids
                c["post_id"] = post["id"]
                c["post_permalink"] = post.get("permalink", "#")
                all_comments.append(c)
                
    return jsonify({"data": all_comments})


if __name__ == '__main__':
    print("=" * 60)
    print("🚀 SOCMED AUTOMATION (SIMPLIFYER ENGINE)")
    print(f"📦 Workspace: D:\\Vibe Coding Application\\socmed_automation")
    print(f"🌐 Local Dashboard: http://localhost:5000")
    print(f"🗄️ Database: {'Supabase Active' if supabase_client else 'Local JSON Fallback'}")
    print(f"🤖 Gemini AI: {'Configured' if bool(GEMINI_API_KEY or get_app_setting('gemini_api_key')) else 'Not Set'}")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)
