import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import { reportCards, reportSeries } from "../utils/adminFallbackData";

function Reports() {
  return (
    <div>
      <PageHeader title="Reports" subtitle="Performance analytics and platform KPI trends." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {reportCards.map((card, index) => (
          <StatCard key={card.label} title={card.label} value={card.value} growth="Monthly" trend="up" index={index} />
        ))}
      </div>

      <div className="mt-6">
        <ChartCard title="Engagement vs Conversion" subtitle="Monthly analytics summary">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={reportSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#33415533" />
              <XAxis dataKey="month" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="engagement" stroke="#6366f1" strokeWidth={2} />
              <Line type="monotone" dataKey="conversion" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

export default Reports;
