import React from 'react';
import { Plane, Users, Fuel, Gauge } from 'lucide-react';
import { motion } from 'framer-motion';
import rbzImage from '../assets/PT-RBZ.jpg';
import mepImage from '../assets/PS-MEP.jpg';
import krtImage from '../assets/PR-KRT.jpg';
import mibImage from '../assets/PS-MIB.jpg';

const aircrafts = [
  {
    id: 1,
    name: 'PT-RBZ | Global 6000',
    type: 'Ultra Long Range',
    passengers: 13,
    range: '6,000 nm',
    speed: '513 ktas',
    image: rbzImage
  },
  {
    id: 2,
    name: 'PS-MEP | Citation CJ4',
    type: 'Light Jet',
    passengers: 10,
    range: '2,165 nm',
    speed: '451 ktas',
    image: mepImage
  },
  {
    id: 3,
    name: 'PR-KRT | Citation CJ2+',
    type: 'Light Jet',
    passengers: 8,
    range: '1,530 nm',
    speed: '418 ktas',
    image: krtImage
  },
  {
    id: 4,
    name: 'PS-MIB | Citation M2',
    type: 'Entry Level Jet',
    passengers: 6,
    range: '1,550 nm',
    speed: '404 ktas',
    image: mibImage
  }
];



export default function AircraftSelector({ selectedId, onSelect }) {
  return (
    <div>
      <h2 style={{ marginBottom: '40px', textAlign: 'center', fontSize: '2.5rem' }}>Escolha sua Aeronave</h2>
      <div className="aircraft-grid">
        {aircrafts.map((ac) => (
          <motion.div
            key={ac.id}
            whileHover={{ y: -5 }}
            onClick={() => onSelect(ac)}
            className={`glass-morphism aircraft-card ${selectedId === ac.id ? 'active' : ''}`}
          >
            <div className="aircraft-image-wrapper">
              <img src={ac.image} alt={ac.name} loading="lazy" />
            </div>
            <div className="aircraft-card-body">
              <div className="aircraft-card-header">
                <h3 className="aircraft-card-title">{ac.name}</h3>
                <span className="aircraft-card-type">{ac.type}</span>
              </div>

              <div className="aircraft-specs">
                <div className="aircraft-spec-item">
                  <Users size={16} className="feature-icon" style={{ marginBottom: 0 }} /> {ac.passengers} pax
                </div>
                <div className="aircraft-spec-item">
                  <Fuel size={16} className="feature-icon" style={{ marginBottom: 0 }} /> {ac.range}
                </div>
                <div className="aircraft-spec-item">
                  <Gauge size={16} className="feature-icon" style={{ marginBottom: 0 }} /> {ac.speed}
                </div>
                <div className="aircraft-spec-item">
                  <Plane size={16} className="feature-icon" style={{ marginBottom: 0 }} /> Jet
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

