"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { 
  Trophy, 
  Users, 
  Calendar, 
  Settings, 
  Plus, 
  UserPlus, 
  Play, 
  Crown, 
  Share2, 
  Edit3, 
  Trash2,
  LogIn,
  UserCheck,
  Target,
  Clock,
  Award,
  ChevronRight,
  Home,
  User,
  Shield,
  Zap,
  Star,
  TrendingUp,
  Activity,
  Medal,
  Users2,
  Calendar as CalendarIcon,
  MapPin,
  Timer,
  CheckCircle,
  XCircle,
  Shuffle,
  ArrowRight,
  RotateCcw,
  Swords,
  Hash,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react'

// Função para gerar ID único
const generateUserId = () => {
  return Math.random().toString(36).substr(2, 8).toUpperCase()
}

// Algoritmo ITF para distribuição de grupos - IMPLEMENTAÇÃO EXATA
const distribuirGrupos = (N: number): number[] => {
  if (N < 3) {
    throw new Error("mínimo 3 duplas")
  }
  if (3 <= N && N <= 5) {
    return [N] // um único grupo
  }

  const base_groups = Math.floor(N / 3) // máximo de grupos se todos tivessem 3
  const r = N % 3 // resto a distribuir

  if (r === 0) {
    return Array(base_groups).fill(3) // lista com base_groups itens = 3
  }

  if (base_groups >= r) {
    // distribui +1 em r grupos (ou seja: r grupos de 4 e o resto de 3)
    return [...Array(r).fill(4), ...Array(base_groups - r).fill(3)]
  } else {
    // caso raro; distribui o resto (até +2 por grupo) em ordem
    const groups = Array(base_groups).fill(3)
    let rem = r
    let i = 0
    while (rem > 0 && i < groups.length) {
      const add = Math.min(2, rem) // não passa de 5 no grupo
      groups[i] += add
      rem -= add
      i++
    }
    if (rem > 0) {
      // cria novo grupo com o que restar (será 1 ou 2)
      groups.push(rem)
    }
    return groups
  }
}

// Função para validar placares ITF Beach Tennis
const validarPlacarITF = (score: string): { valid: boolean; message?: string } => {
  if (!score || score.trim() === '') {
    return { valid: false, message: 'Placar não pode estar vazio' }
  }

  // Formatos aceitos:
  // "6-4 4-6 [10-8]" - 2 sets + match tie-break
  // "6-4 6-2" - 2 sets diretos
  // "6-4" - 1 set (formato especial)
  
  const matchTieBreakRegex = /^(\d+)-(\d+)\s+(\d+)-(\d+)\s+\[(\d+)-(\d+)\]$/
  const twoSetsRegex = /^(\d+)-(\d+)\s+(\d+)-(\d+)$/
  const oneSetRegex = /^(\d+)-(\d+)$/

  let match = score.match(matchTieBreakRegex)
  if (match) {
    const [, s1g1, s1g2, s2g1, s2g2, mtb1, mtb2] = match.map(Number)
    
    // Validar sets
    if (!validarSet(s1g1, s1g2) || !validarSet(s2g1, s2g2)) {
      return { valid: false, message: 'Sets devem terminar em 6 games (com vantagem de 2) ou tie-break 7-6' }
    }
    
    // Validar match tie-break
    if (!validarMatchTieBreak(mtb1, mtb2)) {
      return { valid: false, message: 'Match tie-break deve chegar a 10 pontos com vantagem de 2' }
    }
    
    // Verificar se houve empate 1-1 em sets
    const sets1 = (s1g1 > s1g2 ? 1 : 0) + (s2g1 > s2g2 ? 1 : 0)
    const sets2 = (s1g2 > s1g1 ? 1 : 0) + (s2g2 > s2g1 ? 1 : 0)
    
    if (sets1 !== 1 || sets2 !== 1) {
      return { valid: false, message: 'Match tie-break só é jogado quando há empate 1-1 em sets' }
    }
    
    return { valid: true }
  }

  match = score.match(twoSetsRegex)
  if (match) {
    const [, s1g1, s1g2, s2g1, s2g2] = match.map(Number)
    
    if (!validarSet(s1g1, s1g2) || !validarSet(s2g1, s2g2)) {
      return { valid: false, message: 'Sets devem terminar em 6 games (com vantagem de 2) ou tie-break 7-6' }
    }
    
    // Verificar se alguém venceu 2-0
    const sets1 = (s1g1 > s1g2 ? 1 : 0) + (s2g1 > s2g2 ? 1 : 0)
    const sets2 = (s1g2 > s1g1 ? 1 : 0) + (s2g2 > s2g1 ? 1 : 0)
    
    if (sets1 !== 2 && sets2 !== 2) {
      return { valid: false, message: 'Em 2 sets, um jogador deve vencer ambos (2-0)' }
    }
    
    return { valid: true }
  }

  match = score.match(oneSetRegex)
  if (match) {
    const [, g1, g2] = match.map(Number)
    
    if (!validarSet(g1, g2)) {
      return { valid: false, message: 'Set deve terminar em 6 games (com vantagem de 2) ou tie-break 7-6' }
    }
    
    return { valid: true }
  }

  return { valid: false, message: 'Formato de placar inválido. Use: "6-4 6-2", "6-4 4-6 [10-8]" ou "6-4"' }
}

// Validar um set individual
const validarSet = (games1: number, games2: number): boolean => {
  // Set normal: primeiro a 6 com vantagem de 2
  if (games1 >= 6 && games1 - games2 >= 2) return true
  if (games2 >= 6 && games2 - games1 >= 2) return true
  
  // Tie-break: 7-6
  if ((games1 === 7 && games2 === 6) || (games1 === 6 && games2 === 7)) return true
  
  return false
}

// Validar match tie-break
const validarMatchTieBreak = (points1: number, points2: number): boolean => {
  // Match tie-break: primeiro a 10 com vantagem de 2
  if (points1 >= 10 && points1 - points2 >= 2) return true
  if (points2 >= 10 && points2 - points1 >= 2) return true
  
  return false
}

// Função para calcular estatísticas de um placar
const calcularEstatisticas = (score: string) => {
  const matchTieBreakRegex = /^(\d+)-(\d+)\s+(\d+)-(\d+)\s+\[(\d+)-(\d+)\]$/
  const twoSetsRegex = /^(\d+)-(\d+)\s+(\d+)-(\d+)$/
  const oneSetRegex = /^(\d+)-(\d+)$/

  let match = score.match(matchTieBreakRegex)
  if (match) {
    const [, s1g1, s1g2, s2g1, s2g2, mtb1, mtb2] = match.map(Number)
    
    const sets1 = (s1g1 > s1g2 ? 1 : 0) + (s2g1 > s2g2 ? 1 : 0)
    const sets2 = (s1g2 > s1g1 ? 1 : 0) + (s2g2 > s2g1 ? 1 : 0)
    
    const winner = mtb1 > mtb2 ? 1 : 2
    const games1 = s1g1 + s2g1
    const games2 = s1g2 + s2g2
    
    return {
      winner,
      sets: winner === 1 ? [sets1 + 1, sets2] : [sets1, sets2 + 1],
      games: [games1, games2],
      points: [mtb1, mtb2] // Match tie-break points
    }
  }

  match = score.match(twoSetsRegex)
  if (match) {
    const [, s1g1, s1g2, s2g1, s2g2] = match.map(Number)
    
    const sets1 = (s1g1 > s1g2 ? 1 : 0) + (s2g1 > s2g2 ? 1 : 0)
    const sets2 = (s1g2 > s1g1 ? 1 : 0) + (s2g2 > s2g1 ? 1 : 0)
    
    const winner = sets1 > sets2 ? 1 : 2
    const games1 = s1g1 + s2g1
    const games2 = s1g2 + s2g2
    
    return {
      winner,
      sets: [sets1, sets2],
      games: [games1, games2],
      points: [0, 0] // Não há pontos especiais em sets normais
    }
  }

  match = score.match(oneSetRegex)
  if (match) {
    const [, g1, g2] = match.map(Number)
    
    const winner = g1 > g2 ? 1 : 2
    
    return {
      winner,
      sets: winner === 1 ? [1, 0] : [0, 1],
      games: [g1, g2],
      points: [0, 0]
    }
  }

  return null
}

// Tipos de dados
interface User {
  id: string
  userId: string // ID único para inscrições
  name: string
  email: string
  avatar?: string
  isAdmin?: boolean
  canCreateTournaments?: boolean
}

interface Tournament {
  id: string
  name: string
  description: string
  category: 'iniciante' | 'intermediario' | 'avancado'
  gender: 'masculino' | 'feminino' | 'misto'
  type: 'individual' | 'dupla'
  status: 'criado' | 'andamento' | 'finalizado'
  createdBy: string
  participants: Participant[]
  matches: Match[]
  groups: Group[]
  phase: 'grupos' | 'eliminatorias' | 'final'
  createdAt: Date
  shareLink: string
  maxParticipants?: number
  location?: string
  startDate?: Date
  prize?: string
  setFormat?: string
}

interface Participant {
  id: string
  userId: string
  userName: string
  partnerId?: string
  partnerName?: string
  partnerUserId?: string
  groupId?: string
  wins?: number
  losses?: number
  points?: number
  setsWon?: number
  setsLost?: number
  gamesWon?: number
  gamesLost?: number
  pointsWon?: number // Para match tie-breaks
  pointsLost?: number
  eliminated?: boolean
  groupPosition?: number
}

interface Match {
  id: string
  tournamentId: string
  player1Id: string
  player2Id: string
  player1Name: string
  player2Name: string
  score?: string // Placar no formato ITF
  phase: 'grupos' | 'eliminatorias' | 'final'
  status: 'pendente' | 'finalizada'
  groupId?: string
  scheduledDate?: Date
  court?: string
  round?: string
}

interface Group {
  id: string
  name: string
  participants: string[]
  standings: Standing[]
  completed?: boolean
}

interface Standing {
  participantId: string
  participantName: string
  matchesWon: number
  matchesLost: number
  setsWon: number
  setsLost: number
  gamesWon: number
  gamesLost: number
  pointsWon: number
  pointsLost: number
  setsPercentage: number
  gamesPercentage: number
  pointsDiff: number
}

export default function PorroncaTorneios() {
  // Estados principais
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [activeTab, setActiveTab] = useState('home')
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Estados de formulários
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '' })
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    description: '',
    category: 'iniciante' as const,
    gender: 'misto' as const,
    type: 'individual' as const,
    maxParticipants: 16,
    location: '',
    prize: '',
    setFormat: 'melhor_3_sets' // Padrão ITF
  })

  // Estados de UI
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showCreateTournament, setShowCreateTournament] = useState(false)
  const [showJoinTournament, setShowJoinTournament] = useState(false)
  const [showMatchResult, setShowMatchResult] = useState(false)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [matchResult, setMatchResult] = useState({ score: '' })
  const [partnerUserId, setPartnerUserId] = useState('')

  // Função para criar usuários em massa
  const createMassUsers = () => {
    const names = [
      'Ana Silva', 'Bruno Costa', 'Carla Santos', 'Diego Oliveira', 'Elena Ferreira', 'Felipe Lima',
      'Gabriela Souza', 'Henrique Alves', 'Isabela Rocha', 'João Mendes', 'Karina Pereira', 'Lucas Barbosa',
      'Mariana Gomes', 'Nicolas Cardoso', 'Olivia Martins', 'Pedro Nascimento', 'Queila Ribeiro', 'Rafael Torres',
      'Sofia Campos', 'Thiago Moreira', 'Ursula Dias', 'Vitor Araújo', 'Wanda Freitas', 'Xavier Cunha',
      'Yasmin Lopes', 'Zeca Monteiro', 'Amanda Vieira', 'Bernardo Reis', 'Camila Teixeira', 'Daniel Correia',
      'Eduarda Pinto', 'Fabio Nunes', 'Giovanna Castro', 'Hugo Machado', 'Ingrid Azevedo', 'Julio Carvalho',
      'Kelly Rodrigues', 'Leonardo Farias', 'Melissa Ramos', 'Nathan Borges', 'Otavio Melo', 'Patricia Duarte',
      'Quintino Sá', 'Renata Moura', 'Samuel Tavares', 'Tatiana Vasconcelos', 'Ulisses Paiva', 'Vanessa Cruz'
    ]

    const newUsers: User[] = names.map((name, index) => ({
      id: `user_${index + 11}`,
      userId: generateUserId(),
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      canCreateTournaments: index % 5 === 0
    }))

    return newUsers
  }

  // Função para criar torneio teste com 24 duplas
  const createTestTournament = (users: User[]) => {
    const selectedUsers = users.slice(0, 48)
    const participants: Participant[] = []

    for (let i = 0; i < selectedUsers.length; i += 2) {
      if (selectedUsers[i + 1]) {
        participants.push({
          id: `participant_${i / 2 + 1}`,
          userId: selectedUsers[i].id,
          userName: selectedUsers[i].name,
          partnerId: selectedUsers[i + 1].id,
          partnerName: selectedUsers[i + 1].name,
          partnerUserId: selectedUsers[i + 1].userId,
          wins: 0,
          losses: 0,
          points: 0,
          setsWon: 0,
          setsLost: 0,
          gamesWon: 0,
          gamesLost: 0,
          pointsWon: 0,
          pointsLost: 0
        })
      }
    }

    const testTournament: Tournament = {
      id: 'test_tournament_24',
      name: 'Torneio Teste Beach Tennis ITF - 24 Duplas',
      description: 'Torneio seguindo regras ITF 2025 para Beach Tennis com 24 duplas',
      category: 'intermediario',
      gender: 'misto',
      type: 'dupla',
      status: 'criado',
      createdBy: '1',
      maxParticipants: 24,
      location: 'Arena Beach Tennis ITF',
      prize: 'R$ 5.000 + Troféus ITF',
      setFormat: 'melhor_3_sets',
      participants,
      matches: [],
      groups: [],
      phase: 'grupos',
      createdAt: new Date(),
      shareLink: 'https://porronca.com/tournament/test_24_itf'
    }

    return testTournament
  }

  // Inicialização
  useEffect(() => {
    const baseUsers: User[] = [
      { id: '1', userId: generateUserId(), name: 'Admin ITF', email: 'admin@porronca.com', isAdmin: true, canCreateTournaments: true },
      { id: '2', userId: generateUserId(), name: 'João Silva', email: 'joao@email.com', canCreateTournaments: true },
      { id: '3', userId: generateUserId(), name: 'Maria Santos', email: 'maria@email.com', canCreateTournaments: false },
      { id: '4', userId: generateUserId(), name: 'Pedro Costa', email: 'pedro@email.com', canCreateTournaments: false },
      { id: '5', userId: generateUserId(), name: 'Ana Oliveira', email: 'ana@email.com', canCreateTournaments: true },
      { id: '6', userId: generateUserId(), name: 'Carlos Mendes', email: 'carlos@email.com', canCreateTournaments: false },
      { id: '7', userId: generateUserId(), name: 'Lucia Ferreira', email: 'lucia@email.com', canCreateTournaments: false },
      { id: '8', userId: generateUserId(), name: 'Roberto Lima', email: 'roberto@email.com', canCreateTournaments: false },
      { id: '9', userId: generateUserId(), name: 'Fernanda Souza', email: 'fernanda@email.com', canCreateTournaments: false },
      { id: '10', userId: generateUserId(), name: 'Marcos Pereira', email: 'marcos@email.com', canCreateTournaments: false }
    ]

    const massUsers = createMassUsers()
    const allUsers = [...baseUsers, ...massUsers]
    setUsers(allUsers)

    const testTournament = createTestTournament(allUsers)

    const sampleTournaments: Tournament[] = [
      {
        id: '1',
        name: 'Copa Beach Tennis ITF 2024',
        description: 'Torneio oficial seguindo regras ITF 2025',
        category: 'iniciante',
        gender: 'misto',
        type: 'dupla',
        status: 'criado',
        createdBy: '2',
        maxParticipants: 16,
        location: 'Arena Beach Sports ITF',
        prize: 'R$ 2.000 + Troféu ITF',
        setFormat: 'melhor_3_sets',
        participants: [
          { id: '1', userId: '2', userName: 'João Silva', partnerId: '3', partnerName: 'Maria Santos', partnerUserId: allUsers.find(u => u.id === '3')?.userId, wins: 0, losses: 0, points: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, pointsWon: 0, pointsLost: 0 },
          { id: '2', userId: '4', userName: 'Pedro Costa', partnerId: '1', partnerName: 'Admin ITF', partnerUserId: allUsers.find(u => u.id === '1')?.userId, wins: 0, losses: 0, points: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, pointsWon: 0, pointsLost: 0 },
          { id: '3', userId: '5', userName: 'Ana Oliveira', partnerId: '6', partnerName: 'Carlos Mendes', partnerUserId: allUsers.find(u => u.id === '6')?.userId, wins: 0, losses: 0, points: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, pointsWon: 0, pointsLost: 0 },
          { id: '4', userId: '7', userName: 'Lucia Ferreira', partnerId: '8', partnerName: 'Roberto Lima', partnerUserId: allUsers.find(u => u.id === '8')?.userId, wins: 0, losses: 0, points: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, pointsWon: 0, pointsLost: 0 },
          { id: '5', userId: '9', userName: 'Fernanda Souza', partnerId: '10', partnerName: 'Marcos Pereira', partnerUserId: allUsers.find(u => u.id === '10')?.userId, wins: 0, losses: 0, points: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, pointsWon: 0, pointsLost: 0 }
        ],
        matches: [],
        groups: [],
        phase: 'grupos',
        createdAt: new Date('2024-01-10'),
        shareLink: 'https://porronca.com/tournament/1'
      },
      testTournament
    ]
    setTournaments(sampleTournaments)
  }, [])

  // Funções de autenticação
  const handleLogin = () => {
    const user = users.find(u => u.email === loginForm.email)
    if (user) {
      setCurrentUser(user)
      setShowLogin(false)
      toast.success(`Bem-vindo ao PORRONCA TORNEIOS ITF, ${user.name}!`)
    } else {
      toast.error('Usuário não encontrado')
    }
  }

  const handleRegister = () => {
    const newUser: User = {
      id: Date.now().toString(),
      userId: generateUserId(),
      name: registerForm.name,
      email: registerForm.email,
      canCreateTournaments: false
    }
    setUsers([...users, newUser])
    setCurrentUser(newUser)
    setShowRegister(false)
    toast.success('Conta criada com sucesso no PORRONCA TORNEIOS ITF!')
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setActiveTab('home')
    setMobileMenuOpen(false)
    toast.success('Logout realizado')
  }

  // Função para gerar grupos usando algoritmo ITF
  const generateGroups = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId)
    if (!tournament) return

    const participants = tournament.participants
    
    if (participants.length < 3) {
      toast.error(`Mínimo de 3 ${tournament.type === 'dupla' ? 'duplas' : 'participantes'} necessário para iniciar o torneio`)
      return
    }

    try {
      // Usar algoritmo ITF para distribuição
      const groupSizes = distribuirGrupos(participants.length)
      
      // Embaralhar participantes
      const shuffledParticipants = [...participants].sort(() => Math.random() - 0.5)
      
      // Criar grupos
      const groups: Group[] = []
      let participantIndex = 0

      groupSizes.forEach((size, index) => {
        const groupName = String.fromCharCode(65 + index) // A, B, C, etc.
        const groupParticipants = shuffledParticipants.slice(participantIndex, participantIndex + size)
        participantIndex += size

        const group: Group = {
          id: groupName,
          name: `Grupo ${groupName}`,
          participants: groupParticipants.map(p => p.id),
          standings: groupParticipants.map(p => ({
            participantId: p.id,
            participantName: p.partnerName ? `${p.userName} & ${p.partnerName}` : p.userName,
            matchesWon: 0,
            matchesLost: 0,
            setsWon: 0,
            setsLost: 0,
            gamesWon: 0,
            gamesLost: 0,
            pointsWon: 0,
            pointsLost: 0,
            setsPercentage: 0,
            gamesPercentage: 0,
            pointsDiff: 0
          })),
          completed: false
        }

        groups.push(group)
      })

      // Atualizar participantes com groupId
      const updatedParticipants = participants.map(p => {
        const group = groups.find(g => g.participants.includes(p.id))
        return { ...p, groupId: group?.id }
      })

      // Gerar jogos da fase de grupos (round-robin)
      const matches: Match[] = []
      groups.forEach(group => {
        const groupParticipants = group.participants
        
        // Todos contra todos no grupo: g*(g-1)/2 jogos
        for (let i = 0; i < groupParticipants.length; i++) {
          for (let j = i + 1; j < groupParticipants.length; j++) {
            const p1 = updatedParticipants.find(p => p.id === groupParticipants[i])!
            const p2 = updatedParticipants.find(p => p.id === groupParticipants[j])!
            
            matches.push({
              id: `match_${Date.now()}_${i}_${j}_${group.id}`,
              tournamentId,
              player1Id: p1.id,
              player2Id: p2.id,
              player1Name: p1.partnerName ? `${p1.userName} & ${p1.partnerName}` : p1.userName,
              player2Name: p2.partnerName ? `${p2.userName} & ${p2.partnerName}` : p2.userName,
              phase: 'grupos',
              status: 'pendente',
              groupId: group.id,
              scheduledDate: new Date(Date.now() + (matches.length * 24 * 60 * 60 * 1000))
            })
          }
        }
      })

      const updatedTournament = {
        ...tournament,
        participants: updatedParticipants,
        groups,
        matches,
        status: 'andamento' as const
      }

      setTournaments(tournaments.map(t => t.id === tournamentId ? updatedTournament : t))
      
      if (selectedTournament && selectedTournament.id === tournamentId) {
        setSelectedTournament(updatedTournament)
      }
      
      const groupInfo = groupSizes.map((size, index) => `Grupo ${String.fromCharCode(65 + index)}: ${size} ${tournament.type === 'dupla' ? 'duplas' : 'participantes'}`).join(', ')
      toast.success(`Grupos gerados seguindo regras ITF! ${groups.length} grupos criados. ${groupInfo}`)
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar grupos')
    }
  }

  // Função para gerar chaveamento das eliminatórias - CORRIGIDA
  const generateBracket = (tournamentId: string) => {
    const tournament = tournaments.find(t => t.id === tournamentId)
    if (!tournament) return

    const groupMatches = tournament.matches.filter(m => m.phase === 'grupos')
    const allGroupMatchesCompleted = groupMatches.every(m => m.status === 'finalizada')

    if (!allGroupMatchesCompleted) {
      toast.error('Todos os jogos da fase de grupos devem ser finalizados antes de gerar o chaveamento')
      return
    }

    // Classificar participantes usando critérios ITF - CORRIGIDO
    const qualifiedParticipants: Participant[] = []
    
    tournament.groups.forEach(group => {
      // Aplicar critérios de desempate ITF
      const sortedStandings = [...group.standings].sort((a, b) => {
        // 1. Número de partidas vencidas
        if (b.matchesWon !== a.matchesWon) return b.matchesWon - a.matchesWon
        
        // 2. Percentual de sets vencidos
        if (b.setsPercentage !== a.setsPercentage) return b.setsPercentage - a.setsPercentage
        
        // 3. Percentual de games vencidos
        if (b.gamesPercentage !== a.gamesPercentage) return b.gamesPercentage - a.gamesPercentage
        
        // 4. Diferença de pontos
        return b.pointsDiff - a.pointsDiff
      })

      // CORREÇÃO: Apenas 1º e 2º colocados se classificam (não marcar como eliminado)
      sortedStandings.forEach((standing, index) => {
        const participant = tournament.participants.find(p => p.id === standing.participantId)
        if (participant) {
          participant.groupPosition = index + 1
          if (index < 2) { // Apenas os 2 primeiros se classificam
            participant.eliminated = false // Garantir que não estão eliminados
            qualifiedParticipants.push(participant)
          } else {
            participant.eliminated = true // Apenas 3º lugar em diante são eliminados
          }
        }
      })
    })

    const totalQualified = qualifiedParticipants.length
    
    // Separar 1º e 2º colocados para semeamento
    const firstPlaced = qualifiedParticipants.filter(p => p.groupPosition === 1)
    const secondPlaced = qualifiedParticipants.filter(p => p.groupPosition === 2)
    
    // Ordenar 1º colocados por critérios ITF (melhores ficam com bye)
    const sortedFirstPlaced = firstPlaced.sort((a, b) => {
      if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0)
      if ((b.setsWon || 0) !== (a.setsWon || 0)) return (b.setsWon || 0) - (a.setsWon || 0)
      return ((b.gamesWon || 0) - (b.gamesLost || 0)) - ((a.gamesWon || 0) - (a.gamesLost || 0))
    })
    
    // Calcular byes para próxima potência de 2
    const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(totalQualified)))
    const playersNeedingBye = nextPowerOf2 - totalQualified
    
    const playersWithBye = sortedFirstPlaced.slice(0, playersNeedingBye)
    const playersToPlay = [
      ...sortedFirstPlaced.slice(playersNeedingBye),
      ...secondPlaced
    ]
    
    // Embaralhar evitando confrontos do mesmo grupo
    const shuffledPlayersToPlay = [...playersToPlay].sort(() => Math.random() - 0.5)
    
    // Determinar fase inicial
    let currentRound = ''
    if (totalQualified > 16) currentRound = '32avos'
    else if (totalQualified > 8) currentRound = '16avos'
    else if (totalQualified > 4) currentRound = 'oitavas'
    else if (totalQualified > 2) currentRound = 'quartas'
    else currentRound = 'semifinal'

    // Gerar jogos das eliminatórias
    const eliminationMatches: Match[] = []
    
    for (let i = 0; i < shuffledPlayersToPlay.length; i += 2) {
      if (shuffledPlayersToPlay[i + 1]) {
        const p1 = shuffledPlayersToPlay[i]
        const p2 = shuffledPlayersToPlay[i + 1]
        
        eliminationMatches.push({
          id: `elimination_${Date.now()}_${i}`,
          tournamentId,
          player1Id: p1.id,
          player2Id: p2.id,
          player1Name: p1.partnerName ? `${p1.userName} & ${p1.partnerName}` : p1.userName,
          player2Name: p2.partnerName ? `${p2.userName} & ${p2.partnerName}` : p2.userName,
          phase: 'eliminatorias',
          status: 'pendente',
          round: currentRound,
          scheduledDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000))
        })
      }
    }

    const updatedTournament = {
      ...tournament,
      matches: [...tournament.matches, ...eliminationMatches],
      phase: 'eliminatorias' as const
    }

    setTournaments(tournaments.map(t => t.id === tournamentId ? updatedTournament : t))
    
    let message = `Chaveamento ITF gerado! ${eliminationMatches.length} jogos das eliminatórias criados`
    if (playersWithBye.length > 0) {
      message += `. ${playersWithBye.length} duplas com melhor campanha passaram direto (bye)`
    }
    
    toast.success(message)
  }

  // Função para criar torneio
  const handleCreateTournament = () => {
    if (!currentUser?.canCreateTournaments) {
      toast.error('Você não tem permissão para criar torneios')
      return
    }

    const newTournament: Tournament = {
      id: Date.now().toString(),
      ...tournamentForm,
      status: 'criado',
      createdBy: currentUser.id,
      participants: [],
      matches: [],
      groups: [],
      phase: 'grupos',
      createdAt: new Date(),
      shareLink: `https://porronca.com/tournament/${Date.now()}`
    }

    setTournaments([...tournaments, newTournament])
    setShowCreateTournament(false)
    setTournamentForm({ 
      name: '', 
      description: '', 
      category: 'iniciante', 
      gender: 'misto',
      type: 'individual',
      maxParticipants: 16,
      location: '',
      prize: '',
      setFormat: 'melhor_3_sets'
    })
    toast.success('Torneio ITF criado com sucesso!')
  }

  // Função para inscrição em torneio
  const handleJoinTournament = (tournamentId: string) => {
    if (!currentUser) return

    const tournament = tournaments.find(t => t.id === tournamentId)
    if (!tournament) return

    if (tournament.participants.length >= (tournament.maxParticipants || 16)) {
      toast.error('Torneio lotado!')
      return
    }

    if (tournament.type === 'dupla') {
      if (!partnerUserId) {
        toast.error('Para torneios de dupla, você deve fornecer o ID do seu parceiro')
        return
      }

      const partner = users.find(u => u.userId === partnerUserId)
      if (!partner) {
        toast.error('Parceiro não encontrado. Verifique o ID fornecido')
        return
      }

      const partnerAlreadyRegistered = tournament.participants.some(p => p.userId === partner.id)
      if (partnerAlreadyRegistered) {
        toast.error('Seu parceiro já está inscrito neste torneio')
        return
      }

      const newParticipant: Participant = {
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        partnerId: partner.id,
        partnerName: partner.name,
        partnerUserId: partner.userId,
        wins: 0,
        losses: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        pointsWon: 0,
        pointsLost: 0
      }

      const updatedTournament = {
        ...tournament,
        participants: [...tournament.participants, newParticipant]
      }

      setTournaments(tournaments.map(t => t.id === tournamentId ? updatedTournament : t))
      setPartnerUserId('')
      toast.success(`Dupla ${currentUser.name} & ${partner.name} inscrita com sucesso!`)
    } else {
      const newParticipant: Participant = {
        id: Date.now().toString(),
        userId: currentUser.id,
        userName: currentUser.name,
        wins: 0,
        losses: 0,
        points: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        pointsWon: 0,
        pointsLost: 0
      }

      const updatedTournament = {
        ...tournament,
        participants: [...tournament.participants, newParticipant]
      }

      setTournaments(tournaments.map(t => t.id === tournamentId ? updatedTournament : t))
      toast.success('Inscrição realizada com sucesso!')
    }
  }

  // Função para salvar resultado do jogo com validação ITF
  const saveMatchResult = (match: Match, score: string) => {
    const tournament = tournaments.find(t => t.id === match.tournamentId)
    if (!tournament) return

    // Validar placar ITF
    const validation = validarPlacarITF(score)
    if (!validation.valid) {
      toast.error(`Placar inválido segundo as regras ITF: ${validation.message}`)
      return
    }

    // Calcular estatísticas
    const stats = calcularEstatisticas(score)
    if (!stats) {
      toast.error('Erro ao processar estatísticas do placar')
      return
    }

    const updatedMatch = {
      ...match,
      score,
      status: 'finalizada' as const
    }

    const updatedMatches = tournament.matches.map(m => 
      m.id === match.id ? updatedMatch : m
    )

    // Atualizar estatísticas dos participantes
    const updatedParticipants = tournament.participants.map(p => {
      if (p.id === match.player1Id) {
        const won = stats.winner === 1
        return {
          ...p,
          wins: won ? (p.wins || 0) + 1 : p.wins || 0,
          losses: !won ? (p.losses || 0) + 1 : p.losses || 0,
          points: won ? (p.points || 0) + 3 : (p.points || 0), // 3 pontos por vitória no RR
          setsWon: (p.setsWon || 0) + stats.sets[0],
          setsLost: (p.setsLost || 0) + stats.sets[1],
          gamesWon: (p.gamesWon || 0) + stats.games[0],
          gamesLost: (p.gamesLost || 0) + stats.games[1],
          pointsWon: (p.pointsWon || 0) + stats.points[0],
          pointsLost: (p.pointsLost || 0) + stats.points[1]
        }
      }
      if (p.id === match.player2Id) {
        const won = stats.winner === 2
        return {
          ...p,
          wins: won ? (p.wins || 0) + 1 : p.wins || 0,
          losses: !won ? (p.losses || 0) + 1 : p.losses || 0,
          points: won ? (p.points || 0) + 3 : (p.points || 0),
          setsWon: (p.setsWon || 0) + stats.sets[1],
          setsLost: (p.setsLost || 0) + stats.sets[0],
          gamesWon: (p.gamesWon || 0) + stats.games[1],
          gamesLost: (p.gamesLost || 0) + stats.games[0],
          pointsWon: (p.pointsWon || 0) + stats.points[1],
          pointsLost: (p.pointsLost || 0) + stats.points[0]
        }
      }
      return p
    })

    // Atualizar standings dos grupos
    let updatedGroups = tournament.groups
    if (match.groupId) {
      updatedGroups = tournament.groups.map(group => {
        if (group.id === match.groupId) {
          const updatedStandings = group.standings.map(standing => {
            const participant = updatedParticipants.find(p => p.id === standing.participantId)
            if (participant) {
              const setsPlayed = (participant.setsWon || 0) + (participant.setsLost || 0)
              const gamesPlayed = (participant.gamesWon || 0) + (participant.gamesLost || 0)
              
              return {
                ...standing,
                matchesWon: participant.wins || 0,
                matchesLost: participant.losses || 0,
                setsWon: participant.setsWon || 0,
                setsLost: participant.setsLost || 0,
                gamesWon: participant.gamesWon || 0,
                gamesLost: participant.gamesLost || 0,
                pointsWon: participant.pointsWon || 0,
                pointsLost: participant.pointsLost || 0,
                setsPercentage: setsPlayed > 0 ? (participant.setsWon || 0) / setsPlayed : 0,
                gamesPercentage: gamesPlayed > 0 ? (participant.gamesWon || 0) / gamesPlayed : 0,
                pointsDiff: (participant.pointsWon || 0) - (participant.pointsLost || 0)
              }
            }
            return standing
          })

          return { ...group, standings: updatedStandings }
        }
        return group
      })
    }

    const updatedTournament = {
      ...tournament,
      matches: updatedMatches,
      participants: updatedParticipants,
      groups: updatedGroups
    }

    setTournaments(tournaments.map(t => t.id === tournament.id ? updatedTournament : t))
    
    if (selectedTournament && selectedTournament.id === tournament.id) {
      setSelectedTournament(updatedTournament)
    }
    
    toast.success('Resultado ITF registrado com sucesso!')
  }

  // Função para salvar resultado das eliminatórias - CORRIGIDA
  const saveEliminationMatchResult = (match: Match, score: string) => {
    const tournament = tournaments.find(t => t.id === match.tournamentId)
    if (!tournament) return

    // Validar placar ITF
    const validation = validarPlacarITF(score)
    if (!validation.valid) {
      toast.error(`Placar inválido segundo as regras ITF: ${validation.message}`)
      return
    }

    const stats = calcularEstatisticas(score)
    if (!stats) {
      toast.error('Erro ao processar estatísticas do placar')
      return
    }

    const updatedMatch = {
      ...match,
      score,
      status: 'finalizada' as const
    }

    const updatedMatches = tournament.matches.map(m => 
      m.id === match.id ? updatedMatch : m
    )

    // Determinar vencedor
    const winnerId = stats.winner === 1 ? match.player1Id : match.player2Id
    const winnerName = stats.winner === 1 ? match.player1Name : match.player2Name
    const loserId = stats.winner === 1 ? match.player2Id : match.player1Id

    // Marcar perdedor como eliminado
    const updatedParticipants = tournament.participants.map(p => {
      if (p.id === loserId) {
        return { ...p, eliminated: true }
      }
      return p
    })

    // Verificar se precisa gerar próxima fase
    const currentRoundMatches = tournament.matches.filter(m => m.round === match.round && m.phase === 'eliminatorias')
    const allCurrentRoundCompleted = currentRoundMatches.every(m => 
      m.id === match.id ? true : m.status === 'finalizada'
    )

    let newMatches: Match[] = []
    if (allCurrentRoundCompleted) {
      const winners = currentRoundMatches.map(m => {
        if (m.id === match.id) {
          return { id: winnerId, name: winnerName }
        }
        const matchStats = calcularEstatisticas(m.score!)
        return {
          id: matchStats?.winner === 1 ? m.player1Id : m.player2Id,
          name: matchStats?.winner === 1 ? m.player1Name : m.player2Name
        }
      })

      // Adicionar jogadores com bye
      const playersWithBye = tournament.participants.filter(p => 
        !p.eliminated && 
        !currentRoundMatches.some(m => m.player1Id === p.id || m.player2Id === p.id) &&
        !tournament.matches.some(m => m.phase === 'eliminatorias' && m.status === 'finalizada' && (m.player1Id === p.id || m.player2Id === p.id))
      )

      const allAdvancing = [...winners, ...playersWithBye.map(p => ({
        id: p.id,
        name: p.partnerName ? `${p.userName} & ${p.partnerName}` : p.userName
      }))]

      // CORREÇÃO: Verificar se é final e só criar 1 jogo
      if (allAdvancing.length === 2 && match.round === 'semifinal') {
        // É a final - criar apenas 1 jogo
        newMatches.push({
          id: `final_${Date.now()}`,
          tournamentId: tournament.id,
          player1Id: allAdvancing[0].id,
          player2Id: allAdvancing[1].id,
          player1Name: allAdvancing[0].name,
          player2Name: allAdvancing[1].name,
          phase: 'eliminatorias',
          status: 'pendente',
          round: 'final',
          scheduledDate: new Date(Date.now() + (24 * 60 * 60 * 1000))
        })
      } else if (allAdvancing.length > 2) {
        // Ainda há mais de 2 jogadores - continuar eliminatórias
        let nextRound = ''
        if (match.round === '32avos') nextRound = '16avos'
        else if (match.round === '16avos') nextRound = 'oitavas'
        else if (match.round === 'oitavas') nextRound = 'quartas'
        else if (match.round === 'quartas') nextRound = 'semifinal'

        if (nextRound) {
          const shuffledAdvancing = [...allAdvancing].sort(() => Math.random() - 0.5)
          
          for (let i = 0; i < shuffledAdvancing.length; i += 2) {
            if (shuffledAdvancing[i + 1]) {
              newMatches.push({
                id: `elimination_${Date.now()}_${i}_${nextRound}`,
                tournamentId: tournament.id,
                player1Id: shuffledAdvancing[i].id,
                player2Id: shuffledAdvancing[i + 1].id,
                player1Name: shuffledAdvancing[i].name,
                player2Name: shuffledAdvancing[i + 1].name,
                phase: 'eliminatorias',
                status: 'pendente',
                round: nextRound,
                scheduledDate: new Date(Date.now() + (i * 24 * 60 * 60 * 1000))
              })
            }
          }
        }
      }
    }

    const updatedTournament = {
      ...tournament,
      matches: [...updatedMatches, ...newMatches],
      participants: updatedParticipants
    }

    setTournaments(tournaments.map(t => t.id === tournament.id ? updatedTournament : t))
    
    if (selectedTournament && selectedTournament.id === tournament.id) {
      setSelectedTournament(updatedTournament)
    }
    
    toast.success('Resultado ITF registrado!')
    
    if (newMatches.length > 0) {
      if (newMatches[0].round === 'final') {
        toast.success('GRANDE FINAL gerada! Último confronto do torneio ITF')
      } else {
        toast.success(`Próxima fase gerada! ${newMatches.length} novos jogos criados`)
      }
    }
  }

  const handleMatchResult = () => {
    if (!selectedMatch) return

    if (selectedMatch.phase === 'eliminatorias') {
      saveEliminationMatchResult(selectedMatch, matchResult.score)
    } else {
      saveMatchResult(selectedMatch, matchResult.score)
    }
    
    setShowMatchResult(false)
    setSelectedMatch(null)
    setMatchResult({ score: '' })
  }

  const toggleUserPermission = (userId: string) => {
    if (!currentUser?.isAdmin) return

    setUsers(users.map(user => 
      user.id === userId 
        ? { ...user, canCreateTournaments: !user.canCreateTournaments }
        : user
    ))
    toast.success('Permissão atualizada!')
  }

  const deleteTournament = (tournamentId: string) => {
    if (!currentUser?.isAdmin) return
    
    setTournaments(tournaments.filter(t => t.id !== tournamentId))
    toast.success('Torneio excluído!')
  }

  const shareTournament = (shareLink: string) => {
    navigator.clipboard.writeText(shareLink)
    toast.success('Link copiado para a área de transferência!')
  }

  // Função para obter formato de set legível
  const getSetFormatDisplay = (format: string) => {
    const formats: { [key: string]: string } = {
      'melhor_3_sets': 'Melhor de 3 Sets (ITF)',
      '3_tiebreak_sets': '3 Tie-break Sets',
      '2_sets_6': '2 Sets de 6',
      '1_set_6': '1 Set de 6'
    }
    return formats[format] || format
  }

  // Função para verificar se todos os jogos da fase de grupos foram finalizados
  const areAllGroupMatchesCompleted = (tournament: Tournament) => {
    const groupMatches = tournament.matches.filter(m => m.phase === 'grupos')
    return groupMatches.length > 0 && groupMatches.every(m => m.status === 'finalizada')
  }

  // Renderização condicional baseada no login
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                PORRONCA
              </CardTitle>
              <CardTitle className="text-xl sm:text-2xl font-bold text-gray-800 -mt-1">
                TORNEIOS ITF
              </CardTitle>
              <CardDescription className="text-gray-600 mt-2 text-sm sm:text-base">
                Beach Tennis seguindo regras ITF 2025
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <Dialog open={showLogin} onOpenChange={setShowLogin}>
              <DialogTrigger asChild>
                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg h-12 text-base sm:text-lg font-semibold">
                  <LogIn className="w-5 h-5 mr-2" />
                  Entrar
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Entrar no PORRONCA TORNEIOS ITF</DialogTitle>
                  <DialogDescription className="text-sm sm:text-base">
                    Digite suas credenciais para acessar
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email" className="text-sm">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                      placeholder="seu@email.com"
                      className="text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-sm">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                      placeholder="••••••••"
                      className="text-base"
                    />
                  </div>
                  <Button onClick={handleLogin} className="w-full bg-gradient-to-r from-orange-500 to-red-600 h-12 text-base">
                    Entrar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showRegister} onOpenChange={setShowRegister}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full border-2 hover:bg-gray-50 h-12 text-base sm:text-lg font-semibold">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Criar Conta
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Criar conta no PORRONCA TORNEIOS ITF</DialogTitle>
                  <DialogDescription className="text-sm sm:text-base">
                    Preencha os dados para se cadastrar
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-sm">Nome completo</Label>
                    <Input
                      id="name"
                      value={registerForm.name}
                      onChange={(e) => setRegisterForm({...registerForm, name: e.target.value})}
                      placeholder="Seu nome"
                      className="text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-email" className="text-sm">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      value={registerForm.email}
                      onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                      placeholder="seu@email.com"
                      className="text-base"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-password" className="text-sm">Senha</Label>
                    <Input
                      id="reg-password"
                      type="password"
                      value={registerForm.password}
                      onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                      placeholder="••••••••"
                      className="text-base"
                    />
                  </div>
                  <Button onClick={handleRegister} className="w-full bg-gradient-to-r from-orange-500 to-red-600 h-12 text-base">
                    Criar Conta
                  </Button>
                </div>
              </DialogContent>
            </Dialog>


          </CardContent>
        </Card>
      </div>
    )
  }

  // Interface principal do app
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  PORRONCA
                </h1>
                <p className="text-xs text-gray-500 -mt-1">TORNEIOS ITF</p>
              </div>
            </div>
            
            {/* Desktop User Info */}
            <div className="hidden sm:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                    {currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
                  <span className="text-xs text-gray-500 flex items-center">
                    <Hash className="w-3 h-3 mr-1" />
                    ID: {currentUser.userId}
                  </span>
                </div>
                {currentUser.isAdmin && (
                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-orange-500 to-red-600 text-white">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin ITF
                  </Badge>
                )}
                {currentUser.canCreateTournaments && !currentUser.isAdmin && (
                  <Badge variant="outline" className="text-xs">
                    <Star className="w-3 h-3 mr-1" />
                    Organizador
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Sair
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="sm:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile User Info */}
          {mobileMenuOpen && (
            <div className="sm:hidden border-t bg-white py-4 space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={currentUser.avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                    {currentUser.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{currentUser.name}</p>
                  <p className="text-sm text-gray-500 flex items-center">
                    <Hash className="w-3 h-3 mr-1" />
                    ID: {currentUser.userId}
                  </p>
                  <div className="flex space-x-2 mt-1">
                    {currentUser.isAdmin && (
                      <Badge variant="secondary" className="text-xs bg-gradient-to-r from-orange-500 to-red-600 text-white">
                        <Shield className="w-3 h-3 mr-1" />
                        Admin ITF
                      </Badge>
                    )}
                    {currentUser.canCreateTournaments && !currentUser.isAdmin && (
                      <Badge variant="outline" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Organizador
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Mobile Navigation */}
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setActiveTab('home')
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeTab === 'home'
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Home className="w-4 h-4 inline mr-2" />
                  Início
                </button>
                <button
                  onClick={() => {
                    setActiveTab('tournaments')
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                    activeTab === 'tournaments'
                      ? 'bg-orange-100 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Trophy className="w-4 h-4 inline mr-2" />
                  Torneios ITF
                </button>
                {currentUser.isAdmin && (
                  <button
                    onClick={() => {
                      setActiveTab('admin')
                      setMobileMenuOpen(false)
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                      activeTab === 'admin'
                        ? 'bg-orange-100 text-orange-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Settings className="w-4 h-4 inline mr-2" />
                    Admin
                  </button>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                className="w-full"
              >
                Sair
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="hidden sm:block bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('home')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'home'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Home className="w-4 h-4 inline mr-2" />
              Início
            </button>
            <button
              onClick={() => setActiveTab('tournaments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'tournaments'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Trophy className="w-4 h-4 inline mr-2" />
              Torneios ITF
            </button>
            {currentUser.isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'admin'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Admin
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {activeTab === 'home' && (
          <div className="space-y-6 sm:space-y-8">
            {/* Welcome Banner */}
            <Card className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 text-white border-0 shadow-2xl">
              <CardContent className="p-4 sm:p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl sm:text-3xl font-bold mb-2">Bem-vindo ao PORRONCA TORNEIOS ITF!</h2>
                    <p className="text-orange-100 text-sm sm:text-lg">
                      Beach Tennis seguindo regras oficiais ITF 2025
                    </p>
                    <p className="text-orange-200 mt-2 text-xs sm:text-base">
                      🏐 Validação automática de placares • Algoritmo ITF de grupos • Critérios oficiais de desempate
                    </p>
                  </div>
                  <div className="hidden md:block">
                    <AlertTriangle className="w-16 h-16 sm:w-24 sm:h-24 text-orange-200" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shadow-lg">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs sm:text-sm font-medium">Torneios ITF</p>
                      <p className="text-xl sm:text-3xl font-bold">{tournaments.length}</p>
                    </div>
                    <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-lg">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-xs sm:text-sm font-medium">Em Andamento</p>
                      <p className="text-xl sm:text-3xl font-bold">
                        {tournaments.filter(t => t.status === 'andamento').length}
                      </p>
                    </div>
                    <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-lg">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-xs sm:text-sm font-medium">Finalizados</p>
                      <p className="text-xl sm:text-3xl font-bold">
                        {tournaments.filter(t => t.status === 'finalizado').length}
                      </p>
                    </div>
                    <Medal className="w-6 h-6 sm:w-8 sm:h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-lg">
                <CardContent className="p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-amber-100 text-xs sm:text-sm font-medium">Participantes</p>
                      <p className="text-xl sm:text-3xl font-bold">
                        {tournaments.reduce((acc, t) => acc + t.participants.length, 0)}
                      </p>
                    </div>
                    <Users2 className="w-6 h-6 sm:w-8 sm:h-8 text-amber-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* ITF Rules Info */}
            <Card className="shadow-lg border-l-4 border-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600" />
                  Regras ITF 2025 Implementadas
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Sistema totalmente compatível com regulamentação oficial
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-600" />
                    <h3 className="font-semibold text-blue-900 text-sm sm:text-base">Algoritmo de Grupos</h3>
                    <p className="text-xs sm:text-sm text-blue-700">Distribuição automática priorizando grupos de 3 duplas</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-600" />
                    <h3 className="font-semibold text-green-900 text-sm sm:text-base">Validação de Placares</h3>
                    <p className="text-xs sm:text-sm text-green-700">Sets, tie-breaks e match tie-breaks validados automaticamente</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                    <Award className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-purple-600" />
                    <h3 className="font-semibold text-purple-900 text-sm sm:text-base">Critérios de Desempate</h3>
                    <p className="text-xs sm:text-sm text-purple-700">Head-to-head, % sets, % games e diferença de pontos</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-lg sm:text-xl">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600" />
                  Ações Rápidas
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Acesse rapidamente as principais funcionalidades ITF
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {currentUser.canCreateTournaments && (
                    <Dialog open={showCreateTournament} onOpenChange={setShowCreateTournament}>
                      <DialogTrigger asChild>
                        <Button className="h-auto p-4 sm:p-6 flex flex-col items-center space-y-2 sm:space-y-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg text-xs sm:text-sm">
                          <Plus className="w-6 h-6 sm:w-8 sm:h-8" />
                          <span className="font-semibold">Criar Torneio ITF</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-lg sm:text-xl">Criar Novo Torneio ITF</DialogTitle>
                          <DialogDescription className="text-sm sm:text-base">
                            Torneio seguindo regras ITF 2025
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="tournament-name" className="text-sm">Nome do Torneio</Label>
                            <Input
                              id="tournament-name"
                              value={tournamentForm.name}
                              onChange={(e) => setTournamentForm({...tournamentForm, name: e.target.value})}
                              placeholder="Ex: Copa Beach Tennis ITF 2024"
                              className="text-base"
                            />
                          </div>
                          <div>
                            <Label htmlFor="tournament-description" className="text-sm">Descrição</Label>
                            <Textarea
                              id="tournament-description"
                              value={tournamentForm.description}
                              onChange={(e) => setTournamentForm({...tournamentForm, description: e.target.value})}
                              placeholder="Descreva o torneio..."
                              rows={3}
                              className="text-base"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="tournament-category" className="text-sm">Categoria</Label>
                              <Select
                                value={tournamentForm.category}
                                onValueChange={(value: any) => setTournamentForm({...tournamentForm, category: value})}
                              >
                                <SelectTrigger className="text-base">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="iniciante">Iniciante</SelectItem>
                                  <SelectItem value="intermediario">Intermediário</SelectItem>
                                  <SelectItem value="avancado">Avançado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="tournament-gender" className="text-sm">Gênero</Label>
                              <Select
                                value={tournamentForm.gender}
                                onValueChange={(value: any) => setTournamentForm({...tournamentForm, gender: value})}
                              >
                                <SelectTrigger className="text-base">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="masculino">Masculino</SelectItem>
                                  <SelectItem value="feminino">Feminino</SelectItem>
                                  <SelectItem value="misto">Misto</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="tournament-type" className="text-sm">Tipo</Label>
                            <Select
                              value={tournamentForm.type}
                              onValueChange={(value: any) => setTournamentForm({...tournamentForm, type: value})}
                            >
                              <SelectTrigger className="text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="individual">Individual</SelectItem>
                                <SelectItem value="dupla">Dupla</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="set-format" className="text-sm">Formato ITF</Label>
                            <Select
                              value={tournamentForm.setFormat}
                              onValueChange={(value: any) => setTournamentForm({...tournamentForm, setFormat: value})}
                            >
                              <SelectTrigger className="text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="melhor_3_sets">Melhor de 3 Sets (ITF Padrão)</SelectItem>
                                <SelectItem value="3_tiebreak_sets">3 Tie-break Sets</SelectItem>
                                <SelectItem value="2_sets_6">2 Sets de 6</SelectItem>
                                <SelectItem value="1_set_6">1 Set de 6</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="tournament-location" className="text-sm">Local</Label>
                            <Input
                              id="tournament-location"
                              value={tournamentForm.location}
                              onChange={(e) => setTournamentForm({...tournamentForm, location: e.target.value})}
                              placeholder="Ex: Arena Beach Tennis ITF"
                              className="text-base"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="max-participants" className="text-sm">Máx. {tournamentForm.type === 'dupla' ? 'Duplas' : 'Participantes'}</Label>
                              <Input
                                id="max-participants"
                                type="number"
                                value={tournamentForm.maxParticipants}
                                onChange={(e) => setTournamentForm({...tournamentForm, maxParticipants: parseInt(e.target.value)})}
                                placeholder="24"
                                className="text-base"
                              />
                            </div>
                            <div>
                              <Label htmlFor="prize" className="text-sm">Premiação</Label>
                              <Input
                                id="prize"
                                value={tournamentForm.prize}
                                onChange={(e) => setTournamentForm({...tournamentForm, prize: e.target.value})}
                                placeholder="Ex: R$ 2.000"
                                className="text-base"
                              />
                            </div>
                          </div>
                          <Button onClick={handleCreateTournament} className="w-full bg-gradient-to-r from-orange-500 to-red-600 h-12 text-base">
                            Criar Torneio ITF
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}

                  <Button
                    variant="outline"
                    className="h-auto p-4 sm:p-6 flex flex-col items-center space-y-2 sm:space-y-3 border-2 hover:bg-orange-50 hover:border-orange-300 shadow-lg text-xs sm:text-sm"
                    onClick={() => setActiveTab('tournaments')}
                  >
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
                    <span className="font-semibold">Ver Torneios</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 sm:p-6 flex flex-col items-center space-y-2 sm:space-y-3 border-2 hover:bg-blue-50 hover:border-blue-300 shadow-lg text-xs sm:text-sm"
                    onClick={() => setActiveTab('tournaments')}
                  >
                    <CalendarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                    <span className="font-semibold">Meus Jogos</span>
                  </Button>

                  <Button
                    variant="outline"
                    className="h-auto p-4 sm:p-6 flex flex-col items-center space-y-2 sm:space-y-3 border-2 hover:bg-purple-50 hover:border-purple-300 shadow-lg text-xs sm:text-sm"
                    onClick={() => setActiveTab('tournaments')}
                  >
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                    <span className="font-semibold">Ranking ITF</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Tournaments */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center text-lg sm:text-xl">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600" />
                    Torneios ITF em Destaque
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('tournaments')}
                    className="text-orange-600 hover:text-orange-700 text-xs sm:text-sm"
                  >
                    Ver todos
                    <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tournaments.slice(0, 3).map((tournament) => (
                    <div
                      key={tournament.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-6 border rounded-xl hover:bg-orange-50 hover:border-orange-200 transition-all cursor-pointer shadow-sm space-y-3 sm:space-y-0"
                      onClick={() => {
                        setSelectedTournament(tournament)
                        setActiveTab('tournaments')
                      }}
                    >
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 text-base sm:text-lg">{tournament.name}</h3>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mt-1">
                            <span className="flex items-center">
                              <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              {tournament.participants.length}/{tournament.maxParticipants || 16}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              {tournament.location || 'Local não definido'}
                            </span>
                            <span className="capitalize font-medium text-orange-600">
                              {tournament.category}
                            </span>
                            <span className="capitalize font-medium text-purple-600">
                              {tournament.gender}
                            </span>
                          </div>
                          {tournament.prize && (
                            <p className="text-xs sm:text-sm text-green-600 font-semibold mt-1">
                              🏆 {tournament.prize}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <Badge
                          variant={
                            tournament.status === 'andamento' ? 'default' :
                            tournament.status === 'finalizado' ? 'secondary' : 'outline'
                          }
                          className={
                            tournament.status === 'andamento' ? 'bg-green-500' :
                            tournament.status === 'finalizado' ? 'bg-purple-500' : 'border-orange-500 text-orange-600'
                          }
                        >
                          {tournament.status === 'criado' ? 'Aberto' :
                           tournament.status === 'andamento' ? 'Em andamento' : 'Finalizado'}
                        </Badge>
                        {tournament.status === 'criado' && (
                          <Dialog open={showJoinTournament} onOpenChange={setShowJoinTournament}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-xs sm:text-sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedTournament(tournament)
                                }}
                                disabled={tournament.participants.some(p => p.userId === currentUser.id)}
                              >
                                {tournament.participants.some(p => p.userId === currentUser.id) ? 'Inscrito' : 'Participar'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] max-w-md mx-auto">
                              <DialogHeader>
                                <DialogTitle className="text-lg sm:text-xl">Inscrever-se no Torneio ITF</DialogTitle>
                                <DialogDescription className="text-sm sm:text-base">
                                  {tournament.type === 'dupla' 
                                    ? 'Para torneios de dupla, você precisa fornecer o ID do seu parceiro'
                                    : 'Confirme sua inscrição no torneio individual'
                                  }
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    <strong>Torneio:</strong> {tournament.name}
                                  </p>
                                  <p className="text-sm text-gray-600 mb-2">
                                    <strong>Tipo:</strong> {tournament.type === 'dupla' ? 'Dupla' : 'Individual'}
                                  </p>
                                  <p className="text-sm text-gray-600 mb-4">
                                    <strong>Gênero:</strong> {tournament.gender}
                                  </p>
                                </div>
                                
                                {tournament.type === 'dupla' && (
                                  <div>
                                    <Label htmlFor="partner-id" className="text-sm">ID do Parceiro</Label>
                                    <Input
                                      id="partner-id"
                                      value={partnerUserId}
                                      onChange={(e) => setPartnerUserId(e.target.value.toUpperCase())}
                                      placeholder="Ex: ABC123XY"
                                      className="uppercase text-base"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Peça o ID único do seu parceiro (encontrado no perfil dele)
                                    </p>
                                  </div>
                                )}
                                
                                <Button 
                                  onClick={() => {
                                    if (selectedTournament) {
                                      handleJoinTournament(selectedTournament.id)
                                      setShowJoinTournament(false)
                                    }
                                  }} 
                                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 h-12 text-base"
                                >
                                  Confirmar Inscrição
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  ))}
                  {tournaments.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Nenhum torneio ITF encontrado</h3>
                      <p className="text-gray-500 mb-6 text-sm sm:text-base">Seja o primeiro a criar um torneio seguindo regras ITF!</p>
                      {currentUser.canCreateTournaments && (
                        <Button
                          onClick={() => setShowCreateTournament(true)}
                          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-sm sm:text-base"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Primeiro Torneio ITF
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-6">
            {!selectedTournament ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Torneios ITF</h2>
                  {currentUser.canCreateTournaments && (
                    <Dialog open={showCreateTournament} onOpenChange={setShowCreateTournament}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg text-sm sm:text-base">
                          <Plus className="w-4 h-4 mr-2" />
                          Criar Torneio ITF
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-[95vw] max-w-md mx-auto max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle className="text-lg sm:text-xl">Criar Novo Torneio ITF</DialogTitle>
                          <DialogDescription className="text-sm sm:text-base">
                            Torneio seguindo regras ITF 2025
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="tournament-name" className="text-sm">Nome do Torneio</Label>
                            <Input
                              id="tournament-name"
                              value={tournamentForm.name}
                              onChange={(e) => setTournamentForm({...tournamentForm, name: e.target.value})}
                              placeholder="Ex: Copa Beach Tennis ITF 2024"
                              className="text-base"
                            />
                          </div>
                          <div>
                            <Label htmlFor="tournament-description" className="text-sm">Descrição</Label>
                            <Textarea
                              id="tournament-description"
                              value={tournamentForm.description}
                              onChange={(e) => setTournamentForm({...tournamentForm, description: e.target.value})}
                              placeholder="Descreva o torneio..."
                              rows={3}
                              className="text-base"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="tournament-category" className="text-sm">Categoria</Label>
                              <Select
                                value={tournamentForm.category}
                                onValueChange={(value: any) => setTournamentForm({...tournamentForm, category: value})}
                              >
                                <SelectTrigger className="text-base">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="iniciante">Iniciante</SelectItem>
                                  <SelectItem value="intermediario">Intermediário</SelectItem>
                                  <SelectItem value="avancado">Avançado</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="tournament-gender" className="text-sm">Gênero</Label>
                              <Select
                                value={tournamentForm.gender}
                                onValueChange={(value: any) => setTournamentForm({...tournamentForm, gender: value})}
                              >
                                <SelectTrigger className="text-base">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="masculino">Masculino</SelectItem>
                                  <SelectItem value="feminino">Feminino</SelectItem>
                                  <SelectItem value="misto">Misto</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="tournament-type" className="text-sm">Tipo</Label>
                            <Select
                              value={tournamentForm.type}
                              onValueChange={(value: any) => setTournamentForm({...tournamentForm, type: value})}
                            >
                              <SelectTrigger className="text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="individual">Individual</SelectItem>
                                <SelectItem value="dupla">Dupla</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="set-format" className="text-sm">Formato ITF</Label>
                            <Select
                              value={tournamentForm.setFormat}
                              onValueChange={(value: any) => setTournamentForm({...tournamentForm, setFormat: value})}
                            >
                              <SelectTrigger className="text-base">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="melhor_3_sets">Melhor de 3 Sets (ITF Padrão)</SelectItem>
                                <SelectItem value="3_tiebreak_sets">3 Tie-break Sets</SelectItem>
                                <SelectItem value="2_sets_6">2 Sets de 6</SelectItem>
                                <SelectItem value="1_set_6">1 Set de 6</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="tournament-location" className="text-sm">Local</Label>
                            <Input
                              id="tournament-location"
                              value={tournamentForm.location}
                              onChange={(e) => setTournamentForm({...tournamentForm, location: e.target.value})}
                              placeholder="Ex: Arena Beach Tennis ITF"
                              className="text-base"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="max-participants" className="text-sm">Máx. {tournamentForm.type === 'dupla' ? 'Duplas' : 'Participantes'}</Label>
                              <Input
                                id="max-participants"
                                type="number"
                                value={tournamentForm.maxParticipants}
                                onChange={(e) => setTournamentForm({...tournamentForm, maxParticipants: parseInt(e.target.value)})}
                                placeholder="24"
                                className="text-base"
                              />
                            </div>
                            <div>
                              <Label htmlFor="prize" className="text-sm">Premiação</Label>
                              <Input
                                id="prize"
                                value={tournamentForm.prize}
                                onChange={(e) => setTournamentForm({...tournamentForm, prize: e.target.value})}
                                placeholder="Ex: R$ 2.000"
                                className="text-base"
                              />
                            </div>
                          </div>
                          <Button onClick={handleCreateTournament} className="w-full bg-gradient-to-r from-orange-500 to-red-600 h-12 text-base">
                            Criar Torneio ITF
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                  {tournaments.map((tournament) => (
                    <Card key={tournament.id} className="hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <CardTitle className="text-base sm:text-lg font-bold text-gray-900 mb-2">{tournament.name}</CardTitle>
                            <CardDescription className="text-gray-600 text-sm">
                              {tournament.description}
                            </CardDescription>
                          </div>
                          <Badge
                            variant={
                              tournament.status === 'andamento' ? 'default' :
                              tournament.status === 'finalizado' ? 'secondary' : 'outline'
                            }
                            className={
                              tournament.status === 'andamento' ? 'bg-green-500' :
                              tournament.status === 'finalizado' ? 'bg-purple-500' : 'border-orange-500 text-orange-600'
                            }
                          >
                            {tournament.status === 'criado' ? 'Aberto' :
                             tournament.status === 'andamento' ? 'Em andamento' : 'Finalizado'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-orange-500" />
                            <span className="capitalize font-medium">{tournament.category}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-pink-500" />
                            <span className="capitalize font-medium">{tournament.gender}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-blue-500" />
                            <span className="capitalize font-medium">{tournament.type}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users2 className="w-4 h-4 text-green-500" />
                            <span className="font-medium">{tournament.participants.length}/{tournament.maxParticipants || 16}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Timer className="w-4 h-4 text-purple-500" />
                          <span className="text-sm font-medium">{getSetFormatDisplay(tournament.setFormat || 'melhor_3_sets')}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{tournament.location || 'Local não definido'}</span>
                        </div>
                        
                        {tournament.prize && (
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-3 rounded-lg border border-yellow-200">
                            <p className="text-sm font-semibold text-orange-700 flex items-center">
                              <Medal className="w-4 h-4 mr-2" />
                              {tournament.prize}
                            </p>
                          </div>
                        )}

                        <Separator />
                        
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-xs sm:text-sm"
                            onClick={() => setSelectedTournament(tournament)}
                          >
                            Ver Detalhes
                          </Button>
                          <div className="flex space-x-2">
                            <Dialog open={showJoinTournament} onOpenChange={setShowJoinTournament}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50 text-xs sm:text-sm"
                                  onClick={() => setSelectedTournament(tournament)}
                                  disabled={tournament.participants.some(p => p.userId === currentUser.id) || tournament.participants.length >= (tournament.maxParticipants || 16)}
                                >
                                  {tournament.participants.some(p => p.userId === currentUser.id) ? (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Inscrito
                                    </>
                                  ) : tournament.participants.length >= (tournament.maxParticipants || 16) ? (
                                    <>
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Lotado
                                    </>
                                  ) : (
                                    'Participar'
                                  )}
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="w-[95vw] max-w-md mx-auto">
                                <DialogHeader>
                                  <DialogTitle className="text-lg sm:text-xl">Inscrever-se no Torneio ITF</DialogTitle>
                                  <DialogDescription className="text-sm sm:text-base">
                                    {tournament.type === 'dupla' 
                                      ? 'Para torneios de dupla, você precisa fornecer o ID do seu parceiro'
                                      : 'Confirme sua inscrição no torneio individual'
                                    }
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div>
                                    <p className="text-sm text-gray-600 mb-2">
                                      <strong>Torneio:</strong> {tournament.name}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-2">
                                      <strong>Tipo:</strong> {tournament.type === 'dupla' ? 'Dupla' : 'Individual'}
                                    </p>
                                    <p className="text-sm text-gray-600 mb-4">
                                      <strong>Gênero:</strong> {tournament.gender}
                                    </p>
                                  </div>
                                  
                                  {tournament.type === 'dupla' && (
                                    <div>
                                      <Label htmlFor="partner-id" className="text-sm">ID do Parceiro</Label>
                                      <Input
                                        id="partner-id"
                                        value={partnerUserId}
                                        onChange={(e) => setPartnerUserId(e.target.value.toUpperCase())}
                                        placeholder="Ex: ABC123XY"
                                        className="uppercase text-base"
                                      />
                                      <p className="text-xs text-gray-500 mt-1">
                                        Peça o ID único do seu parceiro (encontrado no perfil dele)
                                      </p>
                                    </div>
                                  )}
                                  
                                  <Button 
                                    onClick={() => {
                                      if (selectedTournament) {
                                        handleJoinTournament(selectedTournament.id)
                                        setShowJoinTournament(false)
                                      }
                                    }} 
                                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 h-12 text-base"
                                  >
                                    Confirmar Inscrição
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => shareTournament(tournament.shareLink)}
                              className="hover:bg-orange-50"
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {tournaments.length === 0 && (
                  <Card className="shadow-lg">
                    <CardContent className="text-center py-16">
                      <Trophy className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-6 text-gray-300" />
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Nenhum torneio ITF encontrado</h3>
                      <p className="text-gray-500 mb-8 text-base sm:text-lg">Crie seu primeiro torneio seguindo regras ITF 2025!</p>
                      {currentUser.canCreateTournaments && (
                        <Button
                          onClick={() => setShowCreateTournament(true)}
                          className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-base sm:text-lg px-6 sm:px-8 py-3"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Criar Primeiro Torneio ITF
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedTournament(null)}
                    className="text-gray-600 hover:text-gray-900 text-sm sm:text-base"
                  >
                    ← Voltar aos Torneios
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => shareTournament(selectedTournament.shareLink)}
                      className="border-orange-500 text-orange-600 hover:bg-orange-50 text-xs sm:text-sm"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </Button>
                    {selectedTournament.status === 'criado' && selectedTournament.participants.length >= 3 && (
                      <Button
                        size="sm"
                        onClick={() => generateGroups(selectedTournament.id)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xs sm:text-sm"
                      >
                        <Shuffle className="w-4 h-4 mr-2" />
                        Gerar Grupos ITF
                      </Button>
                    )}
                    {selectedTournament.status === 'andamento' && selectedTournament.phase === 'grupos' && areAllGroupMatchesCompleted(selectedTournament) && (
                      <Button
                        size="sm"
                        onClick={() => generateBracket(selectedTournament.id)}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-xs sm:text-sm"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Gerar Chaveamento ITF
                      </Button>
                    )}
                    {currentUser.isAdmin && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          deleteTournament(selectedTournament.id)
                          setSelectedTournament(null)
                        }}
                        className="text-xs sm:text-sm"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    )}
                  </div>
                </div>

                <Card className="shadow-xl">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start space-y-4 sm:space-y-0">
                      <div>
                        <CardTitle className="text-xl sm:text-3xl font-bold mb-2">{selectedTournament.name}</CardTitle>
                        <CardDescription className="text-orange-100 text-sm sm:text-lg">
                          {selectedTournament.description}
                        </CardDescription>
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30 mt-2 text-xs sm:text-sm">
                          Regras ITF 2025
                        </Badge>
                      </div>
                      <Badge
                        variant="secondary"
                        className="bg-white/20 text-white border-white/30 text-sm sm:text-lg px-3 sm:px-4 py-1 sm:py-2"
                      >
                        {selectedTournament.status === 'criado' ? 'Aberto para Inscrições' :
                         selectedTournament.status === 'andamento' ? 'Em Andamento' : 'Finalizado'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-8">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 mb-6 sm:mb-8">
                      <div className="text-center p-3 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <Users2 className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 text-blue-600" />
                        <p className="text-2xl sm:text-3xl font-bold text-blue-600">{selectedTournament.participants.length}</p>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">de {selectedTournament.maxParticipants || 16} {selectedTournament.type === 'dupla' ? 'duplas' : 'participantes'}</p>
                      </div>
                      <div className="text-center p-3 sm:p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <Target className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 text-green-600" />
                        <p className="text-lg sm:text-2xl font-bold text-green-600 capitalize">{selectedTournament.category}</p>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Categoria</p>
                      </div>
                      <div className="text-center p-3 sm:p-6 bg-gradient-to-r from-pink-50 to-rose-50 rounded-xl border border-pink-200">
                        <User className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 text-pink-600" />
                        <p className="text-lg sm:text-2xl font-bold text-pink-600 capitalize">{selectedTournament.gender}</p>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Gênero</p>
                      </div>
                      <div className="text-center p-3 sm:p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                        <Trophy className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 text-purple-600" />
                        <p className="text-lg sm:text-2xl font-bold text-purple-600 capitalize">{selectedTournament.type}</p>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Modalidade</p>
                      </div>
                      <div className="text-center p-3 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                        <Timer className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 text-amber-600" />
                        <p className="text-sm sm:text-lg font-bold text-amber-600">{getSetFormatDisplay(selectedTournament.setFormat || 'melhor_3_sets')}</p>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Formato ITF</p>
                      </div>
                      <div className="text-center p-3 sm:p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
                        <MapPin className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-3 text-cyan-600" />
                        <p className="text-sm sm:text-lg font-bold text-cyan-600">{selectedTournament.location || 'N/A'}</p>
                        <p className="text-xs sm:text-sm text-gray-600 font-medium">Local</p>
                      </div>
                    </div>

                    {selectedTournament.prize && (
                      <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-4 sm:p-6 rounded-xl border border-yellow-300 mb-6 sm:mb-8">
                        <div className="flex items-center justify-center">
                          <Medal className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-orange-600" />
                          <p className="text-lg sm:text-xl font-bold text-orange-700">Premiação: {selectedTournament.prize}</p>
                        </div>
                      </div>
                    )}

                    <Tabs defaultValue="participants" className="w-full">
                      <TabsList className={`grid w-full ${selectedTournament.phase === 'eliminatorias' ? 'grid-cols-5' : 'grid-cols-4'} mb-6 h-auto`}>
                        <TabsTrigger value="participants" className="text-xs sm:text-sm font-semibold py-2">Participantes</TabsTrigger>
                        <TabsTrigger value="groups" className="text-xs sm:text-sm font-semibold py-2">Grupos ITF</TabsTrigger>
                        <TabsTrigger value="matches" className="text-xs sm:text-sm font-semibold py-2">Jogos</TabsTrigger>
                        {selectedTournament.phase === 'eliminatorias' && (
                          <TabsTrigger value="eliminatorias" className="text-xs sm:text-sm font-semibold py-2">Eliminatórias</TabsTrigger>
                        )}
                        <TabsTrigger value="results" className="text-xs sm:text-sm font-semibold py-2">Resultados</TabsTrigger>
                      </TabsList>

                      <TabsContent value="participants" className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                          <h3 className="text-lg sm:text-xl font-bold">Lista de Participantes</h3>
                          <Dialog open={showJoinTournament} onOpenChange={setShowJoinTournament}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                disabled={selectedTournament.participants.some(p => p.userId === currentUser.id) || selectedTournament.participants.length >= (selectedTournament.maxParticipants || 16)}
                                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-xs sm:text-sm"
                              >
                                <UserPlus className="w-4 h-4 mr-2" />
                                {selectedTournament.participants.some(p => p.userId === currentUser.id) ? 'Já Inscrito' : 
                                 selectedTournament.participants.length >= (selectedTournament.maxParticipants || 16) ? 'Torneio Lotado' : 'Entrar no Torneio'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="w-[95vw] max-w-md mx-auto">
                              <DialogHeader>
                                <DialogTitle className="text-lg sm:text-xl">Inscrever-se no Torneio ITF</DialogTitle>
                                <DialogDescription className="text-sm sm:text-base">
                                  {selectedTournament.type === 'dupla' 
                                    ? 'Para torneios de dupla, você precisa fornecer o ID do seu parceiro'
                                    : 'Confirme sua inscrição no torneio individual'
                                  }
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <p className="text-sm text-gray-600 mb-2">
                                    <strong>Torneio:</strong> {selectedTournament.name}
                                  </p>
                                  <p className="text-sm text-gray-600 mb-2">
                                    <strong>Tipo:</strong> {selectedTournament.type === 'dupla' ? 'Dupla' : 'Individual'}
                                  </p>
                                  <p className="text-sm text-gray-600 mb-4">
                                    <strong>Gênero:</strong> {selectedTournament.gender}
                                  </p>
                                </div>
                                
                                {selectedTournament.type === 'dupla' && (
                                  <div>
                                    <Label htmlFor="partner-id" className="text-sm">ID do Parceiro</Label>
                                    <Input
                                      id="partner-id"
                                      value={partnerUserId}
                                      onChange={(e) => setPartnerUserId(e.target.value.toUpperCase())}
                                      placeholder="Ex: ABC123XY"
                                      className="uppercase text-base"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Peça o ID único do seu parceiro (encontrado no perfil dele)
                                    </p>
                                  </div>
                                )}
                                
                                <Button 
                                  onClick={() => {
                                    if (selectedTournament) {
                                      handleJoinTournament(selectedTournament.id)
                                      setShowJoinTournament(false)
                                    }
                                  }} 
                                  className="w-full bg-gradient-to-r from-orange-500 to-red-600 h-12 text-base"
                                >
                                  Confirmar Inscrição
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {selectedTournament.participants.map((participant, index) => (
                            <div key={participant.id} className="flex items-center justify-between p-4 border rounded-xl bg-white shadow-sm">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base">
                                  {index + 1}
                                </div>
                                <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                                    {participant.userName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 text-sm sm:text-base">{participant.userName}</p>
                                  {participant.partnerName && (
                                    <p className="text-xs sm:text-sm text-gray-500">Dupla com: {participant.partnerName}</p>
                                  )}
                                  {participant.partnerUserId && (
                                    <p className="text-xs text-gray-400 flex items-center">
                                      <Hash className="w-3 h-3 mr-1" />
                                      Parceiro ID: {participant.partnerUserId}
                                    </p>
                                  )}
                                  {(participant.wins !== undefined || participant.losses !== undefined) && (
                                    <p className="text-xs text-green-600 font-medium">
                                      {participant.wins || 0}V - {participant.losses || 0}D - Sets: {participant.setsWon || 0}/{participant.setsLost || 0}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {participant.eliminated && (
                                      <Badge variant="destructive" className="text-xs">
                                        Eliminado
                                      </Badge>
                                    )}
                                    {participant.groupPosition && (
                                      <Badge variant="outline" className="text-xs">
                                        {participant.groupPosition}º lugar no grupo
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {participant.groupId && (
                                <Badge variant="outline" className="border-orange-500 text-orange-600 text-xs sm:text-sm">
                                  Grupo {participant.groupId}
                                </Badge>
                              )}
                            </div>
                          ))}
                          {selectedTournament.participants.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                              <p className="text-base sm:text-lg font-semibold">Nenhum participante inscrito ainda</p>
                              <p className="text-sm">Seja o primeiro a se inscrever!</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="groups" className="space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                          <h3 className="text-lg sm:text-xl font-bold">Fase de Grupos ITF</h3>
                          {selectedTournament.status === 'criado' && selectedTournament.participants.length >= 3 && (
                            <Button
                              size="sm"
                              onClick={() => generateGroups(selectedTournament.id)}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-xs sm:text-sm"
                            >
                              <Shuffle className="w-4 h-4 mr-2" />
                              Gerar Grupos ITF
                            </Button>
                          )}
                        </div>
                        {selectedTournament.groups.map((group) => (
                          <Card key={group.id} className="shadow-lg">
                            <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                              <CardTitle className="text-base sm:text-lg">{group.name} - Algoritmo ITF</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 sm:p-6">
                              <div className="space-y-4">
                                {/* Tabela de classificação ITF - só exibe se houver jogos finalizados */}
                                {selectedTournament.matches.filter(m => m.groupId === group.id && m.status === 'finalizada').length > 0 ? (
                                  <div className="space-y-3">
                                    <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Classificação ITF</h4>
                                    {group.standings.map((standing, index) => (
                                      <div key={standing.participantId} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 border rounded-lg bg-gray-50 space-y-2 sm:space-y-0">
                                        <div className="flex items-center space-x-3">
                                          <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm ${
                                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-red-500'
                                          }`}>
                                            {index + 1}
                                          </div>
                                          <span className="font-semibold text-sm sm:text-base">{standing.participantName}</span>
                                          <div className="flex flex-wrap gap-1">
                                            {index >= 2 && (
                                              <Badge variant="destructive" className="text-xs">
                                                Eliminado
                                              </Badge>
                                            )}
                                            {index < 2 && (
                                              <Badge variant="default" className="text-xs bg-green-500">
                                                Classificado
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex flex-wrap gap-2 sm:gap-6 text-xs sm:text-sm font-medium">
                                          <span className="text-green-600">V: {standing.matchesWon}</span>
                                          <span className="text-red-600">D: {standing.matchesLost}</span>
                                          <span className="text-blue-600">Sets: {(standing.setsPercentage * 100).toFixed(1)}%</span>
                                          <span className="text-purple-600">Games: {(standing.gamesPercentage * 100).toFixed(1)}%</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-gray-500">
                                    <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-sm font-medium">Classificação pendente</p>
                                    <p className="text-xs">Aguardando resultados dos jogos</p>
                                  </div>
                                )}

                                {/* Jogos do grupo */}
                                <div className="space-y-3">
                                  <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Jogos Round-Robin</h4>
                                  {selectedTournament.matches
                                    .filter(match => match.groupId === group.id)
                                    .map((match) => (
                                      <div key={match.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-white space-y-4 sm:space-y-0">
                                        <div className="flex-1 w-full">
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                                            <div className="text-center sm:text-right">
                                              <p className="font-semibold text-sm sm:text-base">{match.player1Name}</p>
                                            </div>
                                            <div className="text-center">
                                              <div className="flex items-center justify-center space-x-2 sm:space-x-4">
                                                <div className="flex items-center space-x-2">
                                                  <Input
                                                    type="text"
                                                    placeholder="6-4 6-2"
                                                    value={match.score || ''}
                                                    onChange={(e) => {
                                                      const newScore = e.target.value
                                                      const updatedMatches = selectedTournament.matches.map(m => 
                                                        m.id === match.id ? { ...m, score: newScore } : m
                                                      )
                                                      const updatedTournament = { ...selectedTournament, matches: updatedMatches }
                                                      setTournaments(tournaments.map(t => t.id === selectedTournament.id ? updatedTournament : t))
                                                      setSelectedTournament(updatedTournament)
                                                    }}
                                                    className="w-24 sm:w-32 text-center text-xs sm:text-sm"
                                                    disabled={match.status === 'finalizada'}
                                                  />
                                                </div>
                                              </div>
                                              <p className="text-xs text-gray-500 mt-1">
                                                Formato ITF: "6-4 6-2" ou "6-4 4-6 [10-8]"
                                              </p>
                                            </div>
                                            <div className="text-center sm:text-left">
                                              <p className="font-semibold text-sm sm:text-base">{match.player2Name}</p>
                                            </div>
                                          </div>
                                        </div>
                                        <div className="flex flex-col items-center sm:items-end space-y-2 w-full sm:w-auto sm:ml-6">
                                          <Badge variant={match.status === 'finalizada' ? 'default' : 'outline'} className={`text-xs ${
                                            match.status === 'finalizada' ? 'bg-green-500' : 'border-orange-500 text-orange-600'
                                          }`}>
                                            {match.status === 'finalizada' ? 'Finalizada' : 'Pendente'}
                                          </Badge>
                                          {(currentUser.isAdmin || currentUser.canCreateTournaments) && (
                                            <div className="flex space-x-2">
                                              <Button
                                                size="sm"
                                                onClick={() => {
                                                  if (match.score && match.score.trim() !== '') {
                                                    saveMatchResult(match, match.score)
                                                  } else {
                                                    toast.error('Digite o placar antes de salvar')
                                                  }
                                                }}
                                                className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-xs"
                                                disabled={match.status === 'finalizada'}
                                              >
                                                <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                Salvar
                                              </Button>
                                              {match.status === 'finalizada' && (
                                                <Button
                                                  size="sm"
                                                  variant="outline"
                                                  onClick={() => {
                                                    const updatedMatches = selectedTournament.matches.map(m => 
                                                      m.id === match.id ? { ...m, status: 'pendente' as const, score: undefined } : m
                                                    )
                                                    const updatedTournament = { ...selectedTournament, matches: updatedMatches }
                                                    setTournaments(tournaments.map(t => t.id === selectedTournament.id ? updatedTournament : t))
                                                    setSelectedTournament(updatedTournament)
                                                    toast.success('Resultado removido')
                                                  }}
                                                  className="text-xs"
                                                >
                                                  <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                                  Corrigir
                                                </Button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                        {selectedTournament.groups.length === 0 && (
                          <div className="text-center py-12 text-gray-500">
                            <Target className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-base sm:text-lg font-semibold">Grupos ITF ainda não foram criados</p>
                            <p className="text-sm">
                              Mínimo de 3 {selectedTournament.type === 'dupla' ? 'duplas' : 'participantes'} necessário para gerar grupos
                            </p>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="matches" className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold">Jogos do Torneio ITF</h3>
                        <div className="space-y-4">
                          {selectedTournament.matches.map((match) => (
                            <Card key={match.id} className="shadow-lg">
                              <CardContent className="p-4 sm:p-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                                  <div className="flex-1 w-full">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                                      <div className="text-center sm:text-right">
                                        <p className="font-bold text-base sm:text-lg">{match.player1Name}</p>
                                      </div>
                                      <div className="text-center">
                                        <div className="flex items-center justify-center space-x-4">
                                          <span className="text-xl sm:text-2xl font-bold text-gray-600">
                                            {match.score || 'vs'}
                                          </span>
                                        </div>
                                        {match.scheduledDate && (
                                          <p className="text-xs text-gray-500 mt-2">
                                            {match.scheduledDate.toLocaleDateString()} às {match.scheduledDate.toLocaleTimeString()}
                                          </p>
                                        )}
                                        {match.court && (
                                          <p className="text-xs text-gray-500">{match.court}</p>
                                        )}
                                        {match.round && (
                                          <Badge variant="outline" className="mt-2 text-xs">
                                            {match.round}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="text-center sm:text-left">
                                        <p className="font-bold text-base sm:text-lg">{match.player2Name}</p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-center sm:items-end space-y-2 w-full sm:w-auto sm:ml-6">
                                    <Badge variant={match.status === 'finalizada' ? 'default' : 'outline'} className={`text-xs ${
                                      match.status === 'finalizada' ? 'bg-green-500' : 'border-orange-500 text-orange-600'
                                    }`}>
                                      {match.status === 'finalizada' ? 'Finalizada' : 'Pendente'}
                                    </Badge>
                                    {match.groupId && (
                                      <Badge variant="secondary" className="text-xs">
                                        Grupo {match.groupId}
                                      </Badge>
                                    )}
                                    {match.status === 'pendente' && (currentUser.isAdmin || currentUser.canCreateTournaments) && (
                                      <Dialog open={showMatchResult} onOpenChange={setShowMatchResult}>
                                        <DialogTrigger asChild>
                                          <Button
                                            size="sm"
                                            onClick={() => setSelectedMatch(match)}
                                            className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-xs"
                                          >
                                            <Edit3 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                                            Registrar ITF
                                          </Button>
                                        </DialogTrigger>
                                        <DialogContent className="w-[95vw] max-w-md mx-auto">
                                          <DialogHeader>
                                            <DialogTitle className="text-lg sm:text-xl">Registrar Resultado ITF</DialogTitle>
                                            <DialogDescription className="text-sm sm:text-base">
                                              Digite o placar seguindo regras ITF ({getSetFormatDisplay(selectedTournament.setFormat || 'melhor_3_sets')})
                                            </DialogDescription>
                                          </DialogHeader>
                                          <div className="space-y-4">
                                            <div>
                                              <Label className="text-sm">Placar ITF</Label>
                                              <Input
                                                type="text"
                                                value={matchResult.score}
                                                onChange={(e) => setMatchResult({score: e.target.value})}
                                                placeholder="Ex: 6-4 6-2 ou 6-4 4-6 [10-8]"
                                                className="text-base"
                                              />
                                              <p className="text-xs text-gray-500 mt-1">
                                                Formatos válidos: "6-4 6-2", "6-4 4-6 [10-8]", "7-6 6-4"
                                              </p>
                                            </div>
                                            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                              <p className="font-semibold mb-2">Regras ITF:</p>
                                              <ul className="text-xs space-y-1">
                                                <li>• Sets: primeiro a 6 games com vantagem de 2</li>
                                                <li>• Tie-break: 7-6 quando empate 6-6</li>
                                                <li>• Match tie-break: [10-8] quando empate 1-1 em sets</li>
                                                <li>• No-Ad: ponto decisivo no deuce</li>
                                              </ul>
                                            </div>
                                            <Button onClick={handleMatchResult} className="w-full bg-gradient-to-r from-orange-500 to-red-600 h-12 text-base">
                                              Salvar Resultado ITF
                                            </Button>
                                          </div>
                                        </DialogContent>
                                      </Dialog>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {selectedTournament.matches.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                              <Calendar className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                              <p className="text-base sm:text-lg font-semibold">Nenhum jogo agendado ainda</p>
                              <p className="text-sm">Os jogos serão criados quando os grupos ITF forem gerados</p>
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {selectedTournament.phase === 'eliminatorias' && (
                        <TabsContent value="eliminatorias" className="space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
                            <h3 className="text-lg sm:text-xl font-bold flex items-center">
                              <Swords className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-red-600" />
                              Fases Eliminatórias ITF
                            </h3>
                          </div>
                          
                          <div className="space-y-6">
                            {/* Renderizar todas as fases eliminatórias */}
                            {['32avos', '16avos', 'oitavas', 'quartas', 'semifinal', 'final'].map(round => {
                              const roundMatches = selectedTournament.matches.filter(m => m.round === round)
                              if (roundMatches.length === 0) return null

                              const roundNames: { [key: string]: string } = {
                                '32avos': '32avos de Final',
                                '16avos': '16avos de Final',
                                'oitavas': 'Oitavas de Final',
                                'quartas': 'Quartas de Final',
                                'semifinal': 'Semifinal',
                                'final': 'GRANDE FINAL'
                              }

                              const roundColors: { [key: string]: string } = {
                                '32avos': 'from-gray-500 to-gray-600',
                                '16avos': 'from-indigo-500 to-purple-600',
                                'oitavas': 'from-red-500 to-pink-600',
                                'quartas': 'from-purple-500 to-indigo-600',
                                'semifinal': 'from-amber-500 to-orange-600',
                                'final': 'from-yellow-500 to-amber-600'
                              }

                              return (
                                <Card key={round} className={`shadow-lg ${round === 'final' ? 'border-2 border-yellow-400' : ''}`}>
                                  <CardHeader className={`bg-gradient-to-r ${roundColors[round]} text-white`}>
                                    <CardTitle className={`${round === 'final' ? 'text-lg sm:text-xl flex items-center justify-center' : 'text-base sm:text-lg'}`}>
                                      {round === 'final' && <Crown className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />}
                                      {roundNames[round]}
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className={round === 'final' ? 'p-4 sm:p-8' : 'p-4 sm:p-6'}>
                                    <div className={`grid grid-cols-1 ${round === 'final' ? '' : 'lg:grid-cols-2'} gap-4`}>
                                      {roundMatches.map((match) => (
                                        <div key={match.id} className={`p-4 border rounded-lg bg-white shadow-sm ${round === 'final' ? 'text-center' : ''}`}>
                                          <div className={round === 'final' ? 'text-center' : 'text-center'}>
                                            <div className={`flex items-center justify-center space-x-4 mb-2 ${round === 'final' ? 'space-x-8' : ''}`}>
                                              {round === 'final' ? (
                                                <>
                                                  <div className="text-center">
                                                    <p className="font-bold text-base sm:text-lg mb-2">{match.player1Name}</p>
                                                  </div>
                                                  <div className="text-center">
                                                    <span className="text-2xl sm:text-4xl font-bold text-gray-400">×</span>
                                                  </div>
                                                  <div className="text-center">
                                                    <p className="font-bold text-base sm:text-lg mb-2">{match.player2Name}</p>
                                                  </div>
                                                </>
                                              ) : (
                                                <>
                                                  <span className="font-semibold text-xs sm:text-sm">{match.player1Name}</span>
                                                  <span className="text-gray-400">×</span>
                                                  <span className="font-semibold text-xs sm:text-sm">{match.player2Name}</span>
                                                </>
                                              )}
                                            </div>
                                            <div className="mb-2">
                                              <Input
                                                type="text"
                                                placeholder="6-4 6-2 ou 6-4 4-6 [10-8]"
                                                value={match.score || ''}
                                                onChange={(e) => {
                                                  const newScore = e.target.value
                                                  const updatedMatches = selectedTournament.matches.map(m => 
                                                    m.id === match.id ? { ...m, score: newScore } : m
                                                  )
                                                  const updatedTournament = { ...selectedTournament, matches: updatedMatches }
                                                  setTournaments(tournaments.map(t => t.id === selectedTournament.id ? updatedTournament : t))
                                                  setSelectedTournament(updatedTournament)
                                                }}
                                                className={`text-center ${round === 'final' ? 'text-base sm:text-lg' : 'text-xs sm:text-sm'}`}
                                                disabled={match.status === 'finalizada'}
                                              />
                                            </div>
                                            <div className="flex justify-center space-x-2 mt-2">
                                              <Badge 
                                                variant={match.status === 'finalizada' ? 'default' : 'outline'} 
                                                className={`${round === 'final' ? 'text-sm sm:text-lg px-4 sm:px-6 py-1 sm:py-2' : 'text-xs'} ${
                                                  match.status === 'finalizada' ? 'bg-green-500' : 'border-orange-500 text-orange-600'
                                                }`}
                                              >
                                                {match.status === 'finalizada' ? (round === 'final' ? 'FINALIZADA' : 'Finalizada') : (round === 'final' ? 'AGUARDANDO' : 'Pendente')}
                                              </Badge>
                                              {(currentUser.isAdmin || currentUser.canCreateTournaments) && (
                                                <div className="flex space-x-1">
                                                  <Button
                                                    size="sm"
                                                    onClick={() => {
                                                      if (match.score && match.score.trim() !== '') {
                                                        saveEliminationMatchResult(match, match.score)
                                                      } else {
                                                        toast.error('Digite o placar antes de salvar')
                                                      }
                                                    }}
                                                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-xs px-2 py-1"
                                                    disabled={match.status === 'finalizada'}
                                                  >
                                                    Salvar
                                                  </Button>
                                                  {match.status === 'finalizada' && (
                                                    <Button
                                                      size="sm"
                                                      variant="outline"
                                                      onClick={() => {
                                                        const updatedMatches = selectedTournament.matches.map(m => 
                                                          m.id === match.id ? { ...m, status: 'pendente' as const, score: undefined } : m
                                                        )
                                                        const updatedTournament = { ...selectedTournament, matches: updatedMatches }
                                                        setTournaments(tournaments.map(t => t.id === selectedTournament.id ? updatedTournament : t))
                                                        setSelectedTournament(updatedTournament)
                                                        toast.success('Resultado removido')
                                                      }}
                                                      className="text-xs px-2 py-1"
                                                    >
                                                      Corrigir
                                                    </Button>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                            {round === 'final' && match.status === 'finalizada' && (
                                              <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-amber-100 rounded-lg border border-yellow-300">
                                                <div className="flex items-center justify-center">
                                                  <Crown className="w-6 h-6 sm:w-8 sm:h-8 mr-3 text-yellow-600" />
                                                  <p className="text-lg sm:text-xl font-bold text-yellow-700">
                                                    CAMPEÃO ITF: {(() => {
                                                      const stats = calcularEstatisticas(match.score!)
                                                      return stats?.winner === 1 ? match.player1Name : match.player2Name
                                                    })()}
                                                  </p>
                                                </div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>
                              )
                            })}
                          </div>

                          {selectedTournament.matches.filter(m => m.phase === 'eliminatorias').length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                              <Swords className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                              <p className="text-base sm:text-lg font-semibold">Fase eliminatória ITF ainda não iniciada</p>
                              <p className="text-sm">Complete todos os jogos da fase de grupos para gerar o chaveamento ITF</p>
                            </div>
                          )}
                        </TabsContent>
                      )}

                      <TabsContent value="results" className="space-y-4">
                        <h3 className="text-lg sm:text-xl font-bold">Resultados e Classificação ITF</h3>
                        <Card className="shadow-lg">
                          <CardContent className="p-4 sm:p-8">
                            <div className="text-center py-12 text-gray-500">
                              <Crown className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                              <p className="text-base sm:text-lg font-semibold">Resultados ITF serão exibidos após os jogos</p>
                              <p className="text-sm">Acompanhe o progresso do torneio seguindo regras ITF 2025</p>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && currentUser.isAdmin && (
          <div className="space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Painel Administrativo ITF</h2>
            
            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
                <CardTitle className="text-lg sm:text-xl">Gerenciar Usuários</CardTitle>
                <CardDescription className="text-orange-100 text-sm sm:text-base">
                  Controle as permissões dos usuários para criar torneios ITF
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {users.filter(u => !u.isAdmin).map((user) => (
                    <div key={user.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-white shadow-sm space-y-3 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                            {user.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm sm:text-base">{user.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500">{user.email}</p>
                          <p className="text-xs text-gray-400 flex items-center">
                            <Hash className="w-3 h-3 mr-1" />
                            ID: {user.userId}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <Badge variant={user.canCreateTournaments ? 'default' : 'secondary'} className={`text-xs ${
                          user.canCreateTournaments ? 'bg-green-500' : 'bg-gray-400'
                        }`}>
                          {user.canCreateTournaments ? 'Pode criar torneios ITF' : 'Sem permissão'}
                        </Badge>
                        <Button
                          size="sm"
                          variant={user.canCreateTournaments ? 'destructive' : 'default'}
                          onClick={() => toggleUserPermission(user.id)}
                          className={`text-xs ${!user.canCreateTournaments ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700' : ''}`}
                        >
                          <UserCheck className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          {user.canCreateTournaments ? 'Remover' : 'Autorizar'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <CardTitle className="text-lg sm:text-xl">Gerenciar Torneios ITF</CardTitle>
                <CardDescription className="text-blue-100 text-sm sm:text-base">
                  Visualize e gerencie todos os torneios ITF da plataforma
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {tournaments.map((tournament) => (
                    <div key={tournament.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-xl bg-white shadow-sm space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <h3 className="font-bold text-base sm:text-lg text-gray-900">{tournament.name}</h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          Criado por: {users.find(u => u.id === tournament.createdBy)?.name || 'Usuário não encontrado'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mt-1">
                          <span>{tournament.participants.length} {tournament.type === 'dupla' ? 'duplas' : 'participantes'}</span>
                          <span className="capitalize">{tournament.category}</span>
                          <span className="capitalize">{tournament.gender}</span>
                          <span>{tournament.location || 'Local não definido'}</span>
                          <span>{getSetFormatDisplay(tournament.setFormat || 'melhor_3_sets')}</span>
                          <Badge variant="outline" className="text-xs">ITF 2025</Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 w-full sm:w-auto">
                        <Badge
                          variant={
                            tournament.status === 'andamento' ? 'default' :
                            tournament.status === 'finalizado' ? 'secondary' : 'outline'
                          }
                          className={`text-xs ${
                            tournament.status === 'andamento' ? 'bg-green-500' :
                            tournament.status === 'finalizado' ? 'bg-purple-500' : 'border-orange-500 text-orange-600'
                          }`}
                        >
                          {tournament.status === 'criado' ? 'Aberto' :
                           tournament.status === 'andamento' ? 'Em andamento' : 'Finalizado'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteTournament(tournament.id)}
                          className="text-xs"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                  {tournaments.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Trophy className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-base sm:text-lg font-semibold">Nenhum torneio ITF encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}