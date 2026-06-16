import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AlertTriangle, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';
import Chip from '@/components/ui/Chip';
import { cn } from '@/lib/utils';

interface PigeonData {
  name: string;
  value: number;
  color: string;
}

interface WrongShipTrendPoint {
  date: string;
  rate: number;
}

interface ReputationChartProps {
  pigeonRate?: number;
  totalDeals?: number;
  className?: string;
}

const generatePigeonData = (rate: number, total: number): PigeonData[] => {
  const pigeonCount = Math.round(total * rate);
  const normalCount = total - pigeonCount;
  return [
    { name: '正常履约', value: normalCount, color: '#22C55E' },
    { name: '放鸽子', value: pigeonCount, color: '#EF4444' },
  ];
};

const generateWrongShipTrend = (days: number, baseRate: number): WrongShipTrendPoint[] => {
  const data: WrongShipTrendPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const variation = (Math.random() - 0.5) * 0.01;
    const rate = Math.max(0, Math.min(0.05, baseRate + variation));
    data.push({
      date: `${month}/${day}`,
      rate: Math.round(rate * 10000) / 100,
    });
  }
  return data;
};

const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-xs font-bold"
    >
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

export default function ReputationChart({
  pigeonRate = 0.02,
  totalDeals = 1000,
  className,
}: ReputationChartProps) {
  const [trendDays, setTrendDays] = useState<'7' | '30'>('7');
  const [chartType, setChartType] = useState<'pie' | 'donut'>('donut');

  const pigeonData = useMemo(() => generatePigeonData(pigeonRate, totalDeals), [pigeonRate, totalDeals]);

  const wrongShipTrend = useMemo(
    () => generateWrongShipTrend(Number(trendDays), 0.012),
    [trendDays]
  );

  const pigeonPercent = (pigeonRate * 100).toFixed(2);

  return (
    <div className={cn('space-y-4', className)}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl bg-white p-5 shadow-card"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-700">放鸽子率统计</h3>
              <p className="text-xs text-ink-400">基于 {totalDeals} 笔交易记录</p>
            </div>
          </div>
          <div className="flex gap-1 rounded-xl bg-gray-100 p-0.5">
            <button
              onClick={() => setChartType('donut')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
                chartType === 'donut'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700'
              )}
            >
              环形图
            </button>
            <button
              onClick={() => setChartType('pie')}
              className={cn(
                'rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
                chartType === 'pie'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-ink-500 hover:text-ink-700'
              )}
            >
              饼图
            </button>
          </div>
        </div>

        <div className="relative h-52">
          <motion.div
            key={chartType}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pigeonData}
                  cx="50%"
                  cy="50%"
                  innerRadius={chartType === 'donut' ? 55 : 0}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  labelLine={false}
                  label={renderCustomLabel}
                  animationBegin={0}
                  animationDuration={800}
                  animationEasing="ease-out"
                >
                  {pigeonData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value} 笔 (${((value / totalDeals) * 100).toFixed(2)}%)`,
                    name,
                  ]}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {chartType === 'donut' && (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-red-500">{pigeonPercent}%</span>
              <span className="text-xs text-ink-400">放鸽子率</span>
            </div>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 rounded-xl bg-green-50 p-3"
          >
            <CheckCircle2 size={18} className="text-green-500" />
            <div>
              <p className="text-lg font-bold text-green-600">{pigeonData[0].value}</p>
              <p className="text-xs text-green-700/70">正常履约</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-2 rounded-xl bg-red-50 p-3"
          >
            <AlertTriangle size={18} className="text-red-500" />
            <div>
              <p className="text-lg font-bold text-red-600">{pigeonData[1].value}</p>
              <p className="text-xs text-red-700/70">放鸽子</p>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-2xl bg-white p-5 shadow-card"
      >
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <TrendingUp size={18} className="text-blue-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-700">错发率趋势</h3>
              <p className="text-xs text-ink-400">错发/错配配件比例</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Calendar size={14} className="text-ink-400" />
            <Chip
              variant={trendDays === '7' ? 'primary' : 'default'}
              size="sm"
              selected={trendDays === '7'}
              onSelect={() => setTrendDays('7')}
            >
              近7天
            </Chip>
            <Chip
              variant={trendDays === '30' ? 'primary' : 'default'}
              size="sm"
              selected={trendDays === '30'}
              onSelect={() => setTrendDays('30')}
            >
              近30天
            </Chip>
          </div>
        </div>

        <div className="h-52">
          <motion.div
            key={trendDays}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={wrongShipTrend} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4B7FB8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4B7FB8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E4E9F0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#98A5B7' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E4E9F0' }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#98A5B7' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  formatter={(value: number) => [`${value}%`, '错发率']}
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: '#475569', fontWeight: 600 }}
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  name="错发率"
                  stroke="#4B7FB8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#4B7FB8', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#2F5F99', stroke: '#fff', strokeWidth: 2 }}
                  animationBegin={0}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-50 p-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            <span className="text-xs text-ink-500">平均错发率</span>
          </div>
          <span className="text-sm font-bold text-primary-600">
            {(
              wrongShipTrend.reduce((sum, d) => sum + d.rate, 0) / wrongShipTrend.length
            ).toFixed(2)}
            %
          </span>
        </div>
      </motion.div>
    </div>
  );
}
