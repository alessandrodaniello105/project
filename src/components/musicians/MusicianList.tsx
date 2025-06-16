import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Musician } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

const INSTRUMENTS = ['Guitar', 'Keys', 'Voice', 'Bass', 'Drums', 'Other'] as const;

type Props = {
  musicians: Musician[];
  onDelete: (id: string) => void;
  onError: () => void;
};

export function MusicianList({ musicians, onDelete }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(INSTRUMENTS));
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.matchMedia('(min-width: 768px)').matches;
      if (isDesktop) {
        setExpandedSections(new Set(INSTRUMENTS));
      } else {
        setExpandedSections(new Set());
      }
    };

    // Set initial state
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSection = (instrument: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(instrument)) {
        next.delete(instrument);
      } else {
        next.add(instrument);
      }
      return next;
    });
  };

  const groupedMusicians = INSTRUMENTS.reduce((acc, inst) => {
    acc[inst] = musicians.filter(m => m.instrument === inst);
    return acc;
  }, {} as Record<Musician['instrument'], Musician[]>);

  const handleDeleteAll = () => {
    musicians.forEach(musician => onDelete(musician.id));
    setShowDeleteAllModal(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Musicians by Instrument</h2>
        <button
          type="button"
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition text-sm font-semibold"
          onClick={() => {
            if (musicians.length === 0) return;
            setShowDeleteAllModal(true);
          }}
          disabled={musicians.length === 0}
        >
          Delete All Musicians
        </button>
      </div>

      <div className="space-y-4 md:flex md:flex-wrap md:gap-4 justify-around align-baseline">
        {INSTRUMENTS.map((inst) => (
          <div key={inst} className="border rounded-lg overflow-hidden md:w-72">
            <button
              onClick={() => toggleSection(inst)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">{inst}</h3>
                <span className="text-sm text-gray-500">
                  ({groupedMusicians[inst].length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title={`Delete all ${inst} musicians`}
                  className="text-red-500 text-center mx-10 hover:text-red-700 p-1 rounded transition"
                  onClick={e => {
                    e.stopPropagation();
                    groupedMusicians[inst].forEach(musician => onDelete(musician.id));
                  }}
                  disabled={groupedMusicians[inst].length === 0}
                >
                  <span><b>X</b></span>
                </button>
                {expandedSections.has(inst) ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </div>
            </button>

            <AnimatePresence initial={false}>
              {expandedSections.has(inst) && (
                <motion.div
                  key={inst}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="divide-y divide-gray-200"
                >
                  {groupedMusicians[inst].map((musician) => (
                    <div
                      key={musician.id}
                      className="p-4 flex items-center justify-between bg-white"
                    >
                      <h4 className="text-lg">{musician.name}</h4>
                      <button
                        onClick={() => onDelete(musician.id)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  {groupedMusicians[inst].length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                      No {inst.toLowerCase()} players added yet.
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Basic Custom Modal for Delete All Confirmation */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-red-700">Confirm Deletion</h3>
            <p className="mb-6">Are you sure you want to delete <b>ALL</b> musicians? This action cannot be undone.</p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
                onClick={() => setShowDeleteAllModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white font-semibold"
                onClick={handleDeleteAll}
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}