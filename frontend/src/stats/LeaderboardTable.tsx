import { Avatar, Box, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, } from '@mui/material';

// Uma linha do leaderboard, tal como o backend a devolve
// (/static/leaderboard/friends e /static/leaderboard/global).
export interface LeaderboardRow {
    rank: number;
    user_id: string;
    nick_name: string;
    level: number;
    total_wins: number;
    win_rate: number;
}

interface LeaderboardTableProps {
    // texto simples ou um nó (as tabs do ecrã das estatísticas)
    title: React.ReactNode;
    rows: LeaderboardRow[];
    currentUserId: string;
    currentUserAvatar: string;
    tag?: string;
}

// A tabela de classificação, uma só para amigos e global (antes eram
// duas cópias iguais de 100 linhas cada). Medalhas no pódio, e a linha
// do próprio jogador acesa a amarelo com o avatar e a etiqueta You.
export default function LeaderboardTable({
    title,
    rows,
    currentUserId,
    currentUserAvatar,
    tag,
}: LeaderboardTableProps) {
    return (
        <Paper sx={{ p: 3, height: '100%', }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                {typeof title === 'string' ? <Typography variant="h6">{title}</Typography> : title}{tag && <Chip label={tag} variant="outlined" size="small" />}
            </Box>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Rank</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Player</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Level</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Wins</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }} align="right">Win Rate</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows.map((row) => {
                            const isMe = row.user_id === currentUserId;
                            return (
                                <TableRow key={row.rank} sx={{ position: 'relative', backgroundColor: isMe ? 'rgba(255, 193, 7, 0.10)' : 'transparent', boxShadow: isMe ? 'inset 4px 0 0 #ffc107, 0 0 12px rgba(255, 193, 7, 0.12)' : 'none', transition: 'all 0.2s ease', '&:hover': { backgroundColor: isMe ? 'rgba(255, 193, 7, 0.16)' : 'action.hover', }, }}>
                                    <TableCell component="th" scope="row">
                                        {row.rank === 1 && <Chip label="#1" color="secondary" size="small" sx={{ fontWeight: 'bold', color: '#000' }} />}
                                        {row.rank === 2 && <Chip label="#2" size="small" sx={{ fontWeight: 'bold', bgcolor: '#e0e0e0', color: '#000' }} />}
                                        {row.rank === 3 && <Chip label="#3" size="small" sx={{ fontWeight: 'bold', bgcolor: '#cd7f32', color: '#fff' }} />}
                                        {row.rank > 3 && `#${row.rank}`}
                                    </TableCell>
                                    <TableCell>
                                        {isMe ? (
                                            <Box component="span" sx={{ ml: 1 }} className="flex items-center no-wrap gap-1">
                                                <Avatar src={currentUserAvatar} sx={{ width: 24, height: 24 }} />
                                                <Chip label="You" size="small" sx={{ px: 0.8, py: 0.2, borderRadius: 1, fontSize: '0.65rem', fontWeight: 700, letterSpacing: 0.5, backgroundColor: 'warning.main', color: 'warning.contrastText', }} />
                                            </Box>
                                        ) : (row.nick_name)}
                                    </TableCell>
                                    <TableCell>Lvl {row.level}</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>{row.total_wins}</TableCell>
                                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold' }}>{row.win_rate}%</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
