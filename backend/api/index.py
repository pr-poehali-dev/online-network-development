"""Главный API-эндпоинт платформы Buzzy — авторизация, посты, профили, сообщения, админ-панель"""
import json
import os
import hashlib
import secrets
import time
import psycopg2
import psycopg2.extras

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Authorization',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
}

tokens = {}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def resp(status, body):
    return {'statusCode': status, 'headers': CORS_HEADERS, 'body': json.dumps(body, default=str, ensure_ascii=False)}

def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def get_user_from_token(headers):
    token = headers.get('x-authorization', headers.get('Authorization', ''))
    token = token.replace('Bearer ', '')
    if token in tokens:
        return tokens[token]
    return None

def handler(event, context):
    """API платформы Buzzy"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except:
            body = {}

    headers = event.get('headers', {})
    headers = {k.lower(): v for k, v in headers.items()} if headers else {}
    user_id = get_user_from_token(headers)

    try:
        if path == '/auth/register' and method == 'POST':
            return register(body)
        elif path == '/auth/login' and method == 'POST':
            return login(body)
        elif path == '/auth/me' and method == 'GET':
            return get_me(user_id)
        elif path == '/feed' and method == 'GET':
            return get_feed(params, user_id)
        elif path == '/posts' and method == 'POST':
            return create_post(body, user_id)
        elif path == '/posts/view' and method == 'POST':
            return view_post(body)
        elif path == '/posts/like' and method == 'POST':
            return like_post(body, user_id)
        elif path == '/posts/repost' and method == 'POST':
            return repost(body, user_id)
        elif path == '/posts/remove' and method == 'POST':
            return remove_post(body, user_id)
        elif path == '/post' and method == 'GET':
            return get_post(params, user_id)
        elif path == '/comments' and method == 'GET':
            return get_comments(params, user_id)
        elif path == '/comments' and method == 'POST':
            return add_comment(body, user_id)
        elif path == '/comments/like' and method == 'POST':
            return like_comment(body, user_id)
        elif path == '/comments/pin' and method == 'POST':
            return pin_comment(body, user_id)
        elif path == '/comments/remove' and method == 'POST':
            return remove_comment(body, user_id)
        elif path == '/profile' and method == 'GET':
            return get_profile(params, user_id)
        elif path == '/profile/update' and method == 'POST':
            return update_profile(body, user_id)
        elif path == '/profile/avatar' and method == 'POST':
            return update_avatar(body, user_id)
        elif path == '/profile/avatar/remove' and method == 'POST':
            return remove_avatar(body, user_id)
        elif path == '/follow' and method == 'POST':
            return follow_user(body, user_id)
        elif path == '/unfollow' and method == 'POST':
            return unfollow_user(body, user_id)
        elif path == '/follow/request' and method == 'POST':
            return handle_follow_request(body, user_id)
        elif path == '/followers' and method == 'GET':
            return get_followers(params, user_id)
        elif path == '/following' and method == 'GET':
            return get_following(params, user_id)
        elif path == '/friends' and method == 'GET':
            return get_friends(params, user_id)
        elif path == '/search' and method == 'GET':
            return search_users(params)
        elif path == '/messages' and method == 'GET':
            return get_messages(params, user_id)
        elif path == '/messages/chats' and method == 'GET':
            return get_chats(user_id)
        elif path == '/messages/send' and method == 'POST':
            return send_message(body, user_id)
        elif path == '/messages/read' and method == 'POST':
            return mark_read(body, user_id)
        elif path == '/messages/edit' and method == 'POST':
            return edit_message(body, user_id)
        elif path == '/messages/pin' and method == 'POST':
            return pin_message(body, user_id)
        elif path == '/messages/hide' and method == 'POST':
            return hide_message(body, user_id)
        elif path == '/notifications' and method == 'GET':
            return get_notifications(user_id)
        elif path == '/notifications/read' and method == 'POST':
            return read_notifications(user_id)
        elif path == '/stories' and method == 'GET':
            return get_stories(params, user_id)
        elif path == '/stories' and method == 'POST':
            return create_story(body, user_id)
        elif path == '/stories/view' and method == 'POST':
            return view_story(body, user_id)
        elif path == '/report' and method == 'POST':
            return create_report(body, user_id)
        elif path == '/verification/request' and method == 'POST':
            return request_verification(body, user_id)
        elif path == '/appeal' and method == 'POST':
            return create_appeal(body, user_id)
        elif path == '/block' and method == 'POST':
            return block_user(body, user_id)
        elif path == '/unblock' and method == 'POST':
            return unblock_user(body, user_id)
        elif path == '/user/likes' and method == 'GET':
            return get_user_likes(params, user_id)
        elif path == '/user/reposts' and method == 'GET':
            return get_user_reposts(params, user_id)
        elif path == '/admin/block' and method == 'POST':
            return admin_block(body, user_id)
        elif path == '/admin/reports' and method == 'GET':
            return admin_reports(user_id)
        elif path == '/admin/report/handle' and method == 'POST':
            return admin_handle_report(body, user_id)
        elif path == '/admin/verifications' and method == 'GET':
            return admin_verifications(user_id)
        elif path == '/admin/verify' and method == 'POST':
            return admin_verify(body, user_id)
        elif path == '/admin/appeals' and method == 'GET':
            return admin_appeals(user_id)
        elif path == '/admin/appeal/handle' and method == 'POST':
            return admin_handle_appeal(body, user_id)
        elif path == '/admin/releases' and method == 'POST':
            return admin_add_release(body, user_id)
        elif path == '/admin/stats' and method == 'GET':
            return admin_stats(user_id)
        elif path == '/releases' and method == 'GET':
            return get_releases(params)
        elif path == '/settings/theme' and method == 'POST':
            return update_theme(body, user_id)
        elif path == '/settings/privacy' and method == 'POST':
            return update_privacy(body, user_id)
        elif path == '/account/remove' and method == 'POST':
            return remove_account(user_id)
        else:
            return resp(200, {'status': 'ok', 'version': '1.0'})
    except Exception as e:
        return resp(500, {'error': str(e)})

def register(body):
    username = body.get('username', '').strip().lower()
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')
    if not username or not email or not password:
        return resp(400, {'error': 'Заполните все поля'})
    if len(username) < 3:
        return resp(400, {'error': 'Username минимум 3 символа'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id FROM users WHERE username = '%s' OR email = '%s'" % (username, email))
    if cur.fetchone():
        conn.close()
        return resp(400, {'error': 'Username или email уже заняты'})
    pw_hash = hash_pw(password)
    cur.execute("INSERT INTO users (username, email, password_hash, display_name) VALUES ('%s', '%s', '%s', '%s') RETURNING id" % (username, email, pw_hash, username))
    user = cur.fetchone()
    conn.commit()
    token = secrets.token_hex(32)
    tokens[token] = user['id']
    conn.close()
    return resp(200, {'token': token, 'user_id': user['id']})

def login(body):
    email = body.get('email', '').strip().lower()
    password = body.get('password', '')
    if not email or not password:
        return resp(400, {'error': 'Введите email и пароль'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, password_hash, is_blocked, block_reason, role FROM users WHERE email = '%s'" % email)
    user = cur.fetchone()
    if not user:
        conn.close()
        return resp(400, {'error': 'Неверный email или пароль'})
    if user['password_hash'] != hash_pw(password) and user['password_hash'] != password:
        conn.close()
        return resp(400, {'error': 'Неверный email или пароль'})
    conn.close()
    if user['is_blocked']:
        token = secrets.token_hex(32)
        tokens[token] = user['id']
        return resp(200, {'token': token, 'user_id': user['id'], 'blocked': True, 'block_reason': user['block_reason']})
    token = secrets.token_hex(32)
    tokens[token] = user['id']
    return resp(200, {'token': token, 'user_id': user['id']})

def get_me(user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, username, email, display_name, bio, avatar_url, is_private, is_verified, is_artist_verified, is_admin, is_blocked, block_reason, role, theme, links, privacy_settings, avatars, created_at FROM users WHERE id = %s" % user_id)
    user = cur.fetchone()
    conn.close()
    if not user:
        return resp(404, {'error': 'Пользователь не найден'})
    return resp(200, {'user': user})

def get_feed(params, user_id):
    page = int(params.get('page', '0'))
    limit = 20
    offset = page * limit
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    blocked_ids = get_blocked_ids(cur, user_id) if user_id else []
    blocked_clause = ""
    if blocked_ids:
        blocked_clause = " AND p.user_id NOT IN (%s)" % ','.join(str(i) for i in blocked_ids)
    cur.execute("""
        SELECT p.*, u.username, u.display_name, u.avatar_url, u.is_verified, u.is_artist_verified,
        op.content as original_content, op.media_urls as original_media,
        ou.username as original_username, ou.display_name as original_display_name, ou.avatar_url as original_avatar, ou.is_verified as original_verified
        FROM posts p
        JOIN users u ON p.user_id = u.id
        LEFT JOIN posts op ON p.original_post_id = op.id
        LEFT JOIN users ou ON op.user_id = ou.id
        WHERE p.is_removed = FALSE AND u.is_blocked = FALSE %s
        ORDER BY p.created_at DESC
        LIMIT %s OFFSET %s
    """ % (blocked_clause, limit, offset))
    posts = cur.fetchall()
    if user_id:
        post_ids = [p['id'] for p in posts]
        if post_ids:
            cur.execute("SELECT post_id FROM likes WHERE user_id = %s AND post_id IN (%s)" % (user_id, ','.join(str(i) for i in post_ids)))
            liked = {r['post_id'] for r in cur.fetchall()}
            for p in posts:
                p['is_liked'] = p['id'] in liked
    conn.close()
    return resp(200, {'posts': posts})

def create_post(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    content = body.get('content', '').strip()
    media_urls = body.get('media_urls', [])
    if not content and not media_urls:
        return resp(400, {'error': 'Пост не может быть пустым'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("INSERT INTO posts (user_id, content, media_urls) VALUES (%s, '%s', '%s') RETURNING *" % (user_id, content.replace("'", "''"), json.dumps(media_urls)))
    post = cur.fetchone()
    conn.commit()
    cur.execute("SELECT username, display_name, avatar_url, is_verified, is_artist_verified FROM users WHERE id = %s" % user_id)
    u = cur.fetchone()
    post.update(u)
    conn.close()
    return resp(200, {'post': post})

def view_post(body):
    post_id = body.get('post_id')
    if post_id:
        conn = get_db()
        cur = conn.cursor()
        cur.execute("UPDATE posts SET views_count = views_count + 1 WHERE id = %s" % post_id)
        conn.commit()
        conn.close()
    return resp(200, {'ok': True})

def like_post(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    post_id = body.get('post_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id FROM likes WHERE user_id = %s AND post_id = %s AND comment_id IS NULL" % (user_id, post_id))
    existing = cur.fetchone()
    if existing:
        cur.execute("UPDATE likes SET post_id = NULL WHERE id = %s" % existing['id'])
        cur.execute("UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = %s" % post_id)
        liked = False
    else:
        cur.execute("INSERT INTO likes (user_id, post_id) VALUES (%s, %s)" % (user_id, post_id))
        cur.execute("UPDATE posts SET likes_count = likes_count + 1 WHERE id = %s" % post_id)
        cur.execute("SELECT user_id FROM posts WHERE id = %s" % post_id)
        post_owner = cur.fetchone()
        if post_owner and post_owner['user_id'] != user_id:
            cur.execute("INSERT INTO notifications (user_id, from_user_id, type, post_id) VALUES (%s, %s, 'like', %s)" % (post_owner['user_id'], user_id, post_id))
        liked = True
    conn.commit()
    cur.execute("SELECT likes_count FROM posts WHERE id = %s" % post_id)
    cnt = cur.fetchone()
    conn.close()
    return resp(200, {'liked': liked, 'likes_count': cnt['likes_count']})

def repost(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    post_id = body.get('post_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM posts WHERE id = %s" % post_id)
    orig = cur.fetchone()
    if not orig:
        conn.close()
        return resp(404, {'error': 'Пост не найден'})
    real_id = orig['original_post_id'] if orig['is_repost'] else orig['id']
    cur.execute("INSERT INTO posts (user_id, content, is_repost, original_post_id) VALUES (%s, '', TRUE, %s) RETURNING *" % (user_id, real_id))
    post = cur.fetchone()
    cur.execute("UPDATE posts SET reposts_count = reposts_count + 1 WHERE id = %s" % real_id)
    conn.commit()
    conn.close()
    return resp(200, {'post': post})

def remove_post(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    post_id = body.get('post_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT user_id FROM posts WHERE id = %s" % post_id)
    post = cur.fetchone()
    if not post:
        conn.close()
        return resp(404, {'error': 'Пост не найден'})
    cur.execute("SELECT is_admin FROM users WHERE id = %s" % user_id)
    admin = cur.fetchone()
    if post['user_id'] != user_id and not admin['is_admin']:
        conn.close()
        return resp(403, {'error': 'Нет прав'})
    cur.execute("UPDATE posts SET is_removed = TRUE WHERE id = %s" % post_id)
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def get_post(params, user_id):
    post_id = params.get('id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT p.*, u.username, u.display_name, u.avatar_url, u.is_verified, u.is_artist_verified
        FROM posts p JOIN users u ON p.user_id = u.id
        WHERE p.id = %s AND p.is_removed = FALSE
    """ % post_id)
    post = cur.fetchone()
    if not post:
        conn.close()
        return resp(404, {'error': 'Пост не найден'})
    if user_id:
        cur.execute("SELECT id FROM likes WHERE user_id = %s AND post_id = %s AND comment_id IS NULL" % (user_id, post_id))
        post['is_liked'] = cur.fetchone() is not None
    conn.close()
    return resp(200, {'post': post})

def get_comments(params, user_id):
    post_id = params.get('post_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT c.*, u.username, u.display_name, u.avatar_url, u.is_verified, u.is_artist_verified
        FROM comments c JOIN users u ON c.user_id = u.id
        WHERE c.post_id = %s AND c.is_removed = FALSE
        ORDER BY c.is_pinned DESC, c.created_at ASC
    """ % post_id)
    comments = cur.fetchall()
    if user_id:
        cids = [c['id'] for c in comments]
        if cids:
            cur.execute("SELECT comment_id FROM likes WHERE user_id = %s AND comment_id IN (%s)" % (user_id, ','.join(str(i) for i in cids)))
            liked = {r['comment_id'] for r in cur.fetchall()}
            for c in comments:
                c['is_liked'] = c['id'] in liked
    conn.close()
    return resp(200, {'comments': comments})

def add_comment(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    post_id = body.get('post_id')
    content = body.get('content', '').strip()
    parent_id = body.get('parent_id')
    if not content:
        return resp(400, {'error': 'Комментарий пуст'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    parent_clause = "NULL" if not parent_id else str(parent_id)
    cur.execute("INSERT INTO comments (post_id, user_id, parent_id, content) VALUES (%s, %s, %s, '%s') RETURNING *" % (post_id, user_id, parent_clause, content.replace("'", "''")))
    comment = cur.fetchone()
    cur.execute("UPDATE posts SET comments_count = comments_count + 1 WHERE id = %s" % post_id)
    cur.execute("SELECT user_id FROM posts WHERE id = %s" % post_id)
    owner = cur.fetchone()
    if owner and owner['user_id'] != user_id:
        cur.execute("INSERT INTO notifications (user_id, from_user_id, type, post_id, comment_id) VALUES (%s, %s, 'comment', %s, %s)" % (owner['user_id'], user_id, post_id, comment['id']))
    conn.commit()
    cur.execute("SELECT username, display_name, avatar_url, is_verified, is_artist_verified FROM users WHERE id = %s" % user_id)
    u = cur.fetchone()
    comment.update(u)
    conn.close()
    return resp(200, {'comment': comment})

def like_comment(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    comment_id = body.get('comment_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id FROM likes WHERE user_id = %s AND comment_id = %s" % (user_id, comment_id))
    existing = cur.fetchone()
    if existing:
        cur.execute("UPDATE likes SET comment_id = NULL WHERE id = %s" % existing['id'])
        cur.execute("UPDATE comments SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = %s" % comment_id)
        liked = False
    else:
        cur.execute("INSERT INTO likes (user_id, comment_id) VALUES (%s, %s)" % (user_id, comment_id))
        cur.execute("UPDATE comments SET likes_count = likes_count + 1 WHERE id = %s" % comment_id)
        cur.execute("SELECT user_id, post_id FROM comments WHERE id = %s" % comment_id)
        c = cur.fetchone()
        cur.execute("SELECT user_id FROM posts WHERE id = %s" % c['post_id'])
        post_owner = cur.fetchone()
        if post_owner and post_owner['user_id'] == user_id and c['user_id'] != user_id:
            cur.execute("UPDATE comments SET is_author_liked = TRUE WHERE id = %s" % comment_id)
        liked = True
    conn.commit()
    cur.execute("SELECT likes_count, is_author_liked FROM comments WHERE id = %s" % comment_id)
    cnt = cur.fetchone()
    conn.close()
    return resp(200, {'liked': liked, 'likes_count': cnt['likes_count'], 'is_author_liked': cnt['is_author_liked']})

def pin_comment(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    comment_id = body.get('comment_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT c.*, p.user_id as post_owner FROM comments c JOIN posts p ON c.post_id = p.id WHERE c.id = %s" % comment_id)
    c = cur.fetchone()
    if not c or c['post_owner'] != user_id:
        conn.close()
        return resp(403, {'error': 'Нет прав'})
    new_pin = not c['is_pinned']
    cur.execute("UPDATE comments SET is_pinned = %s WHERE id = %s" % (new_pin, comment_id))
    conn.commit()
    conn.close()
    return resp(200, {'pinned': new_pin})

def remove_comment(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    comment_id = body.get('comment_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT c.user_id, c.post_id, p.user_id as post_owner FROM comments c JOIN posts p ON c.post_id = p.id WHERE c.id = %s" % comment_id)
    c = cur.fetchone()
    if not c:
        conn.close()
        return resp(404, {'error': 'Комментарий не найден'})
    cur.execute("SELECT is_admin FROM users WHERE id = %s" % user_id)
    admin = cur.fetchone()
    if c['user_id'] != user_id and c['post_owner'] != user_id and not admin['is_admin']:
        conn.close()
        return resp(403, {'error': 'Нет прав'})
    cur.execute("UPDATE comments SET is_removed = TRUE WHERE id = %s" % comment_id)
    cur.execute("UPDATE posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = %s" % c['post_id'])
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def get_profile(params, user_id):
    username = params.get('username', '')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, username, display_name, bio, avatar_url, is_private, is_verified, is_artist_verified, is_blocked, is_admin, role, links, privacy_settings, avatars, created_at FROM users WHERE username = '%s'" % username)
    user = cur.fetchone()
    if not user:
        conn.close()
        return resp(404, {'error': 'Аккаунт не найден или был удалён'})
    if user['is_blocked'] and (not user_id or user_id != user['id']):
        conn.close()
        return resp(404, {'error': 'Аккаунт не найден или был удалён'})
    cur.execute("SELECT COUNT(*) as cnt FROM follows WHERE following_id = %s AND status = 'active'" % user['id'])
    user['followers_count'] = cur.fetchone()['cnt']
    cur.execute("SELECT COUNT(*) as cnt FROM follows WHERE follower_id = %s AND status = 'active'" % user['id'])
    user['following_count'] = cur.fetchone()['cnt']
    cur.execute("SELECT COUNT(*) as cnt FROM posts WHERE user_id = %s AND is_removed = FALSE" % user['id'])
    user['posts_count'] = cur.fetchone()['cnt']
    if user_id:
        cur.execute("SELECT status FROM follows WHERE follower_id = %s AND following_id = %s" % (user_id, user['id']))
        f = cur.fetchone()
        user['follow_status'] = f['status'] if f else 'none'
        cur.execute("SELECT id FROM user_blocks WHERE blocker_id = %s AND blocked_id = %s" % (user_id, user['id']))
        user['is_blocked_by_me'] = cur.fetchone() is not None
    posts = []
    can_see = True
    if user['is_private'] and user_id != user['id']:
        if user_id:
            cur.execute("SELECT status FROM follows WHERE follower_id = %s AND following_id = %s AND status = 'active'" % (user_id, user['id']))
            if not cur.fetchone():
                can_see = False
        else:
            can_see = False
    if can_see:
        cur.execute("""
            SELECT p.*, u.username, u.display_name, u.avatar_url, u.is_verified, u.is_artist_verified
            FROM posts p JOIN users u ON p.user_id = u.id
            WHERE p.user_id = %s AND p.is_removed = FALSE ORDER BY p.created_at DESC LIMIT 50
        """ % user['id'])
        posts = cur.fetchall()
    user['can_see_posts'] = can_see
    conn.close()
    return resp(200, {'profile': user, 'posts': posts})

def update_profile(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    fields = []
    if 'display_name' in body:
        fields.append("display_name = '%s'" % body['display_name'].replace("'", "''"))
    if 'bio' in body:
        fields.append("bio = '%s'" % body['bio'].replace("'", "''"))
    if 'is_private' in body:
        fields.append("is_private = %s" % body['is_private'])
    if 'links' in body:
        fields.append("links = '%s'" % json.dumps(body['links']).replace("'", "''"))
    if fields:
        cur.execute("UPDATE users SET %s, updated_at = NOW() WHERE id = %s" % (', '.join(fields), user_id))
        conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def update_avatar(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    avatar_url = body.get('avatar_url', '')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT avatars FROM users WHERE id = %s" % user_id)
    user = cur.fetchone()
    avatars = user['avatars'] if user['avatars'] else []
    if isinstance(avatars, str):
        avatars = json.loads(avatars)
    if avatar_url and avatar_url not in avatars:
        avatars.append(avatar_url)
    cur.execute("UPDATE users SET avatar_url = '%s', avatars = '%s' WHERE id = %s" % (avatar_url.replace("'", "''"), json.dumps(avatars).replace("'", "''"), user_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True, 'avatars': avatars})

def remove_avatar(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    avatar_url = body.get('avatar_url', '')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT avatars, avatar_url FROM users WHERE id = %s" % user_id)
    user = cur.fetchone()
    avatars = user['avatars'] if user['avatars'] else []
    if isinstance(avatars, str):
        avatars = json.loads(avatars)
    if avatar_url in avatars:
        avatars.remove(avatar_url)
    new_main = avatars[-1] if avatars else ''
    cur.execute("UPDATE users SET avatar_url = '%s', avatars = '%s' WHERE id = %s" % (new_main.replace("'", "''"), json.dumps(avatars).replace("'", "''"), user_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True, 'avatars': avatars, 'avatar_url': new_main})

def follow_user(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    target_id = body.get('user_id')
    if user_id == target_id:
        return resp(400, {'error': 'Нельзя подписаться на себя'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT is_private FROM users WHERE id = %s" % target_id)
    target = cur.fetchone()
    if not target:
        conn.close()
        return resp(404, {'error': 'Пользователь не найден'})
    cur.execute("SELECT id, status FROM follows WHERE follower_id = %s AND following_id = %s" % (user_id, target_id))
    existing = cur.fetchone()
    if existing:
        conn.close()
        return resp(200, {'status': existing['status']})
    status = 'pending' if target['is_private'] else 'active'
    cur.execute("INSERT INTO follows (follower_id, following_id, status) VALUES (%s, %s, '%s')" % (user_id, target_id, status))
    if status == 'pending':
        cur.execute("INSERT INTO notifications (user_id, from_user_id, type) VALUES (%s, %s, 'follow_request')" % (target_id, user_id))
    else:
        cur.execute("INSERT INTO notifications (user_id, from_user_id, type) VALUES (%s, %s, 'follow')" % (target_id, user_id))
    conn.commit()
    conn.close()
    return resp(200, {'status': status})

def unfollow_user(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    target_id = body.get('user_id')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE follows SET status = 'removed' WHERE follower_id = %s AND following_id = %s" % (user_id, target_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def handle_follow_request(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    from_id = body.get('from_user_id')
    action = body.get('action')
    conn = get_db()
    cur = conn.cursor()
    if action == 'accept':
        cur.execute("UPDATE follows SET status = 'active' WHERE follower_id = %s AND following_id = %s AND status = 'pending'" % (from_id, user_id))
    else:
        cur.execute("UPDATE follows SET status = 'rejected' WHERE follower_id = %s AND following_id = %s AND status = 'pending'" % (from_id, user_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def get_followers(params, user_id):
    target_id = params.get('user_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_verified, u.is_artist_verified
        FROM follows f JOIN users u ON f.follower_id = u.id
        WHERE f.following_id = %s AND f.status = 'active'
    """ % target_id)
    conn.close()
    return resp(200, {'users': cur.fetchall()})

def get_following(params, user_id):
    target_id = params.get('user_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_verified, u.is_artist_verified
        FROM follows f JOIN users u ON f.following_id = u.id
        WHERE f.follower_id = %s AND f.status = 'active'
    """ % target_id)
    conn.close()
    return resp(200, {'users': cur.fetchall()})

def get_friends(params, user_id):
    target_id = params.get('user_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT u.id, u.username, u.display_name, u.avatar_url, u.is_verified, u.is_artist_verified
        FROM follows f1
        JOIN follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id
        JOIN users u ON f1.following_id = u.id
        WHERE f1.follower_id = %s AND f1.status = 'active' AND f2.status = 'active'
    """ % target_id)
    conn.close()
    return resp(200, {'users': cur.fetchall()})

def search_users(params):
    q = params.get('q', '').strip()
    if not q:
        return resp(200, {'users': []})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id, username, display_name, avatar_url, is_verified, is_artist_verified, is_blocked FROM users WHERE (username ILIKE '%%%s%%' OR display_name ILIKE '%%%s%%') AND is_blocked = FALSE LIMIT 30" % (q.replace("'", "''"), q.replace("'", "''")))
    conn.close()
    return resp(200, {'users': cur.fetchall()})

def get_messages(params, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    other_id = params.get('user_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT m.*, su.username as sender_username, su.display_name as sender_name, su.avatar_url as sender_avatar,
        ru.username as receiver_username, ru.display_name as receiver_name
        FROM messages m
        JOIN users su ON m.sender_id = su.id
        JOIN users ru ON m.receiver_id = ru.id
        WHERE ((m.sender_id = %s AND m.receiver_id = %s AND m.hidden_by_sender = FALSE)
            OR (m.sender_id = %s AND m.receiver_id = %s AND m.hidden_by_receiver = FALSE))
        ORDER BY m.created_at ASC LIMIT 200
    """ % (user_id, other_id, other_id, user_id))
    msgs = cur.fetchall()
    conn.close()
    return resp(200, {'messages': msgs})

def get_chats(user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT DISTINCT ON (other_id) other_id, content, created_at, is_read, sender_id FROM (
            SELECT receiver_id as other_id, content, created_at, is_read, sender_id FROM messages WHERE sender_id = %s AND hidden_by_sender = FALSE
            UNION ALL
            SELECT sender_id as other_id, content, created_at, is_read, sender_id FROM messages WHERE receiver_id = %s AND hidden_by_receiver = FALSE
        ) sub ORDER BY other_id, created_at DESC
    """ % (user_id, user_id))
    chats = cur.fetchall()
    if chats:
        uids = list(set(c['other_id'] for c in chats))
        cur.execute("SELECT id, username, display_name, avatar_url, is_verified, is_artist_verified FROM users WHERE id IN (%s)" % ','.join(str(i) for i in uids))
        users_map = {u['id']: u for u in cur.fetchall()}
        for c in chats:
            c['user'] = users_map.get(c['other_id'], {})
        for c in chats:
            cur.execute("SELECT COUNT(*) as cnt FROM messages WHERE sender_id = %s AND receiver_id = %s AND is_read = FALSE" % (c['other_id'], user_id))
            c['unread_count'] = cur.fetchone()['cnt']
    chats.sort(key=lambda x: x['created_at'], reverse=True)
    conn.close()
    return resp(200, {'chats': chats})

def send_message(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    receiver_id = body.get('receiver_id')
    content = body.get('content', '').strip()
    reply_to_id = body.get('reply_to_id')
    if not content:
        return resp(400, {'error': 'Сообщение пустое'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT privacy_settings FROM users WHERE id = %s" % receiver_id)
    receiver = cur.fetchone()
    if receiver:
        ps = receiver['privacy_settings']
        if isinstance(ps, str):
            ps = json.loads(ps)
        if ps.get('allow_messages') == 'nobody':
            conn.close()
            return resp(403, {'error': 'Пользователь отключил сообщения'})
    reply_clause = "NULL" if not reply_to_id else str(reply_to_id)
    cur.execute("INSERT INTO messages (sender_id, receiver_id, content, reply_to_id) VALUES (%s, %s, '%s', %s) RETURNING *" % (user_id, receiver_id, content.replace("'", "''"), reply_clause))
    msg = cur.fetchone()
    cur.execute("INSERT INTO notifications (user_id, from_user_id, type) VALUES (%s, %s, 'message')" % (receiver_id, user_id))
    conn.commit()
    conn.close()
    return resp(200, {'message': msg})

def mark_read(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    other_id = body.get('user_id')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE messages SET is_read = TRUE WHERE sender_id = %s AND receiver_id = %s AND is_read = FALSE" % (other_id, user_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def edit_message(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    msg_id = body.get('message_id')
    content = body.get('content', '').strip()
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE messages SET content = '%s', is_edited = TRUE WHERE id = %s AND sender_id = %s" % (content.replace("'", "''"), msg_id, user_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def pin_message(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    msg_id = body.get('message_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT is_pinned FROM messages WHERE id = %s" % msg_id)
    m = cur.fetchone()
    new_pin = not m['is_pinned'] if m else False
    cur.execute("UPDATE messages SET is_pinned = %s WHERE id = %s" % (new_pin, msg_id))
    conn.commit()
    conn.close()
    return resp(200, {'pinned': new_pin})

def hide_message(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    msg_id = body.get('message_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT sender_id FROM messages WHERE id = %s" % msg_id)
    m = cur.fetchone()
    if m and m['sender_id'] == user_id:
        cur.execute("UPDATE messages SET hidden_by_sender = TRUE WHERE id = %s" % msg_id)
    else:
        cur.execute("UPDATE messages SET hidden_by_receiver = TRUE WHERE id = %s" % msg_id)
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def get_notifications(user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT n.*, u.username, u.display_name, u.avatar_url
        FROM notifications n JOIN users u ON n.from_user_id = u.id
        WHERE n.user_id = %s ORDER BY n.created_at DESC LIMIT 50
    """ % user_id)
    notifs = cur.fetchall()
    cur.execute("SELECT id, follower_id FROM follows WHERE following_id = %s AND status = 'pending'" % user_id)
    pending = cur.fetchall()
    if pending:
        fids = [p['follower_id'] for p in pending]
        cur.execute("SELECT id, username, display_name, avatar_url FROM users WHERE id IN (%s)" % ','.join(str(i) for i in fids))
        pending_users = cur.fetchall()
    else:
        pending_users = []
    conn.close()
    return resp(200, {'notifications': notifs, 'pending_requests': pending_users})

def read_notifications(user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE notifications SET is_read = TRUE WHERE user_id = %s" % user_id)
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def get_stories(params, user_id):
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("""
        SELECT s.*, u.username, u.display_name, u.avatar_url, u.is_verified
        FROM stories s JOIN users u ON s.user_id = u.id
        WHERE s.expires_at > NOW()
        ORDER BY s.created_at DESC
    """)
    stories = cur.fetchall()
    filtered = []
    for s in stories:
        if s['visibility'] == 'all':
            filtered.append(s)
        elif user_id:
            if s['user_id'] == user_id:
                filtered.append(s)
            elif s['visibility'] == 'followers':
                cur.execute("SELECT id FROM follows WHERE follower_id = %s AND following_id = %s AND status = 'active'" % (user_id, s['user_id']))
                if cur.fetchone():
                    filtered.append(s)
            elif s['visibility'] == 'mutual':
                cur.execute("SELECT id FROM follows f1 JOIN follows f2 ON f1.follower_id = f2.following_id AND f1.following_id = f2.follower_id WHERE f1.follower_id = %s AND f1.following_id = %s AND f1.status = 'active' AND f2.status = 'active'" % (user_id, s['user_id']))
                if cur.fetchone():
                    filtered.append(s)
    conn.close()
    return resp(200, {'stories': filtered})

def create_story(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    media_url = body.get('media_url', '')
    visibility = body.get('visibility', 'all')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("INSERT INTO stories (user_id, media_url, visibility) VALUES (%s, '%s', '%s') RETURNING *" % (user_id, media_url.replace("'", "''"), visibility))
    story = cur.fetchone()
    conn.commit()
    conn.close()
    return resp(200, {'story': story})

def view_story(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    story_id = body.get('story_id')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO story_views (story_id, viewer_id) VALUES (%s, %s) ON CONFLICT DO NOTHING" % (story_id, user_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def create_report(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    reason = body.get('reason', '').strip()
    reported_user_id = body.get('user_id')
    reported_post_id = body.get('post_id')
    conn = get_db()
    cur = conn.cursor()
    user_clause = str(reported_user_id) if reported_user_id else "NULL"
    post_clause = str(reported_post_id) if reported_post_id else "NULL"
    cur.execute("INSERT INTO reports (reporter_id, reported_user_id, reported_post_id, reason) VALUES (%s, %s, %s, '%s')" % (user_id, user_clause, post_clause, reason.replace("'", "''")))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def request_verification(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    v_type = body.get('type', 'standard')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT id FROM verification_requests WHERE user_id = %s AND status = 'pending'" % user_id)
    if cur.fetchone():
        conn.close()
        return resp(400, {'error': 'Заявка уже подана'})
    cur.execute("INSERT INTO verification_requests (user_id, type) VALUES (%s, '%s') RETURNING *" % (user_id, v_type))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def create_appeal(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    reason = body.get('reason', '')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO appeals (user_id, reason) VALUES (%s, '%s')" % (user_id, reason.replace("'", "''")))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def block_user(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    blocked_id = body.get('user_id')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (%s, %s) ON CONFLICT DO NOTHING" % (user_id, blocked_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def unblock_user(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    blocked_id = body.get('user_id')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE user_blocks SET blocker_id = NULL WHERE blocker_id = %s AND blocked_id = %s" % (user_id, blocked_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def get_user_likes(params, user_id):
    target_id = params.get('user_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT privacy_settings FROM users WHERE id = %s" % target_id)
    u = cur.fetchone()
    ps = u['privacy_settings'] if u else {}
    if isinstance(ps, str):
        ps = json.loads(ps)
    if ps.get('show_likes') == 'nobody' and int(target_id) != user_id:
        conn.close()
        return resp(200, {'posts': [], 'hidden': True})
    cur.execute("""
        SELECT p.*, u.username, u.display_name, u.avatar_url, u.is_verified
        FROM likes l JOIN posts p ON l.post_id = p.id JOIN users u ON p.user_id = u.id
        WHERE l.user_id = %s AND l.post_id IS NOT NULL AND p.is_removed = FALSE
        ORDER BY l.created_at DESC LIMIT 50
    """ % target_id)
    posts = cur.fetchall()
    conn.close()
    return resp(200, {'posts': posts, 'hidden': False})

def get_user_reposts(params, user_id):
    target_id = params.get('user_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT privacy_settings FROM users WHERE id = %s" % target_id)
    u = cur.fetchone()
    ps = u['privacy_settings'] if u else {}
    if isinstance(ps, str):
        ps = json.loads(ps)
    if ps.get('show_reposts') == 'nobody' and int(target_id) != user_id:
        conn.close()
        return resp(200, {'posts': [], 'hidden': True})
    cur.execute("""
        SELECT p.*, u.username, u.display_name, u.avatar_url, u.is_verified,
        op.content as original_content, op.media_urls as original_media, ou.username as original_username
        FROM posts p JOIN users u ON p.user_id = u.id
        LEFT JOIN posts op ON p.original_post_id = op.id LEFT JOIN users ou ON op.user_id = ou.id
        WHERE p.user_id = %s AND p.is_repost = TRUE AND p.is_removed = FALSE
        ORDER BY p.created_at DESC LIMIT 50
    """ % target_id)
    posts = cur.fetchall()
    conn.close()
    return resp(200, {'posts': posts, 'hidden': False})

def get_blocked_ids(cur, user_id):
    if not user_id:
        return []
    cur.execute("SELECT blocked_id FROM user_blocks WHERE blocker_id = %s AND blocked_id IS NOT NULL" % user_id)
    return [r['blocked_id'] for r in cur.fetchall()]

def admin_block(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT is_admin FROM users WHERE id = %s" % user_id)
    if not cur.fetchone()['is_admin']:
        conn.close()
        return resp(403, {'error': 'Нет прав'})
    username = body.get('username', '').strip().lower()
    reason = body.get('reason', 'Нарушение правил сообщества')
    cur.execute("UPDATE users SET is_blocked = TRUE, block_reason = '%s' WHERE username = '%s'" % (reason.replace("'", "''"), username))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def admin_reports(user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT is_admin FROM users WHERE id = %s" % user_id)
    if not cur.fetchone()['is_admin']:
        conn.close()
        return resp(403, {'error': 'Нет прав'})
    cur.execute("""
        SELECT r.*, ru.username as reporter_username,
        tu.username as reported_username, p.content as post_content
        FROM reports r
        LEFT JOIN users ru ON r.reporter_id = ru.id
        LEFT JOIN users tu ON r.reported_user_id = tu.id
        LEFT JOIN posts p ON r.reported_post_id = p.id
        WHERE r.status = 'pending'
        ORDER BY r.created_at DESC
    """)
    conn.close()
    return resp(200, {'reports': cur.fetchall()})

def admin_handle_report(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT is_admin FROM users WHERE id = %s" % user_id)
    if not cur.fetchone()['is_admin']:
        conn.close()
        return resp(403, {'error': 'Нет прав'})
    report_id = body.get('report_id')
    action = body.get('action')
    cur.execute("SELECT * FROM reports WHERE id = %s" % report_id)
    report = cur.fetchone()
    if action == 'accept':
        if report['reported_post_id']:
            cur.execute("UPDATE posts SET is_removed = TRUE WHERE id = %s" % report['reported_post_id'])
        if report['reported_user_id']:
            cur.execute("UPDATE users SET is_blocked = TRUE, block_reason = 'Удалён по жалобе' WHERE id = %s" % report['reported_user_id'])
    cur.execute("UPDATE reports SET status = '%s' WHERE id = %s" % (action, report_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def admin_verifications(user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT is_admin FROM users WHERE id = %s" % user_id)
    if not cur.fetchone()['is_admin']:
        conn.close()
        return resp(403, {'error': 'Нет прав'})
    cur.execute("""
        SELECT v.*, u.username, u.display_name, u.avatar_url
        FROM verification_requests v JOIN users u ON v.user_id = u.id
        WHERE v.status = 'pending'
        ORDER BY v.created_at DESC
    """)
    conn.close()
    return resp(200, {'verifications': cur.fetchall()})

def admin_verify(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT is_admin FROM users WHERE id = %s" % user_id)
    if not cur.fetchone()['is_admin']:
        conn.close()
        return resp(403, {'error': 'Нет прав'})
    req_id = body.get('request_id')
    action = body.get('action')
    cur.execute("SELECT * FROM verification_requests WHERE id = %s" % req_id)
    req = cur.fetchone()
    if action == 'accept':
        if req['type'] == 'artist':
            cur.execute("UPDATE users SET is_artist_verified = TRUE WHERE id = %s" % req['user_id'])
        else:
            cur.execute("UPDATE users SET is_verified = TRUE WHERE id = %s" % req['user_id'])
    cur.execute("UPDATE verification_requests SET status = '%s' WHERE id = %s" % (action, req_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def admin_appeals(user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT is_admin FROM users WHERE id = %s" % user_id)
    if not cur.fetchone()['is_admin']:
        conn.close()
        return resp(403, {'error': 'Нет прав'})
    cur.execute("""
        SELECT a.*, u.username, u.display_name, u.avatar_url
        FROM appeals a JOIN users u ON a.user_id = u.id
        WHERE a.status = 'pending'
        ORDER BY a.created_at DESC
    """)
    conn.close()
    return resp(200, {'appeals': cur.fetchall()})

def admin_handle_appeal(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT is_admin FROM users WHERE id = %s" % user_id)
    if not cur.fetchone()['is_admin']:
        conn.close()
        return resp(403, {'error': 'Нет прав'})
    appeal_id = body.get('appeal_id')
    action = body.get('action')
    cur.execute("SELECT user_id FROM appeals WHERE id = %s" % appeal_id)
    appeal = cur.fetchone()
    if action == 'accept' and appeal:
        cur.execute("UPDATE users SET is_blocked = FALSE, block_reason = '' WHERE id = %s" % appeal['user_id'])
    cur.execute("UPDATE appeals SET status = '%s' WHERE id = %s" % (action, appeal_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def admin_add_release(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT is_admin FROM users WHERE id = %s" % user_id)
    if not cur.fetchone()['is_admin']:
        conn.close()
        return resp(403, {'error': 'Нет прав'})
    username = body.get('username', '').strip()
    title = body.get('title', '').strip()
    artist = body.get('artist', '').strip()
    cover_url = body.get('cover_url', '')
    cur.execute("SELECT id FROM users WHERE username = '%s'" % username)
    target = cur.fetchone()
    if not target:
        conn.close()
        return resp(404, {'error': 'Пользователь не найден'})
    cur.execute("INSERT INTO releases (user_id, title, artist, cover_url) VALUES (%s, '%s', '%s', '%s') RETURNING *" % (target['id'], title.replace("'", "''"), artist.replace("'", "''"), cover_url.replace("'", "''")))
    release = cur.fetchone()
    conn.commit()
    conn.close()
    return resp(200, {'release': release})

def admin_stats(user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT is_admin FROM users WHERE id = %s" % user_id)
    if not cur.fetchone()['is_admin']:
        conn.close()
        return resp(403, {'error': 'Нет прав'})
    cur.execute("SELECT COUNT(*) as cnt FROM users WHERE is_blocked = FALSE")
    users_count = cur.fetchone()['cnt']
    cur.execute("SELECT COUNT(*) as cnt FROM posts WHERE is_removed = FALSE")
    posts_count = cur.fetchone()['cnt']
    cur.execute("SELECT COUNT(*) as cnt FROM reports WHERE status = 'pending'")
    reports_count = cur.fetchone()['cnt']
    cur.execute("SELECT COUNT(*) as cnt FROM verification_requests WHERE status = 'pending'")
    verif_count = cur.fetchone()['cnt']
    cur.execute("SELECT COUNT(*) as cnt FROM appeals WHERE status = 'pending'")
    appeals_count = cur.fetchone()['cnt']
    conn.close()
    return resp(200, {'users': users_count, 'posts': posts_count, 'reports': reports_count, 'verifications': verif_count, 'appeals': appeals_count})

def get_releases(params):
    user_id = params.get('user_id')
    conn = get_db()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM releases WHERE user_id = %s ORDER BY created_at DESC" % user_id)
    conn.close()
    return resp(200, {'releases': cur.fetchall()})

def update_theme(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    theme = body.get('theme', 'dark-green')
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET theme = '%s' WHERE id = %s" % (theme, user_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def update_privacy(body, user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    settings = body.get('settings', {})
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET privacy_settings = '%s' WHERE id = %s" % (json.dumps(settings).replace("'", "''"), user_id))
    conn.commit()
    conn.close()
    return resp(200, {'ok': True})

def remove_account(user_id):
    if not user_id:
        return resp(401, {'error': 'Не авторизован'})
    conn = get_db()
    cur = conn.cursor()
    cur.execute("UPDATE users SET is_blocked = TRUE, block_reason = 'Аккаунт удалён пользователем', username = username || '_removed_' || '%s' WHERE id = %s" % (int(time.time()), user_id))
    conn.commit()
    conn.close()
    global tokens
    tokens = {k: v for k, v in tokens.items() if v != user_id}
    return resp(200, {'ok': True})
