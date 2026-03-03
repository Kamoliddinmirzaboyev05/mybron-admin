import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Loader2, 
  Save, 
  Clock, 
  MapPin, 
  DollarSign, 
  Upload, 
  X, 
  Image as ImageIcon, 
  Navigation,
  Droplets,
  Car,
  ShirtIcon,
  Coffee,
  Lightbulb,
  Users,
  CircleDot
} from 'lucide-react';
import Toast from './Toast';

// Predefined amenities list with icons
const AMENITIES = [
  { id: 'dush', name: 'Dush', icon: Droplets },
  { id: 'parkovka', name: 'Parkovka', icon: Car },
  { id: 'kiyim', name: 'Kiyim almashtirish xonasi', icon: ShirtIcon },
  { id: 'kafeteriy', name: 'Kafeteriy', icon: Coffee },
  { id: 'yoritish', name: 'Kechki yoritish', icon: Lightbulb },
  { id: 'tribuna', name: 'Tribuna', icon: Users },
  { id: 'inventar', name: "Inventar (to'p/forma)", icon: CircleDot },
];

interface Pitch {
  id: string;
  owner_id: string;
  name: string;
  price_per_hour: number;
  location: string;
  landmark: string;
  start_time: string;
  end_time: string;
  latitude: number | null;
  longitude: number | null;
  images: string[];
  amenities: string[];
  is_active: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const MAX_IMAGES = 8;

  useEffect(() => {
    checkUserRole();
  }, [user]);

  const checkUserRole = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setUserRole(data.role);

      if (data.role === 'admin' || data.role === 'superadmin') {
        fetchPitch();
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error checking user role:', error);
      setLoading(false);
    }
  };

  const fetchPitch = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pitches')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          await createDefaultPitch();
        } else {
          throw error;
        }
      } else {
        setPitch(data);
      }
    } catch (error) {
      console.error('Error fetching pitch:', error);
      setToast({ message: 'Maydon ma\'lumotlarini yuklashda xatolik', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPitch = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('pitches')
        .insert([{
          owner_id: user.id,
          name: 'Mening maydonim',
          price_per_hour: 50000,
          location: '',
          landmark: '',
          start_time: '08:00',
          end_time: '23:00',
          is_active: false,
          images: [],
          amenities: [],
        }])
        .select()
        .single();

      if (error) throw error;
      setPitch(data);
    } catch (error) {
      console.error('Error creating default pitch:', error);
      setToast({ message: 'Maydon yaratishda xatolik', type: 'error' });
    }
  };

  const handleSave = async () => {
    if (!pitch || !user) return;

    if (pitch.end_time <= pitch.start_time) {
      setToast({ message: 'Tugash vaqti boshlanish vaqtidan kechroq bo\'lishi kerak', type: 'error' });
      return;
    }

    if (!pitch.name || !pitch.price_per_hour || !pitch.location) {
      setToast({ message: 'Barcha majburiy maydonlarni to\'ldiring', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('pitches')
        .update({
          name: pitch.name,
          price_per_hour: pitch.price_per_hour,
          location: pitch.location,
          landmark: pitch.landmark,
          start_time: pitch.start_time,
          end_time: pitch.end_time,
          latitude: pitch.latitude,
          longitude: pitch.longitude,
          images: pitch.images,
          amenities: pitch.amenities,
          is_active: true,
        })
        .eq('owner_id', user.id);

      if (error) throw error;
      
      setToast({ message: 'Muvaffaqiyatli saqlandi!', type: 'success' });
      fetchPitch();
    } catch (error) {
      console.error('Error updating pitch:', error);
      setToast({ message: 'Xatolik yuz berdi', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setToast({ message: 'Geolokatsiya qo\'llab-quvvatlanmaydi', type: 'error' });
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setPitch(prev => prev ? { ...prev, latitude, longitude } : null);
        setToast({ message: 'Joylashuv muvaffaqiyatli aniqlandi!', type: 'success' });
        setGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setToast({ message: 'Joylashuvni aniqlab bo\'lmadi', type: 'error' });
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!pitch || !user || !e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files);
    const currentImageCount = pitch.images?.length || 0;

    // Check max images limit
    if (currentImageCount + files.length > MAX_IMAGES) {
      setToast({ 
        message: `Maksimal ${MAX_IMAGES} ta rasm yuklash mumkin. Hozir ${currentImageCount} ta rasm mavjud.`, 
        type: 'error' 
      });
      return;
    }

    // Validate all files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setToast({ message: `${file.name} - faqat rasm fayllari yuklanadi`, type: 'error' });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setToast({ message: `${file.name} - hajmi 5MB dan kichik bo'lishi kerak`, type: 'error' });
        return;
      }
    }

    setUploadingImage(true);
    setUploadProgress({ current: 0, total: files.length });
    const uploadedUrls: string[] = [];

    try {
      // Upload files sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress({ current: i + 1, total: files.length });

        // Create unique filename
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('pitch_images')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('pitch_images')
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // Update images array in database
      const updatedImages = [...(pitch.images || []), ...uploadedUrls];
      
      const { error: updateError } = await supabase
        .from('pitches')
        .update({ images: updatedImages })
        .eq('owner_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setPitch(prev => prev ? { ...prev, images: updatedImages } : null);

      setToast({ 
        message: `${uploadedUrls.length} ta rasm muvaffaqiyatli yuklandi!`, 
        type: 'success' 
      });
    } catch (error: any) {
      console.error('Error uploading images:', error);
      setToast({ message: error.message || 'Rasm yuklashda xatolik', type: 'error' });
      
      // Clean up uploaded files on error
      for (const url of uploadedUrls) {
        const fileName = url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('pitch_images').remove([fileName]);
        }
      }
    } finally {
      setUploadingImage(false);
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    if (!pitch || !user) return;

    try {
      // Remove from images array
      const updatedImages = pitch.images.filter(img => img !== imageUrl);
      
      // Update local state immediately
      setPitch(prev => prev ? { ...prev, images: updatedImages } : null);

      // Update database
      const { error } = await supabase
        .from('pitches')
        .update({ images: updatedImages })
        .eq('owner_id', user.id);

      if (error) throw error;

      // Delete from storage
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        const { error: deleteError } = await supabase.storage
          .from('pitch_images')
          .remove([fileName]);
        
        if (deleteError) {
          console.warn('Storage delete warning:', deleteError);
        }
      }
      
      setToast({ message: 'Rasm o\'chirildi', type: 'success' });
    } catch (error) {
      console.error('Error removing image:', error);
      setToast({ message: 'Rasmni o\'chirishda xatolik', type: 'error' });
      // Revert state on error
      fetchPitch();
    }
  };

  const toggleAmenity = (amenityName: string) => {
    if (!pitch) return;
    
    const currentAmenities = pitch.amenities || [];
    const isSelected = currentAmenities.includes(amenityName);
    
    const updatedAmenities = isSelected
      ? currentAmenities.filter(a => a !== amenityName)
      : [...currentAmenities, amenityName];
    
    setPitch(prev => prev ? { ...prev, amenities: updatedAmenities } : null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!pitch) {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="text-center">
          <p className="text-zinc-400 text-lg">Maydon topilmadi</p>
          <p className="text-zinc-500 text-sm mt-2">Database'da maydon yarating</p>
        </div>
      </div>
    );
  }

  if (userRole && userRole !== 'admin' && userRole !== 'superadmin') {
    return (
      <div className="flex items-center justify-center h-screen bg-zinc-950">
        <div className="text-center">
          <p className="text-red-400 text-lg">Ruxsat yo'q</p>
          <p className="text-zinc-500 text-sm mt-2">Bu sahifa faqat adminlar uchun</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-24 bg-zinc-950 min-h-screen">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <img 
            src="/bronlogo.png" 
            alt="Bron Logo" 
            className="h-10 w-auto"
          />
          <h1 className="text-2xl font-bold text-white">Sozlamalar</h1>
        </div>
        <p className="text-zinc-400 text-sm">Maydon ma'lumotlarini boshqarish</p>
      </div>

      <div className="px-4 space-y-6">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Maydon nomi <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={pitch?.name || ''}
            onChange={(e) => setPitch(prev => prev ? { ...prev, name: e.target.value } : null)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Maydon A"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Soatlik narx (so'm) <span className="text-red-500">*</span>
            </div>
          </label>
          <input
            type="number"
            value={pitch?.price_per_hour || 0}
            onChange={(e) => setPitch(prev => prev ? { ...prev, price_per_hour: Number(e.target.value) } : null)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="50000"
            min="0"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Manzil <span className="text-red-500">*</span>
            </div>
          </label>
          <input
            type="text"
            value={pitch?.location || ''}
            onChange={(e) => setPitch(prev => prev ? { ...prev, location: e.target.value } : null)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Toshkent, Yunusobod tumani"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Mo'ljal
          </label>
          <input
            type="text"
            value={pitch?.landmark || ''}
            onChange={(e) => setPitch(prev => prev ? { ...prev, landmark: e.target.value } : null)}
            className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
            placeholder="Metro Chilonzor yaqinida"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <div className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Joylashuv koordinatalari
            </div>
          </label>
          <div className="flex gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={pitch.latitude ? pitch.latitude.toFixed(6) : ''}
                readOnly
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 text-sm"
                placeholder="Latitude"
              />
            </div>
            <div className="flex-1">
              <input
                type="text"
                value={pitch.longitude ? pitch.longitude.toFixed(6) : ''}
                readOnly
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-400 text-sm"
                placeholder="Longitude"
              />
            </div>
          </div>
          <button
            onClick={handleGetLocation}
            disabled={gettingLocation}
            className="mt-2 w-full bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {gettingLocation ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Aniqlanmoqda...
              </>
            ) : (
              <>
                <Navigation className="w-5 h-5" />
                Aniqlash
              </>
            )}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Ish vaqti <span className="text-red-500">*</span>
            </div>
          </label>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Start Time */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                Boshlanish vaqti
              </label>
              <select
                value={pitch?.start_time || '08:00'}
                onChange={(e) => setPitch(prev => prev ? { ...prev, start_time: e.target.value } : null)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer hover:bg-zinc-850 transition-colors"
                required
              >
                <option value="00:00">00:00</option>
                <option value="01:00">01:00</option>
                <option value="02:00">02:00</option>
                <option value="03:00">03:00</option>
                <option value="04:00">04:00</option>
                <option value="05:00">05:00</option>
                <option value="06:00">06:00</option>
                <option value="07:00">07:00</option>
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="12:00">12:00</option>
                <option value="13:00">13:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
                <option value="16:00">16:00</option>
                <option value="17:00">17:00</option>
                <option value="18:00">18:00</option>
                <option value="19:00">19:00</option>
                <option value="20:00">20:00</option>
                <option value="21:00">21:00</option>
                <option value="22:00">22:00</option>
                <option value="23:00">23:00</option>
              </select>
            </div>

            {/* End Time */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                Tugash vaqti
              </label>
              <select
                value={pitch?.end_time || '23:00'}
                onChange={(e) => setPitch(prev => prev ? { ...prev, end_time: e.target.value } : null)}
                className="w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-white text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent cursor-pointer hover:bg-zinc-850 transition-colors"
                required
              >
                <option value="01:00">01:00</option>
                <option value="02:00">02:00</option>
                <option value="03:00">03:00</option>
                <option value="04:00">04:00</option>
                <option value="05:00">05:00</option>
                <option value="06:00">06:00</option>
                <option value="07:00">07:00</option>
                <option value="08:00">08:00</option>
                <option value="09:00">09:00</option>
                <option value="10:00">10:00</option>
                <option value="11:00">11:00</option>
                <option value="12:00">12:00</option>
                <option value="13:00">13:00</option>
                <option value="14:00">14:00</option>
                <option value="15:00">15:00</option>
                <option value="16:00">16:00</option>
                <option value="17:00">17:00</option>
                <option value="18:00">18:00</option>
                <option value="19:00">19:00</option>
                <option value="20:00">20:00</option>
                <option value="21:00">21:00</option>
                <option value="22:00">22:00</option>
                <option value="23:00">23:00</option>
                <option value="23:59">23:59</option>
              </select>
            </div>
          </div>

          {/* Duration Display */}
          {pitch?.start_time && pitch?.end_time && (() => {
            const [startHour, startMin] = pitch.start_time.split(':').map(Number);
            const [endHour, endMin] = pitch.end_time.split(':').map(Number);
            const startMinutes = startHour * 60 + startMin;
            const endMinutes = endHour * 60 + endMin;
            const duration = endMinutes > startMinutes 
              ? endMinutes - startMinutes 
              : (24 * 60 - startMinutes) + endMinutes;
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;
            
            return (
              <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-zinc-500" />
                <span className="text-zinc-500">Ish vaqti:</span>
                <span className="text-blue-400 font-medium">
                  {hours} soat {minutes > 0 ? `${minutes} daqiqa` : ''}
                </span>
              </div>
            );
          })()}

          {pitch && pitch.end_time <= pitch.start_time && (
            <p className="text-red-400 text-xs mt-2 flex items-center gap-1">
              <X className="w-3 h-3" />
              Tugash vaqti boshlanish vaqtidan kechroq bo'lishi kerak
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Rasmlar
                <span className="text-zinc-500 text-xs">(max {MAX_IMAGES} ta, har biri 5MB)</span>
              </div>
              <span className="text-zinc-400 text-xs">
                {pitch.images?.length || 0} / {MAX_IMAGES}
              </span>
            </div>
          </label>
          
          {/* Image Slider Gallery */}
          {pitch.images && pitch.images.length > 0 && (
            <div className="mb-3">
              <div 
                className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin"
                style={{ scrollBehavior: 'smooth' }}
              >
                {pitch.images.map((imageUrl, index) => (
                  <div 
                    key={index} 
                    className="relative flex-shrink-0 w-64 snap-start group"
                  >
                    <img
                      src={imageUrl}
                      alt={`Maydon ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg border border-zinc-800 shadow-lg"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%2327272a" width="200" height="200"/%3E%3Ctext fill="%2371717a" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ERasm topilmadi%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    <button
                      onClick={() => handleRemoveImage(imageUrl)}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      aria-label="Rasmni o'chirish"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                      {index + 1} / {pitch.images.length}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs mt-2">
                <span>←</span>
                <span>Chapga va o'ngga suring</span>
                <span>→</span>
              </div>
            </div>
          )}

          {/* Upload Area */}
          {(!pitch.images || pitch.images.length < MAX_IMAGES) && (
            <label className="block border-2 border-dashed border-zinc-700 hover:border-zinc-600 rounded-lg p-8 text-center cursor-pointer transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                multiple
                className="hidden"
              />
              {uploadingImage ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <div className="text-center">
                    <p className="text-zinc-300 text-sm font-medium">Yuklanmoqda...</p>
                    {uploadProgress && (
                      <p className="text-zinc-500 text-xs mt-1">
                        {uploadProgress.current} / {uploadProgress.total} rasm
                      </p>
                    )}
                  </div>
                  {/* Progress Bar */}
                  {uploadProgress && (
                    <div className="w-full max-w-xs bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-zinc-500" />
                  <p className="text-zinc-400 text-sm">
                    {pitch.images?.length ? 'Yana rasm qo\'shish' : 'Rasm yuklash uchun bosing'}
                  </p>
                  <p className="text-zinc-600 text-xs">
                    JPG, PNG, WEBP (max 5MB, bir nechta tanlash mumkin)
                  </p>
                </div>
              )}
            </label>
          )}

          {pitch.images && pitch.images.length >= MAX_IMAGES && (
            <div className="bg-amber-950 border border-amber-800 text-amber-200 px-4 py-3 rounded-lg text-sm">
              Maksimal rasm soni ({MAX_IMAGES}) ga yetdi. Yangi rasm qo'shish uchun avval birontasini o'chiring.
            </div>
          )}
        </div>

        {/* Amenities Section */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-3">
            <div className="flex items-center gap-2">
              <CircleDot className="w-4 h-4" />
              Qulayliklar
            </div>
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            {AMENITIES.map((amenity) => {
              const Icon = amenity.icon;
              const isSelected = pitch?.amenities?.includes(amenity.name) || false;
              
              return (
                <button
                  key={amenity.id}
                  type="button"
                  onClick={() => toggleAmenity(amenity.name)}
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200
                    ${isSelected 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-850'
                    }
                  `}
                >
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center
                    ${isSelected ? 'bg-blue-700' : 'bg-zinc-800'}
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-medium text-left flex-1">
                    {amenity.name}
                  </span>
                  {isSelected && (
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {pitch?.amenities && pitch.amenities.length > 0 && (
            <div className="mt-3 text-center">
              <span className="text-zinc-500 text-xs">
                {pitch.amenities.length} ta qulaylik tanlandi
              </span>
            </div>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving || pitch.end_time <= pitch.start_time}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 disabled:cursor-not-allowed text-white font-semibold py-4 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
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

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-sm">Maydon holati:</span>
            <span className={`text-sm font-medium ${pitch.is_active ? 'text-green-400' : 'text-yellow-400'}`}>
              {pitch.is_active ? 'Faol' : 'Nofaol'}
            </span>
          </div>
          {!pitch.is_active && (
            <p className="text-zinc-500 text-xs mt-2">
              Ma'lumotlarni to'ldiring va saqlang, maydon avtomatik faollashadi
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
