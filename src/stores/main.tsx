import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'
import { ConfirmationStatus, Member, Role, Schedule } from '@/types'
import { toast } from '@/hooks/use-toast'

export type UserType = 'coordinator' | 'member' | 'unlinked' | null

interface AppState {
  session: Session | null
  loading: boolean
  userType: UserType
  parishName: string | null
  parishDiocese: string | null
  currentMember: Member | null
  members: Member[]
  roles: Role[]
  schedules: Schedule[]
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (
    email: string,
    password: string,
    name: string,
    parishName: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signUpMember: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>
  updateParish: (updates: { name?: string; diocese?: string }) => Promise<void>
  uploadMemberPhoto: (file: File) => Promise<{ url: string | null; error: string | null }>
  addMember: (member: Omit<Member, 'id'>) => Promise<void>
  updateMember: (id: string, member: Partial<Member>) => Promise<void>
  deleteMember: (id: string) => Promise<void>
  addRole: (role: Omit<Role, 'id'>) => Promise<void>
  updateRole: (id: string, role: Partial<Role>) => Promise<void>
  deleteRole: (id: string) => Promise<void>
  addSchedule: (schedule: Omit<Schedule, 'id'>) => Promise<void>
  updateSchedule: (id: string, schedule: Omit<Schedule, 'id'>) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  confirmAssignment: (assignmentId: string, status: ConfirmationStatus) => Promise<void>
  confirmLeitor: (
    scheduleId: string,
    slot: 'leitor1' | 'leitor2',
    status: ConfirmationStatus,
  ) => Promise<void>
  substituteAssignment: (assignmentId: string, newMemberId: string | null) => Promise<void>
  substituteLeitor: (
    scheduleId: string,
    slot: 'leitor1' | 'leitor2',
    newMemberId: string | null,
  ) => Promise<void>
}

export const AppContext = createContext<AppState | null>(null)

function mapRole(row: {
  id: string
  name: string
  description: string
  icon_name: string
  color: string
}): Role {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    iconName: row.icon_name,
    color: row.color,
  }
}

function mapMember(row: {
  id: string
  name: string
  phone: string
  email: string | null
  avatar_url: string
  availability: Member['availability']
  status: Member['status']
  notes: string | null
  member_roles: { role_id: string }[] | null
}): Member {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    avatarUrl: row.avatar_url,
    roleIds: (row.member_roles ?? []).map((mr) => mr.role_id),
    availability: row.availability,
    status: row.status,
    notes: row.notes ?? undefined,
  }
}

function mapSchedule(row: {
  id: string
  title: string
  date: string
  time: string
  theme: string | null
  status: Schedule['status']
  leitor1: string | null
  leitor1_status: ConfirmationStatus
  leitor2: string | null
  leitor2_status: ConfirmationStatus
  schedule_assignments:
    | {
        id: string
        role_id: string
        member_id: string | null
        confirmation_status: ConfirmationStatus
      }[]
    | null
}): Schedule {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    time: row.time,
    theme: row.theme ?? undefined,
    status: row.status,
    assignments: (row.schedule_assignments ?? []).map((a) => ({
      id: a.id,
      roleId: a.role_id,
      memberId: a.member_id,
      confirmationStatus: a.confirmation_status,
    })),
    leitor1: row.leitor1,
    leitor1Status: row.leitor1_status,
    leitor2: row.leitor2,
    leitor2Status: row.leitor2_status,
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(true)
  const [userType, setUserType] = useState<UserType>(null)
  const [parishId, setParishId] = useState<string | null>(null)
  const [parishName, setParishName] = useState<string | null>(null)
  const [parishDiocese, setParishDiocese] = useState<string | null>(null)
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [schedules, setSchedules] = useState<Schedule[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    // Wait for the initial getSession() to resolve first — otherwise this runs once with
    // session still null (before it's actually known) and clears profileLoading prematurely,
    // opening a window where ProtectedRoute redirects based on a stale/default userType.
    if (loading) return

    if (!session) {
      setUserType(null)
      setParishId(null)
      setParishName(null)
      setParishDiocese(null)
      setCurrentMember(null)
      setMembers([])
      setRoles([])
      setSchedules([])
      setProfileLoading(false)
      return
    }
    setProfileLoading(true)
    loadAllData().finally(() => setProfileLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, session?.user.id])

  async function loadAllData() {
    const { data: profile } = await supabase
      .from('profiles')
      .select('parish_id, parishes(name, diocese)')
      .maybeSingle()

    if (profile) {
      setUserType('coordinator')
      setCurrentMember(null)
      const parish = profile.parishes as { name: string; diocese: string | null } | null
      await loadParishData(profile.parish_id, parish?.name ?? null, parish?.diocese ?? null)
      return
    }

    const { data: memberRow } = await supabase
      .from('members')
      .select('*, member_roles(role_id)')
      .eq('user_id', session?.user.id ?? '')
      .maybeSingle()

    if (memberRow) {
      setUserType('member')
      setCurrentMember(mapMember(memberRow))
      const { data: parish } = await supabase
        .from('parishes')
        .select('name, diocese')
        .eq('id', memberRow.parish_id)
        .maybeSingle()
      await loadParishData(memberRow.parish_id, parish?.name ?? null, parish?.diocese ?? null)
      return
    }

    setUserType('unlinked')
    setParishId(null)
    setParishName(null)
    setParishDiocese(null)
    setCurrentMember(null)
    setMembers([])
    setRoles([])
    setSchedules([])
  }

  async function loadParishData(
    newParishId: string,
    newParishName: string | null,
    newParishDiocese: string | null,
  ) {
    setParishId(newParishId)
    setParishName(newParishName)
    setParishDiocese(newParishDiocese)

    const [{ data: rolesData }, { data: membersData }, { data: schedulesData }] =
      await Promise.all([
        supabase.from('roles').select('*').order('created_at'),
        supabase.from('members').select('*, member_roles(role_id)').order('created_at'),
        supabase
          .from('schedules')
          .select('*, schedule_assignments(id, role_id, member_id, confirmation_status)')
          .order('date'),
      ])

    setRoles((rolesData ?? []).map(mapRole))
    setMembers((membersData ?? []).map(mapMember))
    setSchedules((schedulesData ?? []).map(mapSchedule))
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  }

  const signUp = async (email: string, password: string, name: string, parish: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name, parish_name: parish } },
    })
    return { error: error?.message ?? null, needsEmailConfirmation: !error && !data.session }
  }

  const signUpMember = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    return { error: error?.message ?? null, needsEmailConfirmation: !error && !data.session }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const requestPasswordReset = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })
      return { error: error?.message ?? null }
    } catch {
      return { error: 'Falha de conexão. Tente novamente.' }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      return { error: error?.message ?? null }
    } catch {
      return { error: 'Falha de conexão. Tente novamente.' }
    }
  }

  const updateParish = async (updates: { name?: string; diocese?: string }) => {
    if (!parishId) return
    const { error } = await supabase.from('parishes').update(updates).eq('id', parishId)
    if (error) {
      toast({ title: 'Erro ao atualizar paróquia', description: error.message, variant: 'destructive' })
      return
    }
    if (updates.name !== undefined) setParishName(updates.name)
    if (updates.diocese !== undefined) setParishDiocese(updates.diocese)
    toast({ title: 'Paróquia atualizada', description: 'As alterações foram salvas com sucesso.' })
  }

  // Translates the raw Postgres unique-violation message into something a coordinator can
  // actually act on; falls back to the original message for anything else.
  function friendlyMemberErrorMessage(error: { message: string; code?: string }): string {
    if (error.code === '23505' && error.message.includes('members_email_unique_idx')) {
      return 'Esse email já está em uso por outro membro.'
    }
    return error.message
  }

  const MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024

  const uploadMemberPhoto = async (file: File) => {
    if (!parishId) return { url: null, error: 'Paróquia não identificada.' }
    if (!file.type.startsWith('image/')) {
      return { url: null, error: 'Selecione um arquivo de imagem.' }
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      return { url: null, error: 'A imagem deve ter no máximo 5MB.' }
    }

    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
    const path = `${parishId}/${crypto.randomUUID()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('member-photos')
      .upload(path, file, { cacheControl: '3600', upsert: false })

    if (uploadError) {
      return { url: null, error: uploadError.message }
    }

    const { data } = supabase.storage.from('member-photos').getPublicUrl(path)
    return { url: data.publicUrl, error: null }
  }

  const addMember = async (memberData: Omit<Member, 'id'>) => {
    if (!parishId) return
    const { data: inserted, error } = await supabase
      .from('members')
      .insert({
        parish_id: parishId,
        name: memberData.name,
        phone: memberData.phone,
        email: memberData.email || null,
        avatar_url: memberData.avatarUrl,
        availability: memberData.availability,
        status: memberData.status,
        notes: memberData.notes ?? null,
      })
      .select()
      .single()

    if (error || !inserted) {
      toast({
        title: 'Erro ao adicionar membro',
        description: error ? friendlyMemberErrorMessage(error) : undefined,
        variant: 'destructive',
      })
      return
    }

    if (memberData.roleIds.length > 0) {
      await supabase
        .from('member_roles')
        .insert(memberData.roleIds.map((roleId) => ({ member_id: inserted.id, role_id: roleId })))
    }

    toast({ title: 'Membro adicionado', description: `${memberData.name} foi cadastrado com sucesso.` })
    await loadAllData()
  }

  const updateMember = async (id: string, updated: Partial<Member>) => {
    const dbUpdate: Database['public']['Tables']['members']['Update'] = {}
    if (updated.name !== undefined) dbUpdate.name = updated.name
    if (updated.phone !== undefined) dbUpdate.phone = updated.phone
    if (updated.email !== undefined) dbUpdate.email = updated.email || null
    if (updated.avatarUrl !== undefined) dbUpdate.avatar_url = updated.avatarUrl
    if (updated.availability !== undefined) dbUpdate.availability = updated.availability
    if (updated.status !== undefined) dbUpdate.status = updated.status
    if (updated.notes !== undefined) dbUpdate.notes = updated.notes

    if (Object.keys(dbUpdate).length > 0) {
      const { error } = await supabase.from('members').update(dbUpdate).eq('id', id)
      if (error) {
        toast({
          title: 'Erro ao atualizar membro',
          description: friendlyMemberErrorMessage(error),
          variant: 'destructive',
        })
        return
      }
    }

    if (updated.roleIds !== undefined) {
      await supabase.from('member_roles').delete().eq('member_id', id)
      if (updated.roleIds.length > 0) {
        await supabase
          .from('member_roles')
          .insert(updated.roleIds.map((roleId) => ({ member_id: id, role_id: roleId })))
      }
    }

    toast({ title: 'Membro atualizado', description: 'Os dados foram salvos com sucesso.' })
    await loadAllData()
  }

  const deleteMember = async (id: string) => {
    const { error } = await supabase.from('members').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro ao remover membro', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Membro removido', description: 'O cadastro foi excluído.' })
    await loadAllData()
  }

  const addRole = async (roleData: Omit<Role, 'id'>) => {
    if (!parishId) return
    const { error } = await supabase.from('roles').insert({
      parish_id: parishId,
      name: roleData.name,
      description: roleData.description,
      icon_name: roleData.iconName,
      color: roleData.color,
    })

    if (error) {
      toast({ title: 'Erro ao adicionar função', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: 'Função adicionada', description: `${roleData.name} foi cadastrada com sucesso.` })
    await loadAllData()
  }

  const updateRole = async (id: string, updated: Partial<Role>) => {
    const dbUpdate: Database['public']['Tables']['roles']['Update'] = {}
    if (updated.name !== undefined) dbUpdate.name = updated.name
    if (updated.description !== undefined) dbUpdate.description = updated.description
    if (updated.iconName !== undefined) dbUpdate.icon_name = updated.iconName
    if (updated.color !== undefined) dbUpdate.color = updated.color

    const { error } = await supabase.from('roles').update(dbUpdate).eq('id', id)
    if (error) {
      toast({ title: 'Erro ao atualizar função', description: error.message, variant: 'destructive' })
      return
    }

    toast({ title: 'Função atualizada', description: 'As alterações foram salvas com sucesso.' })
    await loadAllData()
  }

  const deleteRole = async (id: string) => {
    const { error } = await supabase.from('roles').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro ao remover função', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Função removida', description: 'A função foi excluída.' })
    await loadAllData()
  }

  // Best-effort: a failed notification should never block the coordinator's actual save.
  async function notifyMemberAssigned(
    memberId: string,
    roleName: string,
    scheduleTitle: string,
    scheduleDate: string,
    scheduleTime: string,
  ) {
    const member = members.find((m) => m.id === memberId)
    if (!member?.email) return
    try {
      await supabase.functions.invoke('notify-assignment', {
        body: {
          to: member.email,
          memberName: member.name,
          scheduleTitle,
          scheduleDate,
          scheduleTime,
          roleName,
          parishName: parishName ?? '',
        },
      })
    } catch (e) {
      console.warn('Failed to send assignment notification', e)
    }
  }

  const addSchedule = async (scheduleData: Omit<Schedule, 'id'>) => {
    if (!parishId) return
    const { data: inserted, error } = await supabase
      .from('schedules')
      .insert({
        parish_id: parishId,
        title: scheduleData.title,
        date: scheduleData.date,
        time: scheduleData.time,
        theme: scheduleData.theme ?? null,
        status: scheduleData.status,
        leitor1: scheduleData.leitor1 ?? null,
        leitor2: scheduleData.leitor2 ?? null,
      })
      .select()
      .single()

    if (error || !inserted) {
      toast({ title: 'Erro ao criar escala', description: error?.message, variant: 'destructive' })
      return
    }

    if (scheduleData.assignments.length > 0) {
      await supabase.from('schedule_assignments').insert(
        scheduleData.assignments.map((a) => ({
          schedule_id: inserted.id,
          role_id: a.roleId,
          member_id: a.memberId,
        })),
      )
    }

    for (const a of scheduleData.assignments) {
      if (!a.memberId) continue
      const role = roles.find((r) => r.id === a.roleId)
      notifyMemberAssigned(
        a.memberId,
        role?.name ?? 'uma função',
        scheduleData.title,
        scheduleData.date,
        scheduleData.time,
      )
    }
    if (scheduleData.leitor1) {
      notifyMemberAssigned(
        scheduleData.leitor1,
        'Leitor 1',
        scheduleData.title,
        scheduleData.date,
        scheduleData.time,
      )
    }
    if (scheduleData.leitor2) {
      notifyMemberAssigned(
        scheduleData.leitor2,
        'Leitor 2',
        scheduleData.title,
        scheduleData.date,
        scheduleData.time,
      )
    }

    toast({ title: 'Escala criada', description: `A escala para ${scheduleData.title} foi salva.` })
    await loadAllData()
  }

  const updateSchedule = async (id: string, scheduleData: Omit<Schedule, 'id'>) => {
    const existing = schedules.find((s) => s.id === id)
    if (!existing) return

    const dbUpdate: Database['public']['Tables']['schedules']['Update'] = {
      title: scheduleData.title,
      date: scheduleData.date,
      time: scheduleData.time,
      theme: scheduleData.theme ?? null,
      status: scheduleData.status,
      leitor1: scheduleData.leitor1 ?? null,
      leitor2: scheduleData.leitor2 ?? null,
    }
    // Only reset a leitor's confirmation if the assigned member actually changed, so editing
    // unrelated fields (title, time...) doesn't wipe a confirmation someone already gave.
    if (scheduleData.leitor1 !== existing.leitor1) dbUpdate.leitor1_status = 'Pendente'
    if (scheduleData.leitor2 !== existing.leitor2) dbUpdate.leitor2_status = 'Pendente'

    const { error } = await supabase.from('schedules').update(dbUpdate).eq('id', id)
    if (error) {
      toast({ title: 'Erro ao atualizar escala', description: error.message, variant: 'destructive' })
      return
    }

    for (const newAssignment of scheduleData.assignments) {
      const oldAssignment = existing.assignments.find((a) => a.roleId === newAssignment.roleId)
      if (!oldAssignment || oldAssignment.memberId === newAssignment.memberId) continue
      await supabase
        .from('schedule_assignments')
        .update({ member_id: newAssignment.memberId, confirmation_status: 'Pendente' })
        .eq('id', oldAssignment.id)

      if (newAssignment.memberId) {
        const role = roles.find((r) => r.id === newAssignment.roleId)
        notifyMemberAssigned(
          newAssignment.memberId,
          role?.name ?? 'uma função',
          scheduleData.title,
          scheduleData.date,
          scheduleData.time,
        )
      }
    }
    if (scheduleData.leitor1 !== existing.leitor1 && scheduleData.leitor1) {
      notifyMemberAssigned(
        scheduleData.leitor1,
        'Leitor 1',
        scheduleData.title,
        scheduleData.date,
        scheduleData.time,
      )
    }
    if (scheduleData.leitor2 !== existing.leitor2 && scheduleData.leitor2) {
      notifyMemberAssigned(
        scheduleData.leitor2,
        'Leitor 2',
        scheduleData.title,
        scheduleData.date,
        scheduleData.time,
      )
    }

    toast({ title: 'Escala atualizada', description: 'As alterações foram salvas com sucesso.' })
    await loadAllData()
  }

  const deleteSchedule = async (id: string) => {
    const { error } = await supabase.from('schedules').delete().eq('id', id)
    if (error) {
      toast({ title: 'Erro ao remover escala', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Escala removida', description: 'A escala foi excluída.' })
    await loadAllData()
  }

  const confirmAssignment = async (assignmentId: string, status: ConfirmationStatus) => {
    const { error } = await supabase.rpc('confirm_assignment', {
      p_assignment_id: assignmentId,
      p_status: status,
    })
    if (error) {
      toast({ title: 'Erro ao confirmar presença', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: status === 'Confirmado' ? 'Presença confirmada' : 'Presença recusada' })
    await loadAllData()
  }

  const confirmLeitor = async (
    scheduleId: string,
    slot: 'leitor1' | 'leitor2',
    status: ConfirmationStatus,
  ) => {
    const { error } = await supabase.rpc('confirm_leitor', {
      p_schedule_id: scheduleId,
      p_slot: slot,
      p_status: status,
    })
    if (error) {
      toast({ title: 'Erro ao confirmar presença', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: status === 'Confirmado' ? 'Presença confirmada' : 'Presença recusada' })
    await loadAllData()
  }

  const substituteAssignment = async (assignmentId: string, newMemberId: string | null) => {
    const { error } = await supabase
      .from('schedule_assignments')
      .update({ member_id: newMemberId, confirmation_status: 'Pendente' })
      .eq('id', assignmentId)
    if (error) {
      toast({ title: 'Erro ao substituir membro', description: error.message, variant: 'destructive' })
      return
    }

    if (newMemberId) {
      const found = schedules
        .flatMap((s) => s.assignments.map((a) => ({ ...a, schedule: s })))
        .find((a) => a.id === assignmentId)
      if (found) {
        const role = roles.find((r) => r.id === found.roleId)
        notifyMemberAssigned(
          newMemberId,
          role?.name ?? 'uma função',
          found.schedule.title,
          found.schedule.date,
          found.schedule.time,
        )
      }
    }

    toast({
      title: newMemberId ? 'Membro substituído' : 'Vaga deixada em aberto',
      description: 'A escala foi atualizada.',
    })
    await loadAllData()
  }

  const substituteLeitor = async (
    scheduleId: string,
    slot: 'leitor1' | 'leitor2',
    newMemberId: string | null,
  ) => {
    const dbUpdate: Database['public']['Tables']['schedules']['Update'] =
      slot === 'leitor1'
        ? { leitor1: newMemberId, leitor1_status: 'Pendente' }
        : { leitor2: newMemberId, leitor2_status: 'Pendente' }

    const { error } = await supabase.from('schedules').update(dbUpdate).eq('id', scheduleId)
    if (error) {
      toast({ title: 'Erro ao substituir leitor', description: error.message, variant: 'destructive' })
      return
    }

    if (newMemberId) {
      const schedule = schedules.find((s) => s.id === scheduleId)
      if (schedule) {
        notifyMemberAssigned(
          newMemberId,
          slot === 'leitor1' ? 'Leitor 1' : 'Leitor 2',
          schedule.title,
          schedule.date,
          schedule.time,
        )
      }
    }

    toast({
      title: newMemberId ? 'Leitor substituído' : 'Vaga deixada em aberto',
      description: 'A escala foi atualizada.',
    })
    await loadAllData()
  }

  return React.createElement(
    AppContext.Provider,
    {
      value: {
        session,
        loading: loading || profileLoading,
        userType,
        parishName,
        parishDiocese,
        currentMember,
        members,
        roles,
        schedules,
        signIn,
        signUp,
        signUpMember,
        signOut,
        requestPasswordReset,
        updatePassword,
        updateParish,
        uploadMemberPhoto,
        addMember,
        updateMember,
        deleteMember,
        addRole,
        updateRole,
        deleteRole,
        addSchedule,
        updateSchedule,
        deleteSchedule,
        confirmAssignment,
        confirmLeitor,
        substituteAssignment,
        substituteLeitor,
      },
    },
    children,
  )
}

export default function useAppStore() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useAppStore must be used within an AppProvider')
  }
  return context
}
