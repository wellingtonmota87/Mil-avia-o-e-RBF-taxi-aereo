import React, { useState, useEffect } from 'react'; // Importando React e hooks necessários
import { Plane, Shield, Globe, Clock, CheckCircle, ArrowRight, ArrowLeft, Users, ShieldAlert, LogOut, Plus, Calendar, MapPin, Coffee, Edit, FileText, X, Layout, FilePlus, FileArchive, ChevronRight, Check } from 'lucide-react'; // Ícones para a interface
import { motion, AnimatePresence } from 'framer-motion'; // Biblioteca para animações suaves
import { testSupabaseConnection, fetchFlights, upsertFlight } from './utils/supabaseFlights';
import AircraftSelector from './components/AircraftSelector'; // Componente para seleção de aeronave
import BookingForm from './components/BookingForm'; // Formulário de reserva
import PortalHome from './components/PortalHome'; // Página inicial do portal
import CoordinatorDashboard from './components/CoordinatorDashboard'; // Dashboard para coordenadores
import ClientPortal from './components/ClientPortal'; // Portal para clientes acompanharem suas solicitações
import FleetCalendar from './components/FleetCalendar'; // Calendário para visualização da agenda de voos
import SetPassword from './components/SetPassword'; // Componente para configuração de senha via token (link mágico)
import CrewPortal from './components/CrewPortal'; // Portal para tripulação acompanhar suas missões
import FlightPack from './components/FlightPack'; // Componente para gerenciamento do "Pack de Voo" (dados extras para cada perna do voo)

import CompanyProfile from './components/CompanyProfile'; // Página de perfil da empresa, mostrando detalhes e diferenciais
import { saveFlights, loadFlights, startAutoSave } from './utils/flightPersistence'; // Funções para persistência de dados local (substituindo o uso direto do localStorage para maior controle e robustez)
import { getTimestamp } from './utils/dateUtils'; // Função utilitária para obter timestamp formatado

// Flag de debug - mude para true para ativar logs detalhados
const DEBUG_PERSISTENCE = false; // Diagnóstico detalhado para persistência local (substituindo o console.log direto)

function App() {
  const [currentView, setCurrentView] = useState(() => { // Persistência da última view acessada
    const saved = localStorage.getItem('milavia_view'); // Tenta recuperar a última view acessada
    return saved || 'home'; // Se não houver, inicia na 'home'
  });
  const [selectedCompany, setSelectedCompany] = useState(null); // 'mil' or 'rbf' // Estado para controlar a empresa selecionada (usado no perfil da empresa)
  const [selectedAircraft, setSelectedAircraft] = useState(null); // Estado para controlar a aeronave selecionada (usado no fluxo de criação/edição de solicitações)
  const [selectedRequestForPack, setSelectedRequestForPack] = useState(null); // Estado para controlar qual solicitação está sendo editada no Flight Pack
  const [selectedLegIndex, setSelectedLegIndex] = useState(null); // Estado para controlar qual perna do voo está sendo editada no Flight Pack
  const [isSubmitted, setIsSubmitted] = useState(() => { // Persistência do estado de submissão (para mostrar tela de sucesso após enviar uma solicitação)
    return localStorage.getItem('milavia_submitted') === 'true'; //
  });

  // Supress local redundancy logs if needed, but keeping for debug for now
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados iniciais (Supabase com fallback localStorage)
  useEffect(() => {
    async function loadInitialData() {
      console.log('[SUPABASE] 🔄 Sincronizando dados...');
      const supabaseData = await fetchFlights();
      
      if (supabaseData) {
        console.log(`[SUPABASE] ✅ ${supabaseData.length} voos carregados do banco.`);
        setRequests(supabaseData);
        // Atualiza o localstorage para manter o cache em dia
        saveFlights(supabaseData);
      } else {
        console.warn('[SUPABASE] ⚠️ Falha ao carregar do banco, usando cache local...');
        const localData = loadFlights();
        setRequests(localData);
      }
      setIsLoading(false);
    }
    loadInitialData();
  }, []);

  // Persistence for view and submitted state //
  useEffect(() => { //
    localStorage.setItem('milavia_view', currentView); // Salva a última view acessada no localStorage para persistência entre sessões
  }, [currentView]); // Sempre que a view mudar, atualiza o localStorage

  useEffect(() => { // Salva o estado de submissão no localStorage para persistência entre sessões
    localStorage.setItem('milavia_submitted', isSubmitted.toString()); // Converte o boolean para string antes de salvar
  }, [isSubmitted]); // Sempre que o estado de submissão mudar, atualiza o localStorage

  // Scroll to top on navigation or state changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView, isSubmitted, selectedAircraft, selectedCompany]); // Sempre que a view, estado de submissão, aeronave selecionada ou empresa selecionada mudar, rola para o topo da página

useEffect(() => {
  testSupabaseConnection(); 
}, []);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('milavia_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [crewUser, setCrewUser] = useState(() => {
    const saved = localStorage.getItem('milavia_crew_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Lógica de auto-conclusão de voos passados (executada após carregar dados)
  useEffect(() => {
    if (isLoading || requests.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    const needsUpdate = requests.some(req => {
      const isFinished = req.legs && req.legs.every(leg => leg.date < today);
      return isFinished && req.status !== 'concluido' && req.status !== 'cancelado';
    });

    if (needsUpdate) {
      console.log('[APP] 📅 Auto-concluindo voos que já passaram...');
      setRequests(prev => prev.map(req => {
        const isFinished = req.legs && req.legs.every(leg => leg.date < today);
        if (isFinished && req.status !== 'concluido' && req.status !== 'cancelado') {
          const updated = { ...req, status: 'concluido' };
          upsertFlight(updated);
          return updated;
        }
        return req;
      }));
    }
  }, [isLoading, requests]); // Adicionado requests para satisfazer o linter, protegido pelo needsUpdate

  // Estado para controlar se houve interação do usuário (para evitar salvamentos acidentais na carga inicial)
  const [hasInteracted, setHasInteracted] = useState(false);

  // Sistema de salvamento automático (Supabase + LocalStorage)
  useEffect(() => {
    if (isLoading) return; // Não salvar enquanto estiver carregando

    if (requests.length > 0) {
      saveFlights(requests);
      // O salvamento no Supabase é feito individualmente nas funções de ação (Submit/Update)
      // para evitar excesso de requisições e garantir atomicidade
    } else if (hasInteracted) {
      saveFlights(requests, true);
    }
  }, [requests, hasInteracted, isLoading]);

  // Migração ativa
  useEffect(() => {
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('milavia_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('milavia_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (crewUser) {
      localStorage.setItem('milavia_crew_user', JSON.stringify(crewUser));
    } else {
      localStorage.removeItem('milavia_crew_user');
    }
  }, [crewUser]);

  // Proteção adicional: Auto-salvamento periódico e salvamento antes de descarregar
  useEffect(() => {
    // Ativar auto-salvamento a cada 5 segundos
    startAutoSave(() => requests);

    const handleBeforeUnload = () => {
      console.log('[APP] 🚨 Página sendo fechada/atualizada - salvamento forçado!');
      // Sincronização secundária se necessário (mantendo compatibilidade legada)
      saveFlights(requests);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [requests, hasInteracted]); // Adicionando hasInteracted nas dependências


  const [editingRequestId, setEditingRequestId] = useState(null);

  const handleBookingSubmit = (data) => {
    // Garantir que cada leg tenha os estados operacionais padrão
    const legsWithStatus = data.legs.map(leg => ({
      ...leg,
      flightPlanStatus: 'pendente',
      notamStatus: 'pendente',
      hasAllocatedSlot: 'pendente'
    }));

    const updatedRequest = {
      id: editingRequestId || Date.now(),
      userId: currentUser?.id || 'anonymous',
      userName: currentUser?.name || 'Cliente Externo',
      userEmail: currentUser?.email || '',
      timestamp: getTimestamp(),
      ...data,
      legs: legsWithStatus,
      aircraft: selectedAircraft,
      status: editingRequestId ? (requests.find(r => r.id === editingRequestId)?.status === 'recusado' ? 'novo' : requests.find(r => r.id === editingRequestId)?.status) : 'novo',
      // Campos globais
      flightPlan: 'Pendente',
      allocatedSlot: 'Pendente',
      notam: 'Pendente'
    };

    setHasInteracted(true);

    // Salvar no Supabase IMEDIATAMENTE
    upsertFlight(updatedRequest);

    if (editingRequestId) {
      setRequests(prev => prev.map(req => req.id === editingRequestId ? updatedRequest : req));
      setEditingRequestId(null);
    } else {
      setRequests(prev => [updatedRequest, ...prev]);
    }

    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditRequest = (request) => {
    setEditingRequestId(request.id);
    setSelectedAircraft(request.aircraft);
  };

  const updateRequestStatus = (requestId, newStatus, observation = null, editedData = null) => {
    setHasInteracted(true); // Marca interação do usuário

    let finalUpdatedRequest = null;

    setRequests(prev => {
      const newList = prev.map(req => {
        if (req.id === requestId) {
          let base = editedData || req;

          if (editedData && newStatus === 'alteracao_solicitada') {
            base = {
              ...editedData,
              oldData: req.oldData ? req.oldData : req
            };

            if (req.status === 'aprovado' || req.status === 'pendente') {
              base.oldData = req;
            }
          }

          const finalObservation = observation !== null ? observation : (base.observation || req.observation);
          const updated = {
            ...base,
            status: newStatus,
            observation: finalObservation
          };
          finalUpdatedRequest = updated;
          return updated;
        }
        return req;
      });

      // Se for um novo request manual que não estava na lista
      if (editedData && editedData.userId === 'coordinator-manual' && !prev.find(r => r.id === requestId)) {
        finalUpdatedRequest = { ...editedData, status: newStatus, observation };
        return [finalUpdatedRequest, ...prev];
      }

      return newList;
    });

    // Sincronizar com Supabase
    if (finalUpdatedRequest) {
      upsertFlight(finalUpdatedRequest);
    }
  };



  const logout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    setSelectedAircraft(null);
    setIsSubmitted(false);
    setEditingRequestId(null);
  };

  const renderClientView = () => {
    // Check for token in URL first
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    if (token) {
      return (
        <SetPassword
          token={token}
          onPasswordSet={() => {
            // Remove token from URL and redirect to client login
            window.history.replaceState({}, document.title, window.location.pathname);
            setCurrentView('client');
          }}
        />
      );
    }

    if (!currentUser) {
      return (
        <ClientPortal
          requests={[]}
          currentUser={null}
          onLogin={(user) => setCurrentUser(user)}
          onBack={() => setCurrentView('home')}
        />
      );
    }

    if (isSubmitted) {
      return (
        <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-morphism" style={{ padding: '64px', borderRadius: '32px' }}>
            <div style={{ background: '#34d399', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
              <CheckCircle size={40} color="#000" />
            </div>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Solicitação Enviada!</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', marginBottom: '48px', maxWidth: '600px', margin: '0 auto 48px' }}>
              Sua solicitação foi recebida pela nossa equipe de coordenação. Você pode acompanhar o status no seu painel.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
              <button className="premium-button" onClick={() => { setIsSubmitted(false); setSelectedAircraft(null); }}>
                Ver no Meu Painel
              </button>
              <button
                className="premium-button"
                style={{ background: 'transparent', border: '1px solid var(--glass-border)' }}
                onClick={() => {
                  setIsSubmitted(false);
                  setSelectedAircraft(null);
                  setCurrentView('home');
                }}
              >
                Voltar ao Início
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    const handleCancelRequest = (requestId) => {
      // Definir status como 'cancelamento' para aparecer no painel do coordenador
      updateRequestStatus(requestId, 'cancelamento', 'Cancelamento solicitado pelo cliente');
      setIsSubmitted(true); // Mostrar tela de sucesso/confirmação
      setSelectedAircraft(null);
      setEditingRequestId(null);
    };

    if (selectedAircraft) {
      return (
        <div className="container" style={{ padding: '40px 0' }}>
          <button
            onClick={() => setSelectedAircraft(null)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '32px', fontWeight: 'bold' }}
          >
            <ArrowLeft size={18} /> Voltar ao Painel
          </button>
          <BookingForm
            key={editingRequestId || 'new'}
            selectedAircraft={selectedAircraft}
            onSubmit={handleBookingSubmit}
            initialData={editingRequestId ? requests.find(r => r.id === editingRequestId) : null}
            onCancel={handleCancelRequest}
          />
        </div>
      );
    }

    return (
      <ClientPortal
        requests={requests}
        currentUser={currentUser}
        onLogout={() => { logout(); setEditingRequestId(null); }}
        onNewRequest={() => { setSelectedAircraft('selector'); setEditingRequestId(null); }}
        onEditRequest={handleEditRequest}
        onUpdateRequest={updateRequestStatus}
        onBack={() => setCurrentView('home')}
      />
    );
  };

  // Special handling for the aircraft selector within the client view
  const finalClientView = () => {
    // Always show login screen if no user
    if (!currentUser) {
      return (
        <ClientPortal
          requests={[]}
          currentUser={null}
          onLogin={(user) => setCurrentUser(user)}
          onBack={() => setCurrentView('home')}
        />
      );
    }

    // Show aircraft selector if user is logged in and wants to select aircraft
    if (currentUser && !isSubmitted && selectedAircraft === 'selector') {
      return (
        <div className="container" style={{ padding: '80px 0' }}>
          <button
            onClick={() => setSelectedAircraft(null)}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '32px', fontWeight: 'bold' }}
          >
            <ArrowLeft size={18} /> Voltar ao Painel
          </button>
          <div style={{ textAlign: 'center', marginBottom: '80px' }}>
            <h1 style={{ fontSize: '3.5rem', marginBottom: '24px' }}>Escolha Sua Aeronave</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem', maxWidth: '700px', margin: '0 auto' }}>
              Selecione o modelo ideal para sua próxima missão.
            </p>
          </div>
          <AircraftSelector onSelect={setSelectedAircraft} />
        </div>
      );
    }

    return renderClientView();
  };

  return (
    <div className="app">
      {/* Header */}
      <nav className="nav-bar glass-morphism">
        <div className="container nav-content">
          <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); setCurrentView('home'); }}>
            <Plane size={32} color="var(--primary)" />
            <span style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>Mil aviação & RBF Táxi Aéreo</span>
          </a>
          <div className="nav-links">
            <span className="nav-link" onClick={() => { setCurrentView('home'); setSelectedAircraft(null); setIsSubmitted(false); }}>Início</span>
            <span className="nav-link" onClick={() => { setCurrentView('fleet-calendar'); setSelectedAircraft(null); setIsSubmitted(false); }}>Agenda</span>
            <span className="nav-link" onClick={() => { setCurrentView('client'); setSelectedAircraft(null); setIsSubmitted(false); }}>Clientes</span>
            <span className="nav-link" onClick={() => { setCurrentView('crew'); setSelectedAircraft(null); setIsSubmitted(false); }}>Tripulação</span>
            <span className="nav-link" onClick={() => { setCurrentView('coordinator'); setSelectedAircraft(null); setIsSubmitted(false); }}>Coordenadores</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ paddingTop: '80px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView + (currentUser ? 'auth' : 'unauth')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'home' && (
              <PortalHome
                onNavigate={setCurrentView}
                onCompanySelect={(id) => {
                  setSelectedCompany(id);
                  setCurrentView('company-profile');
                }}
              />
            )}
            {currentView === 'company-profile' && (
              <CompanyProfile
                companyId={selectedCompany}
                onBack={() => setCurrentView('home')}
              />
            )}
            {currentView === 'fleet-calendar' && (
              <div className="container" style={{ padding: '80px 0' }}>
                <div className="glass-morphism" style={{ padding: '48px', borderRadius: '32px' }}>
                  <FleetCalendar requests={requests} onBack={() => setCurrentView('home')} />
                </div>
              </div>
            )}
            {currentView === 'client' && finalClientView()}
            {(currentView === 'coordinator' || currentView === 'financial') && (
              <CoordinatorDashboard
                requests={requests}
                onUpdateStatus={updateRequestStatus}
                initialView={currentView === 'financial' ? 'financial' : 'home'}
                onGeneratePack={(req, legIdx = null) => {
                  setSelectedRequestForPack(req);
                  setSelectedLegIndex(legIdx);
                  setCurrentView('flight-pack');
                }}
              />
            )}
            {currentView === 'crew' && (
              <CrewPortal 
                requests={requests} 
                onUpdateRequest={updateRequestStatus} 
                currentUser={crewUser}
                onLogin={setCrewUser}
                onLogout={() => setCrewUser(null)}
              />
            )}
            {currentView === 'flight-pack' && (
              <FlightPack
                request={selectedRequestForPack}
                legIndex={selectedLegIndex}
                onBack={() => setCurrentView('coordinator')}
                onSave={(packData) => {
                  // Salvar os dados extras no request principal para persistência
                  updateRequestStatus(selectedRequestForPack.id, selectedRequestForPack.status, null, {
                    ...selectedRequestForPack,
                    ...packData
                  });
                  alert('Dados do Pack salvos com sucesso!');
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="section-padding" style={{ borderTop: '1px solid var(--glass-border)', paddingBottom: '60px', marginTop: '60px' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', marginBottom: '32px' }}>
            <span className="nav-link" onClick={() => setCurrentView('home')}>Home</span>
            <span className="nav-link" onClick={() => setCurrentView('client')}>Área Cliente</span>
            <span className="nav-link" onClick={() => setCurrentView('crew')}>Tripulação</span>
            <span className="nav-link" onClick={() => setCurrentView('coordinator')}>Coordenadores</span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            © 2026 Mil aviação & RBF Táxi Aéreo.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
