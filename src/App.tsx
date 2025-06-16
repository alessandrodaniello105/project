import { useEffect, useState } from 'react';
// import { lazy } from 'react';
// import { PlusCircle, Trash2, Music2, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';
import { LoginPage } from './components/auth/LoginPage';
import { Musicians } from './components/pages/Musicians';
import { Bands } from './components/pages/Bands';
import { RandomBands } from './components/pages/RandomBands';
import { AnimatePresence, motion } from 'framer-motion';
// import { BandForm } from './components/bands/BandForm';

// import { MusicianForm } from './components/musicians/MusicianForm';


// const INSTRUMENTS = ['Guitar', 'Keys', 'Voice', 'Bass', 'Other'] as const;

function App() {
  // const [musicians, setMusicians] = useState<Musician[]>([]);
  // const [name, setName] = useState('');
  // const [instrument, setInstrument] = useState<Musician['instrument']>('Guitar');
  const [session, setSession] = useState<Session | null>(null);
  const [currentPage, setCurrentPage] = useState<'musicians' | 'bands' | 'random'>('musicians');

  // const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(INSTRUMENTS));

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // useEffect(() => {
  //   if (session) {
  //     fetchMusicians();
  //   }
  // }, [session]);

  // async function fetchMusicians() {
  //   const { data, error } = await supabase
  //     .from('musicians')
  //     .select('*')
  //     .order('name', { ascending: true });

  //   if (error) {
  //     console.error('Error fetching musicians:', error);
  //   } else {
  //     setMusicians(data || []);
  //   }
  // }

  // async function handleSubmit(e: React.FormEvent) {
  //   e.preventDefault();
  //   if (!session) return;

  //   // Optimistic Update: Add the new musician to the state immediately
  //   const newMusician: Musician = {
  //     id: Math.random().toString(36).substring(7), // Temporary ID (will be replaced)
  //     name,
  //     instrument,
  //     user_id: session.user.id,
  //     created_at: new Date().toISOString(), // Add this line for the type to be ok
  //   };
  //   setMusicians(prevMusicians => [...prevMusicians, newMusician]);

  //   // Clear input fields immediately
  //   setName('');
  //   setInstrument('Guitar');

  //   // Async call to insert in the database
  //   const { data, error } = await supabase.from('musicians').insert({
  //     name,
  //     instrument,
  //     user_id: session.user.id,
  //   }).select(); // we need to select in order to get the id

  //   if (error) {
  //     console.error('Error creating musician:', error);
  //     // Rollback: If there's an error, remove the optimistic update
  //     setMusicians(prevMusicians => prevMusicians.filter(m => m.id !== newMusician.id));
  //   } else {
  //     // update the id of the element we added optimistically
  //     setMusicians(prevMusicians => prevMusicians.map(m => {
  //         if (m.id === newMusician.id) {
  //             return {...m, id: data[0].id};
  //         }
  //         return m;
  //     }))
  //   }
    
  // }

  // async function handleDelete(id: string) {
        
  //     // remove optimistically
  //     setMusicians(prevMusicians => prevMusicians.filter(m => m.id !== id));

  //     const { error } = await supabase.from('musicians').delete().eq('id', id);

  //     if (error) {
  //         console.error('Error deleting musician:', error);
  //         // Rollback: If there's an error, refetch the data.
  //         fetchMusicians();
  //     }
  // }

  // const toggleSection = (instrument: string) => {
  //   setExpandedSections(prev => {
  //     const next = new Set(prev);
  //     if (next.has(instrument)) {
  //       next.delete(instrument);
  //     } else {
  //       next.add(instrument);
  //     }
  //     return next;
  //   });
  // };

  // const groupedMusicians = INSTRUMENTS.reduce((acc, inst) => {
  //   acc[inst] = musicians.filter(m => m.instrument === inst);
  //   return acc;
  // }, {} as Record<Musician['instrument'], Musician[]>);


  // se non c'è sessione, mostra il login
  if (!session) {
    return <LoginPage />
  }

  return (
    <>
      <nav className="bg-gray-800 p-4">
        <ul className="flex gap-4">
          <li>
            <button
              onClick={() => setCurrentPage('musicians')}
              className={`text-white hover:text-gray-300 ${currentPage === 'musicians' ? 'font-bold' : ''}`}
            >
              Musicians
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage('bands')}
              className={`text-white hover:text-gray-300 ${currentPage === 'bands' ? 'font-bold' : ''}`}
            >
              Bands
            </button>
          </li>
          <li>
            <button
              onClick={() => setCurrentPage('random')}
              className={`text-white hover:text-gray-300 ${currentPage === 'random' ? 'font-bold' : ''}`}
            >
              Random Bands
            </button>
          </li>
        </ul>
      </nav>
      <AnimatePresence mode="wait">
        {currentPage === 'musicians' && (
          <motion.div
            key="musicians"
            initial={{ opacity: 0}}
            animate={{ opacity: 1}}
            exit={{ opacity: 0}}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Musicians session={session} />
          </motion.div>
        )}

      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentPage === 'bands' && (
          <motion.div
            key="bands"
            initial={{ opacity: 0}}
            animate={{ opacity: 1}}
            exit={{ opacity: 0}}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <Bands session={session} />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentPage === 'random' && (
          <motion.div
            key="random"
            initial={{ opacity: 0}}
            animate={{ opacity: 1}}
            exit={{ opacity: 0}}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          >
            <RandomBands session={session} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // return <Musicians session={session} />

  // return (
  //   <div className="min-h-screen bg-gray-100 py-8 px-4">
  //     <div className="max-w-5xl mx-auto">

  //       {/* header */}
  //       <div className="bg-white rounded-lg shadow-md p-6 mb-8">

  //         {/* titolo */}
  //         <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
  //           <Music2 className="w-6 h-6 text-indigo-600" />
  //           Musician Manager
  //         </h1>

  //         {/* form per aggiungere un musicista */}
  //         {/* <MusicianForm /> */}
  //       </div>

  //       {/* sezione per mostrare i musicisti per strumento */}
  //       <div className="bg-white rounded-lg shadow-md p-6">

  //         <h2 className="text-xl font-semibold mb-4">Musicians by Instrument</h2>

  //         <div className="space-y-4 md:flex md:flex-wrap md:gap-4 justify-around ">

  //           {/* strumenti ciclati */}
  //           {INSTRUMENTS.map((inst) => (
              
  //             /* strumento */ 
  //             <div key={inst} className="border rounded-lg overflow-hidden md:w-72">
                
  //               {/* bottone per mostrare/nascondere i musicisti */}
  //               <button
  //                 onClick={() => toggleSection(inst)}
  //                 className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
  //               >
  //                 <div className="flex items-center gap-2">
  //                   <h3 className="text-lg font-medium">{inst}</h3>
  //                   <span className="text-sm text-gray-500">
  //                     ({groupedMusicians[inst].length})
  //                   </span>
  //                 </div>
  //                 {expandedSections.has(inst) ? (
  //                   <ChevronUp className="w-5 h-5 text-gray-500" />
  //                 ) : (
  //                   <ChevronDown className="w-5 h-5 text-gray-500" />
  //                 )}
  //               </button>
                
  //               {/* se è espanso, mostra i musicisti */}
  //               {expandedSections.has(inst) && (
  //                 /* lista dei musicisti */
  //                 <div className="divide-y divide-gray-200">
  //                   {groupedMusicians[inst].map((musician) => (
  //                     <div
  //                       key={musician.id}
  //                       className="p-4 flex items-center justify-between bg-white"
  //                     >
  //                       <h4 className="text-lg">{musician.name}</h4>
  //                       <button
  //                         onClick={() => handleDelete(musician.id)}
  //                         className="text-red-600 hover:text-red-800 transition"
  //                       >
  //                         <Trash2 className="w-5 h-5" />
  //                       </button>
  //                     </div>
  //                   ))}
  //                   {groupedMusicians[inst].length === 0 && (
  //                     <p className="text-gray-500 text-center py-4">
  //                       No {inst.toLowerCase()} players added yet.
  //                     </p>
  //                   )}
  //                 </div>
  //               )}
  //             </div>
  //           ))}
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
}

export default App;