import React, { useState } from 'react'; // Importa recursos básicos do React
import { Calendar, MapPin, Users, Send, Plane, Clock, Coffee, FileText, User, Mail, CheckCircle, AlertCircle, Trash2, Search } from 'lucide-react'; // Importa ícones visuais
import { motion, AnimatePresence } from 'framer-motion'; // Importa componentes de animação
import { brazilianAirports } from '../data/airports'; // Importa a lista de aeroportos brasileiros para busca

export default function BookingForm({ selectedAircraft, onSubmit, initialData, isManualFlight = false, onManualFlightSubmit, onCancel }) { // Define o componente principal do formulário de reserva
    const initialLeg = { // Estrutura inicial para cada trecho do voo
        origin: '', // Aeroporto de origem
        destination: '', // Aeroporto de destino
        date: '', // Data do voo
        time: '', // Horário de decolagem
        passengers: 1, // Número de passageiros
        catering: '', // Observações de serviço de bordo
        passengerList: '', // Lista textual de passageiros (opcional)
        passengerData: [{ name: '', document: '' }] // Dados detalhados de cada passageiro
    };

    const [formData, setFormData] = useState(() => { // Estado que armazena todos os dados do formulário
        const processLeg = (leg) => { // Função auxiliar para garantir que os dados dos passageiros estejam corretos
            if (!leg.passengerData || !Array.isArray(leg.passengerData)) {
                const count = parseInt(leg.passengers) || 1;
                const pData = [];
                for (let i = 0; i < count; i++) {
                    pData.push({ name: '', document: '' });
                }
                return { ...leg, passengerData: pData, passengers: count };
            }
            return leg;
        };

        let initialDataObj;
        if (initialData) { // Se houver dados iniciais (edição), processa os trechos existentes
            const legs = [...initialData.legs].map(processLeg);
            while (legs.length < 5) { // Garante sempre 5 trechos disponíveis internamente
                legs.push({ ...initialLeg });
            }
            initialDataObj = {
                legs: legs,
                email: initialData.email || '',
                name: initialData.name || '',
                requestor: initialData.requestor || ''
            };
        } else { // Caso contrário, cria um novo formulário limpo
            initialDataObj = {
                legs: Array(5).fill(null).map((_, i) => ({
                    ...initialLeg,
                    origin: i === 0 ? 'SBBH - BELO HORIZONTE/MG' : '' // Define Pampulha como origem padrão no 1º trecho
                })),
                email: '',
                name: '',
                requestor: ''
            };
        }

        // Garante que o primeiro trecho tenha origem padrão se for uma nova solicitação
        if (!initialData && initialDataObj.legs[0] && !initialDataObj.legs[0].origin) {
            initialDataObj.legs[0].origin = 'SBBH - BELO HORIZONTE/MG';
        }

        return initialDataObj;
    });

    const [activeAutocomplete, setActiveAutocomplete] = useState({ index: null, field: null, results: [] }); // Controla o buscador de aeroportos
    const [timePicker, setTimePicker] = useState({ index: null, visible: false }); // Controla a seleção de horário

    const [visibleLegsCount, setVisibleLegsCount] = useState(2); // Controla quantos trechos são visíveis inicialmente

    React.useEffect(() => { // Hook para ajustar a visibilidade dos trechos quando carregados dados existentes
        if (initialData && initialData.legs) {
            const valid = initialData.legs.filter(l => l.origin || l.destination).length;
            setVisibleLegsCount(Math.max(2, valid));
        } else {
            setVisibleLegsCount(2);
        }
    }, [initialData]);

    const today = new Date().toISOString().split('T')[0]; // Obtém a data de hoje para o limite mínimo do calendário

    const handleLegChange = (index, field, value) => { // Gerencia alterações nos campos de cada trecho
        const newLegs = [...formData.legs];
        const upperValue = value.toUpperCase(); // Converte texto para maiúsculas (padrão aeronáutico)
        newLegs[index][field] = upperValue;

        // Lógica de busca de aeroportos (autocomplete)
        if (field === 'origin' || field === 'destination') {
            const results = brazilianAirports.filter(ap =>
                ap.icao.includes(upperValue) ||
                (ap.iata && ap.iata.includes(upperValue)) ||
                ap.name.toUpperCase().includes(upperValue) ||
                ap.city.toUpperCase().includes(upperValue)
            ).slice(0, 5);
            setActiveAutocomplete({ index, field, results });
        }

        const isPampulha = ['SBBH', 'PAMPULHA', 'BELO HORIZONTE'].some(key => upperValue.includes(key));

        // Lógica para preencher automaticamente a origem do próximo trecho com o destino do atual
        if (field === 'destination' && newLegs[index + 1]) {
            if (isPampulha) {
                newLegs[index + 1].origin = ''; // Se voltar para Pampulha, não assume como próxima origem
            } else {
                newLegs[index + 1].origin = upperValue;
            }
        }

        setFormData({ ...formData, legs: newLegs });
    };

    const selectAirport = (index, field, airport) => { // Função chamada ao selecionar um aeroporto na busca
        const newLegs = [...formData.legs];
        newLegs[index][field] = airport.label;

        // Repete o destino como próxima origem se não for Pampulha
        if (field === 'destination' && newLegs[index + 1]) {
            const isPampulha = ['SBBH', 'PAMPULHA'].some(key => airport.label.toUpperCase().includes(key));
            if (isPampulha) {
                newLegs[index + 1].origin = '';
            } else {
                newLegs[index + 1].origin = airport.label;
            }
        }

        setFormData({ ...formData, legs: newLegs });
        setActiveAutocomplete({ index: null, field: null, results: [] }); // Limpa a busca
    };

    const commonTimes = Array.from({ length: 48 }, (_, i) => { // Gera uma lista de horários de 30 em 30 minutos
        const h = Math.floor(i / 2).toString().padStart(2, '0');
        const m = (i % 2 === 0 ? '00' : '30');
        return `${h}:${m}`;
    });

    const handlePaxBlur = (index, e) => { // Acionado quando o usuário termina de preencher os passageiros
        // Impede o disparo se o clique for dentro do mesmo container
        const nextTarget = e.relatedTarget;
        if (nextTarget && nextTarget.closest('.pax-container-' + index)) {
            return;
        }

        const leg = formData.legs[index];
        const hasData = leg.passengerData.some(p => p.name || p.document);

        if (hasData) { // Se houver dados preenchidos, pergunta se deseja replicar para os próximos trechos
            const nextLegsWithRoute = formData.legs.slice(index + 1).filter(l => l.origin && l.destination);
            if (nextLegsWithRoute.length > 0) {
                setTimeout(() => {
                    if (confirm("Deseja usar esta mesma lista de passageiros para as próximas etapas de voo?")) {
                        const newLegs = [...formData.legs];
                        const paxDataString = JSON.stringify(leg.passengerData);
                        for (let i = index + 1; i < newLegs.length; i++) {
                            if (newLegs[i].origin && newLegs[i].destination) {
                                newLegs[i].passengerData = JSON.parse(paxDataString);
                                newLegs[i].passengers = leg.passengers;
                            }
                        }
                        setFormData({ ...formData, legs: newLegs });
                    }
                }, 100);
            }
        }
    };

    const handleContactChange = (e) => { // Gerencia campos simples como e-mail e nome do solicitante
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => { // Envia o formulário
        e.preventDefault();
        if (!selectedAircraft) {
            alert('Por favor, selecione uma aeronave primeiro.');
            document.getElementById('aircraft-selection').scrollIntoView({ behavior: 'smooth' });
            return;
        }

        // Filtra trechos vazios (mantém apenas o primeiro ou os preenchidos)
        const activeLegs = formData.legs.filter((leg, idx) => idx === 0 || leg.origin || leg.destination);
        onSubmit({ ...formData, legs: activeLegs, aircraft: selectedAircraft });
    };

    const [showCancelModal, setShowCancelModal] = useState(false); // Estado para o modal de cancelamento

    const handleCancelClick = () => { // Abre o modal de cancelamento
        setShowCancelModal(true);
    };

    const confirmCancel = () => { // Confirma o cancelamento do voo
        if (onCancel && initialData) {
            onCancel(initialData.id);
        }
        setShowCancelModal(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-morphism"
            style={{
                padding: '48px 40px',
                borderRadius: '32px',
                width: '100%',
                margin: '0 auto',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '48px', flexWrap: 'wrap', gap: '16px' }}>
                <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: '2.5rem' }}>
                    {initialData ? 'Editar Voo' : 'Solicitar Voo'} <span style={{ fontSize: '0.8rem', verticalAlign: 'middle', opacity: 0.5 }}>v2.2.4</span> {/* Título dinâmico */}
                </h2>
                {initialData && onCancel && (
                    <button
                        type="button"
                        onClick={handleCancelClick}
                        className="premium-button"
                        style={{
                            background: '#dc2626',
                            border: '1px solid #ef4444',
                            color: '#fff',
                            padding: '12px 24px',
                            fontWeight: 'bold',
                            boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                        }}
                    >
                        <AlertCircle size={20} /> SOLICITAR CANCELAMENTO
                    </button>
                )}
            </div>

            <AnimatePresence>
                {showCancelModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        backdropFilter: 'blur(8px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        padding: '24px'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="glass-morphism"
                            style={{
                                padding: '48px',
                                borderRadius: '32px',
                                maxWidth: '500px',
                                width: '100%',
                                textAlign: 'center',
                                border: '2px solid #ef4444',
                                boxShadow: '0 0 50px rgba(220, 38, 38, 0.2)'
                            }}
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'rgba(220, 38, 38, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 24px',
                                border: '1px solid #ef4444'
                            }}>
                                <AlertCircle size={40} color="#ef4444" />
                            </div>
                            <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#fff' }}>Tem certeza?</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '40px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                                Você está prestes a solicitar o cancelamento deste voo. Esta ação notificará imediatamente a coordenação.
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    className="premium-button"
                                    style={{
                                        background: 'transparent',
                                        border: '1px solid var(--glass-border)',
                                        justifyContent: 'center',
                                        color: 'var(--text-muted)'
                                    }}
                                >
                                    Não, Manter
                                </button>
                                <button // Botão de confirmação de cancelamento
                                    onClick={confirmCancel}
                                    className="premium-button"
                                    style={{
                                        background: '#dc2626',
                                        color: '#fff',
                                        justifyContent: 'center',
                                        border: 'none',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    Sim, Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}> {/* Início do formulário principal */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: '20px',
                    marginBottom: '40px'
                }}>
                    <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                        <label className="form-label" style={{ marginBottom: '8px' }}>Aeronave Selecionada</label>
                        <div style={{
                            padding: '16px 20px',
                            background: 'var(--primary-light)',
                            borderRadius: '12px',
                            color: selectedAircraft ? 'var(--primary)' : 'var(--text-muted)',
                            fontWeight: '600',
                            fontSize: '1rem',
                            border: '1px solid var(--primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            height: '52px',
                            marginTop: 'auto'
                        }}>
                            <Plane size={18} />
                            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {selectedAircraft ? `${selectedAircraft.name}` : 'Nenhuma selecionada'}
                            </span>
                        </div>
                    </div>

                    <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                        <label htmlFor="name" className="form-label" style={{ marginBottom: '8px' }}>Identificação do Cliente</label>
                        <div style={{ position: 'relative', marginTop: 'auto' }}>
                            <User size={18} style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: formData.name ? 'var(--primary)' : 'var(--text-muted)',
                                transition: 'var(--transition)',
                                zIndex: 1
                            }} />
                            <select
                                id="name"
                                name="name"
                                required
                                className="input-field"
                                style={{
                                    paddingLeft: '48px',
                                    height: '52px',
                                    appearance: 'none',
                                    color: formData.name ? 'var(--primary)' : 'var(--text-muted)',
                                    backgroundColor: formData.name ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.04)',
                                    border: formData.name ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                    fontWeight: formData.name ? '600' : '400',
                                    transition: 'var(--transition)'
                                }}
                                value={formData.name}
                                onChange={handleContactChange}
                            >
                                <option value="" disabled style={{ color: '#000' }}>Selecione o Cliente</option>
                                <option value="MRV&CO" style={{ color: '#000' }}>MRV&CO</option>
                                <option value="MRV" style={{ color: '#000' }}>MRV</option>
                                <option value="BANCO INTER" style={{ color: '#000' }}>BANCO INTER</option>
                                <option value="BAMAQ" style={{ color: '#000' }}>BAMAQ</option>
                                <option value="ATEX" style={{ color: '#000' }}>ATEX</option>
                                <option value="RENATO SALVADOR" style={{ color: '#000' }}>RENATO SALVADOR</option>
                                <option value="CONEDI" style={{ color: '#000' }}>CONEDI</option>
                                <option value="LOG" style={{ color: '#000' }}>LOG</option>
                                <option value="Outros" style={{ color: '#000' }}>Outros (Digitar manualmente...)</option>
                            </select>
                        </div>
                        {formData.name === 'Outros' && (
                            <input
                                type="text"
                                name="customName"
                                placeholder="Nome da Empresa ou Passageiro"
                                required
                                className="input-field"
                                style={{ marginTop: '12px', height: '52px' }}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        )}
                    </div>
                </div>

                {formData.legs.map((leg, index) => {
                    if (index > visibleLegsCount) return null;
                    if (index === visibleLegsCount) {
                        return (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                onClick={() => setVisibleLegsCount(prev => prev + 1)}
                                style={{
                                    marginBottom: '48px',
                                    padding: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    borderRadius: '24px',
                                    border: '2px dashed var(--glass-border)',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    transition: 'var(--transition)'
                                }}
                                whileHover={{ scale: 1.01, background: 'rgba(255, 255, 255, 0.05)', borderColor: 'var(--primary)' }}
                                whileTap={{ scale: 0.99 }}
                            >
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{ fontSize: '24px', color: '#000', fontWeight: 'bold' }}>+</div>
                                </div>
                                <h3 style={{
                                    color: 'var(--primary)',
                                    fontSize: '1.2rem',
                                    margin: 0,
                                    fontWeight: '600'
                                }}>
                                    Adicionar {index + 1}ª Etapa
                                </h3>
                            </motion.div>
                        );
                    }
                    return (
                        <div key={index} style={{
                            marginBottom: '48px',
                            paddingBottom: '32px',
                            borderBottom: index < 4 ? '1px solid var(--glass-border)' : 'none'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{
                                    color: 'var(--primary)',
                                    fontSize: '1.25rem',
                                    margin: 0,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <span style={{
                                        background: 'var(--primary)',
                                        color: '#000',
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '0.9rem'
                                    }}>{index + 1}</span>
                                    Dados do Trecho {index + 1}
                                </h3>

                                {index > 1 && index === visibleLegsCount - 1 && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const newLegs = [...formData.legs];
                                            newLegs[index] = { ...initialLeg };
                                            setFormData({ ...formData, legs: newLegs });
                                            setVisibleLegsCount(prev => prev - 1);
                                        }}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid #ef4444',
                                            color: '#ef4444',
                                            padding: '6px 12px',
                                            borderRadius: '8px',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'var(--transition)'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                    >
                                        <Trash2 size={14} /> Remover Etapa
                                    </button>
                                )}
                            </div>

                            <div className="form-container">
                                <div className="form-group">
                                    <label htmlFor={`origin-${index}`} className="form-label">Origem</label>
                                    <div className="input-with-icon">
                                        <MapPin size={18} className="input-icon" />
                                        <input
                                            id={`origin-${index}`}
                                            type="text"
                                            placeholder="Ex: São Paulo (SBSP)"
                                            required={index === 0}
                                            className="input-field"
                                            value={leg.origin}
                                            onChange={(e) => handleLegChange(index, 'origin', e.target.value)}
                                            onFocus={(e) => handleLegChange(index, 'origin', e.target.value)}
                                            autoComplete="off"
                                        />
                                        {activeAutocomplete.index === index && activeAutocomplete.field === 'origin' && activeAutocomplete.results.length > 0 && (
                                            <div className="glass-morphism" style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                zIndex: 100,
                                                marginTop: '8px',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                background: 'rgba(20, 20, 20, 0.95)',
                                                border: '1px solid var(--primary)'
                                            }}>
                                                {activeAutocomplete.results.map((ap, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => selectAirport(index, 'origin', ap)}
                                                        style={{
                                                            padding: '12px 16px',
                                                            cursor: 'pointer',
                                                            borderBottom: i < activeAutocomplete.results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px'
                                                        }}
                                                        className="autocomplete-item"
                                                    >
                                                        <Search size={14} color="var(--primary)" />
                                                        {ap.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor={`destination-${index}`} className="form-label">Destino</label>
                                    <div className="input-with-icon">
                                        <MapPin size={18} className="input-icon" />
                                        <input
                                            id={`destination-${index}`}
                                            type="text"
                                            placeholder="Ex: Angra dos Reis"
                                            required={index === 0}
                                            className="input-field"
                                            value={leg.destination}
                                            onChange={(e) => handleLegChange(index, 'destination', e.target.value)}
                                            onFocus={(e) => handleLegChange(index, 'destination', e.target.value)}
                                            autoComplete="off"
                                        />
                                        {activeAutocomplete.index === index && activeAutocomplete.field === 'destination' && activeAutocomplete.results.length > 0 && (
                                            <div className="glass-morphism" style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                zIndex: 100,
                                                marginTop: '8px',
                                                borderRadius: '12px',
                                                overflow: 'hidden',
                                                background: 'rgba(20, 20, 20, 0.95)',
                                                border: '1px solid var(--primary)'
                                            }}>
                                                {activeAutocomplete.results.map((ap, i) => (
                                                    <div
                                                        key={i}
                                                        onClick={() => selectAirport(index, 'destination', ap)}
                                                        style={{
                                                            padding: '12px 16px',
                                                            cursor: 'pointer',
                                                            borderBottom: i < activeAutocomplete.results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px'
                                                        }}
                                                        className="autocomplete-item"
                                                    >
                                                        <Search size={14} color="var(--primary)" />
                                                        {ap.label}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor={`date-${index}`} className="form-label">Data do Voo</label>
                                    <div className="input-with-icon">
                                        <Calendar size={18} className="input-icon" />
                                        <input
                                            id={`date-${index}`}
                                            type="date"
                                            min={today}
                                            required={index === 0}
                                            className="input-field"
                                            value={leg.date}
                                            onChange={(e) => handleLegChange(index, 'date', e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Tab' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    setTimeout(() => {
                                                        document.getElementById(`time-${index}`)?.focus();
                                                    }, 10);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group" style={{ position: 'relative' }}>
                                    <label htmlFor={`time-${index}`} className="form-label">Horário de Decolagem</label>
                                    <div className="input-with-icon">
                                        <Clock size={14} className="input-icon" />
                                        <input
                                            id={`time-${index}`}
                                            type="time"
                                            required={index === 0}
                                            className="input-field"
                                            value={leg.time}
                                            onChange={(e) => handleLegChange(index, 'time', e.target.value)}
                                            onFocus={() => setTimePicker({ index, visible: true })}
                                            onBlur={() => setTimeout(() => setTimePicker({ index: null, visible: false }), 200)}
                                        />
                                        {timePicker.visible && timePicker.index === index && (
                                            <div className="glass-morphism" style={{
                                                position: 'absolute',
                                                top: '100%',
                                                left: 0,
                                                right: 0,
                                                maxHeight: '200px',
                                                overflowY: 'auto',
                                                zIndex: 1001,
                                                marginTop: '8px',
                                                background: 'rgba(20, 20, 20, 0.95)',
                                                border: '1px solid var(--primary)',
                                                borderRadius: '12px'
                                            }}>
                                                {commonTimes.map(t => (
                                                    <div
                                                        key={t}
                                                        onClick={() => handleLegChange(index, 'time', t)}
                                                        style={{
                                                            padding: '10px 16px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                        }}
                                                        className="autocomplete-item"
                                                    >
                                                        {t}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Quantidade de Passageiros</label>
                                    <div className="input-with-icon">
                                        <Users size={18} className="input-icon" />
                                        <input
                                            type="number"
                                            min="0"
                                            max={selectedAircraft?.passengers || 20}
                                            className="input-field"
                                            disabled={!leg.origin || !leg.destination}
                                            placeholder={(!leg.origin || !leg.destination) ? "Preencha origem e destino" : ""}
                                            value={leg.passengers === '' ? '' : leg.passengers}
                                            onChange={(e) => {
                                                const valStr = e.target.value;

                                                // Handle empty input for better typing experience
                                                if (valStr === '') {
                                                    const newLegs = [...formData.legs];
                                                    newLegs[index].passengers = '';
                                                    setFormData({ ...formData, legs: newLegs });
                                                    return;
                                                }

                                                let val = parseInt(valStr);
                                                const max = selectedAircraft?.passengers || 20;

                                                // Allow zero and clamp upper bound
                                                if (val > max) val = max;
                                                if (val < 0) val = 0;

                                                const newLegs = [...formData.legs];
                                                // Ensure passengerData exists
                                                if (!newLegs[index].passengerData) {
                                                    newLegs[index].passengerData = [];
                                                }

                                                // Sync the passenger list array
                                                const currentData = [...newLegs[index].passengerData];
                                                if (val > currentData.length) {
                                                    const toAdd = val - currentData.length;
                                                    for (let i = 0; i < toAdd; i++) {
                                                        currentData.push({ name: '', document: '' });
                                                    }
                                                } else if (val < currentData.length) {
                                                    currentData.splice(val);
                                                }
                                                newLegs[index].passengerData = currentData;

                                                newLegs[index].passengers = val;
                                                setFormData({ ...formData, legs: newLegs });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label className="form-label" style={{ marginBottom: '16px', display: 'block' }}>Lista de Passageiros</label>
                                    <div
                                        className={`pax-container-${index}`}
                                        onBlur={(e) => handlePaxBlur(index, e)}
                                        style={{ display: 'flex', flexDirection: 'column', gap: '16px', opacity: (!leg.origin || !leg.destination) ? 0.5 : 1, pointerEvents: (!leg.origin || !leg.destination) ? 'none' : 'auto' }}
                                    >

                                        {leg.passengerData?.map((pax, pIdx) => (
                                            <motion.div
                                                key={pIdx}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: 'minmax(0, 1.5fr) minmax(0, 1fr) auto',
                                                    gap: '12px',
                                                    alignItems: 'center',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    padding: '16px',
                                                    borderRadius: '16px',
                                                    border: '1px solid var(--glass-border)'
                                                }}
                                            >
                                                <div style={{ position: 'relative' }}>
                                                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                    <input
                                                        type="text"
                                                        placeholder={`Nome do Passageiro ${pIdx + 1}`}
                                                        className="input-field"
                                                        style={{ paddingLeft: '36px', height: '42px', fontSize: '0.9rem' }}
                                                        value={pax.name}
                                                        onChange={(e) => {
                                                            const newLegs = [...formData.legs];
                                                            newLegs[index].passengerData[pIdx].name = e.target.value;
                                                            setFormData({ ...formData, legs: newLegs });
                                                        }}
                                                    />
                                                </div>
                                                <div style={{ position: 'relative' }}>
                                                    <FileText size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                                    <input
                                                        type="text"
                                                        placeholder="Documento (RG/CPF)"
                                                        className="input-field"
                                                        style={{ paddingLeft: '36px', height: '42px', fontSize: '0.9rem' }}
                                                        value={pax.document}
                                                        onChange={(e) => {
                                                            const newLegs = [...formData.legs];
                                                            newLegs[index].passengerData[pIdx].document = e.target.value;
                                                            setFormData({ ...formData, legs: newLegs });
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newLegs = [...formData.legs];
                                                        newLegs[index].passengerData.splice(pIdx, 1);
                                                        newLegs[index].passengers = newLegs[index].passengerData.length;
                                                        setFormData({ ...formData, legs: newLegs });
                                                    }}
                                                    style={{
                                                        background: 'rgba(248, 113, 113, 0.1)',
                                                        border: '1px solid #f87171',
                                                        color: '#f87171',
                                                        width: '32px',
                                                        height: '32px',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                    title="Remover"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>

                                <div className="form-group full-width" style={{ marginTop: '24px' }}>
                                    <label htmlFor={`catering-${index}`} className="form-label">Catering</label>
                                    <div className="input-with-icon" style={{ alignItems: 'flex-start' }}>
                                        <Coffee size={18} className="input-icon" style={{ marginTop: '16px' }} />
                                        <textarea
                                            id={`catering-${index}`}
                                            placeholder="Ex: &#10;• Frutas&#10;• Sanduiches&#10;• Bebidas..."
                                            className="input-field"
                                            style={{
                                                minHeight: '120px',
                                                paddingTop: '14px',
                                                lineHeight: '1.6',
                                                resize: 'vertical',
                                                paddingLeft: '48px'
                                            }}
                                            value={leg.catering}
                                            onChange={(e) => handleLegChange(index, 'catering', e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                <div className="form-container" style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="form-group full-width">
                        <label htmlFor="requestor" className="form-label">Solicitante (Quem está preenchendo)</label>
                        <div style={{ position: 'relative' }}>
                            <FileText size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="requestor"
                                type="text"
                                name="requestor"
                                placeholder="Solicitante"
                                required
                                className="input-field"
                                style={{ paddingLeft: '48px', height: '52px' }}
                                value={formData.requestor}
                                onChange={handleContactChange}
                            />
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="email" className="form-label">Confirmação de E-mail</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                id="email"
                                type="email"
                                name="email"
                                placeholder="contato@exemplo.com"
                                required
                                className="input-field"
                                style={{ paddingLeft: '48px' }}
                                value={formData.email}
                                onChange={handleContactChange}
                            />
                        </div>
                    </div>
                </div>

                {isManualFlight ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '48px' }}>
                        <button
                            className="premium-button"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                if (!selectedAircraft) {
                                    alert('Por favor, selecione uma aeronave primeiro.');
                                    return;
                                }
                                const activeLegs = formData.legs.filter((leg, idx) => idx === 0 || leg.origin || leg.destination);
                                onManualFlightSubmit('aprovado', { ...formData, legs: activeLegs, aircraft: selectedAircraft });
                            }}
                            style={{
                                background: '#34d399',
                                color: '#000',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                            }}
                        >
                            <CheckCircle size={20} /> VOO CONFIRMADO
                        </button>
                        <button
                            className="premium-button"
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                if (!selectedAircraft) {
                                    alert('Por favor, selecione uma aeronave primeiro.');
                                    return;
                                }
                                const activeLegs = formData.legs.filter((leg, idx) => idx === 0 || leg.origin || leg.destination);
                                onManualFlightSubmit('pendente', { ...formData, legs: activeLegs, aircraft: selectedAircraft });
                            }}
                            style={{
                                background: '#fbbf24',
                                color: '#000',
                                justifyContent: 'center',
                                fontWeight: 'bold'
                            }}
                        >
                            <AlertCircle size={20} /> VOO PENDENTE
                        </button>
                    </div>
                ) : (
                    <button
                        className="premium-button"
                        type="submit"
                        style={{ width: '100%', marginTop: '48px', justifyContent: 'center' }}
                    >
                        <Send size={20} />
                        {initialData ? 'Solicitar Atualização' : 'Enviar Solicitação de Voo'}
                    </button>
                )}
            </form>
        </motion.div>
    );
}
