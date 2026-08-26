import db from '@/lib/db';
import { NextResponse } from 'next/server';

// GET /api/board - Fetch all posts with comments
export async function GET(req) {
  try {
    const rows = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
    const posts = rows.map(r => {
      const comments = db.prepare('SELECT id, author, text, date FROM comments WHERE post_id = ? ORDER BY created_at ASC').all(r.id);
      return {
        id: r.id,
        category: r.category,
        title: r.title,
        author: r.author,
        authorId: r.author_id,
        date: r.date,
        views: r.views || 0,
        content: r.content,
        comments
      };
    });

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/board - Create new post or add comment
export async function POST(req) {
  try {
    const body = await req.json();
    const { action, id, category, title, author, authorId, content, postId, text } = body;

    // Action: Add Comment
    if (action === 'comment') {
      if (!postId || !text) {
        return NextResponse.json({ error: '댓글 내용이 부족합니다.' }, { status: 400 });
      }

      const commentStmt = db.prepare(`
        INSERT INTO comments (post_id, author, text, date)
        VALUES (?, ?, ?, ?)
      `);

      const nowStr = new Date().toLocaleString();
      commentStmt.run(postId, author || '임직원', text, nowStr);
      return NextResponse.json({ success: true });
    }

    // Action: Create Post
    if (!title || !content) {
      return NextResponse.json({ error: '제목과 내용을 입력해 주세요.' }, { status: 400 });
    }

    const postIdFinal = id || `POST-${Date.now()}`;
    const dateStr = new Date().toISOString().split('T')[0];

    const stmt = db.prepare(`
      INSERT INTO posts (id, category, title, author, author_id, date, views, content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      postIdFinal,
      category || 'notice',
      title,
      author || '작성자',
      authorId || 'admin',
      dateStr,
      1,
      content
    );

    return NextResponse.json({ success: true, id: postIdFinal });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/board - Delete post
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    db.prepare('DELETE FROM posts WHERE id = ?').run(id);
    db.prepare('DELETE FROM comments WHERE post_id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
