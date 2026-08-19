'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const INITIAL_POSTS = [
  {
    id: 101,
    category: 'notice',
    isPinned: true,
    title: '[필독] 2026년 3분기 현장 통신배선 안전 보건 교육 실시 안내',
    author: '경영지원팀',
    authorId: 'netadmin',
    date: '2026-08-18',
    views: 128,
    comments: [
      { id: 1, author: '김철수 과장', text: '네 시공팀 전원 교육 참석 예정입니다.', date: '08-18 14:20' }
    ],
    content: `안녕하십니까, 경영지원팀입니다.

2026년 3분기 현장 통신배선 공사 및 인프라 구축 분야 필수 안전보건교육을 다음과 같이 실시하오니, 현장 엔지니어 및 기술직 임직원 여러분께서는 차질 없이 참석해주시기 바랍니다.

1. 일시: 2026년 8월 21일(금) 14:00 ~ 16:00
2. 장소: 본사 2층 대회의실
3. 대상: 네트워크/인프라 사업부 전 직원 및 시공팀
4. 주요 내용:
   - 고소 작업 및 케이블링 시 안전 수칙
   - 전산실 랙 작업 중 감전/정전 방지 예방 수칙
   - 신규 보호구 지급 안내

감사합니다.`
  },
  {
    id: 102,
    category: 'notice',
    isPinned: false,
    title: '아인스텍 그룹웨어 및 사내 포털 시스템 오픈 안내',
    author: '마스터 관리자',
    authorId: 'netadmin',
    date: '2026-08-15',
    views: 245,
    comments: [],
    content: `임직원 여러분 안녕하십니까.

사내 종합 업무 시스템 (Networkin Staff Portal)이 새롭게 정식 오픈되었습니다.
본 포털을 통해 시공 프로젝트 공정률, 유지보수 장애 출동 접수, 자재 재고 현황, 사내 메일 및 일정을 통합 관리하실 수 있습니다.

최초 로그인 시 제공된 초기 비밀번호(1234)를 반드시 변경 후 이용해 주시기 바랍니다.`
  },
  {
    id: 201,
    category: 'free',
    isPinned: false,
    title: '천안 2공장 시공 때 광케이블 융착접합기 팁 공유합니다.',
    author: '김철수 과장',
    authorId: 'kimcs',
    date: '2026-08-19',
    views: 42,
    comments: [
      { id: 1, author: '박민우 대리', text: '유용한 팁 감사합니다! 다음 현장에 적용해보겠습니다.', date: '08-19 13:10' },
      { id: 2, author: '이강욱 팀장', text: '좋은 정보네요. 장비 유지보수 탭에도 기록 남겨주세요.', date: '08-19 13:45' }
    ],
    content: `안녕하세요 시공팀 김철수입니다.

이번 천안 A공장 2구역 광케이블 구축 때 손실률을 줄이기 위해 슬리브 접속 작업을 진행하면서 정리한 노하우입니다.

1. 광섬유 절단기 코어를 자를 때 90도 직각도를 0.5도 이내로 유지
2. 방진 알코올 솜으로 재세척 후 접합
3. OTDR 측정 시 0.02dB 이하 손실률 확인

현장 나가시는 분들 참고하세요!`
  },
  {
    id: 202,
    category: 'free',
    isPinned: false,
    title: '이번 주 금요일 세미나 끝나고 부서 회식 장소 추천 받습니다~',
    author: '박민우 대리',
    authorId: 'parkmw',
    date: '2026-08-18',
    views: 58,
    comments: [
      { id: 1, author: '이강욱 팀장', text: '본사 근처 삼겹살집이나 고깃집으로 알아봐 주세요~', date: '08-18 17:00' }
    ],
    content: `금요일 안전 교육 세미나 마치고 네트워크 사업부 간단히 저녁 회식 진행할 예정입니다.

메뉴 추천이나 본사 근처 괜찮은 장소 있으시면 댓글 남겨주세요!`
  }
];

export default function BoardPage() {
  const { currentUser } = useAuth();

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

  // Posts State
  const [posts, setPosts] = useState(INITIAL_POSTS);

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('networkin_board_posts');
    if (saved) {
      try { setPosts(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const savePosts = (newPosts) => {
    setPosts(newPosts);
    localStorage.setItem('networkin_board_posts', JSON.stringify(newPosts));
  };

  // Click Post -> Increase View Count & Open Reader Modal
  const handleOpenPost = (post) => {
    const updated = posts.map(p => {
      if (p.id === post.id) return { ...p, views: p.views + 1 };
      return p;
    });
    savePosts(updated);
    setSelectedPost({ ...post, views: post.views + 1 });
  };

  // Submit New Post
  const handleWriteSubmit = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) {
      alert('제목과 내용을 모두 입력해 주세요.');
      return;
    }

    const newPost = {
      id: Date.now(),
      category: newCategory,
      isPinned: false,
      title: newTitle.trim(),
      author: currentUser?.name || currentUser?.id || '이강욱 팀장',
      authorId: currentUser?.id || 'netadmin',
      date: new Date().toISOString().split('T')[0],
      views: 1,
      comments: [],
      content: newContent.trim()
    };

    const updated = [newPost, ...posts];
    savePosts(updated);

    setIsWriting(false);
    setNewTitle('');
    setNewContent('');
    setActiveTab(newCategory);
    alert('게시글이 성공적으로 등록되었습니다.');
  };

  // Submit Comment
  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!commentInput.trim() || !selectedPost) return;

    const newComment = {
      id: Date.now(),
      author: currentUser?.name || currentUser?.id || '임직원',
      text: commentInput.trim(),
      date: '방금 전'
    };

    const updatedPosts = posts.map(p => {
      if (p.id === selectedPost.id) {
        return { ...p, comments: [...p.comments, newComment] };
      }
      return p;
    });

    savePosts(updatedPosts);
    setSelectedPost({ ...selectedPost, comments: [...selectedPost.comments, newComment] });
    setCommentInput('');
  };

  // Delete Post
  const handleDeletePost = (id) => {
    if (confirm('이 게시글을 삭제하시겠습니까?')) {
      const updated = posts.filter(p => p.id !== id);
      savePosts(updated);
      setSelectedPost(null);
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
