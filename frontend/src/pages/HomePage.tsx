import { Link } from "react-router-dom";
import { Box, Button, Container, Typography } from '@mui/material'
import { small_text, big_text } from '../game/macrosConfig.ts'

 function HomePage() 
 {
    return (
        <Container maxWidth={false} sx={{ maxWidth: '75vw', py: '5%' }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'center' }}>
                <Box sx={{ width: '45%' }}>
					<Typography sx={{ color: 'white', mt: '15%', ...big_text, whiteSpace: 'nowrap' }}>
						EXPERIENCE UNO
					</Typography>
					<Typography sx={{ color: 'white', ...big_text }}>
						LIVE<span style={{ color: '#fb2c36' }}>.</span>
					</Typography>
					<Typography sx={{ color: '#d1d5dc', mt: '10%', ...small_text, whiteSpace: 'nowrap', filter: 'drop-shadow(1px 1px 1px black)' }}>
						Challenge your friends online.
					</Typography>
                    <Box sx={{ display: 'flex', mt: "20%" }}>
						<Button draggable={false} component={Link} to="/play" className="play-button"
							sx={{ textTransform: 'none', color: 'black', py: '5%',px: '10%', borderRadius: '10000px', fontWeight: 'bold',
							fontSize: 'clamp(0.5rem, 2vh, 1.5rem)', whiteSpace: 'nowrap' }}>
							Play Now
						</Button>
                    </Box>
                </Box>
            </Box>
        </Container>
    );
}

export default HomePage

// export default function HomePage() {
//     return (
//         <section className="max-w-7xl mx-auto px-8 py-16 ">
//             <div className="grid md:grid-cols-2 items-center ">
//                 <div>
//                     <h1 className="text-5xl font-black tracking-tight text-white leading-tight">
//                         EXPERIENCE UNO LIVE<span style={{ color: '#fb2c36' }}>.</span>
//                     </h1>

//                     <p className="text-gray-300 mt-6 text-xl">
//                         Challenge your friends online.
//                     </p>

//                     {/* um link com cara de botao: um button dentro de
//                         um link e HTML invalido e o browser queixa-se */}
//                     <div className="flex mt-10">
//                         <Link to="/play" className="px-12 py-4 rounded-full text-lg font-bold text-slate-900 no-underline bg-gradient-to-r from-cyan-200 via-sky-200 to-pink-200 shadow-[0_0_25px_rgba(56,189,248,0.6)] hover:shadow-[0_0_35px_rgba(244,114,182,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 ease-out">
//                             Play Now
//                         </Link>
//                     </div>
//                 </div>
//             </div>
//         </section>
//     );
// }
