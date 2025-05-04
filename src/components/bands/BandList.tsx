import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { BandWithMusicians } from '../../lib/supabase';

type Props = {
  bands: BandWithMusicians[];
  onDelete: (id: string) => void;
  onError: () => void;
};

export function BandList({ bands, onDelete }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (bandId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(bandId)) {
        next.delete(bandId);
      } else {
        next.add(bandId);
      }
      return next;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Bands</h2>

      <div className="space-y-4">
        {bands.map((band) => (
          <div key={band.id} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(band.id)}
              className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium">{band.name}</h3>
                <span className="text-sm text-gray-500">
                  ({band.members.length} members)
                </span>
              </div>
              {expandedSections.has(band.id) ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {expandedSections.has(band.id) && (
              <div className="divide-y divide-gray-200">
                {band.members.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 flex items-center justify-between bg-white"
                  >
                    <h4 className="text-lg">{member.name}</h4>
                  </div>
                ))}
                <div className="p-4 flex items-center justify-end bg-white">
                  <button
                    onClick={() => onDelete(band.id)}
                    className="text-red-600 hover:text-red-800 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                {band.members.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    No members added yet.
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
