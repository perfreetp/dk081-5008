import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronUp,
  Truck,
  ShieldCheck,
  Zap,
  Send,
  FileText,
  Calendar,
  Package,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Chip from '@/components/ui/Chip';
import { cn } from '@/lib/utils';
import { formatPrice, formatWarrantyDays } from '@/utils/format';

export interface QuickQuoteData {
  carModel: string;
  oeNumber: string;
  price: number;
  shippingFee: number;
  warrantyDays: number;
  canShipToday: boolean;
  conditionType: 'new' | 'used' | 'refurbished';
  remark: string;
}

export interface QuickQuoteBarProps {
  defaultExpanded?: boolean;
  initialData?: Partial<QuickQuoteData>;
  onSendQuote?: (data: QuickQuoteData) => void;
  onOpenTemplate?: () => void;
  className?: string;
}

const conditionOptions: Array<{
  value: QuickQuoteData['conditionType'];
  label: string;
  variant: 'primary' | 'info' | 'warning';
}> = [
  { value: 'new', label: '全新件', variant: 'primary' },
  { value: 'used', label: '拆车件', variant: 'info' },
  { value: 'refurbished', label: '再制造', variant: 'warning' },
];

const warrantyOptions = [0, 7, 30, 90, 180, 365, 730];

export default function QuickQuoteBar({
  defaultExpanded = false,
  initialData,
  onSendQuote,
  onOpenTemplate,
  className,
}: QuickQuoteBarProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [formData, setFormData] = useState<QuickQuoteData>({
    carModel: initialData?.carModel || '',
    oeNumber: initialData?.oeNumber || '',
    price: initialData?.price || 0,
    shippingFee: initialData?.shippingFee || 0,
    warrantyDays: initialData?.warrantyDays || 90,
    canShipToday: initialData?.canShipToday ?? false,
    conditionType: initialData?.conditionType || 'used',
    remark: initialData?.remark || '',
  });

  const totalPrice = formData.price + formData.shippingFee;
  const isValid = formData.price > 0;

  const updateField = <K extends keyof QuickQuoteData>(
    key: K,
    value: QuickQuoteData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSend = () => {
    if (!isValid) return;
    onSendQuote?.(formData);
  };

  return (
    <motion.div
      layout
      className={cn(
        'bg-white rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.08)]',
        'border-t border-gray-100 overflow-hidden',
        className
      )}
    >
      <motion.div
        layout
        className="flex items-center justify-between px-5 py-3 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ rotate: expanded ? 0 : [0, -5, 5, -5, 0] }}
            transition={{ duration: 0.5 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 flex items-center justify-center shadow-sm shadow-accent-500/30"
          >
            <Zap size={18} className="text-white" />
          </motion.div>
          <div>
            <div className="text-sm font-semibold text-ink-700">快速报价</div>
            <div className="text-[11px] text-gray-400">
              {isValid
                ? `总价 ${formatPrice(totalPrice)} · ${formatWarrantyDays(formData.warrantyDays)}`
                : '填写价格后一键发送报价卡片'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {expanded && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTemplate?.();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-50 text-primary-600 text-xs font-medium hover:bg-primary-100 transition-colors"
              >
                <FileText size={13} />
                报价模板
              </motion.button>
            )}
          </AnimatePresence>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"
          >
            <ChevronDown size={18} className="text-gray-500" />
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
                    <Package size={11} />
                    车型
                  </label>
                  <input
                    type="text"
                    value={formData.carModel}
                    onChange={(e) => updateField('carModel', e.target.value)}
                    placeholder="如:宝马5系 G38"
                    className="w-full h-11 px-3.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-ink-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
                    <FileText size={11} />
                    OE号
                  </label>
                  <input
                    type="text"
                    value={formData.oeNumber}
                    onChange={(e) => updateField('oeNumber', e.target.value)}
                    placeholder="配件原厂编号"
                    className="w-full h-11 px-3.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-ink-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
                    <span className="text-accent-600 font-semibold">¥</span>
                    配件单价
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.price || ''}
                      onChange={(e) => updateField('price', parseFloat(e.target.value) || 0)}
                      placeholder="请输入价格"
                      className="w-full h-11 pl-3.5 pr-16 rounded-xl bg-accent-50/50 border-2 border-accent-200/60 text-sm font-semibold text-accent-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-accent-500/30 focus:border-accent-400 transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                      元
                    </span>
                  </div>
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
                    <Truck size={11} />
                    运费
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={formData.shippingFee || ''}
                      onChange={(e) => updateField('shippingFee', parseFloat(e.target.value) || 0)}
                      placeholder="0为包邮"
                      className="w-full h-11 pl-3.5 pr-16 rounded-xl bg-gray-50 border border-gray-100 text-sm font-semibold text-ink-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-400">
                      元
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                  <Calendar size={11} />
                  质保期
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {warrantyOptions.map((days) => (
                    <motion.button
                      key={days}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => updateField('warrantyDays', days)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                        formData.warrantyDays === days
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm shadow-primary-500/30'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                      )}
                    >
                      {days === 0 ? '无质保' : formatWarrantyDays(days)}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-2 block">配件成色</label>
                <div className="flex gap-2">
                  {conditionOptions.map((opt) => (
                    <Chip
                      key={opt.value}
                      variant={formData.conditionType === opt.value ? opt.variant : 'default'}
                      size="md"
                      onSelect={() => updateField('conditionType', opt.value)}
                      className={cn(
                        'flex-1 justify-center',
                        formData.conditionType === opt.value && 'ring-2 ring-offset-1'
                      )}
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div
                className={cn(
                  'flex items-center justify-between p-3.5 rounded-xl border-2 transition-all cursor-pointer',
                  formData.canShipToday
                    ? 'bg-success-50 border-success-200'
                    : 'bg-gray-50 border-gray-100'
                )}
                onClick={() => updateField('canShipToday', !formData.canShipToday)}
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      scale: formData.canShipToday ? [1, 1.15, 1] : 1,
                    }}
                    transition={{ duration: 0.4 }}
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      formData.canShipToday
                        ? 'bg-gradient-to-br from-success-500 to-success-600 shadow-sm shadow-success-500/30'
                        : 'bg-gray-200'
                    )}
                  >
                    <Truck size={20} className="text-white" />
                  </motion.div>
                  <div>
                    <div
                      className={cn(
                        'text-sm font-semibold',
                        formData.canShipToday ? 'text-success-700' : 'text-ink-600'
                      )}
                    >
                      当天发货
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {formData.canShipToday ? '下单后24小时内发出' : '1-2个工作日内发货'}
                    </div>
                  </div>
                </div>
                <motion.div
                  animate={{
                    backgroundColor: formData.canShipToday ? '#22C55E' : '#D1D5DB',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="relative w-12 h-7 rounded-full p-1"
                >
                  <motion.div
                    animate={{ x: formData.canShipToday ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="w-5 h-5 rounded-full bg-white shadow-md"
                  />
                </motion.div>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-r from-primary-50 via-accent-50 to-success-50">
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-xs text-gray-500">含运费总价</span>
                  <Badge variant="success" size="sm" icon={<ShieldCheck size={10} />}>
                    平台担保
                  </Badge>
                </div>
                <motion.div
                  key={totalPrice}
                  initial={{ scale: 1.05, y: -2 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  className="text-2xl font-bold text-danger-600"
                >
                  {formatPrice(totalPrice)}
                </motion.div>
              </div>

              <textarea
                value={formData.remark}
                onChange={(e) => updateField('remark', e.target.value)}
                placeholder="添加备注信息（可选），如：原厂件、顺丰包邮等..."
                rows={2}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-sm text-ink-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400 transition-all resize-none"
              />

              <Button
                variant="primary"
                size="lg"
                block
                loading={!isValid}
                leftIcon={<Send size={18} />}
                onClick={handleSend}
                className={cn(
                  'h-12 text-base',
                  isValid && 'bg-gradient-to-r from-primary-600 via-accent-600 to-primary-600 bg-[length:200%_100%] hover:bg-[position:100%_0] transition-all duration-500'
                )}
              >
                发送报价卡片
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
