import { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Mic,
  MicOff,
  Send,
  X,
  ImagePlus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Car,
  AlertTriangle,
  Package,
  FileText,
  Sparkles,
  Volume2,
  Pause,
  Play,
  CheckCircle,
  MessageCircle,
  HandCoins,
  Star,
  MapPin,
  Truck,
  Check,
  Info,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { useUrgentStore, normalizeCategory } from '../../stores/urgentStore';
import { useAuthStore } from '../../stores/authStore';
import { useStockStore } from '../../stores/stockStore';
import { useMessageStore } from '../../stores/messageStore';
import { useReputationStore } from '../../stores/reputationStore';
import Card from '../../components/ui/Card';
import Chip from '../../components/ui/Chip';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { cn } from '../../lib/utils';
import { CarPlatform, UrgentPost, StockItem, User } from '../../types';

const carBrands = ['宝马', '奔驰', '奥迪', '大众', '丰田', '本田', '日产', '特斯拉', '比亚迪', '保时捷', '路虎', '别克'];

const categoryOptions = [
  { value: '', label: '自动识别' },
  { value: '照明系统', label: '照明系统' },
  { value: '外观覆盖', label: '外观覆盖' },
  { value: '机械传动', label: '机械传动' },
  { value: '电子电器', label: '电子电器' },
  { value: '底盘悬挂', label: '底盘悬挂' },
  { value: '发动机件', label: '发动机件' },
];

const deadlineOptions = [
  { label: '30分钟内', minutes: 30, urgent: true },
  { label: '2小时内', minutes: 120, urgent: true },
  { label: '6小时内', minutes: 360, urgent: true },
  { label: '12小时内', minutes: 720, urgent: true },
  { label: '24小时内', minutes: 1440, urgent: false },
  { label: '48小时内', minutes: 2880, urgent: false },
];

interface PublishForm {
  carPlatform: CarPlatform;
  partName: string;
  partNumber: string;
  quantity: number;
  description: string;
  deadlineMinutes: number;
  images: string[];
  category: string;
}

const sampleImages = [
  'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=300',
  'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=300',
  'https://images.unsplash.com/photo-1617814086367-b37d4e6c9f0d?w=300',
  'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=300',
  'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=300',
];

function VoiceWaveform({ volume, isListening }: { volume: number; isListening: boolean }) {
  const bars = useMemo(() => Array.from({ length: 40 }, (_, i) => i), []);

  return (
    <div className="flex items-end justify-center gap-0.5 h-16">
      {bars.map((i) => {
        const baseHeight = 4 + Math.sin(i * 0.5) * 2;
        const dynamicHeight = isListening
          ? baseHeight + volume * (20 + Math.random() * 30)
          : baseHeight;
        return (
          <motion.div
            key={i}
            animate={{
              height: `${Math.max(4, dynamicHeight)}px`,
              backgroundColor: isListening ? '#EF4444' : '#D1D5DB',
            }}
            transition={{ duration: 0.08, ease: 'easeOut' }}
            className={cn(
              "w-1 rounded-full",
              isListening ? "bg-red-500" : "bg-gray-300"
            )}
            style={{ minHeight: '4px' }}
          />
        );
      })}
    </div>
  );
}

function PlaybackTranscript({
  transcript,
  onClear,
}: {
  transcript: string;
  onClear: () => void;
}) {
  if (!transcript) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl bg-green-50 border border-green-200"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles size={14} className="text-green-600" />
          <span className="text-xs font-medium text-green-700">AI 语音识别结果</span>
        </div>
        <button
          onClick={onClear}
          className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center"
        >
          <X size={10} className="text-green-600" />
        </button>
      </div>
      <p className="text-sm text-gray-700 leading-relaxed">{transcript}</p>
      <div className="mt-2 flex gap-1.5 flex-wrap">
        <Chip variant="default" size="sm">已智能提取配件名</Chip>
        <Chip variant="default" size="sm">已识别车型信息</Chip>
      </div>
    </motion.div>
  );
}

export default function UrgentPublish() {
  const navigate = useNavigate();
  const { createUrgentPost } = useUrgentStore();
  const { user } = useAuthStore();

  const [step, setStep] = useState<'voice' | 'form' | 'success'>('voice');
  const [publishedPost, setPublishedPost] = useState<any>(null);
  const [form, setForm] = useState<PublishForm>({
    carPlatform: { brand: '', series: '', year: '', model: '' },
    partName: '',
    partNumber: '',
    quantity: 1,
    description: '',
    deadlineMinutes: 30,
    images: [],
    category: '',
  });
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    isListening,
    transcript,
    interimTranscript,
    duration,
    volume,
    start,
    stop,
    reset,
  } = useVoiceInput({
    maxDuration: 30000,
    onStop: (text) => {
      if (text) {
        setForm((prev) => ({ ...prev, description: text }));
        if (!form.partName) {
          const keywords = ['大灯', '保险杠', '涡轮', '方向机', '压缩机', '刹车片', '减震器', '变速箱'];
          const match = keywords.find((k) => text.includes(k));
          if (match) setForm((prev) => ({ ...prev, partName: match }));
        }
        const brandMatch = carBrands.find((b) => text.includes(b));
        if (brandMatch) {
          setSelectedBrand(brandMatch);
          setForm((prev) => ({
            ...prev,
            carPlatform: { ...prev.carPlatform, brand: brandMatch },
          }));
        }
      }
    },
  });

  const formatDuration = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const addImage = () => {
    const availableImages = sampleImages.filter((img) => !form.images.includes(img));
    if (availableImages.length > 0 && form.images.length < 6) {
      const randomImage = availableImages[Math.floor(Math.random() * availableImages.length)];
      setForm((prev) => ({ ...prev, images: [...prev.images, randomImage] }));
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }
    if (!form.partName.trim()) {
      alert('请填写配件名称');
      return;
    }
    if (!selectedBrand) {
      alert('请选择车型品牌');
      return;
    }

    setIsSubmitting(true);
    try {
      const expiresAt = new Date(Date.now() + form.deadlineMinutes * 60 * 1000).toISOString();
      const newPost = createUrgentPost({
        publisherId: user.id,
        carPlatform: {
          ...form.carPlatform,
          series: selectedBrand,
          model: `${selectedBrand} 车型`,
        },
        partName: form.partName,
        partNumber: form.partNumber || undefined,
        quantity: form.quantity,
        description: form.description || form.partName,
        images: form.images,
        expiresAt,
        category: form.category,
      });
      setPublishedPost(newPost);
      setStep('success');
    } catch (error) {
      console.error('发布失败:', error);
      alert('发布失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = form.partName.trim() && selectedBrand;

  if (step === 'success' && publishedPost) {
    return (
      <UrgentPublishSuccess
        post={publishedPost}
        onViewDetail={() => navigate(`/urgent/${publishedPost.id}`, { replace: true })}
        onBackToList={() => navigate('/urgent', { replace: true })}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100"
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900">发布急件</h1>
              <p className="text-[10px] text-gray-400">快至5分钟收到供应商报价</p>
            </div>
          </div>
          <Badge variant="urgent" size="md" icon={<AlertTriangle size={10} />}>
            加急发布
          </Badge>
        </div>
      </motion.div>

      <div className="px-4 py-4 space-y-4">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setStep('voice')}
            className={cn(
              "flex-1 h-9 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
              step === 'voice'
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            )}
          >
            <Mic size={14} />
            语音发布
          </button>
          <button
            onClick={() => setStep('form')}
            className={cn(
              "flex-1 h-9 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5",
              step === 'form'
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500"
            )}
          >
            <FileText size={14} />
            手动填写
          </button>
        </div>

        <AnimatePresence mode="wait">
          {step === 'voice' ? (
            <motion.div
              key="voice"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <Card variant="outlined" padding="md" className="overflow-hidden">
                <div className="flex flex-col items-center py-6">
                  <div className="relative mb-4">
                    <motion.button
                      onClick={isListening ? stop : start}
                      whileTap={{ scale: 0.95 }}
                      whileHover={!isListening ? { scale: 1.03 } : undefined}
                      className={cn(
                        "w-28 h-28 rounded-full flex items-center justify-center transition-all",
                        isListening
                          ? "bg-gradient-to-br from-red-500 to-red-600 shadow-lg shadow-red-500/50"
                          : "bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/40 hover:shadow-xl hover:shadow-primary-500/50"
                      )}
                    >
                      <AnimatePresence mode="wait">
                        {isListening ? (
                          <motion.div
                            key="stop"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <MicOff size={40} className="text-white" strokeWidth={2} />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="mic"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                          >
                            <Mic size={40} className="text-white" strokeWidth={2} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <AnimatePresence>
                      {isListening && (
                        <>
                          <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.3, 0.5, 0.3] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                            className="absolute inset-0 rounded-full border-4 border-red-400/40"
                          />
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.2, 0.3, 0.2] }}
                            transition={{ repeat: Infinity, duration: 2, delay: 0.3 }}
                            className="absolute inset-0 rounded-full border-4 border-red-300/30"
                          />
                        </>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="text-center mb-4">
                    {isListening ? (
                      <>
                        <motion.div
                          key="listening"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-base font-semibold text-red-500 flex items-center justify-center gap-2"
                        >
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
                          </span>
                          正在聆听...
                          <span className="text-gray-400 font-normal text-sm">
                            {formatDuration(duration)}
                          </span>
                        </motion.div>
                        <p className="text-xs text-gray-400 mt-1">
                          请描述您需要的配件、车型和要求
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="text-base font-semibold text-gray-900">
                          点击麦克风开始语音发布
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          AI将自动识别配件信息，快速发布
                        </p>
                      </>
                    )}
                  </div>

                  <div className="w-full mb-4">
                    <VoiceWaveform volume={volume} isListening={isListening} />
                  </div>

                  {(interimTranscript || transcript) && (
                    <div className="w-full">
                      {interimTranscript && isListening && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="p-3 rounded-xl bg-gray-50 border border-dashed border-gray-200 mb-2"
                        >
                          <div className="flex items-center gap-1.5 mb-1">
                            <Volume2 size={12} className="text-gray-400 animate-pulse" />
                            <span className="text-[10px] text-gray-400">实时识别中...</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {interimTranscript}
                            <span className="inline-block w-0.5 h-4 bg-primary-500 ml-0.5 align-middle animate-pulse" />
                          </p>
                        </motion.div>
                      )}
                      {!isListening && transcript && (
                        <PlaybackTranscript
                          transcript={transcript}
                          onClear={() => {
                            reset();
                            setForm((prev) => ({ ...prev, description: '' }));
                          }}
                        />
                      )}
                    </div>
                  )}

                  {!isListening && (
                    <div className="w-full space-y-3">
                      {(transcript || form.description) && (
                        <Button
                          variant="primary"
                          block
                          rightIcon={<ChevronRight size={16} />}
                          onClick={() => setStep('form')}
                        >
                          继续完善信息
                        </Button>
                      )}
                      <div className="text-center">
                        <p className="text-xs text-gray-400 mb-2">试试这样说：</p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {[
                            '宝马5系左前大灯',
                            '大众迈腾变速箱阀体',
                            '丰田凯美瑞前保险杠',
                            '奥迪A6L方向机总成',
                          ].map((example) => (
                            <button
                              key={example}
                              onClick={() => {
                                setForm((prev) => ({
                                  ...prev,
                                  description: `我需要${example}，要求原厂件或高品质拆车件，尽快发货。`,
                                  partName: example.split(/系|腾|瑞|L/)[0] + example.slice(-4).replace(/原厂|高品|尽快|发货|要求|或|品|拆|件/g, ''),
                                }));
                                const brand = carBrands.find((b) => example.includes(b));
                                if (brand) {
                                  setSelectedBrand(brand);
                                  setForm((prev) => ({
                                    ...prev,
                                    carPlatform: { ...prev.carPlatform, brand },
                                  }));
                                }
                              }}
                              className="px-2.5 py-1 text-xs rounded-full bg-gray-100 text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                            >
                              {example}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card variant="outlined" padding="none">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Car size={14} className="text-blue-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">车型信息</h3>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">品牌车系 *</label>
                    <div className="flex flex-wrap gap-1.5">
                      {carBrands.map((brand) => (
                        <Chip
                          key={brand}
                          variant={selectedBrand === brand ? 'primary' : 'default'}
                          size="sm"
                          selected={selectedBrand === brand}
                          onSelect={() => {
                            setSelectedBrand(brand);
                            setForm((prev) => ({
                              ...prev,
                              carPlatform: { ...prev.carPlatform, brand },
                            }));
                          }}
                        >
                          {brand}
                        </Chip>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
                      <Package size={14} className="text-orange-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">配件信息</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">配件名称 *</label>
                      <input
                        type="text"
                        placeholder="例如：左前大灯总成、变速箱阀体"
                        value={form.partName}
                        onChange={(e) => setForm((prev) => ({ ...prev, partName: e.target.value }))}
                        className="w-full h-11 px-4 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white transition-all border border-transparent focus:border-primary-200"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">配件分类</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full h-11 px-4 bg-gray-50 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white transition-all border border-transparent focus:border-primary-200 appearance-none"
                      >
                        {categoryOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">OE零件号（可选）</label>
                      <input
                        type="text"
                        placeholder="例如：63117466115"
                        value={form.partNumber}
                        onChange={(e) => setForm((prev) => ({ ...prev, partNumber: e.target.value }))}
                        className="w-full h-11 px-4 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white transition-all border border-transparent focus:border-primary-200"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">需求数量</label>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setForm((prev) => ({ ...prev, quantity: Math.max(1, prev.quantity - 1) }))}
                          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          −
                        </button>
                        <motion.span
                          key={form.quantity}
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          className="w-12 text-center text-lg font-bold text-gray-900"
                        >
                          {form.quantity}
                        </motion.span>
                        <button
                          onClick={() => setForm((prev) => ({ ...prev, quantity: Math.min(99, prev.quantity + 1) }))}
                          className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 hover:bg-gray-200 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-gray-500 mb-1.5 block">详细描述（可选）</label>
                      <textarea
                        placeholder="描述配件要求、成色偏好、质保要求等..."
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full p-3 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:bg-white transition-all resize-none border border-transparent focus:border-primary-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 flex items-center justify-center">
                        <ImagePlus size={14} className="text-purple-500" />
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">配件图片</h3>
                    </div>
                    <span className="text-xs text-gray-400">
                      {form.images.length}/6
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {form.images.map((img, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative aspect-square rounded-xl overflow-hidden bg-gray-100"
                      >
                        <img
                          src={img}
                          alt={`配件图${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                        >
                          <X size={10} className="text-white" />
                        </button>
                      </motion.div>
                    ))}
                    {form.images.length < 6 && (
                      <motion.button
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        onClick={addImage}
                        className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 hover:border-primary-300 hover:bg-primary-50/50 transition-colors"
                      >
                        <ImagePlus size={20} className="text-gray-400" />
                        <span className="text-xs text-gray-400">上传图片</span>
                      </motion.button>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                      <Clock size={14} className="text-red-500" />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-900">截止时间</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {deadlineOptions.map((opt) => (
                      <button
                        key={opt.minutes}
                        onClick={() => setForm((prev) => ({ ...prev, deadlineMinutes: opt.minutes }))}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-center",
                          form.deadlineMinutes === opt.minutes
                            ? opt.urgent
                              ? "border-red-400 bg-red-50"
                              : "border-primary-400 bg-primary-50"
                            : "border-gray-100 bg-gray-50 hover:border-gray-200"
                        )}
                      >
                        <div
                          className={cn(
                            "text-sm font-semibold",
                            form.deadlineMinutes === opt.minutes
                              ? opt.urgent
                                ? "text-red-600"
                                : "text-primary-600"
                              : "text-gray-700"
                          )}
                        >
                          {opt.label}
                        </div>
                        {opt.urgent && (
                          <div className="text-[10px] text-red-500 mt-0.5 flex items-center justify-center gap-0.5">
                            <AlertTriangle size={9} />
                            加急
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </Card>

              {form.description && (
                <PlaybackTranscript
                  transcript={form.description}
                  onClear={() => {
                    reset();
                    setForm((prev) => ({ ...prev, description: '' }));
                  }}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-gray-100 px-4 py-3 pb-safe"
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">
              {selectedBrand ? `车型：${selectedBrand}` : '请选择车型品牌'}
            </div>
            <div className="text-xs text-gray-500">
              {form.partName ? `配件：${form.partName}` : '请填写配件名称'}
              {form.quantity > 1 && ` · x${form.quantity}`}
            </div>
          </div>
          <Button
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={!canSubmit}
            leftIcon={<Send size={16} />}
            onClick={handleSubmit}
            className="flex-shrink-0"
          >
            发布急件
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

type GroupKey = 'all' | 'sameBrand' | 'sameCategory' | 'nearCity' | 'shipToday' | 'highReputation';

const GROUP_TABS: { key: GroupKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'sameBrand', label: '同品牌' },
  { key: 'sameCategory', label: '同分类' },
  { key: 'nearCity', label: '同城近城' },
  { key: 'shipToday', label: '当天发车' },
  { key: 'highReputation', label: '高信誉' },
];

interface MatchDetail {
  key: string;
  label: string;
  matched: boolean;
  score: number;
}

interface RecommendedSupplier {
  stockItem: StockItem;
  score: number;
  totalScore: number;
  matchReasons: string[];
  matchDetails: MatchDetail[];
  sameBrand: boolean;
  sameCategory: boolean;
  nearCity: boolean;
  shipToday: boolean;
  highReputation: boolean;
  hasStock: boolean;
  isSameCity: boolean;
  distanceKm: number;
  reputationPercent: number;
}

function RecommendReasonModal({
  isOpen,
  onClose,
  supplier,
}: {
  isOpen: boolean;
  onClose: () => void;
  supplier: RecommendedSupplier | null;
}) {
  if (!isOpen || !supplier) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/50"
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[75vh] overflow-hidden"
      >
        <div className="sticky top-0 bg-white z-10 px-4 pt-3 pb-4 border-b border-gray-100">
          <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">为什么推荐</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <img
              src={supplier.stockItem.supplier.avatar}
              alt={supplier.stockItem.supplier.name}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm font-medium text-gray-800">
              {supplier.stockItem.supplier.name}
            </span>
            <div className="ml-auto text-right">
              <div className="text-sm font-bold text-orange-500">
                总得分 {supplier.score}/{supplier.totalScore}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto max-h-[calc(75vh-130px)]">
          <div className="text-xs font-semibold text-gray-500 mb-1">匹配条件</div>
          {supplier.matchDetails.map((detail) => (
            <div
              key={detail.key}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl border',
                detail.matched
                  ? 'bg-green-50 border-green-100'
                  : 'bg-gray-50 border-gray-100'
              )}
            >
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
                  detail.matched ? 'bg-green-500' : 'bg-gray-300'
                )}
              >
                {detail.matched ? (
                  <Check size={14} className="text-white" strokeWidth={3} />
                ) : (
                  <X size={12} className="text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-800">{detail.label}</div>
              </div>
              <div
                className={cn(
                  'text-sm font-bold',
                  detail.matched ? 'text-green-600' : 'text-gray-400'
                )}
              >
                +{detail.score}分
              </div>
            </div>
          ))}

          <div className="mt-4 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <div className="flex items-center gap-2 mb-1">
              <Info size={14} className="text-blue-500" />
              <span className="text-xs font-semibold text-blue-700">匹配来源说明</span>
            </div>
            <ul className="text-[11px] text-blue-600/80 space-y-1 ml-5">
              <li>· 同品牌：供应商库存配件品牌与急件需求品牌一致</li>
              <li>· 同分类：配件分类归一化后与急件分类一致</li>
              <li>· 同城近城：同一城市或距离小于50公里</li>
              <li>· 当天发车：供应商支持当天发货</li>
              <li>· 高信誉：供应商星级评分≥4.7分</li>
              <li>· 有现货：库存数量大于0</li>
            </ul>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function RecommendedSuppliers({ post }: { post: UrgentPost }) {
  const navigate = useNavigate();
  const { stockItems } = useStockStore();
  const { createSessionByParticipants, sendMessage } = useMessageStore();
  const { user } = useAuthStore();
  const [activeGroup, setActiveGroup] = useState<GroupKey>('all');
  const [reasonSupplier, setReasonSupplier] = useState<RecommendedSupplier | null>(null);

  const postCategoryNorm = normalizeCategory(post.category);
  const publisherCity = post.publisher?.city || '';

  const recommendedSuppliers = useMemo(() => {
    const suppliers: RecommendedSupplier[] = [];
    const seenSupplierIds = new Set<string>();

    stockItems.forEach((stockItem) => {
      if (seenSupplierIds.has(stockItem.supplierId)) return;
      if (user && stockItem.supplierId === user.id) return;

      const stockCategoryNorm = normalizeCategory(
        stockItem.tags.find((t) => t !== '热销' && t !== '可议价') || ''
      );
      const isSameCity = stockItem.sourceCity === publisherCity || stockItem.supplier.city === publisherCity;
      const distanceKm = isSameCity ? Math.floor(Math.random() * 20) : Math.floor(Math.random() * 500) + 30;
      const isNearCity = isSameCity || distanceKm < 50;

      const sameBrand = stockItem.carPlatform.brand === post.carPlatform.brand;
      const sameCategory = stockCategoryNorm === postCategoryNorm && postCategoryNorm !== '';
      const hasStock = stockItem.stockQty > 0;
      const shipToday = stockItem.canShipToday;
      const starRating = stockItem.supplier.reputation.starRating;
      const highReputation = starRating >= 4.7;
      const nearCity = isNearCity;

      const matchDetails: MatchDetail[] = [
        { key: 'sameBrand', label: '同品牌匹配', matched: sameBrand, score: 30 },
        { key: 'sameCategory', label: '同分类匹配', matched: sameCategory, score: 20 },
        { key: 'nearCity', label: isSameCity ? '同城供应商' : '近城供应商(<50km)', matched: nearCity, score: 15 },
        { key: 'shipToday', label: '当天可发车', matched: shipToday, score: 25 },
        { key: 'highReputation', label: '高信誉商家(≥4.7星)', matched: highReputation, score: 20 },
        { key: 'hasStock', label: '有现货库存', matched: hasStock, score: 10 },
      ];

      let score = 0;
      const matchReasons: string[] = [];
      matchDetails.forEach((d) => {
        if (d.matched) {
          score += d.score;
          if (d.key === 'sameBrand') matchReasons.push('同品牌');
          if (d.key === 'sameCategory') matchReasons.push('同分类');
          if (d.key === 'nearCity') matchReasons.push(isSameCity ? '同城' : '近城');
          if (d.key === 'shipToday') matchReasons.push('当天发');
          if (d.key === 'highReputation') matchReasons.push('高信誉');
          if (d.key === 'hasStock') matchReasons.push('有现货');
        }
      });

      const totalScore = matchDetails.reduce((s, d) => s + d.score, 0);
      const reputationPercent = Math.max(1, Math.round((5 - starRating + 0.1) * 20 + 1));

      if (score > 0) {
        seenSupplierIds.add(stockItem.supplierId);
        suppliers.push({
          stockItem,
          score,
          totalScore,
          matchReasons,
          matchDetails,
          sameBrand,
          sameCategory,
          nearCity,
          shipToday,
          highReputation,
          hasStock,
          isSameCity,
          distanceKm,
          reputationPercent,
        });
      }
    });

    return suppliers.sort((a, b) => b.score - a.score).slice(0, 8);
  }, [stockItems, post, user, postCategoryNorm, publisherCity]);

  const filteredSuppliers = useMemo(() => {
    switch (activeGroup) {
      case 'sameBrand':
        return recommendedSuppliers.filter((s) => s.sameBrand);
      case 'sameCategory':
        return recommendedSuppliers.filter((s) => s.sameCategory);
      case 'nearCity':
        return recommendedSuppliers.filter((s) => s.nearCity);
      case 'shipToday':
        return recommendedSuppliers.filter((s) => s.shipToday);
      case 'highReputation':
        return recommendedSuppliers.filter((s) => s.highReputation);
      case 'all':
      default:
        return recommendedSuppliers;
    }
  }, [recommendedSuppliers, activeGroup]);

  const handleChat = (supplierId: string) => {
    if (!user) return;
    const session = createSessionByParticipants([user.id, supplierId]);
    navigate(`/message/${session.id}`);
  };

  const handleInviteQuote = (supplierId: string, supplierName: string) => {
    if (!user) return;
    const session = createSessionByParticipants([user.id, supplierId]);
    const message = `【邀请报价】我发布了一个急件：${post.partName}（${post.carPlatform.brand} ${post.carPlatform.series}），数量 ${post.quantity} 个，截止时间 ${new Date(post.expiresAt).toLocaleString()}。能否给我报个价？`;
    sendMessage(session.id, user.id, 'text', message);
    alert(`已向 ${supplierName} 发送邀请报价消息`);
    navigate(`/message/${session.id}`);
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={12}
          className={cn(
            i < fullStars
              ? 'text-yellow-400 fill-yellow-400'
              : i === fullStars && hasHalfStar
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
          )}
        />
      );
    }
    return stars;
  };

  if (recommendedSuppliers.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-100 flex items-center justify-center">
          <Package size={24} className="text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">暂无匹配的供应商</p>
        <p className="text-xs text-gray-400 mt-1">继续等待其他供应商报价</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        {GROUP_TABS.map((tab) => {
          const count =
            tab.key === 'all'
              ? recommendedSuppliers.length
              : recommendedSuppliers.filter((s) => {
                  if (tab.key === 'sameBrand') return s.sameBrand;
                  if (tab.key === 'sameCategory') return s.sameCategory;
                  if (tab.key === 'nearCity') return s.nearCity;
                  if (tab.key === 'shipToday') return s.shipToday;
                  if (tab.key === 'highReputation') return s.highReputation;
                  return false;
                }).length;
          const isActive = activeGroup === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveGroup(tab.key)}
              className={cn(
                'flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5',
                isActive
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-full text-[10px]',
                  isActive ? 'bg-white/25' : 'bg-white'
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredSuppliers.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-sm text-gray-400">该分组下暂无匹配供应商</p>
        </div>
      ) : (
        filteredSuppliers.map((supplier, index) => {
          const { stockItem, matchReasons, score, totalScore, isSameCity, distanceKm, reputationPercent } = supplier;
          return (
            <motion.div
              key={stockItem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="outlined" padding="md" className="relative">
                <button
                  onClick={() => setReasonSupplier(supplier)}
                  className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 hover:bg-blue-100 transition-colors z-10"
                >
                  <Info size={12} className="text-blue-500" />
                  <span className="text-[10px] font-medium text-blue-600">为什么推荐</span>
                </button>

                <div className="flex gap-3 pr-20">
                  <div className="relative">
                    <img
                      src={stockItem.supplier.avatar}
                      alt={stockItem.supplier.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    {stockItem.supplier.verified && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {stockItem.supplier.name}
                          </span>
                          {isSameCity ? (
                            <Badge variant="success" size="sm">
                              同城
                            </Badge>
                          ) : distanceKm < 50 ? (
                            <Badge variant="info" size="sm">
                              {distanceKm}km
                            </Badge>
                          ) : null}
                          {stockItem.supplier.certificationBadges.slice(0, 1).map((badge, i) => (
                            <Badge key={i} variant="success" size="sm">
                              {badge}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <MapPin size={10} className="text-gray-400" />
                          <span className="text-xs text-gray-500">{stockItem.supplier.city}</span>
                          <span className="text-gray-300">·</span>
                          <div className="flex items-center gap-0.5">
                            {renderStars(stockItem.supplier.reputation.starRating)}
                            <span className="text-xs text-gray-500 ml-0.5">
                              {stockItem.supplier.reputation.starRating.toFixed(1)}
                            </span>
                          </div>
                          <span className="text-gray-300">·</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-600 font-medium">
                            信誉前{reputationPercent}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-lg font-bold text-red-500">
                          ¥{stockItem.unitPrice}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          库存 {stockItem.stockQty} 件
                        </div>
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1">
                      {matchReasons.slice(0, 3).map((reason, i) => (
                        <span
                          key={i}
                          className={cn(
                            'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium',
                            reason === '当天发'
                              ? 'bg-orange-50 text-orange-600'
                              : reason === '同城' || reason === '近城'
                                ? 'bg-blue-50 text-blue-600'
                                : reason === '高信誉'
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-primary-50 text-primary-600'
                          )}
                        >
                          <Check size={8} />
                          {reason}
                        </span>
                      ))}
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-gray-50 text-gray-500">
                        {score}分
                      </span>
                    </div>

                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-700">
                        匹配配件：<span className="font-medium">{stockItem.partName}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        block
                        leftIcon={<MessageCircle size={14} />}
                        onClick={() => handleChat(stockItem.supplierId)}
                      >
                        立即聊天
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        block
                        leftIcon={<HandCoins size={14} />}
                        onClick={() => handleInviteQuote(stockItem.supplierId, stockItem.supplier.name)}
                      >
                        邀请报价
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })
      )}

      <RecommendReasonModal
        isOpen={!!reasonSupplier}
        onClose={() => setReasonSupplier(null)}
        supplier={reasonSupplier}
      />
    </div>
  );
}

function UrgentPublishSuccess({
  post,
  onViewDetail,
  onBackToList,
}: {
  post: UrgentPost;
  onViewDetail: () => void;
  onBackToList: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-gray-100"
      >
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToList}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900">发布成功</h1>
              <p className="text-[10px] text-gray-400">已为您推荐匹配的供应商</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="px-4 py-4 space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          className="text-center py-6"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle size={48} className="text-green-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">急件发布成功！</h2>
          <p className="text-sm text-gray-500">
            {post.carPlatform.brand} {post.partName} · {post.quantity} 件
          </p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Badge variant="primary" size="sm">
              {post.category || '已自动分类'}
            </Badge>
            <Badge variant="urgent" size="sm">
              <Clock size={8} className="mr-0.5" />
              倒计时中
            </Badge>
          </div>
        </motion.div>

        <Card variant="outlined" padding="md">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-orange-50 flex items-center justify-center">
              <Sparkles size={14} className="text-orange-500" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">推荐供应商</h3>
            <span className="text-xs text-gray-400">按匹配度排序</span>
          </div>
          <RecommendedSuppliers post={post} />
        </Card>

        <div className="flex gap-3">
          <Button variant="secondary" block onClick={onBackToList}>
            返回列表
          </Button>
          <Button variant="primary" block onClick={onViewDetail} rightIcon={<ChevronRight size={16} />}>
            查看详情
          </Button>
        </div>
      </div>
    </div>
  );
}
