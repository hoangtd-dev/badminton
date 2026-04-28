import { SupabaseClient } from '@supabase/supabase-js'
import { sendWhatsApp, buildLowBalanceMessage } from './whatsappService'

export async function applyTopUp(
  supabase: SupabaseClient,
  playerId: string,
  amount: number,
  type: string,
  description: string,
  createdBy: string
): Promise<void> {
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('balance, full_name, phone, whatsapp_api_key, low_balance_threshold')
    .eq('id', playerId)
    .single()

  if (profileErr || !profile) throw new Error('Player not found')

  const newBalance = profile.balance + amount

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', playerId)

  if (updateErr) throw updateErr

  const { error: txErr } = await supabase.from('transactions').insert({
    player_id: playerId,
    amount,
    type,
    description,
    created_by: createdBy,
  })

  if (txErr) throw txErr
}

export async function applyWithdraw(
  supabase: SupabaseClient,
  playerId: string,
  amount: number,
  description: string,
  createdBy: string
): Promise<void> {
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('balance')
    .eq('id', playerId)
    .single()

  if (profileErr || !profile) throw new Error('Player not found')

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ balance: profile.balance - amount })
    .eq('id', playerId)

  if (updateErr) throw updateErr

  const { error: txErr } = await supabase.from('transactions').insert({
    player_id: playerId,
    amount: -amount,
    type: 'other',
    description,
    created_by: createdBy,
  })

  if (txErr) throw txErr
}

export async function deductSessionFee(
  supabase: SupabaseClient,
  playerId: string,
  amount: number,
  sessionId: string,
  sessionTitle: string,
  createdBy: string
): Promise<{ newBalance: number; isLow: boolean }> {
  const { data: profile, error: profileErr } = await supabase
    .from('profiles')
    .select('balance, full_name, phone, whatsapp_api_key, low_balance_threshold')
    .eq('id', playerId)
    .single()

  if (profileErr || !profile) throw new Error('Player not found')

  const newBalance = profile.balance - amount

  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ balance: newBalance })
    .eq('id', playerId)

  if (updateErr) throw updateErr

  const { error: attErr } = await supabase
    .from('attendances')
    .update({ fee_charged: amount })
    .eq('session_id', sessionId)
    .eq('player_id', playerId)

  if (attErr) throw attErr

  const { error: txErr } = await supabase.from('transactions').insert({
    player_id: playerId,
    amount: -amount,
    type: 'court_fee',
    description: `Session: ${sessionTitle}`,
    session_id: sessionId,
    created_by: createdBy,
  })

  if (txErr) throw txErr

  const isLow = newBalance < profile.low_balance_threshold
  if (isLow && profile.phone && profile.whatsapp_api_key) {
    sendWhatsApp(
      profile.phone,
      profile.whatsapp_api_key,
      buildLowBalanceMessage(profile.full_name, newBalance)
    ).catch(console.error)
  }

  return { newBalance, isLow }
}
