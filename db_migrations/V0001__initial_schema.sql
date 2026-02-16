
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    is_private BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    is_artist_verified BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason TEXT DEFAULT '',
    role VARCHAR(20) DEFAULT 'user',
    theme VARCHAR(30) DEFAULT 'dark-green',
    links JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{"show_likes": "all", "show_reposts": "all", "show_followers": "all", "show_following": "all", "show_friends": "all", "allow_messages": "all"}',
    avatars JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    media_urls JSONB DEFAULT '[]',
    is_repost BOOLEAN DEFAULT FALSE,
    original_post_id INTEGER,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    reposts_count INTEGER DEFAULT 0,
    is_removed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    post_id INTEGER REFERENCES posts(id),
    user_id INTEGER REFERENCES users(id),
    parent_id INTEGER,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_author_liked BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_removed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    post_id INTEGER,
    comment_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE follows (
    id SERIAL PRIMARY KEY,
    follower_id INTEGER REFERENCES users(id),
    following_id INTEGER REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id),
    receiver_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    hidden_by_sender BOOLEAN DEFAULT FALSE,
    hidden_by_receiver BOOLEAN DEFAULT FALSE,
    reply_to_id INTEGER,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE stories (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    media_url TEXT NOT NULL,
    visibility VARCHAR(20) DEFAULT 'all',
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE TABLE story_views (
    id SERIAL PRIMARY KEY,
    story_id INTEGER REFERENCES stories(id),
    viewer_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(story_id, viewer_id)
);

CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    from_user_id INTEGER REFERENCES users(id),
    type VARCHAR(30) NOT NULL,
    post_id INTEGER,
    comment_id INTEGER,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reports (
    id SERIAL PRIMARY KEY,
    reporter_id INTEGER,
    reported_user_id INTEGER,
    reported_post_id INTEGER,
    reason TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE verification_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(20) NOT NULL DEFAULT 'standard',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE appeals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    reason TEXT DEFAULT '',
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE releases (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    artist VARCHAR(255) NOT NULL,
    cover_url TEXT DEFAULT '',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_blocks (
    id SERIAL PRIMARY KEY,
    blocker_id INTEGER,
    blocked_id INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

INSERT INTO users (username, email, password_hash, display_name, is_verified, is_admin, role, avatar_url)
VALUES ('buzzy', 'admin@buzzy.com', 'admin', 'Buzzy', TRUE, TRUE, 'admin', 'https://cdn.poehali.dev/files/e55b3f68-edb3-4e23-991f-a41fe217fb1d.png');
