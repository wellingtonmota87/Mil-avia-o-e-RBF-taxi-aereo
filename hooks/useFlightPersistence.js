import { useEffect, useState } from 'react';
import {
  saveFlights,
  loadFlights,
  forceSaveSync,
  diagnoseStorage,
  startAutoSave
} from '../utils/flightPersistence';

export function useFlightPersistence() {
  const [requests, setRequests] = useState(() => {
    console.log('[HOOK] 🔄 Carregando voos...');
    const flights = loadFlights();
    diagnoseStorage();
    return flights;
  });

  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    if (requests.length > 0) {
      saveFlights(requests);
    } else if (hasInteracted) {
      saveFlights(requests, true);
    }
  }, [requests, hasInteracted]);

  useEffect(() => {
    startAutoSave(() => requests);

    const handleBeforeUnload = () => {
      if (requests.length > 0) {
        forceSaveSync(requests);
      } else if (hasInteracted) {
        forceSaveSync(requests, true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [requests, hasInteracted]);

  return {
    requests,
    setRequests,
    markInteraction: () => setHasInteracted(true)
  };
}
