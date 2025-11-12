import { useState, useEffect } from 'react'
import { ComplianceBalance, BankRecord } from '../types'
import api from '../api/client'
import { ArrowUpCircle, ArrowDownCircle } from 'lucide-react'

export default function BankingTab() {
  const [shipId, setShipId] = useState('R001')
  const [year, setYear] = useState(2025)
  const [compliance, setCompliance] = useState<ComplianceBalance | null>(null)
  const [bankRecord, setBankRecord] = useState<BankRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [bankAmount, setBankAmount] = useState('')
  const [applyAmount, setApplyAmount] = useState('')

  useEffect(() => {
    fetchCompliance()
    fetchBankRecord()
  }, [shipId, year])

  const fetchCompliance = async () => {
    try {
      setLoading(true)
      const response = await api.get('/compliance/cb', {
        params: { shipId, year },
      })
      setCompliance(response.data)
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch compliance:', error)
      }
      setCompliance(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchBankRecord = async () => {
    try {
      const response = await api.get('/banking/records', {
        params: { shipId, year },
      })
      setBankRecord(response.data)
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch bank record:', error)
      }
      setBankRecord(null)
    }
  }

  const handleBank = async () => {
    if (!compliance || !bankAmount) return

    try {
      await api.post('/banking/bank', {
        shipId,
        year,
        cbAmount: parseFloat(bankAmount),
        description: `Banked ${bankAmount} CB`,
      })
      setBankAmount('')
      await fetchCompliance()
      await fetchBankRecord()
      alert('Successfully banked compliance balance')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to bank compliance balance')
    }
  }

  const handleApply = async () => {
    if (!applyAmount) return

    try {
      await api.post('/banking/apply', {
        shipId,
        year,
        cbAmount: parseFloat(applyAmount),
        description: `Applied ${applyAmount} banked CB`,
      })
      setApplyAmount('')
      await fetchCompliance()
      await fetchBankRecord()
      alert('Successfully applied banked compliance balance')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to apply banked compliance balance')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Banking Management</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ship ID
          </label>
          <input
            type="text"
            value={shipId}
            onChange={(e) => setShipId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., R001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : !compliance ? (
        <div className="text-center py-8 text-gray-500">
          No compliance data found for this ship and year.
        </div>
      ) : (
        <>
          {/* Compliance Balance Card */}
          <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Compliance Balance</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Target Intensity</p>
                <p className="text-lg font-semibold">{compliance.targetIntensity.toFixed(2)} gCO₂e/MJ</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Actual Intensity</p>
                <p className="text-lg font-semibold">{compliance.actualIntensity.toFixed(2)} gCO₂e/MJ</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Energy in Scope</p>
                <p className="text-lg font-semibold">{compliance.energyInScope.toLocaleString()} MJ</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Compliance Balance</p>
                <p className={`text-lg font-semibold ${compliance.complianceBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {compliance.complianceBalance >= 0 ? '+' : ''}{compliance.complianceBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Banking Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Bank CB */}
            <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <ArrowUpCircle className="w-5 h-5 mr-2 text-green-600" />
                Bank Compliance Balance
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Bank positive compliance balance for future use.
              </p>
              <div className="space-y-3">
                <input
                  type="number"
                  value={bankAmount}
                  onChange={(e) => setBankAmount(e.target.value)}
                  placeholder="Amount to bank"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={compliance.complianceBalance <= 0}
                />
                <button
                  onClick={handleBank}
                  disabled={!bankAmount || compliance.complianceBalance <= 0 || parseFloat(bankAmount) > compliance.complianceBalance}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Bank CB
                </button>
                {compliance.complianceBalance <= 0 && (
                  <p className="text-sm text-red-600">Only positive CB can be banked</p>
                )}
              </div>
            </div>

            {/* Apply Banked CB */}
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <ArrowDownCircle className="w-5 h-5 mr-2 text-blue-600" />
                Apply Banked Balance
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Apply previously banked compliance balance to cover deficit.
              </p>
              <div className="space-y-3">
                <input
                  type="number"
                  value={applyAmount}
                  onChange={(e) => setApplyAmount(e.target.value)}
                  placeholder="Amount to apply"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!bankRecord || bankRecord.availableBalance <= 0}
                />
                <button
                  onClick={handleApply}
                  disabled={!applyAmount || !bankRecord || bankRecord.availableBalance <= 0 || parseFloat(applyAmount) > bankRecord.availableBalance}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Apply CB
                </button>
                {bankRecord && (
                  <p className="text-sm text-gray-600">
                    Available: {bankRecord.availableBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bank Record */}
          {bankRecord && (
            <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Bank Record</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-500">Total Banked</p>
                  <p className="text-lg font-semibold text-green-600">
                    +{bankRecord.totalBanked.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Applied</p>
                  <p className="text-lg font-semibold text-red-600">
                    -{bankRecord.totalApplied.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Available Balance</p>
                  <p className={`text-lg font-semibold ${bankRecord.availableBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {bankRecord.availableBalance >= 0 ? '+' : ''}{bankRecord.availableBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {bankRecord.entries.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Transaction History</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {bankRecord.entries.map((entry) => (
                          <tr key={entry.id}>
                            <td className="px-4 py-2 text-sm">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                entry.entryType === 'BANK' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {entry.entryType}
                              </span>
                            </td>
                            <td className={`px-4 py-2 text-sm font-semibold ${
                              entry.entryType === 'BANK' ? 'text-green-600' : 'text-blue-600'
                            }`}>
                              {entry.entryType === 'BANK' ? '+' : '-'}{Math.abs(entry.cbAmount).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {new Date(entry.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

