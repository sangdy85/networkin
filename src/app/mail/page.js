'use client';

import { useState, useRef, useEffect } from 'react';

const INITIAL_SIGNATURES = [
  {
    id: 1,
    name: '기본 사내 서명',
    isDefault: true,
    text: `--------------------------------------------------
이 강 욱 / lku@networkin.co.kr
BI 사업부   과장
Tel. 02) 6207 - 8004  Fax. 02) 6207 - 1010
Mobile. 010 - 2062 - 7701
서울특별시 송파구 오금로 36길 28-1 (가락동, 2층)`
  },
  {
    id: 2,
    name: '영문 글로벌 서명 (English Signature)',
    isDefault: false,
    text: `--------------------------------------------------
Kang-Wook Lee / Manager
BI Business Dept. | Einstec / Networkin Co., Ltd.
Email: lku@networkin.co.kr  Mobile: +82-10-2062-7701
Addr: 2F, 28-1 Ogeum-ro 36-gil, Songpa-gu, Seoul, Korea`
  }
];

const PRESET_PROVIDERS = {
  'gmail': { name: 'Google Gmail (IMAP/SMTP)', incomingServer: 'imap.gmail.com', incomingPort: '993', outgoingServer: 'smtp.gmail.com', outgoingPort: '465', ssl: true },
  'naver': { name: '네이버 메일 (POP3/SMTP)', incomingServer: 'pop.naver.com', incomingPort: '995', outgoingServer: 'smtp.naver.com', outgoingPort: '465', ssl: true },
  'daum': { name: '다음 카카오 메일 (POP3/SMTP)', incomingServer: 'pop.daum.net', incomingPort: '995', outgoingServer: 'smtp.daum.net', outgoingPort: '465', ssl: true },
  'custom': { name: '자체 회사 메일 서버 (Custom POP3/SMTP)', incomingServer: 'mail.networkin.co.kr', incomingPort: '995', outgoingServer: 'smtp.networkin.co.kr', outgoingPort: '465', ssl: true }
};

export default function MailPage() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedMail, setSelectedMail] = useState(null);

  const [isComposing, setIsComposing] = useState(false);

  // External Account Settings Modal State
  const [isExtModalOpen, setIsExtModalOpen] = useState(false);
  const [extProvider, setExtProvider] = useState('naver');
  const [extEmail, setExtEmail] = useState('');
  const [extPassword, setExtPassword] = useState('');
  const [extIncomingServer, setExtIncomingServer] = useState('pop.naver.com');
  const [extIncomingPort, setExtIncomingPort] = useState('995');
  const [extOutgoingServer, setExtOutgoingServer] = useState('smtp.naver.com');
  const [extOutgoingPort, setExtOutgoingPort] = useState('465');
  const [isAccountLinked, setIsAccountLinked] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Mail Compose Header State
  const [toSelf, setToSelf] = useState(false);
  const [toAddress, setToAddress] = useState('');
  const [ccAddress, setCcAddress] = useState('');
  const [showCc, setShowCc] = useState(true);
  const [subject, setSubject] = useState('');
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [senderAccount, setSenderAccount] = useState('lku@networkin.co.kr');

  // Rich Text Editor State & Active Formatting Controls
  const textareaRef = useRef(null);
  const [editorMode, setEditorMode] = useState('Editor');
  const [fontFamily, setFontFamily] = useState('맑은 고딕');
  const [fontSize, setFontSize] = useState('10pt');
  const [textColor, setTextColor] = useState('#222222');
  const [bgColor, setBgColor] = useState('#ffffff');
  const [isBold, setIsBold] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isSuperscript, setIsSuperscript] = useState(false);
  const [textAlign, setTextAlign] = useState('left');
  
  // Undo/Redo History Stack
  const [historyStack, setHistoryStack] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Signatures Management State
  const [signatures, setSignatures] = useState(INITIAL_SIGNATURES);
  const [selectedSignatureId, setSelectedSignatureId] = useState(1);
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [editingSig, setEditingSig] = useState(null);
  const [sigFormName, setSigFormName] = useState('');
  const [sigFormText, setSigFormText] = useState('');

  // Pre-filled Corporate Signature content
  const activeSig = signatures.find(s => s.id === Number(selectedSignatureId));
  const activeSigText = activeSig ? activeSig.text : '';

  const [mailBody, setMailBody] = useState(`\n\n${INITIAL_SIGNATURES[0].text}`);

  // Bottom Settings Options
  const [saveToSent, setSaveToSent] = useState(true);
  const [sendIndividual, setSendIndividual] = useState(false);
  const [isScheduled, setIsScheduled] = useState(false);
  const [autoSave, setAutoSave] = useState('사용함');
  const [encoding, setEncoding] = useState('유니코드 (UTF-8)');

  const [mails, setMails] = useState([]);

  // Handle Provider Change in Account Settings Modal
  const handleProviderSelect = (key) => {
    setExtProvider(key);
    const p = PRESET_PROVIDERS[key];
    if (p) {
      setExtIncomingServer(p.incomingServer);
      setExtIncomingPort(p.incomingPort);
      setExtOutgoingServer(p.outgoingServer);
      setExtOutgoingPort(p.outgoingPort);
    }
  };

  // Load Mails and External Account Settings
  const fetchMailsFromAPI = async (folderName = activeTab) => {
    try {
      const res = await fetch(`/api/mail?folder=${folderName}`);
      if (res.ok) {
        const data = await res.json();
        setMails(data || []);
      }
    } catch (e) {
      console.error('Fetch mails error', e);
    }
  };

  useEffect(() => {
    fetchMailsFromAPI(activeTab);
  }, [activeTab]);

  useEffect(() => {
    const savedAccount = localStorage.getItem('networkin_ext_mail_account');
    if (savedAccount) {
      try {
        const parsed = JSON.parse(savedAccount);
        setExtProvider(parsed.provider || 'naver');
        setExtEmail(parsed.email || '');
        setExtPassword(parsed.password || '');
        setExtIncomingServer(parsed.incomingServer || 'pop.naver.com');
        setExtIncomingPort(parsed.incomingPort || '995');
        setExtOutgoingServer(parsed.outgoingServer || 'smtp.naver.com');
        setExtOutgoingPort(parsed.outgoingPort || '465');
        if (parsed.email) setIsAccountLinked(true);
      } catch (e) {}
    }
  }, []);

  // Save External Account
  const handleSaveExternalAccount = (e) => {
    e.preventDefault();
    if (!extEmail.trim() || !extPassword.trim()) {
      alert('외부 이메일 주소와 연동 비밀번호를 입력해 주세요.');
      return;
    }

    const accountInfo = {
      provider: extProvider,
      email: extEmail.trim(),
      password: extPassword.trim(),
      incomingServer: extIncomingServer.trim(),
      incomingPort: extIncomingPort.trim(),
      outgoingServer: extOutgoingServer.trim(),
      outgoingPort: extOutgoingPort.trim(),
      linkedAt: new Date().toLocaleString()
    };

    localStorage.setItem('networkin_ext_mail_account', JSON.stringify(accountInfo));
    setIsAccountLinked(true);
    setIsExtModalOpen(false);
    alert(`[${extEmail}] 외부 메일 계정 (POP3/SMTP) 연동 설정이 완료되었습니다!`);
  };

  // Sync External Emails via Real POP3 Server
  const handleSyncExternalMail = async () => {
    if (!extEmail.trim() || !extPassword.trim() || !extIncomingServer.trim()) {
      setIsExtModalOpen(true);
      alert('외부 메일을 수신하려면 [외부 메일 계정 연동 설정]에서 메일주소, 연동 비밀번호, POP3 서버 정보를 설정해 주세요.');
      return;
    }

    setIsSyncing(true);
    try {
      const res = await fetch('/api/mail/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: extIncomingServer.trim(),
          port: extIncomingPort.trim(),
          user: extEmail.trim(),
          pass: extPassword.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || '외부 메일 수신 중 오류가 발생했습니다.');
      } else {
        alert(`🔄 외부 메일 연동 서버 (${extEmail})에서 신규 메일 ${data.count}건을 가져왔습니다!`);
        fetchMailsFromAPI(activeTab);
      }
    } catch (e) {
      alert(`외부 메일 연동 서버 접속 오류: ${e.message}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // When signature selection changes, update body signature!
  const handleSignatureChange = (sigId) => {
    setSelectedSignatureId(sigId);
    if (sigId === 'none') return;
    const targetSig = signatures.find(s => s.id === Number(sigId));
    if (targetSig) {
      const bodyLines = mailBody.split('--------------------------------------------------');
      const cleanContent = bodyLines[0].trim();
      const updatedBody = `${cleanContent}\n\n${targetSig.text}`;
      setMailBody(updatedBody);
    }
  };

  // Save / Add Signature in Modal
  const handleSaveSignature = (e) => {
    e.preventDefault();
    if (!sigFormName.trim() || !sigFormText.trim()) {
      alert('서명 명칭과 서명 내용을 모두 입력해 주세요.');
      return;
    }

    if (editingSig) {
      const updated = signatures.map(s => s.id === editingSig.id ? { ...s, name: sigFormName.trim(), text: sigFormText.trim() } : s);
      setSignatures(updated);
      localStorage.setItem('networkin_mail_signatures', JSON.stringify(updated));
      alert(`[${sigFormName}] 서명이 수정되었습니다.`);
    } else {
      const newSig = {
        id: Date.now(),
        name: sigFormName.trim(),
        isDefault: false,
        text: sigFormText.trim()
      };
      const updated = [...signatures, newSig];
      setSignatures(updated);
      localStorage.setItem('networkin_mail_signatures', JSON.stringify(updated));
      setSelectedSignatureId(newSig.id);
      alert(`[${sigFormName}] 새로운 서명이 등록되었습니다.`);
    }

    setEditingSig(null);
    setSigFormName('');
    setSigFormText('');
  };

  // Update Body Text with History tracking
  const updateMailBody = (newText) => {
    setMailBody(newText);
    setHistoryStack(prev => [...prev.slice(0, historyIndex + 1), newText]);
    setHistoryIndex(prev => prev + 1);
  };

  // Helper to wrap selected text in textarea
  const wrapSelectedText = (beforeTag, afterTag) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = mailBody.substring(start, end);
    const targetText = selected || '텍스트';
    const newText = mailBody.substring(0, start) + beforeTag + targetText + afterTag + mailBody.substring(end);
    updateMailBody(newText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + beforeTag.length, end + beforeTag.length);
    }, 50);
  };

  // Format Handlers
  const handleToggleBold = () => { setIsBold(!isBold); wrapSelectedText('<b>', '</b>'); };
  const handleToggleUnderline = () => { setIsUnderline(!isUnderline); wrapSelectedText('<u>', '</u>'); };
  const handleToggleItalic = () => { setIsItalic(!isItalic); wrapSelectedText('<i>', '</i>'); };
  const handleToggleStrikethrough = () => { setIsStrikethrough(!isStrikethrough); wrapSelectedText('<s>', '</s>'); };
  const handleToggleSuperscript = () => { setIsSuperscript(!isSuperscript); wrapSelectedText('<sup>', '</sup>'); };

  // Color Pickers
  const handleApplyTextColor = (color) => { setTextColor(color); wrapSelectedText(`<span style="color:${color}">`, '</span>'); };
  const handleApplyBgColor = (color) => { setBgColor(color); wrapSelectedText(`<span style="background-color:${color}">`, '</span>'); };
  const handleAlign = (align) => { setTextAlign(align); };

  // List & Insert Handlers
  const handleInsertList = (type) => {
    const el = textareaRef.current;
    if (!el) return;
    const prefix = type === 'bullet' ? '• ' : '1. ';
    const start = el.selectionStart;
    const newText = mailBody.substring(0, start) + `\n${prefix}` + mailBody.substring(start);
    updateMailBody(newText);
  };

  const handleInsertLink = () => {
    const url = prompt('삽입할 웹 하이퍼링크 URL을 입력하세요:', 'https://');
    if (url) wrapSelectedText(`<a href="${url}" target="_blank">`, '</a>');
  };

  const handleInsertImage = () => {
    const url = prompt('삽입할 이미지 URL 주소를 입력하세요:', 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500');
    if (url) {
      const imgTag = `\n<img src="${url}" alt="첨부이미지" style="max-width:100%; border-radius:6px;" />\n`;
      const el = textareaRef.current;
      const start = el ? el.selectionStart : mailBody.length;
      const newText = mailBody.substring(0, start) + imgTag + mailBody.substring(start);
      updateMailBody(newText);
    }
  };

  // Undo / Redo
  const handleUndo = () => { if (historyIndex > 0) { const idx = historyIndex - 1; setHistoryIndex(idx); setMailBody(historyStack[idx]); } };
  const handleRedo = () => { if (historyIndex < historyStack.length - 1) { const idx = historyIndex + 1; setHistoryIndex(idx); setMailBody(historyStack[idx]); } };

  // File Add
  const handleAddFile = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newFiles = files.map((f, i) => ({ id: Date.now() + i, name: f.name, size: `${(f.size / (1024 * 1024)).toFixed(1)} MB` }));
      setAttachedFiles([...attachedFiles, ...newFiles]);
    }
  };

  // Send Mail Action via Linked External Server
  const handleSendMail = async () => {
    const recipient = toSelf ? (extEmail || 'lku@networkin.co.kr') : toAddress;
    if (!recipient.trim()) { alert('받는 사람 메일 주소를 입력해 주세요.'); return; }
    if (!subject.trim()) { alert('제목을 입력해 주세요.'); return; }

    try {
      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: extOutgoingServer.trim(),
          port: extOutgoingPort.trim(),
          user: extEmail.trim(),
          pass: extPassword.trim(),
          to: recipient.trim(),
          subject: subject.trim(),
          content: mailBody
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(data.message || '메일이 발송되었습니다.');
        setIsComposing(false);
        setSubject('');
        fetchMailsFromAPI(activeTab);
      } else {
        alert(`메일 발송 실패: ${data.error}`);
      }
    } catch (err) {
      alert(`메일 발송 오류: ${err.message}`);
    }
  };

  // Delete Mail
  const handleDeleteMail = async (id) => {
    if (confirm('이 메일을 삭제하시겠습니까?')) {
      try {
        const res = await fetch(`/api/mail?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
          setSelectedMail(null);
          fetchMailsFromAPI(activeTab);
        }
      } catch (err) {
        console.error('Delete mail error', err);
      }
    }
  };

  return (
    <div>
      {/* Header with Mailbox Tabs & External Integration Status */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">✉️ 사내 & 외부 통합 웹메일 시스템 (Webmail Hub)</h1>
          <p className="portal-subtitle">사내메일(networkin.co.kr) 및 네이버/Gmail/POP3/SMTP 외부 메일 주고받기 통합 지원</p>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <button
            onClick={handleSyncExternalMail}
            disabled={isSyncing}
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {isSyncing ? '🔄 메일 수신 중...' : '🔄 외부 메일 가져오기'}
          </button>

          <button
            onClick={() => setIsExtModalOpen(true)}
            className="btn btn-accent"
            style={{ fontSize: '0.82rem' }}
          >
            ⚙️ 외부 메일 계정 연동 설정
          </button>
        </div>
      </header>

      {/* External Connection Status Bar Banner */}
      <div style={{ background: 'rgba(0,180,216,0.08)', padding: '0.75rem 1.2rem', borderRadius: '10px', marginBottom: '1.2rem', border: '1px solid rgba(0,180,216,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.85rem' }}>
          <span style={{ background: '#00B4D8', color: '#000', padding: '0.2rem 0.6rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.75rem' }}>
            연동 상태: {isAccountLinked ? '🟢 정상 연결됨' : '🔴 미연동'}
          </span>
          <span style={{ color: '#fff' }}>
            현재 외부 연동 계정: <strong>{extEmail}</strong> (수신: {extIncomingServer}:{extIncomingPort} / 발신: {extOutgoingServer}:{extOutgoingPort})
          </span>
        </div>

        <span style={{ fontSize: '0.78rem', color: '#aaa' }}>
          💡 외부 고객사 및 Naver/Gmail 수발신 메일 자동 동기화 적용 중
        </span>
      </div>

      {/* Mailbox Navigation Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => { setActiveTab('inbox'); setIsComposing(false); }}
          className={`btn ${activeTab === 'inbox' && !isComposing ? 'btn-accent' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
        >
          📥 받은메일함 ({mails.filter(m => m.unread).length})
        </button>
        <button
          onClick={() => { setActiveTab('sent'); setIsComposing(false); }}
          className={`btn ${activeTab === 'sent' && !isComposing ? 'btn-accent' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
        >
          📤 보낸메일함
        </button>
        <button
          onClick={() => { setActiveTab('starred'); setIsComposing(false); }}
          className={`btn ${activeTab === 'starred' && !isComposing ? 'btn-accent' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
        >
          ⭐ 중요메일함
        </button>

        <button className="btn btn-secondary" onClick={() => setIsComposing(true)} style={{ fontSize: '0.85rem', marginLeft: 'auto', background: 'var(--color-accent)', color: '#000', fontWeight: 700 }}>
          ✏️ 새 메일 쓰기
        </button>
      </div>

      {/* External Account & POP3/SMTP Integration Modal */}
      {isExtModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-card)', color: '#fff' }}>
            <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.2rem', color: '#fff' }}>⚙️ 외부 메일 계정 연동 및 POP3/SMTP 서버 설정</h2>
              <button onClick={() => setIsExtModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveExternalAccount} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: 700, marginBottom: '0.3rem' }}>
                  외부 메일 서비스 선택 *
                </label>
                <select
                  value={extProvider}
                  onChange={(e) => handleProviderSelect(e.target.value)}
                  style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--color-accent)', color: 'white', fontWeight: 600 }}
                >
                  <option value="naver">네이버 메일 (POP3/SMTP)</option>
                  <option value="gmail">Google Gmail (IMAP/SMTP)</option>
                  <option value="daum">다음 카카오 메일 (POP3/SMTP)</option>
                  <option value="custom">자체 커스텀 메일 서버 (Custom Server)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>외부 이메일 주소 *</label>
                  <input
                    type="email"
                    value={extEmail}
                    onChange={(e) => setExtEmail(e.target.value)}
                    placeholder="예: user@naver.com"
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>비밀번호 / 앱 암호 *</label>
                  <input
                    type="password"
                    value={extPassword}
                    onChange={(e) => setExtPassword(e.target.value)}
                    placeholder="비밀번호 또는 2차 앱 암호"
                    style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              {/* Server Connection Details */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-accent)', fontWeight: 700, display: 'block', marginBottom: '0.6rem' }}>
                  🖥️ 수신 (POP3/IMAP) & 발신 (SMTP) 서버 상세 정보
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.8rem', marginBottom: '0.6rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.2rem' }}>수신 서버 (Incoming)</label>
                    <input
                      type="text"
                      value={extIncomingServer}
                      onChange={(e) => setExtIncomingServer(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.2rem' }}>포트 (Port)</label>
                    <input
                      type="text"
                      value={extIncomingPort}
                      onChange={(e) => setExtIncomingPort(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.2rem' }}>발신 서버 (Outgoing SMTP)</label>
                    <input
                      type="text"
                      value={extOutgoingServer}
                      onChange={(e) => setExtOutgoingServer(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.2rem' }}>포트 (Port)</label>
                    <input
                      type="text"
                      value={extOutgoingPort}
                      onChange={(e) => setExtOutgoingPort(e.target.value)}
                      style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsExtModalOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">🔌 계정 연결 및 테스트 저장</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full-Featured Webmail Composition Editor View */}
      {isComposing ? (
        <div className="panel" style={{ background: '#fff', color: '#222', padding: '1.2rem', borderRadius: '8px', border: '1px solid #ccc' }}>
          
          {/* Top Action Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f5f5f5', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              <button onClick={handleSendMail} style={{ padding: '0.35rem 0.9rem', background: '#2B3A55', color: '#fff', border: '1px solid #1A2536', borderRadius: '3px', fontWeight: 'bold', fontSize: '0.82rem', cursor: 'pointer' }}>
                보내기
              </button>
              <button onClick={() => { setSubject(''); updateMailBody(`\n\n${activeSigText}`); setAttachedFiles([]); }} style={{ padding: '0.35rem 0.7rem', background: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '3px', fontSize: '0.82rem', cursor: 'pointer' }}>
                새로쓰기
              </button>
              <button onClick={() => alert(`[미리보기]\n발신계정: ${senderAccount}\n수신자: ${toAddress}\n제목: ${subject}\n\n내용:\n${mailBody}`)} style={{ padding: '0.35rem 0.7rem', background: '#fff', color: '#333', border: '1px solid #ccc', borderRadius: '3px', fontSize: '0.82rem', cursor: 'pointer' }}>
                미리보기
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1.2rem', fontSize: '0.8rem', color: '#333' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={saveToSent} onChange={(e) => setSaveToSent(e.target.checked)} style={{ accentColor: '#2B3A55' }} />
                보낸메일함 저장
              </label>
            </div>
          </div>

          {/* Mail Headers Table */}
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', background: '#FAFAFA', marginBottom: '1rem' }}>
            
            {/* 보내는 계정 선택 (Sender Account Selection) */}
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', alignItems: 'center', padding: '0.4rem 0.8rem' }}>
              <div style={{ width: '90px', fontSize: '0.82rem', fontWeight: 'bold', color: '#2B3A55' }}>
                보내는 계정
              </div>
              <select
                value={senderAccount}
                onChange={(e) => setSenderAccount(e.target.value)}
                style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid #00B4D8', borderRadius: '3px', fontSize: '0.83rem', fontWeight: 'bold', background: '#E6F4F8', color: '#007791' }}
              >
                <option value="lku@networkin.co.kr">🏢 사내 대표 메일 (lku@networkin.co.kr)</option>
                {isAccountLinked && <option value={extEmail}>🌐 외부 연동 계정 ({extEmail}) - {extOutgoingServer}</option>}
              </select>
            </div>

            {/* 받는사람 (To) */}
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', alignItems: 'center', padding: '0.4rem 0.8rem' }}>
              <div style={{ width: '90px', fontSize: '0.82rem', fontWeight: 'bold', color: '#444', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                받는사람
                <label style={{ fontWeight: 'normal', fontSize: '0.78rem', color: '#666', display: 'flex', alignItems: 'center', gap: '0.2rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={toSelf} onChange={(e) => { setToSelf(e.target.checked); if(e.target.checked) setToAddress(senderAccount); }} />
                  내게쓰기
                </label>
              </div>

              <input
                type="text"
                value={toAddress}
                onChange={(e) => setToAddress(e.target.value)}
                placeholder="외부 또는 사내 수신 이메일 주소를 입력하세요 (예: client@gmail.com, cs.kim@einstec.com)"
                disabled={toSelf}
                style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '3px', fontSize: '0.83rem', outline: 'none', background: toSelf ? '#f0f0f0' : '#fff' }}
              />
            </div>

            {/* 제목 (Subject) */}
            <div style={{ display: 'flex', borderBottom: '1px solid #eee', alignItems: 'center', padding: '0.4rem 0.8rem' }}>
              <div style={{ width: '90px', fontSize: '0.82rem', fontWeight: 'bold', color: '#444' }}>
                제목
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="제목을 입력하세요."
                style={{ flex: 1, padding: '0.4rem 0.6rem', border: '1px solid #ccc', borderRadius: '3px', fontSize: '0.83rem', outline: 'none' }}
              />
            </div>

            {/* 파일첨부 */}
            <div style={{ padding: '0.6rem 0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#444', marginRight: '0.5rem' }}>파일첨부</span>
                  <label style={{ padding: '0.3rem 0.7rem', background: '#fff', border: '1px solid #bbb', borderRadius: '3px', fontSize: '0.78rem', cursor: 'pointer' }}>
                    파일찾기
                    <input type="file" multiple onChange={handleAddFile} style={{ display: 'none' }} />
                  </label>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#666' }}>일반 {attachedFiles.length}개 첨부</div>
              </div>
            </div>

          </div>

          {/* WYSIWYG Formatting Buttons */}
          <div style={{ border: '1px solid #ccc', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
            <div style={{ background: '#f8f8f8', padding: '0.4rem 0.6rem', borderBottom: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap', fontSize: '0.8rem', color: '#333' }}>
              <button type="button" onClick={handleToggleBold} style={{ border: isBold ? '1px solid #00B4D8' : '1px solid #ccc', background: isBold ? 'rgba(0,180,216,0.15)' : '#fff', padding: '0.15rem 0.45rem', fontWeight: 'bold' }}>B</button>
              <button type="button" onClick={handleToggleUnderline} style={{ border: isUnderline ? '1px solid #00B4D8' : '1px solid #ccc', background: isUnderline ? 'rgba(0,180,216,0.15)' : '#fff', padding: '0.15rem 0.45rem', textDecoration: 'underline' }}>U</button>
              <button type="button" onClick={handleToggleItalic} style={{ border: isItalic ? '1px solid #00B4D8' : '1px solid #ccc', background: isItalic ? 'rgba(0,180,216,0.15)' : '#fff', padding: '0.15rem 0.45rem', fontStyle: 'italic' }}>I</button>
              <button type="button" onClick={handleInsertLink} style={{ border: '1px solid #ccc', background: '#fff', padding: '0.15rem 0.4rem' }}>🔗 링크</button>
              <button type="button" onClick={handleInsertImage} style={{ border: '1px solid #ccc', background: '#fff', padding: '0.15rem 0.4rem' }}>🖼️ 이미지</button>
            </div>

            <textarea
              ref={textareaRef}
              rows={12}
              value={mailBody}
              onChange={(e) => updateMailBody(e.target.value)}
              placeholder="메일 본문 내용을 입력하세요..."
              style={{ width: '100%', padding: '1rem', border: 'none', outline: 'none', fontSize: '0.92rem', lineHeight: '1.6', color: '#222', resize: 'vertical' }}
            ></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button onClick={() => setIsComposing(false)} className="btn btn-secondary">취소</button>
            <button onClick={handleSendMail} className="btn btn-accent" style={{ background: '#2B3A55', color: '#fff' }}>보내기 ({senderAccount})</button>
          </div>
        </div>
      ) : (
        /* Main Mail View Grid */
        <div style={{ display: 'grid', gridTemplateColumns: '3.5fr 6.5fr', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Left: Mail List */}
          <div className="panel" style={{ padding: '1.25rem' }}>
            <div style={{ paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>📩 수신 메일함 ({mails.length})</h3>
              <span style={{ fontSize: '0.75rem', color: '#aaa' }}>사내 & 외부 통합</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {mails.map((mail) => (
                <div
                  key={mail.id}
                  onClick={() => setSelectedMail(mail)}
                  style={{
                    padding: '1.1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    background: selectedMail?.id === mail.id 
                      ? 'linear-gradient(135deg, rgba(0,180,216,0.25), rgba(58,80,107,0.3))' 
                      : mail.unread 
                      ? 'rgba(255,255,255,0.05)' 
                      : 'rgba(0,0,0,0.2)',
                    border: selectedMail?.id === mail.id 
                      ? '1px solid var(--color-accent)' 
                      : mail.unread 
                      ? '1px solid rgba(0,180,216,0.3)' 
                      : '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: mail.unread ? 700 : 600, color: mail.unread ? '#fff' : '#ccc', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      {mail.unread && <span style={{ color: '#E63946', fontSize: '0.8rem' }}>●</span>}
                      {mail.isExternal && <span style={{ fontSize: '0.7rem', background: '#E63946', color: '#fff', padding: '0.1rem 0.3rem', borderRadius: '3px', fontWeight: 700 }}>외부</span>}
                      {mail.sender}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#aaa' }}>{mail.date}</span>
                  </div>
                  
                  <div style={{ fontSize: '0.92rem', fontWeight: selectedMail?.id === mail.id || mail.unread ? 700 : 500, color: selectedMail?.id === mail.id ? 'var(--color-accent)' : '#fff', marginBottom: '0.4rem', lineHeight: '1.3' }}>
                    {mail.subject}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Mail Content Detail View */}
          <div className="panel" style={{ padding: '2rem', minHeight: '520px' }}>
            {selectedMail ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.2rem', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#888' }}>{selectedMail.date}</span>
                      {selectedMail.isExternal && <span style={{ fontSize: '0.75rem', background: '#E63946', color: '#fff', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>🌐 외부수신 메일</span>}
                    </div>

                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: '1.4', color: '#fff' }}>
                      {selectedMail.subject}
                    </h2>
                    <div style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '0.75rem' }}>
                      보낸사람: <strong style={{ color: '#fff' }}>{selectedMail.sender}</strong> &lt;{selectedMail.email}&gt;
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '1rem', lineHeight: '1.85', color: '#E2E8F0', marginBottom: '2.5rem', whiteSpace: 'pre-line' }}>
                  {selectedMail.content}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => { setIsComposing(true); setToAddress(selectedMail.email); setSubject(`Re: ${selectedMail.subject}`); }} className="btn btn-accent">↩️ 외부 답장 쓰기</button>
                  <button onClick={() => { setIsComposing(true); setSubject(`Fwd: ${selectedMail.subject}`); updateMailBody(`${selectedMail.content}\n\n${activeSigText}`); }} className="btn btn-secondary">➡️ 전달</button>
                  <button onClick={() => handleDeleteMail(selectedMail.id)} className="btn btn-secondary" style={{ color: '#E63946', borderColor: '#E63946' }}>🗑️ 메일 삭제</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '400px', color: '#aaa' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✉️</div>
                <p style={{ fontSize: '1.1rem' }}>좌측 목록에서 메일을 선택하면 본문 내용이 표시됩니다.</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
