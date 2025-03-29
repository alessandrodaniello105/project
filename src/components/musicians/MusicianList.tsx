import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { Musician } from '../../lib/supabase';

const INSTRUMENTS = ['Guitar', 'Keys', 'Voice', 'Bass', 'Other'] as const;

type Props = {
  musicians: Musician[];
  onDelete: (id: string) => void;
  onError: () => void;
};

export function MusicianList({ musicians, onDelete }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(INSTRUMENTS));

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

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Musicians by Instrument</h2>

      <div className="space-y-4 md:flex md:flex-wrap md:gap-4 justify-around">
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
              {expandedSections.has(inst) ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedSections.has(inst) && (
              <div className="divide-y divide-gray-200">
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
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}