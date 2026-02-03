import React, { useState, useEffect } from 'react';
import { Plane, Shield, Globe, Clock, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AircraftSelector from './components/AircraftSelector';
import BookingForm from './components/BookingForm';
import PortalHome from './components/PortalHome';
import CoordinatorDashboard from './components/CoordinatorDashboard';
import ClientPortal from './components/ClientPortal';
import FleetCalendar from './components/FleetCalendar';
import SetPassword from './components/SetPassword';
import CrewPortal from './components/CrewPortal';
import FlightPack from './components/FlightPack';

import CompanyProfile from './components/CompanyProfile';
import { saveFlights, loadFlights, forceSaveSync, diagnoseStorage, startAutoSave } from './utils/flightPersistence';
import { getTimestamp } from './utils/dateUtils';

// Flag de debug - mude para true para ativar logs detalhados
const DEBUG_PERSISTENCE = false;

function App() {
  const [currentView, setCurrentView] = useState(() => {
    const saved = localStorage.getItem('milavia_view');
    return saved || 'home';
  });
  const [selectedCompany, setSelectedCompany] = useState(null); // 'mil' or 'rbf'
  const [selectedAircraft, setSelectedAircraft] = useState(null);
  const [selectedRequestForPack, setSelectedRequestForPack] = useState(null);
  const [selectedLegIndex, setSelectedLegIndex] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(() => {
    return localStorage.getItem('milavia_submitted') === 'true';
  });

  // Persistence for view and submitted state
  useEffect(() => {
    localStorage.setItem('milavia_view', currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem('milavia_submitted', isSubmitted.toString());
  }, [isSubmitted]);

  // Scroll to top on navigation or state changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView, isSubmitted, selectedAircraft, selectedCompany]);

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('milavia_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [requests, setRequests] = useState(() => {
    console.log('[APP] 🔄 Inicializando aplicação e carregando voos...');

    // Usar o novo sistema ultra robusto
    let flights = loadFlights();

    // Auto-complete flights that have passed
    const today = new Date().toISOString().split('T')[0];
    flights = flights.map(req => {
      if (req.status !== 'aprovado' || !req.legs || req.legs.length === 0) return req;

      const lastLeg = req.legs[req.legs.length - 1];
      if (lastLeg.date < today) {
        return { ...req, status: 'concluido' };
      }
      return req;
    });

    // Executar diagnóstico na primeira carga
    diagnoseStorage();

    return flights;
  });

  // Estado para controlar se houve interação do usuário (para evitar salvamentos acidentais na carga inicial)
  const [hasInteracted, setHasInteracted] = useState(false);

  // Sistema ultra robusto de salvamento automático
  // Só salva se houver dados OU se o usuário já tiver interagido com a aplicação
  useEffect(() => {
    // Se a lista tiver dados, é seguro salvar (estamos atualizando dados existentes)
    if (requests.length > 0) {
      saveFlights(requests);
    }
    // Se a lista estiver vazia, SÓ salvamos se tivermos certeza que foi uma ação do usuário
    // A função saveFlights agora também tem uma proteção interna contra wipedia, mas aqui evitamos sequer chamar
    else if (hasInteracted) {
      console.log('Salvando lista vazia (Ação do usuário detectada)');
      saveFlights(requests, true); // Forçamos o salvamento pois sabemos que houve interação
    }
  }, [requests, hasInteracted]);

  // Migração ativa: toda vez que o app abre, garantimos que dados antigos virem "final" e limpamos as chaves temporárias
  useEffect(() => {
    const chavesAntigas = ['milavia_requests_v5', 'milavia_requests_v4', 'milavia_requests_v3', 'milavia_requests_v2', 'milavia_requests'];
    chavesAntigas.forEach(chave => {
      // Não removemos aqui no mount para evitar riscos, apenas as lógicas acima já resolvem.
    });
  }, []);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('milavia_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('milavia_user');
    }
  }, [currentUser]);

  // Proteção adicional: Auto-salvamento periódico e salvamento antes de descarregar
  useEffect(() => {
    // Ativar auto-salvamento a cada 5 segundos
    startAutoSave(() => requests);

    const handleBeforeUnload = () => {
      console.log('[APP] 🚨 Página sendo fechada/atualizada - salvamento forçado!');
      // Se tiver requests, salva. Se não tiver, só salva se houve interação.
      if (requests.length > 0) {
        forceSaveSync(requests);
      } else if (hasInteracted) {
        forceSaveSync(requests, true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [requests, hasInteracted]); // Adicionando hasInteracted nas dependências


  const [editingRequestId, setEditingRequestId] = useState(null);

  const handleBookingSubmit = (data) => {
    const newRequest = {
      id: Date.now(),
      userId: currentUser?.id || 'anonymous',
      userName: currentUser?.name || 'Cliente Externo',
      userEmail: currentUser?.email || '',
      timestamp: getTimestamp(),
      ...data,
      aircraft: selectedAircraft,
      status: 'novo'
    };

    setHasInteracted(true); // Marca interação do usuário

    if (editingRequestId) {
      setRequests(prev => prev.map(req => {
        if (req.id === editingRequestId) {
          return {
            ...req,
            ...data,
            userId: currentUser?.id || req.userId || 'anonymous',
            status: req.status === 'recusado' ? 'novo' : req.status,
            observation: req.observation,
            oldData: { ...req },
            timestamp: getTimestamp()
          };
        }
        return req;
      }));
      setEditingRequestId(null);
    } else {
      setRequests(prev => [newRequest, ...prev]);
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

    // Se editedData tem todas as propriedades de um novo request
    if (editedData && editedData.userId === 'coordinator-manual' && !requests.find(r => r.id === requestId)) {
      setRequests(prev => [editedData, ...prev]);
      return;
    }

    setRequests(prev => {
      return prev.map(req => {
        if (req.id === requestId) {
          // Lógica para preservar o histórico quando o cliente solicita alteração
          let base = editedData || req;

          if (editedData && newStatus === 'alteracao_solicitada') {
            // Se estamos recebendo uma edição do cliente, salvamos o estado anterior (original) como oldData
            // para que o coordenador possa ver o "diff" (destaque do que mudou)
            base = {
              ...editedData,
              oldData: req.oldData ? req.oldData : req // Mantém o oldData original se já existir, senão usa o atual
            };

            // Caso especial: se o request estava "aprovado" ou "pendente", ele é a versão estável.
            // Então garantimos que o oldData seja EXATAMENTE ele.
            if (req.status === 'aprovado' || req.status === 'pendente') {
              base.oldData = req;
            }
          }

          const finalObservation = observation !== null ? observation : (base.observation || req.observation);
          return {
            ...base,
            status: newStatus,
            observation: finalObservation
          };
        }
        return req;
      });
    });
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
            {currentView === 'coordinator' && (
              <CoordinatorDashboard
                requests={requests}
                onUpdateStatus={updateRequestStatus}
                onGeneratePack={(req, legIdx = null) => {
                  setSelectedRequestForPack(req);
                  setSelectedLegIndex(legIdx);
                  setCurrentView('flight-pack');
                }}
              />
            )}
            {currentView === 'crew' && (
              <CrewPortal requests={requests} />
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
