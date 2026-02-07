import { supabase } from './supabaseClient';

const mapToSupabase = (flight) => ({
  id: flight.id,
  userid: flight.userId,
  username: flight.userName || flight.name || '', 
  useremail: flight.userEmail || flight.email || '',
  company_name: flight.company_name || flight.company || flight.requestor || '', 
  name: flight.name || flight.userName || '',
  email: flight.email || flight.userEmail || '',
  requestor: flight.requestor || flight.company_name || '',
  timestamp: flight.timestamp,
  legs: flight.legs || [],
  aircraft: flight.aircraft,
  status: flight.status,
  flightplan: flight.flightPlan,
  allocatedslot: flight.allocatedSlot,
  notam: flight.notam,
  crew_assignment: flight.crew_assignment || flight.crew || [],
  observation: flight.observation,
  olddata: flight.oldData
});

const mapFromSupabase = (row) => ({
  id: row.id,
  userId: row.userid,
  userName: row.username,
  userEmail: row.useremail,
  company_name: row.company_name,
  name: row.name || row.username || '', 
  email: row.email || row.useremail || '',
  requestor: row.requestor || row.company_name || '',
  timestamp: row.timestamp,
  legs: row.legs || [],
  aircraft: row.aircraft,
  status: row.status,
  flightPlan: row.flightplan,
  allocatedSlot: row.allocatedslot,
  notam: row.notam,
  crew_assignment: row.crew_assignment,
  observation: row.observation,
  oldData: row.olddata
});

export const fetchFlights = async () => {
  const { data: flights, error } = await supabase
    .from('solicitacoes_voo')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error('Error fetching flights:', error);
    return [];
  }

  return Array.isArray(flights) ? flights.map(mapFromSupabase) : [];
};

export const fetchFlightsFromSupabase = fetchFlights; // Alias

export const upsertFlight = async (flightData) => {
  const mapped = mapToSupabase(flightData);
  const { error } = await supabase
    .from('solicitacoes_voo')
    .upsert(mapped);

  if (error) {
    console.error('Erro ao fazer upsert no Supabase:', error);
    return false;
  }
  return true;
};

export const updateFlightStatus = async (id, status, observation = null, fullData = null) => {
  let updateData = { status, observation };
  
  if (fullData) {
    const mapped = mapToSupabase(fullData);
    updateData = { ...mapped, status, observation };
  }
  
  const { error } = await supabase
    .from('solicitacoes_voo')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error(`Erro ao atualizar status do voo ${id}:`, error);
    return false;
  }
  return true;
};

export const deleteFlight = async (id) => {
  const { error } = await supabase
    .from('solicitacoes_voo')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Erro ao deletar voo ${id}:`, error);
    return false;
  }
  return true;
};

export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('solicitacoes_voo')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Supabase não conectou ou tabela inexistente:', error);
      return false;
    }
    console.log('✅ Supabase conectado com sucesso!');
    return true;
  } catch (err) {
    console.error('❌ Erro inesperado ao conectar ao Supabase:', err);
    return false;
  }
};
