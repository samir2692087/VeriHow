import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface GaugeProps {
  score: number;
}

const Gauge: React.FC<GaugeProps> = ({ score }) => {
  // Determine color based on score
  let color = '#ef4444'; // Red (0-39)
  if (score >= 40 && score < 70) color = '#f59e0b'; // Amber (40-69)
  if (score >= 70) color = '#10b981'; // Emerald (70-100)

  const data = [
    { name: 'Score', value: score },
    { name: 'Remainder', value: 100 - score },
  ];

  const emptyData = [
     { name: 'Empty', value: 100 }
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={emptyData}
            cx="50%"
            cy="70%"
            startAngle={180}
            endAngle={0}
            innerRadius="60%"
            outerRadius="80%"
            fill="#1e293b"
            dataKey="value"
            stroke="none"
          />
          <Pie
            data={data}
            cx="50%"
            cy="70%"
            startAngle={180}
            endAngle={0}
            innerRadius="60%"
            outerRadius="80%"
            dataKey="value"
            stroke="none"
            cornerRadius={6}
          >
            <Cell key="cell-0" fill={color} />
            <Cell key="cell-1" fill="transparent" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      
      <div className="absolute top-[60%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-3xl sm:text-4xl font-bold font-mono transition-all" style={{ color }}>
          {score}
        </div>
        <div className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest mt-1">
          Trust Score
        </div>
      </div>
    </div>
  );
};

export default Gauge;