import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter, Plane, Clock, MapPin, Users, Coffee, X, Info, HelpCircle, FileText, Fingerprint, ArrowLeft } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

export default function FleetCalendar({ requests = [], onBack }) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState('month'); // 'month', 'week', 'day'
    const [selectedFlight, setSelectedFlight] = useState(null);
    const [viewingDetails, setViewingDetails] = useState(null); // Just for read-only viewing from calendar

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];

    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const handlePrev = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() - 1);
            newDate.setDate(1); // Avoid overflow issues
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() - 7);
        } else { // day
            newDate.setDate(newDate.getDate() - 1);
        }
        setCurrentDate(newDate);
    };

    const handleNext = () => {
        const newDate = new Date(currentDate);
        if (viewMode === 'month') {
            newDate.setMonth(newDate.getMonth() + 1);
            newDate.setDate(1);
        } else if (viewMode === 'week') {
            newDate.setDate(newDate.getDate() + 7);
        } else { // day
            newDate.setDate(newDate.getDate() + 1);
        }
        setCurrentDate(newDate);
    };

    // Resets to "today" and default view (optional, but good UX to have a way to reset)
    // For now keeping simple as requested: just persist month view on new entry (which is default state)

    // Process requests
    const activeRequests = requests.filter(req =>
        (req.status === 'aprovado' || req.status === 'pendente' || req.status === 'concluido') &&
        req.legs && req.legs.length > 0
    ).map(req => {
        const sortedLegs = [...req.legs].sort((a, b) => a.date.localeCompare(b.date));
        return {
            ...req,
            startDateStr: sortedLegs[0].date,
            endDateStr: sortedLegs[sortedLegs.length - 1].date,
            start: new Date(sortedLegs[0].date + 'T00:00:00'),
            end: new Date(sortedLegs[sortedLegs.length - 1].date + 'T23:59:59')
        };
    });

    const overlaps = (a, b) => a.start <= b.end && b.start <= a.end;

    const assignTracks = (reqs) => {
        const sorted = [...reqs].sort((a, b) => a.startDateStr.localeCompare(b.startDateStr));
        const tracks = [];
        return sorted.map(req => {
            let trackIndex = 0;
            while (tracks[trackIndex] && tracks[trackIndex].some(r => overlaps(r, req))) {
                trackIndex++;
            }
            if (!tracks[trackIndex]) tracks[trackIndex] = [];
            tracks[trackIndex].push(req);
            return { ...req, trackIndex };
        });
    };

    const requestsWithTracks = assignTracks(activeRequests);
    const maxTrack = requestsWithTracks.reduce((max, req) => Math.max(max, req.trackIndex), -1);

    const getEventsForDay = (dObj) => {
        // dObj is a Date object
        const targetDate = new Date(dObj);
        targetDate.setHours(12, 0, 0, 0); // normalize
        return requestsWithTracks.filter(req => targetDate >= req.start && targetDate <= req.end);
    };

    // GENERATE GRID CELLS BASED ON VIEW MODE
    let dayCells = [];
    let gridTemplateColumns = 'repeat(7, 1fr)';
    let gridTemplateRows = '50px repeat(6, 140px)';
    let showWeekDaysRequest = true;

    if (viewMode === 'month') {
        const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
        const getFirstDayOfMonth = (y, m) => new Date(y, m, 1, 12, 0, 0).getDay();

        const totalDays = getDaysInMonth(year, month);
        const startDayOffset = getFirstDayOfMonth(year, month);

        const prevMonthIdx = month === 0 ? 11 : month - 1;
        const prevMonthYear = month === 0 ? year - 1 : year;
        const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonthIdx);

        for (let i = startDayOffset - 1; i >= 0; i--) {
            dayCells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), currentMonth: false });
        }
        for (let d = 1; d <= totalDays; d++) {
            dayCells.push({ date: new Date(year, month, d), currentMonth: true });
        }
        const currentLength = dayCells.length;
        const remainder = currentLength % 7;
        const daysToAdd = remainder === 0 ? 0 : 7 - remainder;

        for (let d = 1; d <= daysToAdd; d++) {
            dayCells.push({ date: new Date(year, month + 1, d), currentMonth: false });
        }

        // Dynamic rows based on content
        const numRows = Math.ceil(dayCells.length / 7);
        gridTemplateRows = `50px repeat(${numRows}, 140px)`;
    } else if (viewMode === 'week') {
        // Find start of week (Sunday)
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

        gridTemplateRows = '50px 1fr'; // Header + 1 tall row

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);
            dayCells.push({ date: d, currentMonth: true }); // 'currentMonth' mostly for styling opacity
        }
    } else if (viewMode === 'day') {
        gridTemplateColumns = '1fr';
        gridTemplateRows = '50px 1fr';
        dayCells.push({ date: new Date(currentDate), currentMonth: true });
    }

    // Attach events to cells
    dayCells = dayCells.map(cell => ({
        ...cell,
        events: getEventsForDay(cell.date)
    }));

    const aircraftColors = {
        'PT-RBZ | Global 6000': { main: '#6366f1', light: 'rgba(99, 102, 241, 0.25)' },
        'PS-MEP | Citation CJ4': { main: '#10b981', light: 'rgba(16, 185, 129, 0.25)' },
        'PR-KRT | Citation CJ2+': { main: '#f43f5e', light: 'rgba(244, 63, 94, 0.25)' },
        'PS-MIB | Citation M2': { main: '#f59e0b', light: 'rgba(245, 158, 11, 0.25)' },
    };

    const getAircraftStyle = (name) => {
        if (!name) return { main: '#94a3b8', light: 'rgba(148, 163, 184, 0.2)' };
        if (aircraftColors[name]) return aircraftColors[name];
        const key = Object.keys(aircraftColors).find(k => name.includes(k) || k.includes(name));
        return key ? aircraftColors[key] : { main: '#94a3b8', light: 'rgba(148, 163, 184, 0.2)' };
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'aprovado': return { label: 'Confirmado', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
            case 'novo': return { label: 'Em Análise', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
            case 'alteracao_solicitada': return { label: 'Alteração do Voo', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' };
            case 'pendente': return { label: 'Pendência', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
            default: return { label: status, color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.1)' };
        }
    };

    const GRID_COLOR = 'rgba(255, 255, 255, 0.15)';

    const getTitle = () => {
        if (viewMode === 'month') return `${monthNames[month]} ${year}`;
        if (viewMode === 'week') {
            const start = dayCells[0].date;
            const end = dayCells[6].date;
            const startStr = `${start.getDate()} ${monthNames[start.getMonth()].substring(0, 3)}`;
            const endStr = `${end.getDate()} ${monthNames[end.getMonth()].substring(0, 3)}`;
            return `${startStr} - ${endStr}`;
        }
        if (viewMode === 'day') {
            const d = dayCells[0].date;
            return `${d.getDate()} de ${monthNames[d.getMonth()]}`;
        }
    };

    return (
        <div className="fleet-calendar" style={{ width: '100%', position: 'relative' }}>
            <button
                onClick={onBack}
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'var(--text-main)',
                    padding: '12px 24px',
                    borderRadius: '14px',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    marginBottom: '40px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--primary)';
                    e.currentTarget.style.color = '#000';
                    e.currentTarget.style.transform = 'translateX(-5px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(201, 168, 106, 0.2)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = 'var(--text-main)';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                }}
            >
                <ArrowLeft size={20} /> Voltar ao Início
            </button>
            {/* Header Controls */}
            <div className="calendar-header-mobile-stack" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ background: 'var(--primary-light)', padding: '12px', borderRadius: '12px' }}>
                        <CalendarIcon size={24} color="var(--primary)" />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.5rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fff' }}>
                            {getTitle()}
                        </h3>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Agenda Operacional da Frota</p>
                    </div>
                </div>

                {/* View Mode Switcher */}
                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '12px', padding: '4px', display: 'flex' }}>
                    <button
                        onClick={() => setViewMode('month')}
                        style={{
                            background: viewMode === 'month' ? 'var(--primary)' : 'transparent',
                            color: viewMode === 'month' ? '#000' : 'var(--text-muted)',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Mês
                    </button>
                    <button
                        onClick={() => setViewMode('week')}
                        style={{
                            background: viewMode === 'week' ? 'var(--primary)' : 'transparent',
                            color: viewMode === 'week' ? '#000' : 'var(--text-muted)',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Semana
                    </button>
                    <button
                        onClick={() => setViewMode('day')}
                        style={{
                            background: viewMode === 'day' ? 'var(--primary)' : 'transparent',
                            color: viewMode === 'day' ? '#000' : 'var(--text-muted)',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        Dia
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={handlePrev} className="premium-button" style={{ padding: '10px', borderRadius: '12px', minWidth: '44px' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={handleNext} className="premium-button" style={{ padding: '10px', borderRadius: '12px', minWidth: '44px' }}>
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* UNIFIED CALENDAR BOX */}
            <div style={{
                border: `1px solid ${GRID_COLOR}`,
                borderRadius: '24px',
                overflow: 'hidden',
                background: 'rgba(14, 14, 17, 0.85)',
                display: 'grid',
                gridTemplateColumns: gridTemplateColumns,
                gridTemplateRows: gridTemplateRows,
                width: '100%',
                maxWidth: '1120px',
                margin: '0 auto',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
            }} className="calendar-grid-container">
                {/* Weekday Headers */}
                {viewMode !== 'day' ? weekDays.map((wd, i) => (
                    <div key={wd} style={{
                        textAlign: 'center',
                        padding: '16px 0',
                        color: 'var(--primary)',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.15em',
                        background: 'rgba(255,255,255,0.03)',
                        borderBottom: `1px solid ${GRID_COLOR}`,
                        borderRight: i < 6 ? `1px solid ${GRID_COLOR}` : 'none'
                    }}>
                        {wd}
                    </div>
                )) : (
                    <div style={{
                        textAlign: 'center',
                        padding: '16px 0',
                        color: 'var(--primary)',
                        fontSize: '1.2rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        background: 'rgba(255,255,255,0.03)',
                        borderBottom: `1px solid ${GRID_COLOR}`,
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '12px'
                    }}>
                        <span>{weekDays[dayCells[0].date.getDay()]}</span>
                        <span style={{ color: '#fff', opacity: 0.9 }}>
                            {formatDate(dayCells[0].date)}
                        </span>
                    </div>
                )}

                {/* Day Cells */}
                {dayCells.map((cell, index) => {
                    const isToday = cell.date.toDateString() === new Date().toDateString();
                    const dayCol = viewMode === 'day' ? 0 : index % 7;
                    const isLastCol = viewMode === 'day' ? true : dayCol === 6;
                    // For month view, check index. For week/day, usually just bottom. 
                    // To simplify border logic:
                    const isLastRow = viewMode === 'month' ? index >= 35 : true;

                    return (
                        <div
                            key={`${index}`}
                            style={{
                                height: viewMode === 'month' ? '140px' : '400px', // Taller rows for Week/Day view
                                background: !cell.currentMonth && viewMode === 'month'
                                    ? 'rgba(255,255,255,0.02)'
                                    : (isToday ? 'rgba(201, 168, 106, 0.08)' : 'transparent'),
                                display: 'flex',
                                flexDirection: 'column',
                                paddingTop: '8px',
                                position: 'relative',
                                borderRight: isLastCol ? 'none' : `1px solid ${GRID_COLOR}`,
                                borderBottom: isLastRow ? 'none' : `1px solid ${GRID_COLOR}`,
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{
                                fontSize: '0.85rem',
                                color: (!cell.currentMonth && viewMode === 'month')
                                    ? 'rgba(255,255,255,0.35)'
                                    : (isToday ? 'var(--primary)' : 'var(--text-muted)'),
                                padding: '0 12px 6px',
                                textAlign: 'right'
                            }}>
                                {cell.date.getDate()}
                            </div>

                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                position: 'relative',
                                flex: 1,
                                paddingBottom: '8px',
                                overflowY: 'auto',
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                            }} className="hide-scrollbar">
                                {[...Array(maxTrack + 1)].map((_, trackIdx) => {
                                    const ev = cell.events.find(e => e.trackIndex === trackIdx);
                                    if (!ev) return <div key={trackIdx} style={{ height: '32px' }}></div>;

                                    const cellDateStr = cell.date.toISOString().split('T')[0];
                                    const isStart = ev.startDateStr === cellDateStr;
                                    const isEnd = ev.endDateStr === cellDateStr;
                                    const style = getAircraftStyle(ev.aircraft?.name);

                                    return (
                                        <div
                                            key={trackIdx}
                                            style={{
                                                height: '32px',
                                                padding: '2px 0',
                                                zIndex: 2
                                            }}
                                        >
                                            <motion.div
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedFlight(ev);
                                                }}
                                                whileHover={{ filter: 'brightness(1.2)', scale: 1.01 }}
                                                style={{
                                                    background: style.light,
                                                    color: style.main,
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center',
                                                    padding: '0 8px',
                                                    fontSize: '0.6rem',
                                                    fontWeight: '700',
                                                    borderLeft: isStart ? `3px solid ${style.main}` : 'none',
                                                    borderTopLeftRadius: (isStart || dayCol === 0) ? '6px' : '0',
                                                    borderBottomLeftRadius: (isStart || dayCol === 0) ? '6px' : '0',
                                                    borderTopRightRadius: (isEnd || dayCol === 6) ? '6px' : '0',
                                                    borderBottomRightRadius: (isEnd || dayCol === 6) ? '6px' : '0',
                                                    marginLeft: (isStart || dayCol === 0) ? '4px' : '-1px',
                                                    marginRight: (isEnd || dayCol === 6) ? '4px' : '-1px',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    opacity: ev.status !== 'aprovado' ? 0.75 : 1,
                                                    borderStyle: ev.status !== 'aprovado' ? 'dashed' : 'solid',
                                                    borderWidth: ev.status !== 'aprovado' ? '1px' : '0',
                                                    borderColor: ev.status !== 'aprovado' ? style.main : 'transparent',
                                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                    cursor: 'pointer',
                                                    zIndex: 10,
                                                    position: 'relative'
                                                }}
                                                title={`${ev.aircraft?.name} | ${(() => {
                                                    const parts = [];
                                                    ev.legs.forEach(l => { parts.push(l.origin); parts.push(l.destination); });
                                                    return parts.join(' > ');
                                                })()} (${ev.name})`}
                                            >
                                                {(isStart || (dayCol === 0)) && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', overflow: 'hidden' }}>
                                                        <span style={{ color: '#fff', fontSize: '0.62rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                                            {ev.aircraft?.name?.split(' | ')[0] || ev.aircraft?.name} | {(() => {
                                                                const parts = [];
                                                                if (ev.legs && ev.legs.length > 0) {
                                                                    ev.legs.forEach((l) => {
                                                                        const oCity = l.origin.split(' - ')[1] || l.origin;
                                                                        const dCity = l.destination.split(' - ')[1] || l.destination;
                                                                        parts.push(oCity);
                                                                        parts.push(dCity);
                                                                    });
                                                                }
                                                                return parts.join(' > ');
                                                            })()} ({ev.name || ev.requestor || 'Admin'})
                                                        </span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div style={{
                marginTop: '32px',
                padding: '24px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '24px',
                border: '1px solid var(--glass-border)'
            }}>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {Object.entries(aircraftColors).map(([name, style]) => (
                        <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: style.main }}></div>
                            {name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Modal Detail */}
            <AnimatePresence>
                {selectedFlight && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedFlight(null)}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.85)',
                                backdropFilter: 'blur(10px)'
                            }}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 30 }}
                            style={{
                                background: 'rgba(25, 25, 30, 0.95)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '32px',
                                width: '100%',
                                maxWidth: '550px',
                                position: 'relative',
                                overflow: 'hidden',
                                boxShadow: '0 40px 100px rgba(0,0,0,0.8)'
                            }}
                        >
                            <button
                                onClick={() => setSelectedFlight(null)}
                                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10 }}
                            >
                                <X size={24} />
                            </button>

                            <div style={{ padding: '40px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                                    {/* Status Badge Above Aircraft */}
                                    <div>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '6px 16px',
                                            borderRadius: '100px',
                                            background: getStatusInfo(selectedFlight?.status || 'pendente').bg,
                                            color: getStatusInfo(selectedFlight?.status || 'pendente').color,
                                            fontSize: '0.75rem',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            border: `1px solid ${getStatusInfo(selectedFlight?.status || 'pendente').color}40`
                                        }}>
                                            {getStatusInfo(selectedFlight?.status || 'pendente').label}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                                        <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold', lineHeight: '1.2' }}>{selectedFlight.aircraft?.name}</div>
                                        <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.2' }}>{selectedFlight.aircraft?.type}</div>
                                    </div>

                                    <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '500' }}>
                                        {selectedFlight.name || selectedFlight.userName || 'Cliente Externo'}
                                    </div>
                                </div>

                                <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                                    <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Trechos do Voo</h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        {selectedFlight.legs.map((leg, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => setViewingDetails(selectedFlight)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.02)',
                                                    border: '1px solid rgba(255,255,255,0.08)',
                                                    padding: '12px 16px',
                                                    borderRadius: '16px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.3s ease',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                                onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                                onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                                            >
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ background: 'var(--primary)', color: '#000', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem' }}>{idx + 1}</span>
                                                    {idx + 1}ª Etapa
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                                                    <div>
                                                        <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: '600' }}>{leg.origin}</span>
                                                    </div>
                                                    <div>
                                                        <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: '600' }}>{leg.destination}</span>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px' }}>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '0.6rem' }}>
                                                            <CalendarIcon size={10} color="#9ca3af" />
                                                            {formatDate(leg.date)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9ca3af', fontSize: '0.6rem' }}>
                                                            <Clock size={10} color="#9ca3af" />
                                                            {leg.time}
                                                        </div>
                                                    </div>
                                                    <div style={{ color: 'var(--primary)', fontSize: '0.6rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                        VER DETALHES →
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {selectedFlight.observation && (
                                    <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(201, 168, 106, 0.05)', border: '1px solid rgba(201, 168, 106, 0.1)', borderRadius: '16px' }}>
                                        <p style={{ margin: '0 0 4px 0', fontSize: '0.65rem', color: 'var(--primary)', textTransform: 'uppercase', fontWeight: 'bold' }}>Observações</p>
                                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{selectedFlight.observation}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )
                }
            </AnimatePresence >

            {/* Read-only Detail Modal */}
            < AnimatePresence >
                {viewingDetails && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 10000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setViewingDetails(null)}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.9)',
                                backdropFilter: 'blur(15px)'
                            }}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            style={{
                                background: 'rgba(10, 10, 12, 0.98)',
                                border: '1px solid var(--primary)',
                                borderRadius: '32px',
                                width: '100%',
                                maxWidth: '850px',
                                maxHeight: '90vh',
                                position: 'relative',
                                overflowY: 'auto',
                                boxShadow: '0 50px 100px rgba(0,0,0,0.9)',
                                padding: '48px'
                            }}
                        >
                            <button
                                onClick={() => setViewingDetails(null)}
                                style={{ position: 'absolute', top: '24px', right: '24px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                            >
                                <X size={28} />
                            </button>

                            {/* Modal Header */}
                            <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)', marginBottom: '8px' }}>
                                        <Info size={20} />
                                        <span style={{ fontWeight: '800', letterSpacing: '0.1em', fontSize: '0.75rem', textTransform: 'uppercase' }}>DETALHES DA SOLICITAÇÃO</span>
                                    </div>
                                    <h2 style={{ fontSize: '1.8rem', margin: 0, color: '#fff' }}>{viewingDetails.aircraft?.name}</h2>
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '1rem' }}>{viewingDetails.name}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{
                                        padding: '10px 24px',
                                        borderRadius: '100px',
                                        background: getStatusInfo(viewingDetails.status).bg,
                                        color: getStatusInfo(viewingDetails.status).color,
                                        fontSize: '0.85rem',
                                        fontWeight: '800',
                                        marginBottom: '12px',
                                        display: 'inline-block'
                                    }}>
                                        {getStatusInfo(viewingDetails.status).label.toUpperCase()}
                                    </div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gerado em: {viewingDetails.timestamp}</div>
                                </div>
                            </div>

                            {/* Itinerary - High Tech Style */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {viewingDetails.legs.map((leg, idx) => (
                                    <div key={idx} style={{
                                        background: 'rgba(255,255,255,0.02)',
                                        borderRadius: '24px',
                                        padding: '24px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        fontFamily: 'monospace'
                                    }}>
                                        {/* ETAPA Header */}
                                        <div style={{ marginBottom: '16px', fontFamily: 'monospace' }}>
                                            <div style={{ color: 'var(--primary)', fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '8px' }}>
                                                {`|> ${idx + 1}ª ETAPA <|`}
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px', fontSize: '0.9rem' }}>
                                                <p style={{ margin: 0 }}><span style={{ color: 'var(--text-muted)' }}>Data:</span> <span style={{ color: '#fff' }}>{formatDate(leg.date)}</span></p>
                                                <p style={{ margin: 0 }}><span style={{ color: 'var(--text-muted)' }}>Origem:</span> <span style={{ color: '#fff' }}>{leg.origin}</span></p>
                                                <p style={{ margin: 0 }}><span style={{ color: 'var(--text-muted)' }}>DESTINO:</span> <span style={{ color: '#fff' }}>{leg.destination}</span></p>
                                                <p style={{ margin: 0 }}><span style={{ color: 'var(--text-muted)' }}>Horário:</span> <span style={{ color: '#fff' }}>{leg.time}</span></p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {/* Passageiros Section */}
                                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Users size={14} /> PASSAGEIROS ({leg.passengers}):
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#fff', lineHeight: '1.5' }}>
                                                    {Array.isArray(leg.passengerData) && leg.passengerData.length > 0 ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                            {leg.passengerData.map((p, i) => (
                                                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '2px' }}>
                                                                    <span>{p.name || '---'}</span>
                                                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{p.document || ''}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p style={{ margin: 0 }}>{leg.passengerList || 'Nenhum passageiro listado.'}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Comissaria Section */}
                                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Coffee size={16} /> COMISSARIA:
                                                </div>
                                                <div style={{ fontSize: '0.9rem', color: '#fff', lineHeight: '1.6' }}>
                                                    {leg.catering ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                            {leg.catering.split(/[\n,]/).filter(item => item.trim() !== '').map((item, i) => (
                                                                <div key={i} style={{ display: 'flex', gap: '8px' }}>
                                                                    <span style={{ color: 'var(--primary)' }}>•</span>
                                                                    <span>{item.trim()}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p style={{ margin: 0 }}>Catering padrão solicitado.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* FBO Section */}
                                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <MapPin size={16} /> FBO {leg.fboCity || ''}:
                                                </div>
                                                <p style={{ margin: 0, fontSize: '0.9rem', color: '#fff', lineHeight: '1.6' }}>{leg.fboDetails || 'Informações operacionais não disponíveis.'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Tripulação do Voo Section */}
                            {viewingDetails.crew && viewingDetails.crew.some(c => c.name) && (
                                <div style={{
                                    marginTop: '24px',
                                    padding: '24px',
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <h4 style={{ margin: '0 0 12px 0', fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Fingerprint size={14} /> TRIPULAÇÃO DO VOO
                                    </h4>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontFamily: 'monospace' }}>
                                        {viewingDetails.crew.map((member, idx) => member.name && (
                                            <div key={idx} style={{
                                                fontSize: '0.9rem',
                                                color: '#fff',
                                                display: 'flex',
                                                alignItems: 'center',
                                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                paddingBottom: '4px'
                                            }}>
                                                <span style={{ width: '50%' }}>
                                                    <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{idx + 1} - </span>
                                                    <span>{member.name}</span>
                                                </span>
                                                <span style={{ fontWeight: 'bold' }}>
                                                    <span style={{ color: 'var(--primary)' }}>Canac </span>
                                                    <span style={{ color: '#fff' }}>{member.anac || '---'}</span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {viewingDetails.observation && (
                                <div style={{
                                    marginTop: '24px',
                                    padding: '24px',
                                    background: 'rgba(201, 168, 106, 0.05)',
                                    borderRadius: '24px',
                                    border: '1px solid rgba(201, 168, 106, 0.1)'
                                }}>
                                    <h4 style={{ margin: '0 0 8px 0', fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', fontFamily: 'monospace' }}>OBSERVAÇÕES DA COORDENAÇÃO</h4>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontStyle: 'italic', lineHeight: '1.5' }}>{viewingDetails.observation}</p>
                                </div>
                            )}

                            <button
                                onClick={() => setViewingDetails(null)}
                                className="premium-button"
                                style={{ width: '100%', marginTop: '40px', justifyContent: 'center', padding: '20px' }}
                            >
                                FECHAR DETALHES
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence >
        </div >
    );
}
