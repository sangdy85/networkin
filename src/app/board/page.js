'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const INITIAL_POSTS = [];

export default function BoardPage() {
  const { currentUser } = useAuth();

  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [activeTab, setActiveTab] = useState('notice'); // 'notice' | 'free'
  const [selectedPost, setSelectedPost] = useState(null);
  const [isWriting, setIsWriting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // New Post Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('notice');
  const [newContent, setNewContent] = useState('');

  // Comment State
  const [commentInput, setCommentInput] = useState('');

  // Fetch posts from real SQLite DB
  const fetchPostsFromAPI = async () => {
    try {
      const res = await fetch('/api/board');
      if (res.ok) {
        const data = await res.json();
        setPosts(data || []);
      }
    } catch (e) {
      console.error('Fetch board posts error', e);
    }
  };

  useEffect(() => {
    fetchPostsFromAPI();
  }, []);

  // Click Post -> Open Reader Modal
  const handleOpenPost = (post) => {
    setSelectedPost(post);
  };

  // Submit New Post
  const handleWriteSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    const newPostData = {
      category: newCategory,
      title: newTitle.trim(),
      author: currentUser?.name || currentUser?.id || '작성자',
      authorId: currentUser?.id || 'netadmin',
      content: newContent.trim()
    };

    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPostData)
      });

      const data = await res.json();
      if (res.ok) {
        alert('게시글이 성공적으로 등록되었습니다.');
        setIsWriting(false);
        setNewTitle('');
        setNewContent('');
        setActiveTab(newCategory);
        fetchPostsFromAPI();
      } else {
        alert(`게시글 등록 실패: ${data.error}`);
      }
    } catch (err) {
      alert(`게시글 등록 오류: ${err.message}`);
    }
  };

  // Submit Comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedPost) return;

    try {
      const res = await fetch('/api/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'comment',
          postId: selectedPost.id,
          author: currentUser?.name || currentUser?.id || '임직원',
          text: commentInput.trim()
        })
      });

      if (res.ok) {
        const updatedComments = [...(selectedPost.comments || []), { id: Date.now(), author: currentUser?.name || '임직원', text: commentInput.trim(), date: '방금 전' }];
        setSelectedPost({ ...selectedPost, comments: updatedComments });
        setCommentInput('');
        fetchPostsFromAPI();
      }
    } catch (err) {
      console.error('Comment submit error', err);
    }
  };

  // Delete Post
  const handleDeletePost = async (id) => {
    if (confirm('이 게시글을 삭제하시겠습니까?')) {
      try {
        const res = await fetch(`/api/board?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
          setSelectedPost(null);
          fetchPostsFromAPI();
        }
      } catch (err) {
        console.error('Delete post error', err);
      }
    }
  };

  // Filtered Posts
  const filteredPosts = posts.filter(p => {
    const catMatch = p.category === activeTab;
    const searchMatch = !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author.toLowerCase().includes(searchQuery.toLowerCase());
    return catMatch && searchMatch;
  });

  return (
    <div>
      {/* Header */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">📋 사내 게시판 (Networkin Board)</h1>
          <p className="portal-subtitle">아인스텍 임직원 사내 공지사항 및 자유 소통 커뮤니티 공간</p>
        </div>
        <button className="btn btn-accent" onClick={() => setIsWriting(true)}>✏️ 새 글 작성</button>
      </header>

      {/* Board Category Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('notice')}
            className={`btn ${activeTab === 'notice' ? 'btn-accent' : 'btn-secondary'}`}
            style={{ fontSize: '0.9rem', padding: '0.6rem 1.2rem' }}
          >
            📢 공지사항 ({posts.filter(p => p.category === 'notice').length})
          </button>
          <button
            onClick={() => setActiveTab('free')}
            className={`btn ${activeTab === 'free' ? 'btn-accent' : 'btn-secondary'}`}
            style={{ fontSize: '0.9rem', padding: '0.6rem 1.2rem' }}
          >
            💬 자유게시판 ({posts.filter(p => p.category === 'free').length})
          </button>
        </div>

        {/* Search Input */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="제목/작성자 검색..."
          style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem', width: '220px' }}
        />
      </div>

      {/* Write Post Modal */}
      {isWriting && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '650px', background: 'var(--bg-card)' }}>
            <div className="panel-header">
              <h2 className="panel-title">✏️ 게시글 작성</h2>
              <button onClick={() => setIsWriting(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleWriteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>게시판 구분</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white' }}
                >
                  <option value="notice">📢 공지사항 (회사 공지/안내)</option>
                  <option value="free">💬 자유게시판 (임직원 자유 소통)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>제목 *</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="제목을 입력하세요"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>내용 *</label>
                <textarea
                  rows={7}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="내용을 상세히 입력해 주세요..."
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsWriting(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">게시하기</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Board Post Table */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            {activeTab === 'notice' ? '📢 사내 공지사항 목록' : '💬 자유게시판 글 목록'}
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#aaa' }}>총 {filteredPosts.length}건의 글</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '70px', textAlign: 'center' }}>번호</th>
              <th>제목</th>
              <th style={{ width: '120px' }}>작성자</th>
              <th style={{ width: '110px' }}>작성일</th>
              <th style={{ width: '70px', textAlign: 'center' }}>조회</th>
              <th style={{ width: '70px', textAlign: 'center' }}>댓글</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post, idx) => (
                <tr
                  key={post.id}
                  onClick={() => handleOpenPost(post)}
                  style={{ cursor: 'pointer', background: post.isPinned ? 'rgba(230,57,70,0.08)' : 'transparent' }}
                >
                  <td style={{ textAlign: 'center', fontSize: '0.85rem' }}>
                    {post.isPinned ? <span style={{ color: '#E63946', fontWeight: 700 }}>[공지]</span> : filteredPosts.length - idx}
                  </td>
                  <td style={{ fontWeight: post.isPinned ? 700 : 500 }}>
                    {post.title}
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{post.author}</td>
                  <td style={{ fontSize: '0.8rem', color: '#aaa' }}>{post.date}</td>
                  <td style={{ textAlign: 'center', fontSize: '0.8rem', color: '#aaa' }}>{post.views}</td>
                  <td style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                    {post.comments.length > 0 ? post.comments.length : '-'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#aaa' }}>
                  등록된 게시글이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Post Detail Reader Modal */}
      {selectedPost && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '750px', maxHeight: '85vh', overflowY: 'auto', background: 'var(--bg-card)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.2rem' }}>
              <div>
                <span style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: selectedPost.category === 'notice' ? 'rgba(230,57,70,0.2)' : 'rgba(0,180,216,0.2)',
                  color: selectedPost.category === 'notice' ? '#E63946' : '#00B4D8',
                  fontWeight: 600,
                  marginRight: '0.5rem'
                }}>
                  {selectedPost.category === 'notice' ? '공지사항' : '자유게시판'}
                </span>
                <span style={{ fontSize: '0.8rem', color: '#aaa' }}>{selectedPost.date}</span>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: '0.4rem', color: '#fff' }}>{selectedPost.title}</h2>
                <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '0.3rem' }}>
                  작성자: <strong style={{ color: '#fff' }}>{selectedPost.author}</strong> | 조회수: {selectedPost.views}회
                </div>
              </div>
              <button onClick={() => setSelectedPost(null)} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            {/* Content Body */}
            <div style={{ fontSize: '0.95rem', lineHeight: '1.85', color: '#E2E8F0', whiteSpace: 'pre-line', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
              {selectedPost.content}
            </div>

            {/* Comments Section */}
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                💬 댓글 ({selectedPost.comments.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {selectedPost.comments.length > 0 ? (
                  selectedPost.comments.map((c) => (
                    <div key={c.id} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', fontSize: '0.82rem' }}>
                        <strong style={{ color: 'var(--color-accent)' }}>{c.author}</strong>
                        <span style={{ color: '#888' }}>{c.date}</span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: '#ddd' }}>{c.text}</p>
                    </div>
                  ))
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>작성된 댓글이 없습니다. 첫 댓글을 남겨보세요!</div>
                )}
              </div>

              {/* Add Comment Form */}
              <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  style={{ flex: 1, padding: '0.7rem 1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.88rem' }}
                />
                <button type="submit" className="btn btn-accent" style={{ padding: '0.7rem 1.2rem', fontSize: '0.85rem' }}>등록</button>
              </form>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <button onClick={() => handleDeletePost(selectedPost.id)} className="btn btn-secondary" style={{ color: '#E63946', fontSize: '0.82rem' }}>
                🗑️ 게시글 삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
