import { supabase } from './supabaseClient';

export const getFleet = async () => {
  const { data, error } = await supabase
    .from('frota')
    .select('*')
    .order('name', { ascending: true });
  
  if (error) {
    console.error('Erro ao buscar frota:', error);
    return null;
  }
  
  return data;
};

export const fetchFleet = getFleet; // Alias for compatibility
