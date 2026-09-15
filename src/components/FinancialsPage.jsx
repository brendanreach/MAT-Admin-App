import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Plus,
  ReceiptText,
  Trash2,
  TrendingUp,
  WalletCards,
  X,
} from 'lucide-react'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { supabase } from '../lib/supabase.js'

const INCOME_CATEGORIES = [
  'Tuition',
  'Private Lesson',
  'Testing Fee',
  'Uniform / Equipment Sale',
  'Seminar',
  'Other Income',
]

const EXPENSE_CATEGORIES = [
  'Equipment',
  'Tournament / Travel',
  'Coaching',
  'Facility',
  'Insurance',
  'Marketing',
  'Uniforms',
  'Office / Software',
  'Team Event',
  'Other Expense',
]

const emptyTransaction = {
  transaction_type: 'income',
  category: 'Tuition',
  description: '',
  amount: '',
  transaction_date:
    new Date().toISOString().slice(0, 10),
  member_id: '',
  notes: '',
}

function FinancialsPage({
  members,
  tournaments,
  allTournamentEntries,
}) {
  const [
    transactions,
    setTransactions,
  ] = useState([])

  const [
    memberTuition,
    setMemberTuition,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    showTransactionForm,
    setShowTransactionForm,
  ] = useState(false)

  const [
    transactionForm,
    setTransactionForm,
  ] = useState(emptyTransaction)

  const [
    saving,
    setSaving,
  ] = useState(false)

  const [
    message,
    setMessage,
  ] = useState('')

  const [
    yearFilter,
    setYearFilter,
  ] = useState(
    String(
      new Date().getFullYear()
    )
  )

  useEffect(() => {
    loadFinancialData()
  }, [])

  async function loadFinancialData() {
    setLoading(true)
    setMessage('')

    await Promise.all([
      loadTransactions(),
      loadMemberTuition(),
    ])

    setLoading(false)
  }

  async function loadTransactions() {
    const {
      data,
      error,
    } =
      await supabase
        .from(
          'financial_transactions'
        )
        .select('*')
        .order(
          'transaction_date',
          {
            ascending: false,
          }
        )

    if (error) {
      setMessage(
        error.message
      )

      setTransactions([])
      return
    }

    setTransactions(
      data || []
    )
  }

  async function loadMemberTuition() {
    const {
      data,
      error,
    } =
      await supabase.rpc(
        'get_member_tuition_admin'
      )

    if (error) {
      setMessage(
        error.message
      )

      setMemberTuition([])
      return
    }

    setMemberTuition(
      data || []
    )
  }

  const activeMembers =
    useMemo(
      () =>
        members.filter(
          (member) =>
            member.is_active
        ),
      [members]
    )

  const expectedMonthlyTuition =
    useMemo(() => {
      return activeMembers.reduce(
        (
          total,
          member
        ) => {
          const tuitionRecord =
            memberTuition.find(
              (item) =>
                item.member_id ===
                member.id
            )

          return (
            total +
            Number(
              tuitionRecord?.monthly_tuition ||
                0
            )
          )
        },
        0
      )
    }, [
      activeMembers,
      memberTuition,
    ])

  const availableYears =
    useMemo(() => {
      const years =
        new Set([
          new Date().getFullYear(),
        ])

      transactions.forEach(
        (transaction) => {
          if (
            transaction.transaction_date
          ) {
            years.add(
              Number(
                transaction.transaction_date.slice(
                  0,
                  4
                )
              )
            )
          }
        }
      )

      return Array.from(
        years
      )
        .sort(
          (a, b) =>
            b - a
        )
        .map(String)
    }, [transactions])

  const filteredTransactions =
    useMemo(
      () =>
        transactions.filter(
          (transaction) =>
            transaction.transaction_date?.startsWith(
              yearFilter
            )
        ),
      [
        transactions,
        yearFilter,
      ]
    )

  const totalIncome =
    useMemo(
      () =>
        filteredTransactions
          .filter(
            (transaction) =>
              transaction.transaction_type ===
              'income'
          )
          .reduce(
            (
              total,
              transaction
            ) =>
              total +
              Number(
                transaction.amount ||
                  0
              ),
            0
          ),
      [filteredTransactions]
    )

  const totalExpenses =
    useMemo(
      () =>
        filteredTransactions
          .filter(
            (transaction) =>
              transaction.transaction_type ===
              'expense'
          )
          .reduce(
            (
              total,
              transaction
            ) =>
              total +
              Number(
                transaction.amount ||
                  0
              ),
            0
          ),
      [filteredTransactions]
    )

  const netCashFlow =
    totalIncome -
    totalExpenses

  const monthlyData =
    useMemo(() => {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ]

      const months =
        monthNames.map(
          (month) => ({
            month,
            income: 0,
            spending: 0,
            net: 0,
          })
        )

      filteredTransactions.forEach(
        (transaction) => {
          if (
            !transaction.transaction_date
          ) {
            return
          }

          const monthIndex =
            Number(
              transaction.transaction_date.slice(
                5,
                7
              )
            ) - 1

          if (
            monthIndex < 0 ||
            monthIndex > 11
          ) {
            return
          }

          const amount =
            Number(
              transaction.amount ||
                0
            )

          if (
            transaction.transaction_type ===
            'income'
          ) {
            months[
              monthIndex
            ].income += amount
          } else {
            months[
              monthIndex
            ].spending += amount
          }
        }
      )

      return months.map(
        (month) => ({
          ...month,
          net:
            month.income -
            month.spending,
        })
      )
    }, [filteredTransactions])

  const tournamentFeeOutstanding =
    useMemo(() => {
      return tournaments.reduce(
        (
          total,
          tournament
        ) => {
          const entries =
            allTournamentEntries.filter(
              (entry) =>
                entry.tournament_id ===
                tournament.id &&
                !entry.has_paid
            )

          return (
            total +
            entries.length *
              Number(
                tournament.entry_fee ||
                  0
              )
          )
        },
        0
      )
    }, [
      tournaments,
      allTournamentEntries,
    ])

  const spendingByCategory =
    useMemo(() => {
      const totals = {}

      filteredTransactions
        .filter(
          (transaction) =>
            transaction.transaction_type ===
            'expense'
        )
        .forEach(
          (transaction) => {
            const category =
              transaction.category ||
              'Other Expense'

            totals[category] =
              (
                totals[category] ||
                0
              ) +
              Number(
                transaction.amount ||
                  0
              )
          }
        )

      return Object.entries(
        totals
      )
        .map(
          ([
            category,
            amount,
          ]) => ({
            category,
            amount,
          })
        )
        .sort(
          (a, b) =>
            b.amount -
            a.amount
        )
    }, [filteredTransactions])

  function getMemberName(
    memberId
  ) {
    if (!memberId) {
      return ''
    }

    const member =
      members.find(
        (item) =>
          item.id === memberId
      )

    if (!member) {
      return ''
    }

    return `${member.first_name} ${member.last_name}`
  }

  function formatMoney(
    amount
  ) {
    return Number(
      amount || 0
    ).toLocaleString(
      'en-US',
      {
        style: 'currency',
        currency: 'USD',
      }
    )
  }

  function formatDate(
    dateString
  ) {
    if (!dateString) {
      return '—'
    }

    const date =
      new Date(
        `${dateString}T00:00:00`
      )

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return dateString
    }

    return date.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }
    )
  }

  function openAddTransaction() {
    setTransactionForm(
      emptyTransaction
    )

    setMessage('')
    setShowTransactionForm(
      true
    )
  }

  function handleTransactionChange(
    event
  ) {
    const {
      name,
      value,
    } = event.target

    setTransactionForm(
      (current) => {
        if (
          name ===
          'transaction_type'
        ) {
          return {
            ...current,
            transaction_type:
              value,

            category:
              value === 'income'
                ? 'Tuition'
                : 'Equipment',
          }
        }

        return {
          ...current,
          [name]: value,
        }
      }
    )
  }

  async function saveTransaction(
    event
  ) {
    event.preventDefault()

    setSaving(true)
    setMessage('')

    const {
      error,
    } =
      await supabase
        .from(
          'financial_transactions'
        )
        .insert([
          {
            transaction_type:
              transactionForm.transaction_type,

            category:
              transactionForm.category,

            description:
              transactionForm.description.trim(),

            amount:
              Number(
                transactionForm.amount
              ),

            transaction_date:
              transactionForm.transaction_date,

            member_id:
              transactionForm.member_id ||
              null,

            notes:
              transactionForm.notes.trim() ||
              null,
          },
        ])

    if (error) {
      setMessage(
        error.message
      )

      setSaving(false)
      return
    }

    await loadTransactions()

    setSaving(false)
    setShowTransactionForm(
      false
    )
  }

  async function deleteTransaction(
    transactionId
  ) {
    const confirmed =
      window.confirm(
        'Delete this financial transaction?'
      )

    if (!confirmed) {
      return
    }

    const {
      error,
    } =
      await supabase
        .from(
          'financial_transactions'
        )
        .delete()
        .eq(
          'id',
          transactionId
        )

    if (error) {
      setMessage(
        error.message
      )

      return
    }

    await loadTransactions()
  }

  const categories =
    transactionForm.transaction_type ===
    'income'
      ? INCOME_CATEGORIES
      : EXPENSE_CATEGORIES

  return (
    <div className="mat-page">

      <div className="mat-financial-header">

        <div>
          <div className="mat-eyebrow">
            MAT Financial Administration
          </div>

          <h1 className="mat-section-title">
            Financials
          </h1>

          <p className="mat-section-description">
            Track actual income,
            team spending, cash flow,
            and expected tuition.
          </p>
        </div>

        <div className="mat-financial-header-actions">

          <select
            className="mat-select"
            value={
              yearFilter
            }
            onChange={(
              event
            ) =>
              setYearFilter(
                event.target
                  .value
              )
            }
          >
            {availableYears.map(
              (year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              )
            )}
          </select>

          <button
            type="button"
            className="mat-primary-button"
            onClick={
              openAddTransaction
            }
          >
            <Plus
              size={19}
            />

            Add Transaction
          </button>

        </div>

      </div>

      {message && (
        <div className="mat-error">
          {message}
        </div>
      )}

      <div className="mat-financial-kpi-grid">

        <div className="mat-financial-kpi income">

          <div className="mat-financial-kpi-icon">
            <ArrowUpRight
              size={22}
            />
          </div>

          <div>
            <span>
              Actual Income
            </span>

            <strong>
              {formatMoney(
                totalIncome
              )}
            </strong>

            <small>
              Recorded in{' '}
              {yearFilter}
            </small>
          </div>

        </div>

        <div className="mat-financial-kpi expense">

          <div className="mat-financial-kpi-icon">
            <ArrowDownRight
              size={22}
            />
          </div>

          <div>
            <span>
              Team Spending
            </span>

            <strong>
              {formatMoney(
                totalExpenses
              )}
            </strong>

            <small>
              Recorded in{' '}
              {yearFilter}
            </small>
          </div>

        </div>

        <div
          className={`mat-financial-kpi ${
            netCashFlow >= 0
              ? 'net-positive'
              : 'net-negative'
          }`}
        >

          <div className="mat-financial-kpi-icon">
            <TrendingUp
              size={22}
            />
          </div>

          <div>
            <span>
              Net Cash Flow
            </span>

            <strong>
              {formatMoney(
                netCashFlow
              )}
            </strong>

            <small>
              Income minus spending
            </small>
          </div>

        </div>

        <div className="mat-financial-kpi expected">

          <div className="mat-financial-kpi-icon">
            <WalletCards
              size={22}
            />
          </div>

          <div>
            <span>
              Expected Monthly Tuition
            </span>

            <strong>
              {formatMoney(
                expectedMonthlyTuition
              )}
            </strong>

            <small>
              {activeMembers.length}{' '}
              active athletes
            </small>
          </div>

        </div>

      </div>

      <div className="mat-financial-chart-card">

        <div className="mat-financial-card-heading">

          <div>
            <h2>
              Income vs Team Spending
            </h2>

            <p>
              Monthly actual transactions
              for {yearFilter}.
            </p>
          </div>

          <CalendarDays
            size={24}
          />

        </div>

        <div className="mat-financial-chart">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={
                monthlyData
              }
              margin={{
                top: 15,
                right: 20,
                bottom: 5,
                left: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#e3ebf1"
              />

              <XAxis
                dataKey="month"
                stroke="#6f8298"
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                stroke="#6f8298"
                tickLine={false}
                axisLine={false}
                tickFormatter={(
                  value
                ) =>
                  `$${value}`
                }
              />

              <Tooltip
                formatter={(
                  value
                ) =>
                  formatMoney(
                    value
                  )
                }
              />

              <Legend />

              <Line
                type="monotone"
                dataKey="income"
                name="Income"
                stroke="#1687cf"
                strokeWidth={3}
                dot={{
                  r: 3,
                }}
                activeDot={{
                  r: 5,
                }}
              />

              <Line
                type="monotone"
                dataKey="spending"
                name="Team Spending"
                stroke="#e15b64"
                strokeWidth={3}
                dot={{
                  r: 3,
                }}
                activeDot={{
                  r: 5,
                }}
              />

              <Line
                type="monotone"
                dataKey="net"
                name="Net"
                stroke="#35a66f"
                strokeWidth={2}
                strokeDasharray="6 4"
                dot={false}
              />

            </LineChart>
          </ResponsiveContainer>

        </div>

      </div>

      <div className="mat-financial-lower-grid">

        <div className="mat-financial-card">

          <div className="mat-financial-card-heading">

            <div>
              <h2>
                Spending by Category
              </h2>

              <p>
                Where team money is going.
              </p>
            </div>

            <ReceiptText
              size={23}
            />

          </div>

          {spendingByCategory.length ===
          0 ? (
            <div className="mat-financial-empty">
              No team expenses recorded
              for {yearFilter}.
            </div>
          ) : (
            <div className="mat-financial-category-list">

              {spendingByCategory.map(
                (
                  item,
                  index
                ) => {
                  const percent =
                    totalExpenses >
                    0
                      ? (
                          item.amount /
                          totalExpenses
                        ) *
                        100
                      : 0

                  return (
                    <div
                      key={
                        item.category
                      }
                      className="mat-financial-category-row"
                    >

                      <div className="mat-financial-category-top">

                        <span>
                          {
                            item.category
                          }
                        </span>

                        <strong>
                          {formatMoney(
                            item.amount
                          )}
                        </strong>

                      </div>

                      <div className="mat-financial-progress">

                        <div
                          className={`mat-financial-progress-fill progress-${index %
                            5}`}
                          style={{
                            width: `${percent}%`,
                          }}
                        />

                      </div>

                      <small>
                        {percent.toFixed(
                          1
                        )}
                        % of team spending
                      </small>

                    </div>
                  )
                }
              )}

            </div>
          )}

        </div>

        <div className="mat-financial-card">

          <div className="mat-financial-card-heading">

            <div>
              <h2>
                Admin Notes
              </h2>

              <p>
                Financial numbers that
                should stay separate.
              </p>
            </div>

            <CircleDollarSign
              size={23}
            />

          </div>

          <div className="mat-financial-note-list">

            <div className="mat-financial-note tuition">

              <span>
                Monthly Tuition Projection
              </span>

              <strong>
                {formatMoney(
                  expectedMonthlyTuition
                )}
              </strong>

              <small>
                Planning estimate based
                on current active roster.
              </small>

            </div>

            <div className="mat-financial-note tournament">

              <span>
                Tournament Fees Outstanding
              </span>

              <strong>
                {formatMoney(
                  tournamentFeeOutstanding
                )}
              </strong>

              <small>
                Athlete tournament obligations.
                Not MAT revenue.
              </small>

            </div>

          </div>

        </div>

      </div>

      <div className="mat-financial-ledger">

        <div className="mat-financial-card-heading ledger">

          <div>
            <h2>
              Transaction Ledger
            </h2>

            <p>
              Actual MAT income and
              operating expenses.
            </p>
          </div>

          <span className="mat-financial-count">
            {
              filteredTransactions.length
            }
          </span>

        </div>

        {loading ? (
          <div className="mat-financial-empty">
            Loading transactions...
          </div>
        ) : filteredTransactions.length ===
          0 ? (
          <div className="mat-financial-empty large">
            <CircleDollarSign
              size={32}
            />

            <strong>
              No financial transactions
              recorded for {yearFilter}
            </strong>

            <span>
              Use Add Transaction to
              begin tracking income
              and team spending.
            </span>
          </div>
        ) : (
          <div className="mat-financial-table-wrap">

            <table className="mat-financial-table">

              <thead>
                <tr>
                  <th>
                    Date
                  </th>

                  <th>
                    Type
                  </th>

                  <th>
                    Category
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Athlete
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>

                {filteredTransactions.map(
                  (
                    transaction
                  ) => (
                    <tr
                      key={
                        transaction.id
                      }
                    >

                      <td>
                        {formatDate(
                          transaction.transaction_date
                        )}
                      </td>

                      <td>
                        <span
                          className={`mat-financial-type ${
                            transaction.transaction_type
                          }`}
                        >
                          {transaction.transaction_type ===
                          'income'
                            ? 'Income'
                            : 'Expense'}
                        </span>
                      </td>

                      <td>
                        {
                          transaction.category
                        }
                      </td>

                      <td>
                        <strong>
                          {
                            transaction.description
                          }
                        </strong>

                        {transaction.notes && (
                          <div className="mat-financial-row-note">
                            {
                              transaction.notes
                            }
                          </div>
                        )}
                      </td>

                      <td>
                        {getMemberName(
                          transaction.member_id
                        ) ||
                          '—'}
                      </td>

                      <td
                        className={
                          transaction.transaction_type ===
                          'income'
                            ? 'mat-financial-amount income'
                            : 'mat-financial-amount expense'
                        }
                      >
                        {transaction.transaction_type ===
                        'income'
                          ? '+'
                          : '-'}

                        {formatMoney(
                          transaction.amount
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="mat-financial-delete"
                          onClick={() =>
                            deleteTransaction(
                              transaction.id
                            )
                          }
                          aria-label="Delete transaction"
                        >
                          <Trash2
                            size={16}
                          />
                        </button>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {showTransactionForm && (
        <div className="mat-modal-backdrop">

          <div className="mat-financial-modal">

            <div className="mat-financial-modal-header">

              <div>
                <div className="mat-eyebrow">
                  Financial Entry
                </div>

                <h2>
                  Add Transaction
                </h2>
              </div>

              <button
                type="button"
                className="mat-financial-modal-close"
                onClick={() =>
                  setShowTransactionForm(
                    false
                  )
                }
              >
                <X
                  size={23}
                />
              </button>

            </div>

            <form
              className="mat-financial-form"
              onSubmit={
                saveTransaction
              }
            >

              <div className="mat-financial-type-select">

                <label
                  className={
                    transactionForm.transaction_type ===
                    'income'
                      ? 'selected income'
                      : ''
                  }
                >
                  <input
                    type="radio"
                    name="transaction_type"
                    value="income"
                    checked={
                      transactionForm.transaction_type ===
                      'income'
                    }
                    onChange={
                      handleTransactionChange
                    }
                  />

                  <ArrowUpRight
                    size={19}
                  />

                  Income
                </label>

                <label
                  className={
                    transactionForm.transaction_type ===
                    'expense'
                      ? 'selected expense'
                      : ''
                  }
                >
                  <input
                    type="radio"
                    name="transaction_type"
                    value="expense"
                    checked={
                      transactionForm.transaction_type ===
                      'expense'
                    }
                    onChange={
                      handleTransactionChange
                    }
                  />

                  <ArrowDownRight
                    size={19}
                  />

                  Team Expense
                </label>

              </div>

              <div className="mat-form-grid">

                <div className="mat-form-group">

                  <label>
                    Category
                  </label>

                  <select
                    className="mat-input"
                    name="category"
                    value={
                      transactionForm.category
                    }
                    onChange={
                      handleTransactionChange
                    }
                  >
                    {categories.map(
                      (
                        category
                      ) => (
                        <option
                          key={
                            category
                          }
                          value={
                            category
                          }
                        >
                          {
                            category
                          }
                        </option>
                      )
                    )}
                  </select>

                </div>

                <div className="mat-form-group">

                  <label>
                    Date
                  </label>

                  <input
                    className="mat-input"
                    name="transaction_date"
                    type="date"
                    value={
                      transactionForm.transaction_date
                    }
                    onChange={
                      handleTransactionChange
                    }
                    required
                  />

                </div>

                <div className="mat-form-group">

                  <label>
                    Amount
                  </label>

                  <input
                    className="mat-input"
                    name="amount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={
                      transactionForm.amount
                    }
                    onChange={
                      handleTransactionChange
                    }
                    required
                  />

                </div>

                <div className="mat-form-group">

                  <label>
                    Athlete
                    {' '}
                    <span className="mat-optional">
                      optional
                    </span>
                  </label>

                  <select
                    className="mat-input"
                    name="member_id"
                    value={
                      transactionForm.member_id
                    }
                    onChange={
                      handleTransactionChange
                    }
                  >
                    <option value="">
                      No athlete
                    </option>

                    {members.map(
                      (member) => (
                        <option
                          key={
                            member.id
                          }
                          value={
                            member.id
                          }
                        >
                          {
                            member.first_name
                          }{' '}
                          {
                            member.last_name
                          }
                        </option>
                      )
                    )}
                  </select>

                </div>

              </div>

              <div className="mat-form-group">

                <label>
                  Description
                </label>

                <input
                  className="mat-input"
                  name="description"
                  type="text"
                  placeholder={
                    transactionForm.transaction_type ===
                    'income'
                      ? 'Example: September tuition'
                      : 'Example: Tournament paddles'
                  }
                  value={
                    transactionForm.description
                  }
                  onChange={
                    handleTransactionChange
                  }
                  required
                />

              </div>

              <div className="mat-form-group">

                <label>
                  Notes
                  {' '}
                  <span className="mat-optional">
                    optional
                  </span>
                </label>

                <textarea
                  className="mat-textarea"
                  name="notes"
                  rows="3"
                  value={
                    transactionForm.notes
                  }
                  onChange={
                    handleTransactionChange
                  }
                />

              </div>

              {message && (
                <div className="mat-tournament-form-error">
                  {message}
                </div>
              )}

              <div className="mat-form-actions">

                <button
                  type="button"
                  className="mat-secondary-button"
                  onClick={() =>
                    setShowTransactionForm(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="mat-primary-button"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? 'Saving...'
                    : 'Save Transaction'}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  )
}

export default FinancialsPage