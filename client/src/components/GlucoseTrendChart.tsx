import {
  CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { ChartPoint } from '../types';

export function GlucoseTrendChart({ data }: { data: ChartPoint[] }) {
  if (!data.length) return <div className="chart-empty">No readings have been recorded in this month yet.</div>;
  return (
    <div className="glucose-chart" role="img" aria-label="Line chart showing average blood glucose reading for each recorded day">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 12, right: 18, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eeeaf5" />
          <XAxis dataKey="date" tickFormatter={(date: string) => date.slice(8, 10)} tickLine={false} axisLine={false} fontSize={11} />
          <YAxis width={42} tickLine={false} axisLine={false} fontSize={11} domain={['dataMin - 20', 'dataMax + 20']} />
          <Tooltip labelFormatter={(date) => `Date: ${date}`} formatter={(value) => [`${value} mg/dL`, 'Daily average']} />
          <Line type="monotone" dataKey="average" name="Daily average" stroke="#7965ce" strokeWidth={3} dot={{ r: 4, fill: '#7965ce' }} activeDot={{ r: 6 }} />
        </LineChart>
      </ResponsiveContainer>
      <p className="chart-caption">Each point represents the average of readings recorded on that date. This chart is for tracking only, not medical interpretation.</p>
    </div>
  );
}
