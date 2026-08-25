'use client';

import { useState, useEffect } from 'react';

const INITIAL_INVENTORY = [];

export default function InventoryPage() {
  const [inventory, setInventory] = useState(INITIAL_INVENTORY);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOutboundOpen, setIsOutboundOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedOutboundItem, setSelectedOutboundItem] = useState(null);

  // Inbound Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('케이블/배선');
  const [formStock, setFormStock] = useState(10);
  const [formMinStock, setFormMinStock] = useState(5);
  const [formUnit, setFormUnit] = useState('개');
  const [formLocation, setFormLocation] = useState('본사 자재실 A-1');
  const [formPrice, setFormPrice] = useState('');

  // Outbound Form State
  const [outboundQty, setOutboundQty] = useState(1);
  const [outboundSite, setOutboundSite] = useState('천안 A공장 시공현장');
  const [outboundWorker, setOutboundWorker] = useState('김철수 과장');

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('networkin_inventory');
    if (saved) {
      try { setInventory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  const saveInventory = (newInv) => {
    setInventory(newInv);
    localStorage.setItem('networkin_inventory', JSON.stringify(newInv));
  };

  // Open Inbound Modal
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory('케이블/배선');
    setFormStock(10);
    setFormMinStock(5);
    setFormUnit('개');
    setFormLocation('본사 자재실 A-1');
    setFormPrice('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormStock(item.stock);
    setFormMinStock(item.minStock);
    setFormUnit(item.unit);
    setFormLocation(item.location);
    setFormPrice(item.price);
    setIsModalOpen(true);
  };

  // Open Outbound Modal
  const handleOpenOutboundModal = (item) => {
    setSelectedOutboundItem(item);
    setOutboundQty(1);
    setOutboundSite('천안 A공장 시공현장');
    setOutboundWorker('김철수 과장');
    setIsOutboundOpen(true);
  };

  // Submit Inbound (Create / Edit)
  const handleSaveSubmit = (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('자재/장비명을 입력해 주세요.');
      return;
    }

    const stockNum = parseInt(formStock, 10) || 0;
    const minStockNum = parseInt(formMinStock, 10) || 0;
    const isShortage = stockNum <= minStockNum;

    const itemData = {
      id: editingItem ? editingItem.id : Date.now(),
      code: editingItem ? editingItem.code : `INV-${formCategory.slice(0, 3).toUpperCase()}-${String(inventory.length + 10).padStart(3, '0')}`,
      name: formName.trim(),
      category: formCategory,
      stock: stockNum,
      minStock: minStockNum,
      unit: formUnit,
      location: formLocation.trim() || '본사 자재실',
      price: formPrice.trim() || '미정',
      status: isShortage ? '재입고필요' : '적정',
      badgeClass: isShortage ? 'badge-urgent' : 'badge-active'
    };

    if (editingItem) {
      const updated = inventory.map(item => item.id === editingItem.id ? itemData : item);
      saveInventory(updated);
      alert('자재/장비 수량 및 정보가 수정되었습니다.');
    } else {
      const updated = [itemData, ...inventory];
      saveInventory(updated);
      alert('새로운 자재/장비가 입고 등록되었습니다.');
    }

    setIsModalOpen(false);
  };

  // Process Outbound Dispatch
  const handleOutboundSubmit = (e) => {
    e.preventDefault();
    if (!selectedOutboundItem) return;

    const qty = parseInt(outboundQty, 10) || 0;
    if (qty > selectedOutboundItem.stock) {
      alert(`출고 요청 수량(${qty})이 현재 재고 수량(${selectedOutboundItem.stock})보다 많습니다.`);
      return;
    }

    const newStock = selectedOutboundItem.stock - qty;
    const isShortage = newStock <= selectedOutboundItem.minStock;

    const updated = inventory.map(item => {
      if (item.id === selectedOutboundItem.id) {
        return {
          ...item,
          stock: newStock,
          status: isShortage ? '재입고필요' : '적정',
          badgeClass: isShortage ? 'badge-urgent' : 'badge-active'
        };
      }
      return item;
    });

    saveInventory(updated);
    alert(`[${selectedOutboundItem.name}] ${qty}${selectedOutboundItem.unit}가 ${outboundSite}로 출고 처리되었습니다.`);
    setIsOutboundOpen(false);
  };

  // Delete Item
  const handleDeleteItem = (id) => {
    if (confirm('이 자재/장비 항목을 완전히 삭제하시겠습니까?')) {
      const updated = inventory.filter(item => item.id !== id);
      saveInventory(updated);
    }
  };

  // Filtering Logic
  const filteredInventory = inventory.filter(item => {
    let catMatch = true;
    if (activeCategory === 'shortage') {
      catMatch = item.stock <= item.minStock;
    } else if (activeCategory !== 'all') {
      catMatch = item.category === activeCategory;
    }

    const searchMatch = !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());

    return catMatch && searchMatch;
  });

  return (
    <div>
      {/* Header */}
      <header className="portal-header" style={{ marginBottom: '1.2rem' }}>
        <div>
          <h1 className="portal-title">📦 자재 & 장비 관리 (Inventory Hub)</h1>
          <p className="portal-subtitle">UTP/광케이블, 네트워크 스위치, IP폰, 융착접합기 수량 모니터링 및 현장 출고 관리</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-accent" onClick={handleOpenCreateModal}>+ 자재/장비 입고 등록</button>
        </div>
      </header>

      {/* KPI Inventory Cards */}
      <div className="grid-stats" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">전체 보유 품목</div>
          <div className="stat-value" style={{ color: '#00B4D8' }}>{inventory.length} <span style={{ fontSize: '1rem' }}>종</span></div>
          <div className="stat-desc" style={{ color: '#aaa' }}>케이블, 스위치, 장비 포함</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">UTP / 광케이블 보유 수량</div>
          <div className="stat-value" style={{ color: '#38B000' }}>
            {inventory.filter(i => i.category === '케이블/배선').reduce((acc, cur) => acc + cur.stock, 0)} <span style={{ fontSize: '1rem' }}>단위</span>
          </div>
          <div className="stat-desc" style={{ color: '#aaa' }}>자재실 A-1, A-2 보관 중</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">⚠️ 재입고 필요 품목 (재고 부족)</div>
          <div className="stat-value" style={{ color: '#E63946' }}>
            {inventory.filter(i => i.stock <= i.minStock).length} <span style={{ fontSize: '1rem' }}>종</span>
          </div>
          <div className="stat-desc" style={{ color: '#E63946' }}>⚡ 안전재고 미달 품목</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          <button 
            className={`btn ${activeCategory === 'all' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveCategory('all')}
            style={{ fontSize: '0.85rem' }}
          >
            전체 품목 ({inventory.length})
          </button>
          <button 
            className={`btn ${activeCategory === '케이블/배선' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveCategory('케이블/배선')}
            style={{ fontSize: '0.85rem' }}
          >
            🔌 케이블/배선
          </button>
          <button 
            className={`btn ${activeCategory === '네트워크 스위치' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveCategory('네트워크 스위치')}
            style={{ fontSize: '0.85rem' }}
          >
            🌐 네트워크 스위치
          </button>
          <button 
            className={`btn ${activeCategory === 'IPT/IP전화기' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveCategory('IPT/IP전화기')}
            style={{ fontSize: '0.85rem' }}
          >
            📞 IPT/IP전화기
          </button>
          <button 
            className={`btn ${activeCategory === '시공/측정 장비' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveCategory('시공/측정 장비')}
            style={{ fontSize: '0.85rem' }}
          >
            🛠️ 시공/측정 장비
          </button>
          <button 
            className={`btn ${activeCategory === 'shortage' ? 'btn-accent' : 'btn-secondary'}`}
            onClick={() => setActiveCategory('shortage')}
            style={{ fontSize: '0.85rem', color: activeCategory === 'shortage' ? '#fff' : '#E63946' }}
          >
            ⚠️ 재고부족 ({inventory.filter(i => i.stock <= i.minStock).length})
          </button>
        </div>

        {/* Search */}
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="자재/장비명/보관위치 검색..."
          style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', fontSize: '0.82rem', width: '220px' }}
        />
      </div>

      {/* Inbound Create / Edit Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-card)' }}>
            <div className="panel-header">
              <h2 className="panel-title">{editingItem ? '✏️ 자재/장비 수량 및 정보 수정' : '➕ 신규 자재/장비 입고 등록'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleSaveSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>자재 / 장비명 *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: LS 전선 UTP Cat.6 케이블 (305m Box)"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>분류 카테고리</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white' }}
                  >
                    <option value="케이블/배선">🔌 케이블/배선</option>
                    <option value="네트워크 스위치">🌐 네트워크 스위치</option>
                    <option value="IPT/IP전화기">📞 IPT/IP전화기</option>
                    <option value="시공/측정 장비">🛠️ 시공/측정 장비</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>수량 단위</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    placeholder="예: Box, 대, Spool, 세트"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>현재 재고 수량 *</label>
                  <input
                    type="number"
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>안전 재고 수량 (경고 기준)</label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>보관 위치</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="예: 본사 자재실 A-1"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>단가 / 참고 금액</label>
                  <input
                    type="text"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    placeholder="예: 145,000원"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">{editingItem ? '수정 완료' : '입고 등록'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Outbound Dispatch Modal */}
      {isOutboundOpen && selectedOutboundItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(5px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
        }}>
          <div className="panel" style={{ width: '100%', maxWidth: '520px', background: 'var(--bg-card)' }}>
            <div className="panel-header">
              <h2 className="panel-title">📤 시공 현장 출고 승인 처리</h2>
              <button onClick={() => setIsOutboundOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
            </div>

            <form onSubmit={handleOutboundSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'rgba(0,180,216,0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(0,180,216,0.3)' }}>
                <div style={{ fontSize: '0.8rem', color: '#aaa' }}>출고 자재:</div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginTop: '0.2rem' }}>{selectedOutboundItem.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-accent)', marginTop: '0.4rem' }}>
                  현재 보유 재고: <strong>{selectedOutboundItem.stock} {selectedOutboundItem.unit}</strong>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>출고 요청 수량 ({selectedOutboundItem.unit}) *</label>
                <input
                  type="number"
                  min="1"
                  max={selectedOutboundItem.stock}
                  value={outboundQty}
                  onChange={(e) => setOutboundQty(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--color-accent)', color: 'white', fontWeight: 700, fontSize: '1.1rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>출고 목적지 / 현장명 *</label>
                <input
                  type="text"
                  value={outboundSite}
                  onChange={(e) => setOutboundSite(e.target.value)}
                  placeholder="예: 천안 A공장 생산라인 2구역 현장"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>불출 수령 담당자</label>
                <input
                  type="text"
                  value={outboundWorker}
                  onChange={(e) => setOutboundWorker(e.target.value)}
                  placeholder="예: 김철수 과장"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsOutboundOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">📤 출고 승인 처리</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Data Table */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">📋 보유 자재 및 장비 현황</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>총 {filteredInventory.length}건 목록</span>
        </div>

        <table className="data-table">
          <thead>
            <tr>
              <th>관리코드</th>
              <th>자재/장비명</th>
              <th>분류</th>
              <th>보유 재고량</th>
              <th>안전재고</th>
              <th>보관 위치</th>
              <th>단가</th>
              <th>상태</th>
              <th style={{ width: '150px', textAlign: 'center' }}>출고 및 관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600, color: 'var(--color-accent)', fontSize: '0.85rem' }}>{item.code}</td>
                  <td style={{ fontWeight: 600, color: '#fff' }}>{item.name}</td>
                  <td>
                    <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      {item.category}
                    </span>
                  </td>
                  <td>
                    <strong style={{ fontSize: '1rem', color: item.stock <= item.minStock ? '#E63946' : '#00B4D8' }}>
                      {item.stock} {item.unit}
                    </strong>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#aaa' }}>{item.minStock} {item.unit}</td>
                  <td style={{ fontSize: '0.85rem' }}>{item.location}</td>
                  <td style={{ fontSize: '0.85rem' }}>{item.price}</td>
                  <td><span className={`badge ${item.badgeClass}`}>{item.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                      <button onClick={() => handleOpenOutboundModal(item)} className="btn btn-accent" style={{ padding: '0.25rem 0.55rem', fontSize: '0.75rem' }}>
                        📤 출고
                      </button>
                      <button onClick={() => handleOpenEditModal(item)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}>
                        ✏️
                      </button>
                      <button onClick={() => handleDeleteItem(item.id)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#E63946' }}>
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#aaa' }}>
                  등록된 자재/장비 품목이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
