"use client";

import { motion } from "framer-motion";
import { TrendUp, CalendarCheck, CurrencyEur, XCircle, ChartBar } from "@phosphor-icons/react";
import type { Icon } from "@phosphor-icons/react";
import { MOCK_DASHBOARD_STATS, MOCK_BOOKINGS, MOCK_FIELDS } from "@/lib/mock-data";
import { formatPrice, formatDate, formatTime } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

function StatCard({
  icon: IconComponent,
  label,
  value,
  subtext,
  color = "text-vert-projecteur",
}: {
  icon: Icon;
  label: string;
  value: string | number;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="border-2 border-encre bg-encre p-5 shadow-brutal">
      <div className="flex items-start justify-between mb-3">
        <div className="text-xs font-bold text-craie/40 uppercase tracking-widest font-mono">{label}</div>
        <IconComponent size={20} weight="bold" className={color} />
      </div>
      <div className={`font-mono font-black text-4xl ${color} mb-1`}>{value}</div>
      {subtext && <div className="text-xs text-craie/40 font-mono">{subtext}</div>}
    </div>
  );
}

function RevenueBar({ day, revenue, max }: { day: string; revenue: number; max: number }) {
  const pct = Math.round((revenue / max) * 100);
  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <div className="font-mono text-xs text-craie/60">{formatPrice(revenue, "EUR").replace("€", "").trim()}</div>
      <div className="w-full bg-encre border border-encre/30 h-28 relative flex items-end">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${pct}%` }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full bg-vert-projecteur border-t-2 border-encre"
        />
      </div>
      <div className="font-mono text-xs font-bold text-craie/60 uppercase">{day}</div>
    </div>
  );
}

export default function DashboardPage() {
  const stats = MOCK_DASHBOARD_STATS;
  const maxRevenue = Math.max(...stats.revenueByDay.map((d) => d.revenue));

  return (
    <div className="min-h-screen bg-nuit-pelouse">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div aria-hidden="true" className="font-display font-black text-vert-projecteur/10 text-[60px] leading-none select-none -mb-2">
            DASHBOARD
          </div>
          <h1 className="font-display font-black text-craie uppercase text-4xl leading-none">
            Espace <span className="text-vert-projecteur">gérant</span>
          </h1>
          <p className="text-craie/50 font-mono text-sm mt-2">
            Semaine du 4 au 10 Novembre 2024
          </p>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            icon={TrendUp}
            label="Taux d'occupation"
            value={`${stats.occupancyRate}%`}
            subtext="+5% vs semaine dernière"
            color="text-vert-projecteur"
          />
          <StatCard
            icon={CurrencyEur}
            label="Revenus totaux"
            value={formatPrice(stats.totalRevenue)}
            subtext="Cette semaine"
            color="text-jaune-carton"
          />
          <StatCard
            icon={CalendarCheck}
            label="Réservations"
            value={stats.totalBookings}
            subtext={`dont ${stats.cancelledBookings} annulées`}
            color="text-orange-sifflet"
          />
          <StatCard
            icon={ChartBar}
            label="Durée moy."
            value={`${stats.avgBookingDuration}h`}
            subtext="par réservation"
            color="text-craie"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Graphique revenus */}
          <div className="lg:col-span-2 border-2 border-encre bg-encre p-6 shadow-brutal">
            <div className="font-display font-black text-craie uppercase text-xl mb-6">
              Revenus par jour
            </div>
            <div className="flex items-end gap-2">
              {stats.revenueByDay.map(({ day, revenue }) => (
                <RevenueBar key={day} day={day} revenue={revenue} max={maxRevenue} />
              ))}
            </div>
          </div>

          {/* Top terrains */}
          <div className="border-2 border-encre bg-encre p-6 shadow-brutal">
            <div className="font-display font-black text-craie uppercase text-xl mb-6">
              Top terrains
            </div>
            <div className="space-y-4">
              {stats.bookingsByField.map(({ fieldName, count }, i) => (
                <div key={fieldName}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-sm text-craie/80 font-bold">{fieldName}</span>
                    <span className="font-mono font-black text-vert-projecteur">{count}</span>
                  </div>
                  <div className="h-2 bg-encre/50 border border-encre/30">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / 35) * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.15 }}
                      className="h-full bg-vert-projecteur"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Planning des réservations */}
        <div className="mt-8 border-2 border-encre bg-encre shadow-brutal">
          <div className="border-b-2 border-encre/50 p-5 flex items-center justify-between">
            <div className="font-display font-black text-craie uppercase text-xl">
              Réservations récentes
            </div>
            <Badge variant="default">{MOCK_BOOKINGS.length} billets</Badge>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" aria-label="Tableau des réservations">
              <thead>
                <tr className="border-b-2 border-encre/30">
                  {["ID", "Terrain", "Date", "Horaire", "Montant", "Statut"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-bold text-craie/40 uppercase tracking-widest font-mono"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MOCK_BOOKINGS.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-encre/20 hover:bg-vert-projecteur/5 transition-colors"
                  >
                    <td className="px-5 py-3 font-mono text-xs text-craie/40">
                      #{booking.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3 font-bold text-craie text-sm">
                      {booking.field?.name ?? "—"}
                    </td>
                    <td className="px-5 py-3 font-mono text-sm text-craie/70">
                      {formatDate(booking.startAt)}
                    </td>
                    <td className="px-5 py-3 font-mono text-sm text-vert-projecteur font-bold">
                      {formatTime(booking.startAt)}
                    </td>
                    <td className="px-5 py-3 font-mono font-bold text-jaune-carton">
                      {formatPrice(booking.totalAmount)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        variant={
                          booking.status === "CONFIRMED" ? "confirmed" :
                          booking.status === "PENDING_PAYMENT" ? "pending" :
                          booking.status === "COMPLETED" ? "completed" :
                          "cancelled"
                        }
                      >
                        {booking.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

