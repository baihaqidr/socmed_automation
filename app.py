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

RULES_FILE = "rules.json"
REPLIED_COMMENTS_FILE = "replied_comments.json"


# ==========================================
# DATABASE HELPER FUNCTIONS (SUPABASE + FALLBACK)
# ==========================================
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
        "harga": "Halo kak! Info harga & pricelist lengkap bisa DM kami ya 😊",
        "lokasi": "Lokasinya sangat strategis di Ciracas kak, yuk survey minggu ini!",
        "spesifikasi": "Rumah mewah 2 lantai, LT 65m2 LB 65m2 siap huni kak!"
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
def get_account_info():
    url = f"{GRAPH_URL}/{INSTAGRAM_ACCOUNT_ID}"
    params = {
        "fields": "id,username,name,media_count",
        "access_token": ACCESS_TOKEN
    }
    return requests.get(url, params=params).json()


def get_recent_posts(limit=10):
    url = f"{GRAPH_URL}/{INSTAGRAM_ACCOUNT_ID}/media"
    params = {
        "fields": "id,caption,media_type,media_url,permalink,timestamp,comments_count",
        "limit": limit,
        "access_token": ACCESS_TOKEN
    }
    return requests.get(url, params=params).json()


def get_post_comments(media_id):
    url = f"{GRAPH_URL}/{media_id}/comments"
    params = {
        "fields": "id,text,username,timestamp,replies",
        "access_token": ACCESS_TOKEN
    }
    return requests.get(url, params=params).json()


def reply_to_comment(comment_id, message):
    url = f"{GRAPH_URL}/{comment_id}/replies"
    data = {
        "message": message,
        "access_token": ACCESS_TOKEN
    }
    return requests.post(url, data=data).json()


def create_and_publish_image_post(image_input, caption):
    image_input = image_input.strip('"').strip("'").strip()
    
    if not image_input.startswith("http://") and not image_input.startswith("https://"):
        public_url = upload_local_file_to_cloud(image_input)
        if not public_url:
            return {"error": "Gagal mengunggah file gambar lokal ke cloud."}
        image_url = public_url
    else:
        image_url = image_input

    container_url = f"{GRAPH_URL}/{INSTAGRAM_ACCOUNT_ID}/media"
    container_data = {
        "image_url": image_url,
        "caption": caption,
        "access_token": ACCESS_TOKEN
    }
    container_res = requests.post(container_url, data=container_data).json()
    
    if "id" not in container_res:
        return container_res
        
    creation_id = container_res["id"]
    time.sleep(5)
    
    publish_url = f"{GRAPH_URL}/{INSTAGRAM_ACCOUNT_ID}/media_publish"
    publish_data = {
        "creation_id": creation_id,
        "access_token": ACCESS_TOKEN
    }
    publish_res = requests.post(publish_url, data=publish_data).json()
    
    if "id" in publish_res:
        log_published_post(publish_res["id"], caption, image_url)
        
    return publish_res


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
        "instagram_account_id": INSTAGRAM_ACCOUNT_ID
    })


@app.route('/api/account')
def api_account():
    return jsonify(get_account_info())


@app.route('/api/posts')
def api_posts():
    return jsonify(get_recent_posts(limit=10))


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
    replied_ids = load_replied_comments()
    posts_data = get_recent_posts(limit=10)
    
    total_replied = 0
    details = []
    
    if "data" in posts_data:
        for post in posts_data["data"]:
            if post.get("comments_count", 0) == 0:
                continue
            comments_data = get_post_comments(post["id"])
            if "data" in comments_data:
                for comment in comments_data["data"]:
                    c_id = comment["id"]
                    if c_id in replied_ids:
                        continue
                    text = comment.get("text", "").lower()
                    username = comment.get("username", "")
                    
                    for kw, reply_msg in rules.items():
                        if kw.lower() in text:
                            res = reply_to_comment(c_id, reply_msg)
                            if "id" in res:
                                record_replied_comment(
                                    comment_id=c_id,
                                    post_id=post["id"],
                                    username=username,
                                    comment_text=comment.get("text", ""),
                                    reply_text=reply_msg
                                )
                                total_replied += 1
                                details.append({
                                    "comment_id": c_id,
                                    "username": username,
                                    "keyword": kw,
                                    "reply_id": res["id"]
                                })
                            break
                            
    return jsonify({
        "status": "success",
        "total_scanned_posts": len(posts_data.get("data", [])),
        "total_new_replies": total_replied,
        "details": details
    })


@app.route('/api/cron/scan')
def api_cron_scan():
    """Vercel Cron / Scheduler Endpoint (Runs auto scan)."""
    return api_auto_reply_scan()


@app.route('/api/inbox-comments')
def api_inbox_comments():
    posts_data = get_recent_posts(limit=5)
    all_comments = []
    replied_ids = load_replied_comments()
    
    if "data" in posts_data:
        for post in posts_data["data"]:
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
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)
