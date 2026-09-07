'use client';
import Link from 'next/link';

import React from 'react';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('Caught by ErrorBoundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: '#ffebee', color: '#b71c1c', borderRadius: '8px' }}>
          <h2>🚨 에러 발생 (상세 내용)</h2>
          <p><strong>Message:</strong> {this.state.error?.message}</p>
          <details style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
            <summary>Stack Trace</summary>
            {this.state.error?.stack}
          </details>
          <details style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>
            <summary>Component Stack</summary>
            {this.state.errorInfo?.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}


import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

const CONTRACT_STATUSES = ['유지보수 계약중', '프로젝트 진행중', '계약 완료', '상담중'];

function ClientDetailPageComponent() {
  const routeParams = useParams();
  const router = useRouter();
  const rawId = routeParams?.id;
  const clientId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { currentUser } = useAuth();

  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState([]);

  // Active Tab: 'info' | 'history' | 'network' | 'docs' | 'inspections'
  const [activeTab, setActiveTab] = useState('info');

  // Work History State
  const [history, setHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('전체');
  const [historySearch, setHistorySearch] = useState('');
  const [historyLoading, setHistoryLoading] = useState(false);

  // Client Documents State
  const [documents, setDocuments] = useState([]);
  const [docFilter, setDocFilter] = useState('전체');
  const [docSearch, setDocSearch] = useState('');
  const [docsLoading, setDocsLoading] = useState(false);

  // Document Upload Modal State
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('계약서');
  const [docDescription, setDocDescription] = useState('');
  const [docFile, setDocFile] = useState(null);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Inspection States (Templates & Scans)
  const [inspectionTemplates, setInspectionTemplates] = useState([]);
  const [inspectionScans, setInspectionScans] = useState([]);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);

  // Template Upload Modal State
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateFile, setTemplateFile] = useState(null);
  const [uploadingTemplate, setUploadingTemplate] = useState(false);

  // Scan Report Upload Modal State
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanTitle, setScanTitle] = useState('');
  const [scanDate, setScanDate] = useState(new Date().toISOString().split('T')[0]);
  const [scanInspector, setScanInspector] = useState('');
  const [scanMemo, setScanMemo] = useState('');
  const [scanFile, setScanFile] = useState(null);
  const [uploadingScan, setUploadingScan] = useState(false);

  // Edit Basic Profile Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formIndustry, setFormIndustry] = useState('');
  const [formContacts, setFormContacts] = useState([]);
  const [formAddress, setFormAddress] = useState('');
  const [formContractStatus, setFormContractStatus] = useState('유지보수 계약중');
  const [formContractDate, setFormContractDate] = useState('');
  const [formEngineerPrimary, setFormEngineerPrimary] = useState('');
  const [formEngineerSecondary, setFormEngineerSecondary] = useState('미지정');
  const [formMemo, setFormMemo] = useState('');
  const [formHasPeriodicInspection, setFormHasPeriodicInspection] = useState(true);
  const [formInspectionCycle, setFormInspectionCycle] = useState('매월');

  // Network & Maintenance Equipment Config State
  const [netConfig, setNetConfig] = useState({
    isp: '',
    ipSubnet: '',
    gateway: '',
    dnsPrimary: '',
    dnsSecondary: '',
    equipments: [],
    notes: ''
  });

  // Maintenance Equipment Filter & Search State
  const [equipFilter, setEquipFilter] = useState('전체');
  const [equipSearch, setEquipSearch] = useState('');

  // Single Equipment Add/Edit Modal State
  const [isEquipModalOpen, setIsEquipModalOpen] = useState(false);
  const [editingEquipIndex, setEditingEquipIndex] = useState(null);
  const [equipType, setEquipType] = useState('UTM 방화벽');
  const [equipModel, setEquipModel] = useState('');
  const [equipSerial, setEquipSerial] = useState('');
  const [equipIsContracted, setEquipIsContracted] = useState('계약');
  const [equipLocation, setEquipLocation] = useState('');
  const [equipMemo, setEquipMemo] = useState('');

  // Excel Batch Upload Modal State
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [excelParsedData, setExcelParsedData] = useState([]);
  const [excelImportMode, setExcelImportMode] = useState('append'); // 'append' | 'replace'

  // Fetch client details, users, documents & inspections
  useEffect(() => {
    if (clientId) {
      fetchClientDetail();
      fetchUsersFromAPI();
      fetchClientDocuments();
      fetchInspections();
    }
  }, [clientId]);

  const fetchClientDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clients');
      if (res.ok) {
        const data = await res.json();
        const found = data.find(c => String(c.id) === String(clientId));
        if (found) {
          setClient(found);
          setNotFound(false);
          initClientForms(found);
          fetchClientHistory(found.name);
        } else {
          setNotFound(true);
          setClient(null);
        }
      }
    } catch (e) {
      console.error('Fetch client detail error', e);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersFromAPI = async () => {
    try {
      const res = await fetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setRegisteredUsers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn('Fetch users error', e);
    }
  };

  const fetchClientHistory = async (clientName) => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/clients/history?clientName=${encodeURIComponent(clientName)}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Fetch history error', e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchClientDocuments = async () => {
    if (!clientId) return;
    setDocsLoading(true);
    try {
      const res = await fetch(`/api/clients/documents?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setDocuments(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Fetch client documents error', e);
    } finally {
      setDocsLoading(false);
    }
  };

  const fetchInspections = async () => {
    if (!clientId) return;
    setInspectionsLoading(true);
    try {
      const res = await fetch(`/api/clients/inspections?clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        const templates = Array.isArray(data.templates) ? data.templates : [];
        setInspectionTemplates(templates);

        // Sort scans by inspectionDate descending (most recent date first)
        const scans = Array.isArray(data.scans) ? data.scans : [];
        const sortedScans = scans.sort((a, b) => {
          const dateA = a.inspectionDate || a.inspection_date || '';
          const dateB = b.inspectionDate || b.inspection_date || '';
          if (dateA !== dateB) {
            return dateB.localeCompare(dateA); // Newest inspection date first
          }
          return (b.id || 0) - (a.id || 0);
        });

        setInspectionScans(sortedScans);
      }
    } catch (e) {
      console.error('Fetch inspections error', e);
    } finally {
      setInspectionsLoading(false);
    }
  };

  const handleUploadTemplate = async (e) => {
    e.preventDefault();
    if (!templateFile) {
      alert('점검서 양식 파일을 선택해주세요.');
      return;
    }

    setUploadingTemplate(true);
    try {
      const formData = new FormData();
      formData.append('file', templateFile);

      const uploadRes = await fetch('/api/clients/inspections/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('양식 파일 업로드 실패');
      const uploadData = await uploadRes.json();

      const payload = {
        type: 'template',
        clientId,
        title: templateTitle.trim() || `${client?.name || '고객사'} 정기점검 서식 양식`,
        fileName: uploadData.fileName,
        filePath: uploadData.filePath,
        fileSize: uploadData.fileSize,
        version: `v${inspectionTemplates.length + 1}.0`,
        uploadedBy: currentUser?.name || '담당자'
      };

      const metaRes = await fetch('/api/clients/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (metaRes.ok) {
        alert('신규 점검서 양식이 등록되었으며 최신 대표 양식으로 설정되었습니다!');
        setIsTemplateModalOpen(false);
        setTemplateTitle('');
        setTemplateFile(null);
        fetchInspections();
      } else {
        alert('양식 등록 실패');
      }
    } catch (err) {
      alert(`양식 등록 오류: ${err.message}`);
    } finally {
      setUploadingTemplate(false);
    }
  };

  const handleUploadScan = async (e) => {
    e.preventDefault();
    if (!scanFile) {
      alert('점검서 스캔본 파일을 선택해주세요.');
      return;
    }

    setUploadingScan(true);
    try {
      const formData = new FormData();
      formData.append('file', scanFile);

      const uploadRes = await fetch('/api/clients/inspections/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error('스캔본 파일 업로드 실패');
      const uploadData = await uploadRes.json();

      const payload = {
        type: 'scan',
        clientId,
        title: scanTitle.trim() || `${scanDate} 정기점검 완료 보고서`,
        inspectionDate: scanDate,
        inspector: scanInspector.trim() || currentUser?.name || '점검 엔지니어',
        fileName: uploadData.fileName,
        filePath: uploadData.filePath,
        fileSize: uploadData.fileSize,
        memo: scanMemo.trim(),
        uploadedBy: currentUser?.name || '담당자'
      };

      const metaRes = await fetch('/api/clients/inspections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (metaRes.ok) {
        alert('정기점검 스캔본 보고서가 정상적으로 등록되었습니다!');
        setIsScanModalOpen(false);
        setScanTitle('');
        setScanMemo('');
        setScanFile(null);
        fetchInspections();
      } else {
        alert('스캔본 등록 실패');
      }
    } catch (err) {
      alert(`스캔본 등록 오류: ${err.message}`);
    } finally {
      setUploadingScan(false);
    }
  };

  const handleDeleteInspectionItem = async (type, id, title) => {
    if (confirm(`'${title}' 항목을 삭제하시겠습니까?`)) {
      try {
        const res = await fetch(`/api/clients/inspections?type=${type}&id=${id}`, { method: 'DELETE' });
        if (res.ok) {
          alert('삭제되었습니다.');
          fetchInspections();
        }
      } catch (e) {
        console.error('Delete inspection item error', e);
      }
    }
  };

  const handleUploadDocument = async (e) => {
    e.preventDefault();
    if (!docTitle.trim()) {
      alert('문서 제목을 입력해주세요.');
      return;
    }
    if (!docFile) {
      alert('업로드할 파일 문서 선택이 필요합니다.');
      return;
    }

    setUploadingDoc(true);
    try {
      // 1. Upload File
      const formData = new FormData();
      formData.append('file', docFile);

      const uploadRes = await fetch('/api/clients/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) {
        const errData = await uploadRes.json();
        throw new Error(errData.error || '파일 업로드 실패');
      }

      const uploadData = await uploadRes.json();

      // 2. Save Document Metadata
      const payload = {
        clientId,
        title: docTitle.trim(),
        category: docCategory,
        fileName: uploadData.fileName,
        filePath: uploadData.filePath,
        fileSize: uploadData.fileSize,
        uploadedBy: currentUser?.name || '담당자',
        description: docDescription.trim()
      };

      const metaRes = await fetch('/api/clients/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (metaRes.ok) {
        alert('관리 문서가 등록되어 공유되었습니다!');
        setIsDocModalOpen(false);
        setDocTitle('');
        setDocCategory('계약서');
        setDocDescription('');
        setDocFile(null);
        fetchClientDocuments();
      } else {
        const errData = await metaRes.json();
        alert(`등록 실패: ${errData.error}`);
      }
    } catch (err) {
      alert(`문서 등록 오류: ${err.message}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDocument = async (docId, title) => {
    if (confirm(`'${title}' 공유 관리 문서를 삭제하시겠습니까?`)) {
      try {
        const res = await fetch(`/api/clients/documents?id=${docId}`, { method: 'DELETE' });
        if (res.ok) {
          alert('문서가 삭제되었습니다.');
          fetchClientDocuments();
        }
      } catch (e) {
        console.error('Delete document error', e);
      }
    }
  };

  const handleCopyLink = (filePath) => {
    const fullUrl = `${window.location.origin}${filePath}`;
    navigator.clipboard.writeText(fullUrl);
    alert(`다운로드 공유 링크가 클립보드에 복사되었습니다!{eq.type ||{eq.type || '기타 장비'}n${fullUrl}`);
  };

  const initClientForms = (cli) => {
    if (!cli) return;
    setFormName(cli.name || '');
    setFormIndustry(cli.industry || '');

    let normalizedContacts = [];
    if (Array.isArray(cli.contacts) && cli.contacts.length > 0) {
      normalizedContacts = cli.contacts.map(c => {
        if (typeof c === 'string') return { name: c, rank: '', phone: '', email: '', duty: '담당자' };
        if (c && typeof c === 'object') return { name: c.name || '담당자', rank: c.rank || '', phone: c.phone || '', email: c.email || '', duty: c.duty || '담당자' };
        return { name: '담당자', rank: '', phone: '', email: '', duty: '담당자' };
      });
    } else if (cli.contact_name || cli.contact_phone || cli.contact_email) {
      normalizedContacts = [{
        name: cli.contact_name || '',
        rank: '',
        phone: cli.contact_phone || '',
        email: cli.contact_email || '',
        duty: '대표 담당자'
      }];
    } else {
      normalizedContacts = [{ name: '', rank: '', phone: '', email: '', duty: '대표 담당자' }];
    }

    setFormContacts(normalizedContacts);
    setFormAddress(cli.address || '');
    setFormContractStatus(cli.contract_status || '유지보수 계약중');
    setFormContractDate(cli.contract_date || new Date().toISOString().split('T')[0]);
    setFormEngineerPrimary(cli.engineer_primary || cli.assigned_pm || '담당자');
    setFormEngineerSecondary(cli.engineer_secondary || '미지정');
    setFormMemo(cli.memo || '');
    setFormHasPeriodicInspection(cli.has_periodic_inspection === 1);
    setFormInspectionCycle(cli.inspection_cycle || '매월');

    let cfg = {};
    if (typeof cli.network_config === 'string') {
      try { cfg = JSON.parse(cli.network_config); } catch(e) {}
    } else if (typeof cli.network_config === 'object' && cli.network_config !== null) {
      cfg = cli.network_config;
    }
    
    let rawEquipments = [];
    if (Array.isArray(cfg.equipments)) {
      rawEquipments = cfg.equipments.map(eq => {
        if (typeof eq === 'string') return { type: '기타 장비', model: eq, serial: '', isContracted: '계약', location: '', memo: '' };
        if (eq && typeof eq === 'object') {
          return {
            type: eq.type || eq.name || '기타 장비',
            model: eq.model || '',
            serial: eq.serial || '',
            isContracted: eq.isContracted || '계약',
            location: eq.location || '',
            memo: eq.memo || ''
          };
        }
        return { type: '기타 장비', model: '', serial: '', isContracted: '계약', location: '', memo: '' };
      });
    }

    setNetConfig({
      isp: cfg.isp || 'KT 전용회선 (1G)',
      ipSubnet: cfg.ipSubnet || '192.168.0.0/24',
      gateway: cfg.gateway || '192.168.0.1',
      dnsPrimary: cfg.dnsPrimary || '168.126.63.1',
      dnsSecondary: cfg.dnsSecondary || '168.126.63.2',
      equipments: rawEquipments,
      notes: cfg.notes || ''
    });
  };

  // Engineer user list (excluding master admin)
  const engineerUsers = (registeredUsers || []).filter(u => (u?.id || '').toLowerCase() !== 'netadmin' && u?.name !== '마스터 관리자' && u?.role !== '마스터 관리자');

  // Contact helper handlers
  const handleAddContact = () => {
    setFormContacts([...formContacts, { name: '', rank: '', phone: '', email: '', duty: '담당자' }]);
  };

  const handleRemoveContact = (idx) => {
    if (formContacts.length === 1) return;
    setFormContacts(formContacts.filter((_, i) => i !== idx));
  };

  const handleContactChange = (idx, field, val) => {
    const updated = [...formContacts];
    updated[idx][field] = val;
    setFormContacts(updated);
  };

  // Save Basic Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert('고객사명을 입력해주세요.');
      return;
    }

    const payload = {
      id: client.id,
      name: formName.trim(),
      industry: formIndustry.trim(),
      contacts: formContacts.filter(c => c.name.trim() || c.phone.trim()),
      address: formAddress.trim(),
      contract_status: formContractStatus,
      contract_date: formContractDate,
      engineer_primary: formEngineerPrimary,
      engineer_secondary: formEngineerSecondary,
      memo: formMemo.trim(),
      network_config: netConfig,
      has_periodic_inspection: formHasPeriodicInspection ? 1 : 0,
      inspection_cycle: formInspectionCycle
    };

    try {
      const res = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('고객사 기본 정보가 수정되었습니다.');
        setIsEditModalOpen(false);
        fetchClientDetail();
      } else {
        alert('수정 실패');
      }
    } catch (err) {
      alert(`수정 오류: ${err.message}`);
    }
  };

  // DB Save Helper for Maintenance Equipments
  const saveEquipmentsToDB = async (configToSave) => {
    const payload = {
      id: client.id,
      name: client.name,
      industry: client.industry,
      contacts: client.contacts,
      address: client.address,
      contract_status: client.contract_status,
      contract_date: client.contract_date,
      engineer_primary: client.engineer_primary,
      engineer_secondary: client.engineer_secondary,
      memo: client.memo,
      network_config: configToSave
    };

    try {
      const res = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        fetchClientDetail();
      } else {
        alert('유지보수 장비 정보 저장 실패');
      }
    } catch (err) {
      alert(`저장 오류: ${err.message}`);
    }
  };

  // Open Single Equipment Add Modal
  const handleOpenAddEquipModal = () => {
    setEditingEquipIndex(null);
    setEquipType('UTM 방화벽');
    setEquipModel('');
    setEquipSerial('');
    setEquipIsContracted('계약');
    setEquipLocation('');
    setEquipMemo('');
    setIsEquipModalOpen(true);
  };

  // Open Single Equipment Edit Modal
  const handleOpenEditEquipModal = (index) => {
    const item = netConfig.equipments[index];
    if (!item) return;
    setEditingEquipIndex(index);
    setEquipType(item.type || item.name || 'UTM 방화벽');
    setEquipModel(item.model || '');
    setEquipSerial(item.serial || '');
    setEquipIsContracted(item.isContracted || '계약');
    setEquipLocation(item.location || '');
    setEquipMemo(item.memo || '');
    setIsEquipModalOpen(true);
  };

  // Save Single Equipment Item (Add or Edit)
  const handleSaveSingleEquip = async () => {
    if (!equipModel.trim() && !equipSerial.trim()) {
      alert('모델명 또는 시리얼 번호를 입력해주세요.');
      return;
    }

    const newItem = {
      type: equipType.trim(),
      model: equipModel.trim(),
      serial: equipSerial.trim(),
      isContracted: equipIsContracted,
      location: equipLocation.trim(),
      memo: equipMemo.trim()
    };

    let updatedEquipments = [...netConfig.equipments];
    if (editingEquipIndex !== null) {
      updatedEquipments[editingEquipIndex] = newItem;
    } else {
      updatedEquipments.push(newItem);
    }

    const updatedConfig = { ...netConfig, equipments: updatedEquipments };
    setNetConfig(updatedConfig);
    setIsEquipModalOpen(false);

    await saveEquipmentsToDB(updatedConfig);
  };

  // Remove Single Equipment Item
  const handleRemoveEquip = async (index) => {
    if (confirm('선택한 유지보수 대상 장비를 목록에서 삭제하시겠습니까?')) {
      const updatedEquipments = netConfig.equipments.filter((_, idx) => idx !== index);
      const updatedConfig = { ...netConfig, equipments: updatedEquipments };
      setNetConfig(updatedConfig);
      await saveEquipmentsToDB(updatedConfig);
    }
  };

  // Toggle Contracted Status (계약 <-> 미계약)
  const handleToggleContractStatus = async (index) => {
    const updatedEquipments = [...netConfig.equipments];
    const curr = updatedEquipments[index].isContracted || '계약';
    updatedEquipments[index].isContracted = (curr === '계약') ? '미계약' : '계약';

    const updatedConfig = { ...netConfig, equipments: updatedEquipments };
    setNetConfig(updatedConfig);
    await saveEquipmentsToDB(updatedConfig);
  };

  // Excel Template Download Function (Dynamic import with CSV fallback)
  const handleDownloadExcelTemplate = async () => {
    const templateData = [
      {
        '장비명': 'UTM 방화벽',
        '모델명': 'FortiGate 100F',
        '시리얼 번호': 'FG100F-8821941',
        '실제 계약 여부': '계약',
        '설치 위치': '3층 메인 서버실 랙 1',
        '비고': '2026년 정기점검 대상'
      },
      {
        '장비명': '백본 스위치',
        '모델명': 'Cisco Catalyst 9300',
        '시리얼 번호': 'C9300-48P-0012',
        '실제 계약 여부': '계약',
        '설치 위치': '3층 메인 서버실 랙 1',
        '비고': '유지보수 계약 포함'
      },
      {
        '장비명': '무선 AP',
        '모델명': 'Aruba AP-505',
        '시리얼 번호': 'AP505-998123',
        '실제 계약 여부': '미계약',
        '설치 위치': '2층 전구역',
        '비고': '신규 구매 검토 중'
      }
    ];

    const safeClientName = client?.name ? client.name.replace(/[/{eq.type ||{eq.type || '기타 장비'}{eq.type ||{eq.type || '기타 장비'}?%*:|"<>]/g, '_') : '고객사';

    try {
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(templateData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '유지보수대상장비양식');

      worksheet['!cols'] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 22 },
        { wch: 15 },
        { wch: 25 },
        { wch: 25 }
      ];

      XLSX.writeFile(workbook, `유지보수_대상장비_업로드양식_${safeClientName}.xlsx`);
    } catch (e) {
      console.warn('Dynamic XLSX import fallback to CSV', e);
      const headers = ['장비명', '모델명', '시리얼 번호', '실제 계약 여부', '설치 위치', '비고'];
      const csvRows = [
        headers.join(','),
        ...templateData.map(row => headers.map(h => `"${(row[h] || '').replace(/"/g, '""')}"`).join(','))
      ];
      const csvContent = '{eq.type ||{eq.type || '기타 장비'}uFEFF' + csvRows.join('{eq.type ||{eq.type || '기타 장비'}n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `유지보수_대상장비_업로드양식_${safeClientName}.csv`;
      link.click();
    }
  };

  // Excel File Input Change Handler (Dynamic import with CSV fallback)
  const handleExcelFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let parsed = [];
      try {
        const XLSX = await import('xlsx');
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: 'array' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        parsed = data.map((row) => {
          const type = row['장비명'] || row['장비 구분'] || row['구분'] || row['장비'] || row['type'] || '기타 장비';
          const model = row['모델명'] || row['모델'] || row['model'] || '';
          const serial = row['시리얼 번호'] || row['시리얼번호'] || row['시리얼'] || row['S/N'] || row['SN'] || row['serial'] || '';
          const isContractedRaw = String(row['실제 계약 여부'] || row['계약 여부'] || row['계약여부'] || row['계약 상태'] || row['계약'] || '계약').trim();
          const isContracted = (isContractedRaw.includes('미계약') || isContractedRaw.includes('N') || isContractedRaw === 'false') ? '미계약' : '계약';
          const location = row['설치 위치'] || row['설치위치'] || row['위치'] || row['location'] || '';
          const memo = row['비고'] || row['메모'] || row['notes'] || row['memo'] || '';

          return {
            type: String(type).trim(),
            model: String(model).trim(),
            serial: String(serial).trim(),
            isContracted,
            location: String(location).trim(),
            memo: String(memo).trim()
          };
        }).filter(item => item.model || item.serial || item.type);
      } catch (xlsxErr) {
        console.warn('XLSX import failed, parsing as text/CSV:', xlsxErr);
        const text = await file.text();
        const lines = text.split(/{eq.type ||{eq.type || '기타 장비'}r?{eq.type ||{eq.type || '기타 장비'}n/).filter(line => line.trim());
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.replace(/^["']|["']$/g, '').trim());
          parsed = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.replace(/^["']|["']$/g, '').trim());
            const getVal = (keyName) => {
              const idx = headers.findIndex(h => h.includes(keyName));
              return idx >= 0 ? values[idx] || '' : '';
            };
            const type = getVal('장비') || getVal('구분') || '기타 장비';
            const model = getVal('모델');
            const serial = getVal('시리얼') || getVal('S/N') || getVal('SN');
            const isContractedRaw = getVal('계약');
            const isContracted = isContractedRaw.includes('미계약') ? '미계약' : '계약';
            const location = getVal('위치');
            const memo = getVal('비고') || getVal('메모');

            return { type, model, serial, isContracted, location, memo };
          }).filter(item => item.model || item.serial || item.type);
        }
      }

      if (parsed.length === 0) {
        alert('엑셀 또는 CSV 파일에서 유효한 장비 데이터를 찾을 수 없습니다.');
        return;
      }

      setExcelParsedData(parsed);
      setIsExcelModalOpen(true);
    } catch (err) {
      alert(`파일 파싱 오류: ${err.message}`);
    }

    e.target.value = '';
  };

  // Confirm Excel Batch Import
  const handleConfirmExcelImport = async () => {
    if (excelParsedData.length === 0) {
      alert('업로드할 장비 데이터가 없습니다.');
      return;
    }

    let updatedEquipments = [];
    if (excelImportMode === 'replace') {
      updatedEquipments = [...excelParsedData];
    } else {
      updatedEquipments = [...netConfig.equipments, ...excelParsedData];
    }

    const updatedConfig = { ...netConfig, equipments: updatedEquipments };
    setNetConfig(updatedConfig);

    await saveEquipmentsToDB(updatedConfig);
    alert(`엑셀 장비 데이터 ${excelParsedData.length}건이 성공적으로 ${excelImportMode === 'replace' ? '덮어쓰기' : '추가'} 저장되었습니다.`);
    setIsExcelModalOpen(false);
    setExcelParsedData([]);
  };

  // Delete Client
  const handleDeleteClient = async () => {
    if (confirm(`'${client.name}' 고객사를 삭제하시겠습니까? 관련 데이터는 복구할 수 없습니다.`)) {
      try {
        const res = await fetch(`/api/clients?id=${encodeURIComponent(client.id)}`, { method: 'DELETE' });
        if (res.ok) {
          alert('고객사가 삭제되었습니다.');
          router.push('/clients');
        }
      } catch (e) {
        console.error('Delete error', e);
      }
    }
  };

  // History Filtering
  const filteredHistory = history.filter(h => {
    const typeMatch = historyFilter === '전체' || (h.category || '').includes(historyFilter);
    const searchMatch = !historySearch.trim() ||
      (h.title || '').toLowerCase().includes(historySearch.toLowerCase()) ||
      (h.content || '').toLowerCase().includes(historySearch.toLowerCase()) ||
      (h.workers || []).some(w => String(w || '').toLowerCase().includes(historySearch.toLowerCase()));

    return typeMatch && searchMatch;
  });

  // Client Document Filtering
  const filteredDocuments = documents.filter(doc => {
    const categoryMatch = docFilter === '전체' || doc.category === docFilter;
    const searchMatch = !docSearch.trim() ||
      (doc.title || '').toLowerCase().includes(docSearch.toLowerCase()) ||
      (doc.fileName || '').toLowerCase().includes(docSearch.toLowerCase()) ||
      (doc.description || '').toLowerCase().includes(docSearch.toLowerCase()) ||
      (doc.uploadedBy || '').toLowerCase().includes(docSearch.toLowerCase());

    return categoryMatch && searchMatch;
  });

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#aaa' }}>
        고객사 상세 정보를 불러오는 중...
      </div>
    );
  }

  if (notFound || !client) {
    return (
      <div className="panel" style={{ padding: '4rem 2rem', textAlign: 'center', margin: '2rem 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <h2 style={{ fontSize: '1.4rem', color: '#E63946', marginBottom: '0.8rem', fontWeight: 800 }}>
          요청하신 고객사 정보를 찾을 수 없습니다
        </h2>
        <p style={{ color: '#aaa', marginBottom: '1.75rem', fontSize: '0.95rem' }}>
          고객사 ID(<strong>#{clientId}</strong>)가 존재하지 않거나 삭제되었을 수 있습니다.
        </p>
        <Link href="/clients" className="btn btn-accent" style={{ textDecoration: 'none', padding: '0.75rem 1.6rem', fontWeight: 700 }}>
          📋 고객사 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Top Breadcrumb & Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/clients" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}>
          ◀ 고객사 목록으로 돌아가기
        </Link>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => setIsEditModalOpen(true)} className="btn btn-accent" style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem' }}>
            ✏️ 정보 수정
          </button>
          <Link href="/maintenance" className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: '0.85rem', padding: '0.5rem 0.9rem', color: '#E63946', borderColor: '#E63946' }}>
            🚨 장애/유지보수 접수
          </Link>
          <button onClick={handleDeleteClient} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem', color: '#aaa' }}>
            🗑️ 삭제
          </button>
        </div>
      </div>

      {/* Main Client Header Panel */}
      <div className="panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg, rgba(11,19,43,0.9) 0%, rgba(27,38,59,0.9) 100%)', borderLeft: '6px solid var(--color-accent)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: 'var(--color-primary)', color: '#fff', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                {client.code}
              </span>
              <span className="badge" style={{ background: client.contract_status === '유지보수 계약중' ? 'rgba(56,176,0,0.25)' : 'rgba(255,183,3,0.25)', color: client.contract_status === '유지보수 계약중' ? '#38B000' : '#FFB703', fontSize: '0.8rem', fontWeight: 700 }}>
                ● {client.contract_status}
              </span>
              <span className="badge" style={{
                background: client.has_periodic_inspection === 1 ? 'rgba(157,78,221,0.25)' : 'rgba(255,255,255,0.08)',
                color: client.has_periodic_inspection === 1 ? '#C77DFF' : '#aaa',
                border: client.has_periodic_inspection === 1 ? '1px solid rgba(157,78,221,0.4)' : 'none',
                fontSize: '0.8rem',
                fontWeight: 700
              }}>
                🔄 {client.has_periodic_inspection === 1 ? `정기점검 진행 (${client.inspection_cycle || '매월'})` : '정기점검 미대상'}
              </span>
              {client.industry && (
                <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)', color: '#ddd', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                  {client.industry}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              🏢 {client.name}
            </h1>
            <p style={{ color: '#aaa', fontSize: '0.9rem', marginTop: '0.4rem', margin: 0 }}>📍 사업장 주소: <strong style={{ color: '#fff' }}>{client.address || '주소 미등록'}</strong></p>
          </div>

          {/* Quick Contact & PM Summary Card */}
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.85rem 1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div>
                <span style={{ color: '#00B4D8', fontWeight: 700, display: 'block' }}>👤 전담 엔지니어 (정)</span>
                <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{client.engineer_primary || '미지정'}</strong>
              </div>
              <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                <span style={{ color: '#aaa', fontWeight: 600, display: 'block' }}>👤 전담 엔지니어 (부)</span>
                <strong style={{ color: '#ddd', fontSize: '0.95rem' }}>{client.engineer_secondary || '미지정'}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Overview Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="panel" style={{ padding: '1rem', background: 'rgba(0,180,216,0.06)', borderLeft: '4px solid #00B4D8' }}>
          <div style={{ fontSize: '0.78rem', color: '#aaa' }}>등록 담당자</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
            {Array.isArray(client.contacts) ? client.contacts.length : 1} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>명</span>
          </div>
        </div>

        <div className="panel" style={{ padding: '1rem', background: 'rgba(56,176,0,0.06)', borderLeft: '4px solid #38B000' }}>
          <div style={{ fontSize: '0.78rem', color: '#aaa' }}>수행 작업 이력</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38B000', marginTop: '0.2rem' }}>
            {(history || []).length} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>건</span>
          </div>
        </div>

        <div className="panel" style={{ padding: '1rem', background: 'rgba(255,183,3,0.06)', borderLeft: '4px solid #FFB703' }}>
          <div style={{ fontSize: '0.78rem', color: '#aaa' }}>유지보수 대상 장비</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#FFB703', marginTop: '0.2rem' }}>
            {(netConfig?.equipments || []).length} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>대</span>
          </div>
        </div>

        <div className="panel" style={{ padding: '1rem', background: 'rgba(157,78,221,0.06)', borderLeft: '4px solid #9D4EDD' }}>
          <div style={{ fontSize: '0.78rem', color: '#aaa' }}>점검서 스캔본</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#C77DFF', marginTop: '0.2rem' }}>
            {(inspectionScans || []).length} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>건</span>
          </div>
        </div>

        <div className="panel" style={{ padding: '1rem', background: 'rgba(0,180,216,0.06)', borderLeft: '4px solid #00B4D8' }}>
          <div style={{ fontSize: '0.78rem', color: '#aaa' }}>공유 관리 문서</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#00B4D8', marginTop: '0.2rem' }}>
            {(documents || []).length} <span style={{ fontSize: '0.85rem', fontWeight: 400 }}>건</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('info')}
          className={`btn ${activeTab === 'info' ? 'btn-accent' : 'btn-secondary'}`}
          style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem', fontWeight: 700 }}
        >
          📋 고객사 프로필 & 👥 담당자 관리
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`btn ${activeTab === 'history' ? 'btn-accent' : 'btn-secondary'}`}
          style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem', fontWeight: 700 }}
        >
          🛠️ 통합 작업 & 장애 처리 이력 ({history.length}건)
        </button>
        <button
          onClick={() => setActiveTab('network')}
          className={`btn ${activeTab === 'network' ? 'btn-accent' : 'btn-secondary'}`}
          style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem', fontWeight: 700 }}
        >
          🌐 유지보수 대상 장비
        </button>
        <button
          onClick={() => setActiveTab('inspections')}
          className={`btn ${activeTab === 'inspections' ? 'btn-accent' : 'btn-secondary'}`}
          style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem', fontWeight: 700, background: activeTab === 'inspections' ? '#9D4EDD' : undefined, borderColor: activeTab === 'inspections' ? '#9D4EDD' : undefined }}
        >
          🔍 정기점검 & 스캔본 관리 ({inspectionScans.length}건)
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`btn ${activeTab === 'docs' ? 'btn-accent' : 'btn-secondary'}`}
          style={{ fontSize: '0.9rem', padding: '0.6rem 1.25rem', fontWeight: 700 }}
        >
          📁 관리 문서 공유 ({documents.length}건)
        </button>
      </div>

      {/* TAB 1: Profile & Contacts */}
      {activeTab === 'info' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Contacts Section */}
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.1rem' }}>👥 고객사 담당자 목록 ({formContacts.length}명)</h2>
              <button onClick={() => setIsEditModalOpen(true)} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '0.3rem 0.65rem' }}>
                ✏️ 담당자 추가/수정
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {formContacts.map((cnt, i) => (
                <div key={i} style={{ background: 'var(--bg-main)', padding: '1.1rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <strong style={{ fontSize: '1.05rem', color: '#fff' }}>{cnt.name || '담당자'}</strong>
                        {cnt.rank && (
                          <span style={{ fontSize: '0.8rem', color: '#00B4D8', fontWeight: 600 }}>
                            {cnt.rank}
                          </span>
                        )}
                      </div>
                      {cnt.duty && (
                        <span style={{ fontSize: '0.78rem', background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>
                          {cnt.duty}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#aaa', display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.75rem' }}>
                      {cnt.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>📞</span> <a href={`tel:${cnt.phone}`} style={{ color: '#fff', textDecoration: 'none', fontWeight: 600 }}>{cnt.phone}</a>
                        </div>
                      )}
                      {cnt.email && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>✉️</span> <a href={`mailto:${cnt.email}`} style={{ color: '#00B4D8', textDecoration: 'none' }}>{cnt.email}</a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.75rem' }}>
                    {cnt.phone && (
                      <a href={`tel:${cnt.phone}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: '0.78rem', padding: '0.35rem' }}>
                        📞 전화연결
                      </a>
                    )}
                    {cnt.email && (
                      <a href={`mailto:${cnt.email}`} className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none', fontSize: '0.78rem', padding: '0.35rem' }}>
                        ✉️ 이메일 작성
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Profile Cards */}
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.1rem' }}>📋 계약 및 고객사 세부 프로필</h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                <div><span style={{ color: '#aaa' }}>고객사 코드:</span> <strong style={{ color: '#fff', fontFamily: 'monospace' }}>{client.code}</strong></div>
                <div><span style={{ color: '#aaa' }}>업종 분류:</span> <strong style={{ color: '#fff' }}>{client.industry || '미지정'}</strong></div>
                <div><span style={{ color: '#aaa' }}>계약 상태:</span> <strong style={{ color: client.contract_status === '유지보수 계약중' ? '#38B000' : '#FFB703' }}>{client.contract_status}</strong></div>
                <div><span style={{ color: '#aaa' }}>정기점검 대상:</span> <strong style={{ color: client.has_periodic_inspection === 1 ? '#C77DFF' : '#aaa' }}>{client.has_periodic_inspection === 1 ? `🔄 진행중 (${client.inspection_cycle || '매월'})` : '미진행 (미대상)'}</strong></div>
                <div><span style={{ color: '#aaa' }}>계약/등록일자:</span> <strong style={{ color: '#fff' }}>{client.contract_date || '-'}</strong></div>
              </div>

              <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.9rem' }}>
                <div><span style={{ color: '#aaa' }}>전담 엔지니어 (정):</span> <strong style={{ color: '#00B4D8' }}>👤 {client.engineer_primary || '미지정'}</strong></div>
                <div><span style={{ color: '#aaa' }}>전담 엔지니어 (부):</span> <strong style={{ color: '#ddd' }}>👤 {client.engineer_secondary || '미지정'}</strong></div>
                <div><span style={{ color: '#aaa' }}>사업장 주소:</span> <strong style={{ color: '#fff' }}>{client.address || '미입력'}</strong></div>
              </div>
            </div>

            {client.memo && (
              <div style={{ marginTop: '1.25rem', background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '8px', borderLeft: '4px solid var(--color-accent)' }}>
                <span style={{ fontSize: '0.82rem', color: '#aaa', display: 'block', marginBottom: '0.35rem' }}>📌 고객사 특이사항 및 유지보수 메모:</span>
                <p style={{ color: '#ddd', fontSize: '0.9rem', lineHeight: '1.7', whiteSpace: 'pre-line', margin: 0 }}>{client.memo}</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: Work History Timeline */}
      {activeTab === 'history' && (
        <div className="panel">
          <div className="panel-header" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.1rem' }}>🛠️ 고객사 수행 작업 및 처리 이력 ({filteredHistory.length}건)</h2>
              <p style={{ fontSize: '0.82rem', color: '#aaa', margin: 0, marginTop: '0.2rem' }}>유지보수/장애, IPT, 네트워크, 시공현장, 회의 실시간 집계</p>
            </div>

            {/* History Filter Toolbar */}
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select value={historyFilter} onChange={e => setHistoryFilter(e.target.value)} style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem' }}>
                <option value="전체">전체 작업 구분</option>
                <option value="유지보수">🔴 유지보수/장애</option>
                <option value="IPT">📞 IPT전화</option>
                <option value="네트워크">🌐 네트워크</option>
                <option value="시공">🏗️ 시공현장</option>
                <option value="회의">🤝 회의/컨설팅</option>
              </select>

              <input
                type="text"
                placeholder="제목, 엔지니어, 내용 검색..."
                value={historySearch}
                onChange={e => setHistorySearch(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem', width: '220px' }}
              />

              <button onClick={() => fetchClientHistory(client.name)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.75rem' }}>
                🔄 새로고침
              </button>
            </div>
          </div>

          {historyLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>작업 이력을 조회하는 중...</div>
          ) : filteredHistory.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {filteredHistory.map(h => (
                <div key={h.id} style={{ background: 'var(--bg-main)', padding: '1.1rem 1.25rem', borderRadius: '10px', border: `1px solid ${h.badgeColor || 'var(--border-color)'}`, borderLeft: `5px solid ${h.badgeColor || 'var(--color-accent)'}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                      <span className="badge" style={{ background: h.badgeColor || 'var(--color-primary)', color: '#fff', fontSize: '0.78rem', fontWeight: 700 }}>
                        {h.category}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600 }}>📅 {h.date}</span>
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '0.75rem' }}>
                        {h.status}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0, marginBottom: '0.3rem' }}>{h.title}</h3>
                    <div style={{ fontSize: '0.85rem', color: '#ccc', lineHeight: '1.5' }}>{h.content}</div>
                    {h.fileName && h.filePath && (
                      <div style={{ marginTop: '0.4rem' }}>
                        <a href={h.filePath} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#00B4D8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(0,180,216,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                          📁 {h.fileName}
                        </a>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {(h.workers || []).map((w, idx) => (
                      <span key={idx} style={{ background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>
                        👤 {w}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#aaa', background: 'var(--bg-main)', borderRadius: '8px' }}>
              조건에 해당하는 작업 이력이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Maintenance Target Equipment Manager */}
      {activeTab === 'network' && (() => {
        const totalEquipCount = netConfig.equipments.length;
        const contractedEquipCount = netConfig.equipments.filter(e => (e.isContracted || '계약') === '계약').length;
        const nonContractedEquipCount = totalEquipCount - contractedEquipCount;

        const filteredEquipments = netConfig.equipments.filter((eq) => {
          const isContractedStr = eq.isContracted || '계약';
          const filterMatch = equipFilter === '전체' || isContractedStr === equipFilter;
          const searchLower = equipSearch.toLowerCase().trim();
          const searchMatch = !searchLower ||
            (eq.type || eq.name || '').toLowerCase().includes(searchLower) ||
            (eq.model || '').toLowerCase().includes(searchLower) ||
            (eq.serial || '').toLowerCase().includes(searchLower) ||
            (eq.location || '').toLowerCase().includes(searchLower) ||
            (eq.memo || '').toLowerCase().includes(searchLower);

          return filterMatch && searchMatch;
        });

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Equipment Summary Banner */}
            <div className="panel" style={{ padding: '1.25rem', background: 'rgba(255,183,3,0.04)', borderLeft: '5px solid #FFB703' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 className="panel-title" style={{ fontSize: '1.15rem', color: '#FFB703', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🛠️ 유지보수 대상 장비 관리 ({totalEquipCount}대)
                  </h2>
                  <p style={{ fontSize: '0.82rem', color: '#aaa', margin: 0, marginTop: '0.3rem' }}>
                    고객사와 실제 계약된 유지보수 대상 장비인지 시리얼 번호(Serial No)로 직접 확인 및 엑셀 일괄 등록
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div style={{ background: 'var(--bg-main)', padding: '0.45rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                    <span style={{ color: '#aaa' }}>전체 장비: </span>
                    <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{totalEquipCount}대</strong>
                  </div>
                  <div style={{ background: 'rgba(56,176,0,0.1)', padding: '0.45rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(56,176,0,0.3)', fontSize: '0.85rem' }}>
                    <span style={{ color: '#aaa' }}>실제 계약 장비: </span>
                    <strong style={{ color: '#38B000', fontSize: '0.95rem' }}>✅ {contractedEquipCount}대</strong>
                  </div>
                  <div style={{ background: 'rgba(230,57,70,0.1)', padding: '0.45rem 0.9rem', borderRadius: '8px', border: '1px solid rgba(230,57,70,0.3)', fontSize: '0.85rem' }}>
                    <span style={{ color: '#aaa' }}>미계약 / 검토필요: </span>
                    <strong style={{ color: '#E63946', fontSize: '0.95rem' }}>⚠️ {nonContractedEquipCount}대</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar & Filter */}
            <div className="panel">
              <div className="panel-header" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={equipFilter}
                    onChange={e => setEquipFilter(e.target.value)}
                    style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}
                  >
                    <option value="전체">전체 장비 (계약/미계약)</option>
                    <option value="계약">✅ 실제 계약 대상 장비</option>
                    <option value="미계약">⚠️ 미계약 장비 (확인필요)</option>
                  </select>

                  <input
                    type="text"
                    placeholder="장비명, 모델명, 시리얼 번호, 위치 검색..."
                    value={equipSearch}
                    onChange={e => setEquipSearch(e.target.value)}
                    style={{ padding: '0.5rem 0.85rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.85rem', width: '250px' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleDownloadExcelTemplate}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.95rem', borderColor: '#38B000', color: '#38B000', fontWeight: 600 }}
                  >
                    📥 엑셀 템플릿 다운로드
                  </button>

                  <label
                    className="btn btn-accent"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.95rem', background: '#38B000', borderColor: '#38B000', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', margin: 0, fontWeight: 700 }}
                  >
                    📁 엑셀 일괄 업로드
                    <input
                      type="file"
                      accept=".xlsx, .xls, .csv"
                      onChange={handleExcelFileChange}
                      style={{ display: 'none' }}
                    />
                  </label>

                  <button
                    onClick={handleOpenAddEquipModal}
                    className="btn btn-accent"
                    style={{ fontSize: '0.85rem', padding: '0.5rem 0.95rem', fontWeight: 700 }}
                  >
                    + 장비 개별 등록
                  </button>
                </div>
              </div>

              {/* Maintenance Equipment Table */}
              {filteredEquipments.length > 0 ? (
                <div style={{ overflowX: 'auto' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '130px' }}>장비 구분</th>
                        <th style={{ width: '200px' }}>장비명</th>
                        <th>모델명</th>
                        <th>시리얼 번호 (Serial No)</th>
                        <th style={{ width: '130px', textAlign: 'center' }}>실제 계약 여부</th>
                        <th>설치 장소 / 위치</th>
                        <th>비고</th>
                        <th style={{ width: '100px', textAlign: 'center' }}>관리</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEquipments.map((eq, originalIdx) => {
                        const idx = netConfig.equipments.indexOf(eq);
                        const isContracted = (eq.isContracted || '계약') === '계약';

                        return (
                          <tr key={originalIdx}>
                            <td>
                              <span style={{ fontSize: '0.8rem', background: 'rgba(0,180,216,0.15)', color: '#00B4D8', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 700 }}>
                                {eq.type ||{eq.type || '기타 장비'}
                              </span>
                            </td>
                            <td style={{ fontWeight: 700, color: '#00B4D8', wordBreak: 'keep-all' }}>
                              {eq.name || '-'}
                            </td>
                            <td style={{ fontWeight: 700, color: '#fff' }}>
                              {eq.model || '-'}
                            </td>
                            <td>
                              <code style={{ fontSize: '0.85rem', background: 'rgba(255,255,255,0.08)', color: '#FFB703', padding: '0.2rem 0.5rem', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700 }}>
                                {eq.serial || '시리얼 미입력'}
                              </code>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleContractStatus(idx)}
                                title="클릭하여 계약 / 미계약 상태 전환"
                                style={{
                                  background: isContracted ? 'rgba(56,176,0,0.15)' : 'rgba(230,57,70,0.15)',
                                  color: isContracted ? '#38B000' : '#E63946',
                                  border: `1px solid ${isContracted ? 'rgba(56,176,0,0.4)' : 'rgba(230,57,70,0.4)'}`,
                                  padding: '0.25rem 0.6rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {isContracted ? '✅ 계약 대상' : '⚠️ 미계약'}
                              </button>
                            </td>
                            <td style={{ color: '#ccc', fontSize: '0.85rem' }}>
                              {eq.location ? `📍 ${eq.location}` : '-'}
                            </td>
                            <td style={{ color: '#aaa', fontSize: '0.82rem' }}>
                              {eq.memo || '-'}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditEquipModal(idx)}
                                  title="장비 정보 수정"
                                  style={{ background: 'none', border: 'none', color: '#00B4D8', cursor: 'pointer', fontSize: '0.95rem' }}
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveEquip(idx)}
                                  title="장비 삭제"
                                  style={{ background: 'none', border: 'none', color: '#E63946', cursor: 'pointer', fontSize: '0.95rem' }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '3.5rem', textAlign: 'center', color: '#aaa', background: 'var(--bg-main)', borderRadius: '8px' }}>
                  등록된 유지보수 대상 장비가 없습니다. [📥 엑셀 템플릿 다운로드] 후 [📁 엑셀 일괄 업로드]를 진행하거나 상단 [+ 장비 개별 등록] 버튼을 이용하세요.
                </div>
              )}
            </div>

          </div>
        );
      })()}

      {/* TAB 4: Client Document Management & Sharing */}
      {activeTab === 'docs' && (
        <div className="panel">
          <div className="panel-header" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 className="panel-title" style={{ fontSize: '1.1rem', color: '#9D4EDD' }}>📁 고객사 공유 관리 문서 ({filteredDocuments.length}건)</h2>
              <p style={{ fontSize: '0.82rem', color: '#aaa', margin: 0, marginTop: '0.2rem' }}>계약서, 네트워크 구성도, 점검보고서, 정산서 등 관리문서 첨부 및 공유 링크 제공</p>
            </div>

            {/* Filter & Upload Action Bar */}
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <select
                value={docFilter}
                onChange={e => setDocFilter(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem' }}
              >
                <option value="전체">전체 카테고리</option>
                <option value="계약서">📄 계약서</option>
                <option value="네트워크 구성도">🌐 네트워크 구성도</option>
                <option value="점검보고서">📊 점검보고서</option>
                <option value="견적/정산서">💰 견적/정산서</option>
                <option value="매뉴얼/지침서">📘 매뉴얼/지침서</option>
                <option value="기타">📂 기타 문서</option>
              </select>

              <input
                type="text"
                placeholder="제목, 파일명, 작성자 검색..."
                value={docSearch}
                onChange={e => setDocSearch(e.target.value)}
                style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: 'var(--bg-main)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.82rem', width: '220px' }}
              />

              <button onClick={() => setIsDocModalOpen(true)} className="btn btn-accent" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#9D4EDD', borderColor: '#9D4EDD' }}>
                ➕ 새 관리 문서 등록
              </button>
            </div>
          </div>

          {docsLoading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>관리 문서를 불러오는 중...</div>
          ) : filteredDocuments.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {filteredDocuments.map(doc => (
                <div key={doc.id} style={{ background: 'var(--bg-main)', padding: '1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span className="badge" style={{ background: 'rgba(157,78,221,0.2)', color: '#C77DFF', border: '1px solid rgba(157,78,221,0.4)', fontSize: '0.78rem', fontWeight: 700 }}>
                        {doc.category}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#aaa' }}>{doc.createdAt ? doc.createdAt.split(' ')[0] : ''}</span>
                    </div>

                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 0.5rem 0', wordBreak: 'break-all' }}>
                      {doc.title}
                    </h3>

                    {doc.description && (
                      <p style={{ fontSize: '0.85rem', color: '#bbb', margin: '0 0 0.75rem 0', lineHeight: '1.4', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {doc.description}
                      </p>
                    )}

                    <div style={{ fontSize: '0.8rem', color: '#aaa', background: 'rgba(0,0,0,0.25)', padding: '0.6rem', borderRadius: '6px', marginBottom: '1rem', wordBreak: 'break-all' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ddd' }}>
                        <span>📎</span> <strong>{doc.fileName}</strong>
                      </div>
                      <div style={{ marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.75rem' }}>
                        <span>용량: {doc.fileSize}</span>
                        <span>등록자: {doc.uploadedBy || '담당자'}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                    <a
                      href={doc.filePath}
                      download={doc.fileName}
                      className="btn btn-secondary"
                      style={{ flex: 1, textDecoration: 'none', textAlign: 'center', fontSize: '0.8rem', padding: '0.4rem 0.6rem', color: '#00B4D8', borderColor: 'rgba(0,180,216,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                    >
                      📥 다운로드
                    </a>
                    <button
                      onClick={() => handleCopyLink(doc.filePath)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', color: '#FFB703', borderColor: 'rgba(255,183,3,0.4)' }}
                      title="다운로드 공유 링크 복사"
                    >
                      🔗 링크 복사
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.title)}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', color: '#E63946', borderColor: 'rgba(230,57,70,0.4)' }}
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#aaa', background: 'var(--bg-main)', borderRadius: '8px' }}>
              등록된 관리 문서가 없습니다. 상단 '➕ 새 관리 문서 등록' 버튼을 눌러 공유 문서를 추가하세요.
            </div>
          )}
        </div>
      )}

      {/* TAB 5: Periodic Inspection Management & Scanned Reports */}
      {activeTab === 'inspections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Periodic Inspection Status & Primary Template Panel */}
          <div className="panel" style={{ borderLeft: '6px solid #9D4EDD' }}>
            <div className="panel-header" style={{ marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 className="panel-title" style={{ fontSize: '1.1rem', color: '#C77DFF' }}>⭐ 고객사 대표 점검서 양식 (최신 서식)</h2>
                <p style={{ fontSize: '0.82rem', color: '#aaa', margin: 0, marginTop: '0.2rem' }}>
                  현재 적용 중인 대표 정기점검서 양식입니다. 새 양식 업로드 시 기존 양식은 히스토리에 자동 보관됩니다.
                </p>
              </div>

              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="btn btn-accent"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#9D4EDD', borderColor: '#9D4EDD' }}
              >
                ➕ 새 점검서 양식 등록
              </button>
            </div>

            {(() => {
              const primaryTemplate = inspectionTemplates.find(t => t.isPrimary) || inspectionTemplates[0];
              const templateHistory = inspectionTemplates.filter(t => t.id !== primaryTemplate?.id);

              return (
                <div>
                  {primaryTemplate ? (
                    <div style={{ background: 'rgba(157,78,221,0.08)', padding: '1.25rem', borderRadius: '10px', border: '1px solid rgba(157,78,221,0.3)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                          <span className="badge" style={{ background: '#9D4EDD', color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}>
                            ⭐ 대표 점검서 양식
                          </span>
                          <span className="badge" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: '0.78rem' }}>
                            {primaryTemplate.version || 'v1.0'}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: '#aaa' }}>등록일: {primaryTemplate.createdAt ? primaryTemplate.createdAt.split(' ')[0] : ''}</span>
                        </div>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>{primaryTemplate.title}</h3>
                        <p style={{ fontSize: '0.85rem', color: '#bbb', margin: '0.3rem 0 0 0' }}>📎 파일명: {primaryTemplate.fileName} ({primaryTemplate.fileSize}) | 등록자: {primaryTemplate.uploadedBy || '담당자'}</p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <a
                          href={primaryTemplate.filePath}
                          download={primaryTemplate.fileName}
                          className="btn btn-accent"
                          style={{ textDecoration: 'none', fontSize: '0.85rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          📥 대표 양식 다운로드
                        </a>
                        <button
                          onClick={() => handleCopyLink(primaryTemplate.filePath)}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem', color: '#FFB703', borderColor: 'rgba(255,183,3,0.4)' }}
                        >
                          🔗 링크 복사
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: '2.5rem', textAlign: 'center', color: '#aaa', background: 'var(--bg-main)', borderRadius: '8px', marginBottom: '1rem' }}>
                      등록된 점검서 양식이 없습니다. '➕ 새 점검서 양식 등록' 버튼으로 서식을 업로드하세요.
                    </div>
                  )}

                  {/* Template History List */}
                  {templateHistory.length > 0 && (
                    <div style={{ background: 'var(--bg-main)', padding: '1rem 1.25rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <h4 style={{ fontSize: '0.9rem', color: '#aaa', margin: '0 0 0.75rem 0' }}>📜 이전 점검서 양식 히스토리 ({templateHistory.length}건)</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {templateHistory.map(t => (
                          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '6px', fontSize: '0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              <span style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.08)', color: '#ccc', padding: '0.15rem 0.4rem', borderRadius: '4px' }}>{t.version || '이전양식'}</span>
                              <strong style={{ color: '#ddd' }}>{t.title}</strong>
                              <span style={{ fontSize: '0.78rem', color: '#888' }}>({t.fileName} - {t.fileSize})</span>
                            </div>
                            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.75rem', color: '#888', marginRight: '0.5rem' }}>{t.createdAt ? t.createdAt.split(' ')[0] : ''}</span>
                              <a href={t.filePath} download={t.fileName} className="btn btn-secondary" style={{ textDecoration: 'none', fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>
                                📥 다운로드
                              </a>
                              <button onClick={() => handleDeleteInspectionItem('template', t.id, t.title)} style={{ background: 'none', border: 'none', color: '#E63946', cursor: 'pointer', fontSize: '0.9rem' }}>
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Scanned Inspection Reports Panel */}
          <div className="panel">
            <div className="panel-header" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h2 className="panel-title" style={{ fontSize: '1.1rem', color: '#00B4D8' }}>📄 정기점검 완료 스캔본 보관소 ({inspectionScans.length}건)</h2>
                <p style={{ fontSize: '0.82rem', color: '#aaa', margin: 0, marginTop: '0.2rem' }}>실제 점검 후 작성된 정기점검 스캔본 문서 보관 및 조회 (📅 점검일자 최신순 정렬)</p>
              </div>

              <button
                onClick={() => setIsScanModalOpen(true)}
                className="btn btn-accent"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                ➕ 정기점검 스캔본 업로드
              </button>
            </div>

            {inspectionsLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#aaa' }}>점검서 스캔본을 불러오는 중...</div>
            ) : inspectionScans.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                {inspectionScans.map(s => (
                  <div key={s.id} style={{ background: 'var(--bg-main)', padding: '1.2rem', borderRadius: '10px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.55rem' }}>
                        <span className="badge" style={{ background: 'rgba(0,180,216,0.15)', color: '#00B4D8', fontSize: '0.8rem', fontWeight: 700 }}>
                          📅 점검일: {s.inspectionDate}
                        </span>
                        <span style={{ fontSize: '0.78rem', color: '#aaa' }}>점검자: <strong style={{ color: '#fff' }}>{s.inspector}</strong></span>
                      </div>

                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 0.4rem 0', wordBreak: 'break-all' }}>
                        {s.title}
                      </h3>

                      {s.memo && (
                        <p style={{ fontSize: '0.83rem', color: '#ccc', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px', margin: '0 0 0.75rem 0', lineHeight: '1.4' }}>
                          📌 특이사항: {s.memo}
                        </p>
                      )}

                      <div style={{ fontSize: '0.8rem', color: '#aaa', background: 'rgba(0,0,0,0.25)', padding: '0.6rem', borderRadius: '6px', marginBottom: '1rem', wordBreak: 'break-all' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ddd' }}>
                          <span>📎</span> <strong>{s.fileName}</strong>
                        </div>
                        <div style={{ marginTop: '0.2rem', display: 'flex', justifyContent: 'space-between', color: '#888', fontSize: '0.75rem' }}>
                          <span>용량: {s.fileSize}</span>
                          <span>등록자: {s.uploadedBy || '담당자'}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
                      <a
                        href={s.filePath}
                        download={s.fileName}
                        className="btn btn-secondary"
                        style={{ flex: 1, textDecoration: 'none', textAlign: 'center', fontSize: '0.8rem', padding: '0.4rem 0.6rem', color: '#00B4D8', borderColor: 'rgba(0,180,216,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                      >
                        📥 스캔본 다운로드
                      </a>
                      <button
                        onClick={() => handleCopyLink(s.filePath)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', color: '#FFB703', borderColor: 'rgba(255,183,3,0.4)' }}
                        title="다운로드 공유 링크 복사"
                      >
                        🔗 링크 복사
                      </button>
                      <button
                        onClick={() => handleDeleteInspectionItem('scan', s.id, s.title)}
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem', color: '#E63946', borderColor: 'rgba(230,57,70,0.4)' }}
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: '#aaa', background: 'var(--bg-main)', borderRadius: '8px' }}>
                등록된 정기점검 스캔본이 없습니다. 상단 '➕ 정기점검 스캔본 업로드' 버튼을 눌러 스캔 파일을 추가하세요.
              </div>
            )}
          </div>

        </div>
      )}

      {/* Upload Inspection Template Modal */}
      {isTemplateModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '540px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.15rem', color: '#C77DFF' }}>⭐ 새 점검서 양식 등록 (대표 양식 설정)</h2>
              <button onClick={() => setIsTemplateModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleUploadTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>양식 제목 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: (주)아인스텍 2026년 표준 정기점검 양식"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>점검서 양식 파일 선택 (HXP/HWP/PDF/DOCX/XLSX) *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setTemplateFile(e.target.files[0] || null)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px dashed #9D4EDD', color: 'white', fontSize: '0.85rem' }}
                />
                {templateFile && (
                  <div style={{ fontSize: '0.78rem', color: '#C77DFF', marginTop: '0.3rem' }}>
                    선택된 파일: <strong>{templateFile.name}</strong> ({(templateFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.8rem', color: '#aaa', background: 'rgba(157,78,221,0.1)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #9D4EDD' }}>
                💡 이 파일이 업로드되면 **대표 점검서 양식**으로 즉시 지정되며, 기존 양식은 양식 히스토리 목록으로 이동합니다.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="btn btn-secondary" disabled={uploadingTemplate}>취소</button>
                <button type="submit" className="btn btn-accent" style={{ background: '#9D4EDD', borderColor: '#9D4EDD' }} disabled={uploadingTemplate}>
                  {uploadingTemplate ? '업로드 및 대표 설정 중...' : '💾 대표 양식 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Scan Report Modal */}
      {isScanModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '580px', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.15rem', color: '#00B4D8' }}>📄 정기점검 완료 스캔본 등록</h2>
              <button onClick={() => setIsScanModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleUploadScan} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>점검 보고서 제목 *</label>
                <input
                  type="text"
                  required
                  placeholder="예: 2026년 3월 정기점검 결과 보고서"
                  value={scanTitle}
                  onChange={(e) => setScanTitle(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>실제 점검 일자 *</label>
                  <input
                    type="date"
                    required
                    value={scanDate}
                    onChange={(e) => setScanDate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>점검 수행자 (엔지니어)</label>
                  <input
                    type="text"
                    placeholder="예: 이강욱 팀장"
                    value={scanInspector}
                    onChange={(e) => setScanInspector(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>점검서 스캔 파일 (PDF / 이미지 / ZIP) *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setScanFile(e.target.files[0] || null)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--color-accent)', color: 'white', fontSize: '0.85rem' }}
                />
                {scanFile && (
                  <div style={{ fontSize: '0.78rem', color: '#00B4D8', marginTop: '0.3rem' }}>
                    선택된 파일: <strong>{scanFile.name}</strong> ({(scanFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>점검 특이사항 및 의견 (선택)</label>
                <textarea
                  rows={3}
                  placeholder="점검 결과 이상 유무, 백본 장비 팬 교체 필요 권고 등 메모..."
                  value={scanMemo}
                  onChange={(e) => setScanMemo(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsScanModalOpen(false)} className="btn btn-secondary" disabled={uploadingScan}>취소</button>
                <button type="submit" className="btn btn-accent" disabled={uploadingScan}>
                  {uploadingScan ? '업로드 및 저장 중...' : '💾 점검서 스캔본 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📁 관리 문서 업로드 모달 */}
      {isDocModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.15rem', color: '#fff' }}>📁 신규 관리 문서 공유/등록</h2>
              <button onClick={() => setIsDocModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleUploadDocument} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>문서 제목 *</label>
                  <input
                    type="text"
                    required
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="예: 2026년도 유지보수 계약서"
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>문서 카테고리</label>
                  <select
                    value={docCategory}
                    onChange={(e) => setDocCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--color-accent)', color: 'white' }}
                  >
                    <option value="계약서">계약서</option>
                    <option value="네트워크 구성도">🌐 네트워크 구성도</option>
                    <option value="정기점검 보고서">정기점검 보고서</option>
                    <option value="정산서 / 청구서">정산서 / 청구서</option>
                    <option value="기타 문서">기타 문서</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>파일 첨부 *</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setDocFile(e.target.files[0])}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>문서 설명 / 요약 (선택)</label>
                <textarea
                  rows={3}
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  placeholder="공유할 문서에 대한 간단한 설명을 입력하세요."
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsDocModalOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent" disabled={uploadingDoc} style={{ background: '#9D4EDD', borderColor: '#9D4EDD' }}>
                  {uploadingDoc ? '업로드 중...' : '📤 업로드 및 공유'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📊 엑셀 일괄 등록 모달 */}
      {isExcelModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.15rem', color: '#fff' }}>📊 장비 데이터 엑셀 일괄 등록 확인</h2>
              <button onClick={() => setIsExcelModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                총 <strong style={{ color: '#00B4D8' }}>{excelParsedData.length}</strong>건의 장비 데이터가 정상적으로 읽혔습니다. 데이터를 어떻게 적용하시겠습니까?
              </p>
              
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="excelMode"
                    value="append"
                    checked={excelImportMode === 'append'}
                    onChange={() => setExcelImportMode('append')}
                    style={{ accentColor: '#00B4D8' }}
                  />
                  기존 목록 아래에 추가 등록 (Append)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white', cursor: 'pointer', fontSize: '0.9rem' }}>
                  <input
                    type="radio"
                    name="excelMode"
                    value="replace"
                    checked={excelImportMode === 'replace'}
                    onChange={() => setExcelImportMode('replace')}
                    style={{ accentColor: '#E63946' }}
                  />
                  기존 장비 목록 덮어쓰기 (Replace)
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button onClick={() => setIsExcelModalOpen(false)} className="btn btn-secondary">취소</button>
              <button onClick={handleConfirmExcelImport} className="btn btn-accent" style={{ background: '#00B4D8', borderColor: '#00B4D8' }}>
                ✅ 데이터 적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '1rem' }}>
          <div className="panel" style={{ width: '100%', maxWidth: '680px', maxHeight: '92vh', overflowY: 'auto', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ fontSize: '1.15rem', color: '#fff' }}>✏️ 고객사 기본 프로필 수정</h2>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>고객사 / 기관명 *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>업종 분류</label>
                  <input
                    type="text"
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              {/* Dynamic Multiple Client Contacts */}
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', color: 'var(--color-accent)', fontWeight: 700 }}>
                    👥 고객사 담당자 정보
                  </label>
                  <button
                    type="button"
                    onClick={handleAddContact}
                    className="btn btn-accent"
                    style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                  >
                    + 담당자 추가
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {formContacts.map((cnt, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr 1.2fr 1.4fr 0.9fr auto', gap: '0.4rem', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px' }}>
                      <input
                        type="text"
                        placeholder="담당자명"
                        value={cnt.name}
                        onChange={(e) => handleContactChange(idx, 'name', e.target.value)}
                        style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input
                        type="text"
                        placeholder="직급(과장 등)"
                        value={cnt.rank || ''}
                        onChange={(e) => handleContactChange(idx, 'rank', e.target.value)}
                        style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input
                        type="text"
                        placeholder="연락처"
                        value={cnt.phone}
                        onChange={(e) => handleContactChange(idx, 'phone', e.target.value)}
                        style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input
                        type="email"
                        placeholder="이메일"
                        value={cnt.email}
                        onChange={(e) => handleContactChange(idx, 'email', e.target.value)}
                        style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                      <input
                        type="text"
                        placeholder="담당업무"
                        value={cnt.duty || ''}
                        onChange={(e) => handleContactChange(idx, 'duty', e.target.value)}
                        style={{ padding: '0.45rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#fff', fontSize: '0.8rem' }}
                      />
                      {formContacts.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveContact(idx)}
                          style={{ background: 'none', border: 'none', color: '#E63946', fontSize: '1rem', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Periodic Inspection Settings */}
              <div style={{ background: 'rgba(157,78,221,0.06)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(157,78,221,0.25)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#C77DFF', fontWeight: 700, marginBottom: '0.6rem' }}>
                  🔄 정기점검 실시 유무 및 점검 주기 설정
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', fontSize: '0.85rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formHasPeriodicInspection}
                      onChange={(e) => setFormHasPeriodicInspection(e.target.checked)}
                      style={{ width: '18px', height: '18px', accentColor: '#9D4EDD' }}
                    />
                    <span>정기점검 진행 고객사 (점검 대상)</span>
                  </label>

                  {formHasPeriodicInspection && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.82rem', color: '#aaa' }}>점검 주기:</span>
                      <select
                        value={formInspectionCycle}
                        onChange={(e) => setFormInspectionCycle(e.target.value)}
                        style={{ padding: '0.45rem 0.75rem', borderRadius: '6px', background: '#0B132B', border: '1px solid #9D4EDD', color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                      >
                        <option value="매월">📅 매월 (월 1회)</option>
                        <option value="분기(3개월)">📅 분기 (3개월 1회)</option>
                        <option value="반기(6개월)">📅 반기 (6개월 1회)</option>
                        <option value="연간(12개월)">📅 연간 (년 1회)</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* Engineers selection */}
              <div style={{ background: 'rgba(0,180,216,0.06)', padding: '1rem', borderRadius: '10px', border: '1px solid rgba(0,180,216,0.25)' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#00B4D8', fontWeight: 700, marginBottom: '0.6rem' }}>
                  🛠️ 사내 전담 엔지니어 지정 (정 / 부)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: '0.2rem' }}>전담 엔지니어 (정) *</label>
                    <select
                      value={formEngineerPrimary}
                      onChange={(e) => setFormEngineerPrimary(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--color-accent)', color: 'white', fontWeight: 700 }}
                    >
                      {engineerUsers.map(u => {
                        const label = `${u.name}${u.rank ? ' ' + u.rank : ''}`.trim();
                        return (
                          <option key={u.id} value={label}>👤 {label} ({u.department || '네트워크'})</option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: '#aaa', marginBottom: '0.2rem' }}>전담 엔지니어 (부 - 백업)</label>
                    <select
                      value={formEngineerSecondary}
                      onChange={(e) => setFormEngineerSecondary(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--border-color)', color: 'white', fontWeight: 500 }}
                    >
                      <option value="미지정">미지정</option>
                      {engineerUsers.map(u => {
                        const label = `${u.name}${u.rank ? ' ' + u.rank : ''}`.trim();
                        return (
                          <option key={u.id} value={label}>👤 {label} ({u.department || '네트워크'})</option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>계약 상태</label>
                  <select
                    value={formContractStatus}
                    onChange={(e) => setFormContractStatus(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: '#0B132B', border: '1px solid var(--color-accent)', color: 'white', fontWeight: 700 }}
                  >
                    {CONTRACT_STATUSES.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>계약 / 등록일</label>
                  <input
                    type="date"
                    value={formContractDate}
                    onChange={(e) => setFormContractDate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>사업장 주소</label>
                <input
                  type="text"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', color: '#aaa', marginBottom: '0.3rem' }}>비고 및 메모 사항</label>
                <textarea
                  rows={3}
                  value={formMemo}
                  onChange={(e) => setFormMemo(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: 'white', resize: 'vertical' }}
                ></textarea>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn btn-secondary">취소</button>
                <button type="submit" className="btn btn-accent">수정 완료</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}


export default function ClientDetailPage(props) {
  return (
    <ErrorBoundary>
      <ClientDetailPageComponent {...props} />
    </ErrorBoundary>
  );
}
