import { useEffect, useState } from "react";

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Users,
  UsersRound,
  Receipt,
  FileText,
  RefreshCw,
  CalendarDays,
  ArrowUpRight,
  ArrowDownRight,
  Church,
  HandCoins,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

import api from "../services/api";

import "../styles/Dashboard.css";


const COLORS = [
  "#54265f",
  "#863b86",
  "#b68a39",
  "#d6b16b",
  "#198754",
  "#6f83b5",
  "#bb7a9d",
  "#94b49f",
  "#a99bc7",
  "#d49c74",
];


const currency = (value) => {

  return Number(value || 0).toLocaleString(
    "en-IN",
    {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  );

};


const formatDate = (value) => {

  if (!value) return "-";

  const [year, month, day] = value
    .slice(0, 10)
    .split("-");

  return `${day}/${month}/${year}`;

};


/* ==========================================
   STAT CARD
========================================== */

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}) {

  return (

    <div className={`stat-card stat-${color}`}>

      <div className="stat-card-top">

        <div className="stat-icon">

          <Icon size={25} />

        </div>

        <span className="stat-label">
          {title}
        </span>

      </div>

      <h2>{value}</h2>

      <p>{subtitle}</p>

    </div>

  );

}


/* ==========================================
   FUND CARD
========================================== */

function FundCard({
  title,
  fund,
  color,
  icon: Icon,
  filtered,
}) {

  const income = Number(fund?.income || 0);

  const expenses = Number(fund?.expenses || 0);

  const balance = Number(fund?.balance || 0);

  const percentage = income > 0
    ? Math.min(
        100,
        Math.max(0, (expenses / income) * 100)
      )
    : 0;


  return (

    <div className={`fund-card fund-${color}`}>

      <div className="fund-card-heading">

        <div className="fund-icon">

          <Icon size={24} />

        </div>

        <h3>{title}</h3>

      </div>

      <div className="fund-detail">

        <span>Total Income</span>

        <strong className="positive">
          {currency(income)}
        </strong>

      </div>

      <div className="fund-detail">

        <span>Total Expenses</span>

        <strong className="negative">
          {currency(expenses)}
        </strong>

      </div>

      <div className="fund-progress">

        <div
          style={{
            width: `${percentage}%`,
          }}
        />

      </div>

      <div className="fund-balance">

        <span>
          {filtered
            ? "Period Net Balance"
            : "Available Balance"}
        </span>

        <h2
          className={
            balance < 0 ? "negative" : ""
          }
        >
          {currency(balance)}
        </h2>

      </div>

    </div>

  );

}


/* ==========================================
   MAIN DASHBOARD
========================================== */

export default function Dashboard() {

  const { user } = useAuth();

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const [appliedDates, setAppliedDates] =
    useState({
      start_date: "",
      end_date: "",
    });

  const [refreshKey, setRefreshKey] = useState(0);


  const filtered = Boolean(
    appliedDates.start_date ||
    appliedDates.end_date
  );


  /* ========================================
     FETCH LIVE DJANGO DATA
  ======================================== */

  useEffect(() => {

    const controller = new AbortController();

    const fetchDashboard = async () => {

      setLoading(true);

      setError("");

      try {

        const params = {};

        if (appliedDates.start_date) {

          params.start_date =
            appliedDates.start_date;

        }

        if (appliedDates.end_date) {

          params.end_date =
            appliedDates.end_date;

        }

        const response = await api.get(
          "dashboard/",
          {
            params,
            signal: controller.signal,
          }
        );

        if (!controller.signal.aborted) {

          setData(response.data);

        }

      } catch (err) {

        if (controller.signal.aborted) return;

        setError(
          err.response?.data?.error ||
          err.response?.data?.detail ||
          "Unable to load dashboard. Please check your Django server."
        );

      } finally {

        if (!controller.signal.aborted) {

          setLoading(false);

        }

      }

    };

    fetchDashboard();

    return () => controller.abort();

  }, [appliedDates, refreshKey]);


  /* ========================================
     DATE FILTER
  ======================================== */

  const applyFilter = (event) => {

    event.preventDefault();

    if (
      startDate &&
      endDate &&
      startDate > endDate
    ) {

      setError(
        "Start date cannot be after end date."
      );

      return;

    }

    setAppliedDates({
      start_date: startDate,
      end_date: endDate,
    });

  };


  const resetFilter = () => {

    setStartDate("");

    setEndDate("");

    setAppliedDates({
      start_date: "",
      end_date: "",
    });

  };


  /* ========================================
     LOADING AND ERROR
  ======================================== */

  if (loading) {

    return (

      <div className="dashboard-loading">

        <LoaderCircle
          size={40}
          className="dashboard-spinner"
        />

        <h3>Loading Church Finance...</h3>

        <p>
          Fetching financial records from Django.
        </p>

      </div>

    );

  }


  if (!data) {

    return (

      <div className="dashboard-error-panel">

        <AlertCircle size={38} />

        <h2>Unable to load dashboard</h2>

        <p>{error}</p>

        <button
          className="primary-button"
          onClick={() =>
            setRefreshKey((value) => value + 1)
          }
        >

          <RefreshCw size={17} />

          Try Again

        </button>

      </div>

    );

  }


  /* ========================================
     PREPARE CHART DATA
  ======================================== */

  const summary = data.summary || {};

  const monthlyChart = (
    data.monthly_chart || []
  ).map((item) => ({
    month: item.month,
    income: Number(item.income),
    expenses: Number(item.expenses),
  }));


  const categoryChart = (
    data.offering_categories || []
  ).map((item) => ({
    name: item.category,
    value: Number(item.amount),
    group: item.group,
  }));


  const recentOfferings =
    data.recent_offerings || [];

  const recentExpenses =
    data.recent_expenses || [];


  return (

    <div className="dashboard">

      {/* WELCOME SECTION */}

      <section className="dashboard-welcome">

        <div>

          <span className="welcome-eyebrow">
            PRAISE THE LORD
          </span>

          <h1>
            Welcome back, {user?.full_name}!
          </h1>

          <p>
            Here is your church financial overview.
          </p>

        </div>

        <Church
          className="welcome-church-icon"
          size={100}
          strokeWidth={1}
        />

      </section>


      {/* DATE FILTER */}

      <section className="dashboard-filter">

        <div className="filter-heading">

          <CalendarDays size={22} />

          <div>

            <h3>Financial Overview</h3>

            <p>
              {filtered
                ? "Showing selected period"
                : "Showing all completed records"}
            </p>

          </div>

        </div>

        <form
          className="dashboard-filter-form"
          onSubmit={applyFilter}
        >

          <div className="date-field">

            <label htmlFor="startDate">
              From Date
            </label>

            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
            />

          </div>

          <div className="date-field">

            <label htmlFor="endDate">
              To Date
            </label>

            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(event) =>
                setEndDate(event.target.value)
              }
            />

          </div>

          <button
            type="submit"
            className="primary-button"
          >
            Apply
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={resetFilter}
          >
            Reset
          </button>

          <button
            type="button"
            className="refresh-button"
            title="Refresh dashboard"
            aria-label="Refresh dashboard"
            onClick={() =>
              setRefreshKey((value) => value + 1)
            }
          >
            <RefreshCw size={18} />
          </button>

        </form>

      </section>


      {error && (

        <div className="dashboard-error-message">

          <AlertCircle size={20} />

          {error}

          {" "}Previously loaded data is displayed.

        </div>

      )}


      {/* STATISTICS */}

      <section className="stats-grid">

        <StatCard
          title="Total Income"
          value={currency(summary.total_income)}
          icon={TrendingUp}
          color="green"
          subtitle="Completed offerings"
        />

        <StatCard
          title="Total Expenses"
          value={currency(summary.total_expenses)}
          icon={TrendingDown}
          color="red"
          subtitle="Completed expenses"
        />

        <StatCard
          title={
            filtered
              ? "Period Net Balance"
              : "Available Balance"
          }
          value={currency(summary.available_balance)}
          icon={Wallet}
          color={
            Number(summary.available_balance) < 0
              ? "red"
              : "purple"
          }
          subtitle="Income minus expenses"
        />

        <StatCard
          title="Total Families"
          value={summary.total_families || 0}
          icon={Users}
          color="gold"
          subtitle="Active registered families"
        />

        <StatCard
          title="Church Members"
          value={summary.total_members || 0}
          icon={UsersRound}
          color="blue"
          subtitle="Active family members"
        />

        <StatCard
          title="Cash Receipts"
          value={summary.total_receipts || 0}
          icon={Receipt}
          color="purple"
          subtitle="Completed cash receipts"
        />

        <StatCard
          title="Payment Vouchers"
          value={summary.total_vouchers || 0}
          icon={FileText}
          color="gold"
          subtitle="Completed payment vouchers"
        />

        <StatCard
          title="Today's Income"
          value={currency(summary.today_income)}
          icon={HandCoins}
          color="green"
          subtitle={
            filtered
              ? "Today within selected period"
              : "Offerings received today"
          }
        />

      </section>


      {/* FUND-WISE BALANCE */}

      <section className="dashboard-section">

        <div className="section-heading">

          <h2>Fund-wise Balance</h2>

          <p>
            Local Church and Denomination funds
          </p>

        </div>

        <div className="fund-grid">

          <FundCard
            title="Local Church Fund"
            fund={data.local_fund}
            color="purple"
            icon={Church}
            filtered={filtered}
          />

          <FundCard
            title="Denomination Fund"
            fund={data.denomination_fund}
            color="gold"
            icon={HandCoins}
            filtered={filtered}
          />

        </div>

      </section>


      {/* CHARTS */}

      <section className="dashboard-charts">

        <div className="dashboard-panel">

          <div className="panel-heading">

            <h3>Income & Expenses</h3>

            <p>
              Last six calendar months
              {filtered
                ? " within selected period"
                : ""}
            </p>

          </div>

          <div className="chart-container">

            <ResponsiveContainer
              width="100%"
              height="100%"
            >

              <BarChart data={monthlyChart}>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#eee6f0"
                />

                <XAxis
                  dataKey="month"
                  tick={{
                    fontSize: 11,
                    fill: "#807187",
                  }}
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: "#807187",
                  }}
                  tickFormatter={(value) =>
                    `₹${Number(value).toLocaleString("en-IN")}`
                  }
                  width={80}
                  tickLine={false}
                  axisLine={false}
                />

                <Tooltip
                  formatter={(value) =>
                    currency(value)
                  }
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1px solid #eee6f0",
                  }}
                />

                <Legend />

                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#863b86"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={35}
                />

                <Bar
                  dataKey="expenses"
                  name="Expenses"
                  fill="#d6b16b"
                  radius={[5, 5, 0, 0]}
                  maxBarSize={35}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>


        <div className="dashboard-panel">

          <div className="panel-heading">

            <h3>Offering Categories</h3>

            <p>Income by offering purpose</p>

          </div>

          {categoryChart.length > 0 ? (

            <>

              <div className="pie-chart-container">

                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >

                  <PieChart>

                    <Pie
                      data={categoryChart}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >

                      {categoryChart.map(
                        (item, index) => (

                          <Cell
                            key={`${item.group}-${item.name}`}
                            fill={
                              COLORS[
                                index % COLORS.length
                              ]
                            }
                          />

                        )
                      )}

                    </Pie>

                    <Tooltip
                      formatter={(value) =>
                        currency(value)
                      }
                    />

                  </PieChart>

                </ResponsiveContainer>

              </div>

              <div className="category-legend">

                {categoryChart.map(
                  (item, index) => (

                    <div
                      className="category-legend-row"
                      key={`${item.group}-${item.name}`}
                    >

                      <span
                        className="category-dot"
                        style={{
                          background:
                            COLORS[
                              index % COLORS.length
                            ],
                        }}
                      />

                      <span>
                        {item.name}
                      </span>

                      <strong>
                        {currency(item.value)}
                      </strong>

                    </div>

                  )
                )}

              </div>

            </>

          ) : (

            <div className="empty-chart">

              <HandCoins size={40} />

              <p>No offering records available.</p>

            </div>

          )}

        </div>

      </section>


      {/* RECENT OFFERINGS */}

      <section className="dashboard-panel">

        <div className="panel-heading panel-heading-row">

          <div>

            <h3>Recent Offerings</h3>

            <p>Latest completed cash receipts</p>

          </div>

          <Link
            to="/offerings"
            className="view-all-link"
          >
            View All
            <ArrowUpRight size={16} />
          </Link>

        </div>

        <div className="table-responsive">

          <table className="dashboard-table">

            <thead>

              <tr>
                <th>Receipt No.</th>
                <th>Donor / Family</th>
                <th>Date</th>
                <th>Payment Mode</th>
                <th>Amount</th>
              </tr>

            </thead>

            <tbody>

              {recentOfferings.length > 0 ? (

                recentOfferings.map((item) => (

                  <tr key={item.id}>

                    <td className="record-number">
                      {item.receipt_number}
                    </td>

                    <td>{item.donor_name}</td>

                    <td>{formatDate(item.date)}</td>

                    <td>

                      <span className="payment-label">
                        {item.payment_method}
                      </span>

                    </td>

                    <td className="positive amount-cell">

                      <ArrowUpRight size={15} />

                      {currency(item.amount)}

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan={5}
                    className="empty-table"
                  >
                    No completed offerings found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>


      {/* RECENT EXPENSES */}

      <section className="dashboard-panel">

        <div className="panel-heading panel-heading-row">

          <div>

            <h3>Recent Expenses</h3>

            <p>Latest completed payment vouchers</p>

          </div>

          <Link
            to="/expenses"
            className="view-all-link"
          >
            View All
            <ArrowUpRight size={16} />
          </Link>

        </div>

        <div className="table-responsive">

          <table className="dashboard-table">

            <thead>

              <tr>
                <th>Voucher No.</th>
                <th>Paid To</th>
                <th>Date</th>
                <th>Fund</th>
                <th>Amount</th>
              </tr>

            </thead>

            <tbody>

              {recentExpenses.length > 0 ? (

                recentExpenses.map((item) => (

                  <tr key={item.id}>

                    <td className="record-number">
                      {item.voucher_number}
                    </td>

                    <td>{item.paid_to}</td>

                    <td>{formatDate(item.date)}</td>

                    <td>{item.fund}</td>

                    <td className="negative amount-cell">

                      <ArrowDownRight size={15} />

                      {currency(item.amount)}

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan={5}
                    className="empty-table"
                  >
                    No completed expenses found.
                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>


      <div className="dashboard-verse">

        <Church size={24} />

        <p>
          “Moreover it is required in stewards,
          that a man be found faithful.”
        </p>

        <span>1 Corinthians 4:2</span>

      </div>

    </div>

  );

}