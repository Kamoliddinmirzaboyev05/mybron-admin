import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Save, Clock, MapPin, DollarSign } from 'lucide-react';

interface Pitch {
  id: string;
  name: string;
  price: number;
  address: string;
  working_hours_start: string;
  working_hours_end: string;
}

export default function PitchPage() {
  const [pitches, setPitches] = useState<Pitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState<Pitch | null>(null);

  useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
    try {
      const { data, error } = await supabase
        .from('pitches')
        .select('*')
        .order('name');

      if (error) throw error;
      setPitches(data || []);
      if (data && data.length > 0) {
        setSelectedPitch(data[0]);
      }
    } catch (error) {
      console.error('Error fetching pitches:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedPitch) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('pitches')
        .update({
          name: selectedPitch.name,
          price: selectedPitch.price,
          address: selectedPitch.address,
          working_hours_start: selectedPitch.working_hours_start,
          working_hours_end: selectedPitch.working_hours_end,
        })
        .eq('id', selectedPitch.id);

      if (error) throw error;
      
      alert('O\'zgarishlar saqlandi!');
      fetchPitches();
    } catch (error) {
      console.error('Error updating pitch:', error);
      alert('Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-24 bg-zinc-950 min-h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-white mb-1">Maydon sozlamalari</h1>
        <p className="text-zinc-400 text-sm">Maydon ma'lumotlarini tahrirlash</p>
      </div>

      {/* Pitch Selector */}
      <div className="px-4 mb-6">
        <label className="block text-sm font-medium text-zinc-300 mb-2">
          Maydonni tanlash
        </label>
        <select
          value={selectedPitch?.id || ''}
          onChange={(e) => {
            const pitch = pitches.find((p) => p.id === e.target.value);
            if (pitch) setSelectedPitch(pitch);
          }}
          className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          {pitches.map((pitch) => (
            <option key={pitch.id} value={pitch.id}>
              {pitch.name}
            </option>
          ))}
        </select>
      </div>

      {selectedPitch && (
        <div className="px-4 space-y-4">
          {/* Pitch Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Maydon nomi
            </label>
            <input
              type="text"
              value={selectedPitch.name}
              onChange={(e) =>
                setSelectedPitch({ ...selectedPitch, name: e.target.value })
              }
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Maydon A"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Soatlik narx (so'm)
              </div>
            </label>
            <input
              type="number"
              value={selectedPitch.price}
              onChange={(e) =>
                setSelectedPitch({ ...selectedPitch, price: Number(e.target.value) })
              }
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="50000"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Manzil
              </div>
            </label>
            <input
              type="text"
              value={selectedPitch.address}
              onChange={(e) =>
                setSelectedPitch({ ...selectedPitch, address: e.target.value })
              }
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="Toshkent, Yunusobod tumani"
            />
          </div>

          {/* Working Hours */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Ish vaqti
              </div>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Boshlanishi</label>
                <input
                  type="time"
                  value={selectedPitch.working_hours_start}
                  onChange={(e) =>
                    setSelectedPitch({
                      ...selectedPitch,
                      working_hours_start: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Tugashi</label>
                <input
                  type="time"
                  value={selectedPitch.working_hours_end}
                  onChange={(e) =>
                    setSelectedPitch({
                      ...selectedPitch,
                      working_hours_end: e.target.value,
                    })
                  }
                  className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Image Upload Placeholder */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Rasmlar
            </label>
            <div className="border-2 border-dashed border-zinc-700 rounded-lg p-8 text-center">
              <p className="text-zinc-400 text-sm">Rasm yuklash funksiyasi</p>
              <p className="text-zinc-500 text-xs mt-1">(Keyingi versiyada qo'shiladi)</p>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 text-white font-semibold py-4 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saqlanmoqda...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                O'zgarishlarni saqlash
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
