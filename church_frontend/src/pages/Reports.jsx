import { useEffect, useState } from "react";

import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  Printer,
  CalendarDays,
  RefreshCw,
  ChartColumn,
  Church,
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
} from "recharts";

import * as XLSX from "xlsx";

import api from "../services/api";

import "../styles/Reports.css";


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


const dateString = (date) => {

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

};


const fundName = (group) => {

  return group === "local"
    ? "Local Church"
    : group === "denomination"
      ? "Denomination"
      : group;

};


function SummaryCard({
  title,
  amount,
  icon: Icon,
  type,
}) {

  return (

    <div className={`report-summary-card ${type}`}>

      <div className="report-summary-icon">
        <Icon size={24} />
      </div>

      <div>

        <p>{title}</p>

        <h2>{currency(amount)}</h2>

      </div>

    </div>

  );

}


function FundCard({ title, fund }) {

  return (

    <div className="report-fund-card">

      <h3>
        <Church size={20} />
        {title}
      </h3>

      <div className="report-fund-row">

        <span>Total Income</span>

        <strong className="report-income">
          {currency(fund?.income)}
        </strong>

      </div>

      <div className="report-fund-row">

        <span>Total Expenses</span>

        <strong className="report-expense">
          {currency(fund?.expenses)}
        </strong>

      </div>

      <div className="report-fund-balance">

        <span>Net Balance</span>

        <strong
          className={
            Number(fund?.balance || 0) < 0
              ? "report-expense"
              : "report-income"
          }
        >
          {currency(fund?.balance)}
        </strong>

      </div>

    </div>

  );

}


export default function Reports() {

  const [report, setReport] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [filterError, setFilterError] = useState("");

  const [period, setPeriod] = useState("all");

  const [startDate, setStartDate] = useState("");

  const [endDate, setEndDate] = useState("");

  const [appliedDates, setAppliedDates] = useState({
    start_date: "",
    end_date: "",
  });

  const [refreshKey, setRefreshKey] = useState(0);


  // ======================================
  // FETCH FINANCIAL REPORT
  // ======================================

  useEffect(() => {

    const controller = new AbortController();

    const fetchReport = async () => {

      setLoading(true);

      setError("");

      setReport(null);

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

          setReport(response.data);

        }

      } catch (err) {

        if (!controller.signal.aborted) {

          setError(
            "Unable to load financial reports. Please try again."
          );

        }

      } finally {

        if (!controller.signal.aborted) {

          setLoading(false);

        }

      }

    };

    fetchReport();

    return () => controller.abort();

  }, [appliedDates, refreshKey]);


  // ======================================
  // DATE PERIOD FILTER
  // ======================================

  const selectPeriod = (value) => {

    setPeriod(value);

    setFilterError("");

    const today = dateString(new Date());

    let start = "";

    let end = "";

    if (value === "today") {

      start = today;

      end = today;

    } else if (value === "month") {

      start = `${today.slice(0, 7)}-01`;

      end = today;

    } else if (value === "year") {

      start = `${today.slice(0, 4)}-01-01`;

      end = today;

    } else if (value === "custom") {

      return;

    }

    setStartDate(start);

    setEndDate(end);

    setAppliedDates({
      start_date: start,
      end_date: end,
    });

  };


  const applyFilter = (event) => {

    event.preventDefault();

    setFilterError("");

    if (!startDate || !endDate) {

      setFilterError(
        "Please select both From Date and To Date."
      );

      return;

    }

    if (startDate > endDate) {

      setFilterError(
        "From Date cannot be after To Date."
      );

      return;

    }

    setPeriod("custom");

    setAppliedDates({
      start_date: startDate,
      end_date: endDate,
    });

  };


  const reportPeriod = (
    appliedDates.start_date ||
    appliedDates.end_date
  )
    ? `${appliedDates.start_date || "Beginning"} to ${
        appliedDates.end_date || "Present"
      }`
    : "All Time";


  // ======================================
  // DOWNLOAD EXCEL REPORT
  // ======================================

  const downloadExcel = () => {

    if (!report) return;

    const workbook = XLSX.utils.book_new();

    const summary = report.summary || {};

    const local = report.local_fund || {};

    const denomination =
      report.denomination_fund || {};


    // Summary worksheet

    const summaryRows = [

      ["FGPC YELAHANKA CHURCH"],

      ["FINANCIAL REPORT"],

      ["Report Period", reportPeriod],

      [],

      ["Description", "Amount (INR)"],

      [
        "Total Income",
        Number(summary.total_income || 0),
      ],

      [
        "Total Expenses",
        Number(summary.total_expenses || 0),
      ],

      [
        "Net Balance",
        Number(summary.available_balance || 0),
      ],

      [],

      ["Local Church Fund"],

      ["Income", Number(local.income || 0)],

      ["Expenses", Number(local.expenses || 0)],

      ["Net Balance", Number(local.balance || 0)],

      [],

      ["Denomination Fund"],

      ["Income", Number(denomination.income || 0)],

      ["Expenses", Number(denomination.expenses || 0)],

      ["Net Balance", Number(denomination.balance || 0)],

    ];

    const summarySheet =
      XLSX.utils.aoa_to_sheet(summaryRows);

    summarySheet["!cols"] = [
      { wch: 32 },
      { wch: 32 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Financial Summary"
    );


    // Offering categories worksheet

    const categoryRows = [

      ["Category", "Fund", "Amount (INR)"],

      ...(report.offering_categories || []).map(
        (item) => [
          item.category,
          fundName(item.group),
          Number(item.amount || 0),
        ]
      ),

      [],

      [
        "Total Income",
        "",
        Number(summary.total_income || 0),
      ],

    ];

    const categorySheet =
      XLSX.utils.aoa_to_sheet(categoryRows);

    categorySheet["!cols"] = [
      { wch: 30 },
      { wch: 25 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      categorySheet,
      "Offering Categories"
    );


    // Monthly summary worksheet

    const monthlyRows = [

      ["Month", "Income", "Expenses", "Net Balance"],

      ...(report.monthly_chart || []).map(
        (item) => [

          item.month,

          Number(item.income || 0),

          Number(item.expenses || 0),

          Number(item.income || 0) -
            Number(item.expenses || 0),

        ]
      ),

    ];

    const monthlySheet =
      XLSX.utils.aoa_to_sheet(monthlyRows);

    monthlySheet["!cols"] = [
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      monthlySheet,
      "Last 6 Months"
    );


    XLSX.writeFile(
      workbook,
      `FGPC-Financial-Report-${dateString(new Date())}.xlsx`
    );

  };


  // ======================================
  // PRINT REPORT
  // ======================================

  const printReport = () => {

    window.print();

  };


  const summary = report?.summary || {};

  const categories =
    report?.offering_categories || [];

  const chartData = (
    report?.monthly_chart || []
  ).map((item) => ({

    month: item.month,

    income: Number(item.income || 0),

    expenses: Number(item.expenses || 0),

  }));


  // ======================================
  // REPORT PAGE
  // ======================================

  return (

    <div className="reports-page">

      {/* PAGE HEADING */}

      <div className="reports-header">

        <div>

          <h1>Financial Reports</h1>

          <p>
            Monitor and analyse church financial transactions.
          </p>

        </div>

        <div className="reports-actions">

          <button
            className="report-button report-refresh-button"
            onClick={() => setRefreshKey(
              (previous) => previous + 1
            )}
            disabled={loading}
          >
            <RefreshCw size={17} />
            Refresh
          </button>

          <button
            className="report-button report-print-button"
            onClick={printReport}
            disabled={loading || !report}
          >
            <Printer size={17} />
            Print Report
          </button>

          <button
            className="report-button report-excel-button"
            onClick={downloadExcel}
            disabled={loading || !report}
          >
            <Download size={17} />
            Download Excel
          </button>

        </div>

      </div>


      {/* REPORT FILTERS */}

      <div className="report-filter-card">

        <h3>
          <CalendarDays size={20} />
          Report Period
        </h3>

        <div className="report-period-buttons">

          {[
            ["today", "Today"],
            ["month", "This Month"],
            ["year", "This Year"],
            ["all", "All Time"],
            ["custom", "Custom Date"],
          ].map(([value, label]) => (

            <button
              key={value}
              type="button"
              className={
                period === value
                  ? "report-period-button active"
                  : "report-period-button"
              }
              onClick={() => selectPeriod(value)}
            >
              {label}
            </button>

          ))}

        </div>

        <form
          className="report-date-form"
          onSubmit={applyFilter}
        >

          <div className="report-date-field">

            <label>From Date</label>

            <input
              type="date"
              value={startDate}
              onChange={(event) => {

                setStartDate(event.target.value);

                setPeriod("custom");

              }}
            />

          </div>

          <div className="report-date-field">

            <label>To Date</label>

            <input
              type="date"
              value={endDate}
              onChange={(event) => {

                setEndDate(event.target.value);

                setPeriod("custom");

              }}
            />

          </div>

          <button
            type="submit"
            className="report-button report-print-button"
          >
            Generate Report
          </button>

          <button
            type="button"
            className="report-button report-refresh-button"
            onClick={() => selectPeriod("all")}
          >
            Reset
          </button>

        </form>

        {filterError && (

          <div className="report-error">

            <AlertCircle size={18} />

            {filterError}

          </div>

        )}

      </div>


      {/* LOADING */}

      {loading && (

        <div className="report-loading">

          <LoaderCircle
            size={35}
            className="report-spinner"
          />

          <p>Loading financial reports...</p>

        </div>

      )}


      {/* API ERROR */}

      {!loading && error && (

        <div className="report-error">

          <AlertCircle size={20} />

          {error}

          <button
            className="report-button report-refresh-button"
            onClick={() => setRefreshKey(
              (previous) => previous + 1
            )}
          >
            Retry
          </button>

        </div>

      )}


      {/* FINANCIAL REPORT CONTENT */}

      {!loading && report && (

        <div className="report-print-area">

          <div className="report-print-heading">

            <p>PRAISE THE LORD</p>

            <h2>FULL GOSPEL PENTECOSTAL CHURCH</h2>

            <h3>YELAHANKA</h3>

            <p>
              Thirumalappa Nagar, Attur 2nd Stage,
              Yelahanka, Bangalore - 560064
            </p>

            <h2>FINANCIAL REPORT</h2>

          </div>

          <div className="report-selected-period">

            <CalendarDays size={17} />

            Report Period: <strong>{reportPeriod}</strong>

          </div>


          {/* SUMMARY CARDS */}

          <div className="report-summary-grid">

            <SummaryCard
              title="Total Income"
              amount={summary.total_income}
              icon={TrendingUp}
              type="income"
            />

            <SummaryCard
              title="Total Expenses"
              amount={summary.total_expenses}
              icon={TrendingDown}
              type="expense"
            />

            <SummaryCard
              title="Net Balance"
              amount={summary.available_balance}
              icon={Wallet}
              type={
                Number(summary.available_balance || 0) < 0
                  ? "expense"
                  : "balance"
              }
            />

          </div>


          {/* FUND DETAILS */}

          <div className="report-fund-grid">

            <FundCard
              title="Local Church Fund"
              fund={report.local_fund}
            />

            <FundCard
              title="Denomination Fund"
              fund={report.denomination_fund}
            />

          </div>


          {/* MONTHLY CHART */}

          <div className="report-panel">

            <h3>

              <ChartColumn size={21} />

              Income vs Expenses

            </h3>

            <p className="report-panel-description">

              Last six calendar months within
              the selected report period.

            </p>

            <div className="report-chart">

              <ResponsiveContainer
                width="100%"
                height="100%"
              >

                <BarChart data={chartData}>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E9E0ED"
                  />

                  <XAxis dataKey="month" />

                  <YAxis
                    tickFormatter={(value) =>
                      `₹${Number(value).toLocaleString("en-IN")}`
                    }
                    width={85}
                  />

                  <Tooltip
                    formatter={(value) => currency(value)}
                  />

                  <Legend />

                  <Bar
                    dataKey="income"
                    name="Income"
                    fill="#863B86"
                    radius={[5, 5, 0, 0]}
                  />

                  <Bar
                    dataKey="expenses"
                    name="Expenses"
                    fill="#C6A15B"
                    radius={[5, 5, 0, 0]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>


          {/* OFFERING CATEGORY REPORT */}

          <div className="report-panel">

            <h3>Offering Category Report</h3>

            <p className="report-panel-description">

              Contributions grouped by offering purpose.

            </p>

            <div className="report-table-wrapper">

              <table className="financial-report-table">

                <thead>

                  <tr>

                    <th>S.No</th>

                    <th>Offering Category</th>

                    <th>Fund</th>

                    <th>Amount</th>

                    <th>Percentage</th>

                  </tr>

                </thead>

                <tbody>

                  {categories.length === 0 ? (

                    <tr>

                      <td
                        colSpan="5"
                        className="report-empty"
                      >

                        No offerings found for
                        the selected period.

                      </td>

                    </tr>

                  ) : (

                    categories.map((item, index) => {

                      const total = Number(
                        summary.total_income || 0
                      );

                      const percentage = total > 0

                        ? (
                            Number(item.amount || 0) /
                            total * 100
                          ).toFixed(1)

                        : "0.0";

                      return (

                        <tr
                          key={`${item.group}-${item.category}-${index}`}
                        >

                          <td>{index + 1}</td>

                          <td>{item.category}</td>

                          <td>

                            <span
                              className={
                                `report-fund-label ${item.group}`
                              }
                            >

                              {fundName(item.group)}

                            </span>

                          </td>

                          <td className="report-amount">

                            {currency(item.amount)}

                          </td>

                          <td>{percentage}%</td>

                        </tr>

                      );

                    })

                  )}

                </tbody>

                <tfoot>

                  <tr>

                    <td colSpan="3">
                      Total Offering Income
                    </td>

                    <td>
                      {currency(summary.total_income)}
                    </td>

                    <td>
                      {
                        Number(summary.total_income || 0) > 0
                          ? "100%"
                          : "0%"
                      }
                    </td>

                  </tr>

                </tfoot>

              </table>

            </div>

          </div>


          {/* FINAL FINANCIAL SUMMARY */}

          <div className="report-panel">

            <h3>Final Financial Summary</h3>

            <div className="report-final-summary">

              <div>

                <span>Total Income</span>

                <strong className="report-income">

                  {currency(summary.total_income)}

                </strong>

              </div>

              <div>

                <span>Less: Total Expenses</span>

                <strong className="report-expense">

                  {currency(summary.total_expenses)}

                </strong>

              </div>

              <div className="report-final-balance">

                <span>Net Balance</span>

                <strong>

                  {currency(summary.available_balance)}

                </strong>

              </div>

            </div>

            <p className="report-balance-note">

              Net balance represents recorded income
              minus recorded expenses for the selected
              period. Opening balances are not included.

            </p>

          </div>


          {/* PRINT SIGNATURES */}

          <div className="report-signatures">

            <div>Prepared By</div>

            <div>Cashier-in-charge</div>

            <div>Pastor</div>

          </div>


          {/* BIBLE VERSE */}

          <div className="report-verse">

            “Moreover it is required in stewards,
            that a man be found faithful.”

            <strong> — 1 Corinthians 4:2</strong>

          </div>

        </div>

      )}

    </div>

  );

}