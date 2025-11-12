import { useState, useEffect } from 'react'
import { ComplianceBalance } from '../types'
import api from '../api/client'
import { Users, Plus, X } from 'lucide-react'

interface PoolMemberInput {
  shipId: string
  adjustedCB: number
}

export default function PoolingTab() {
  const [year, setYear] = useState(2025)
  const [compliances, setCompliances] = useState<ComplianceBalance[]>([])
  const [loading, setLoading] = useState(false)
  const [poolName, setPoolName] = useState('')
  const [members, setMembers] = useState<PoolMemberInput[]>([])
  const [selectedShipId, setSelectedShipId] = useState('')
  const [adjustedCB, setAdjustedCB] = useState('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    fetchCompliances()
  }, [year])

  const fetchCompliances = async () => {
    try {
      setLoading(true)
      const response = await api.get('/compliance/adjusted-cb', {
        params: { year },
      })
      setCompliances(response.data)
    } catch (error) {
      console.error('Failed to fetch compliances:', error)
    } finally {
      setLoading(false)
    }
  }

  const addMember = () => {
    if (!selectedShipId || adjustedCB === '') {
      alert('Please select a ship and enter adjusted CB')
      return
    }

    if (members.some(m => m.shipId === selectedShipId)) {
      alert('Ship already added to pool')
      return
    }

    setMembers([...members, {
      shipId: selectedShipId,
      adjustedCB: parseFloat(adjustedCB),
    }])
    setSelectedShipId('')
    setAdjustedCB('')
  }

  const removeMember = (shipId: string) => {
    setMembers(members.filter(m => m.shipId !== shipId))
  }

  const validatePool = () => {
    const errors: string[] = []
    const cbBefore: Record<string, number> = {}

    // Get CB before for all ships
    for (const member of members) {
      const compliance = compliances.find(c => c.shipId === member.shipId)
      if (!compliance) {
        errors.push(`Compliance data not found for ship ${member.shipId}`)
        continue
      }
      cbBefore[member.shipId] = compliance.complianceBalance
    }

    // Rule 1: Sum(adjustedCB) ≥ 0
    const sumAdjustedCB = members.reduce((sum, m) => sum + m.adjustedCB, 0)
    if (sumAdjustedCB < 0) {
      errors.push(`Sum of adjusted CB (${sumAdjustedCB.toFixed(2)}) must be ≥ 0`)
    }

    // Rule 2: Deficit ship cannot exit worse
    // Rule 3: Surplus ship cannot go negative
    for (const member of members) {
      const before = cbBefore[member.shipId]
      const after = member.adjustedCB

      if (before < 0 && after < before) {
        errors.push(`Ship ${member.shipId}: Deficit ship cannot exit worse (${before.toFixed(2)} → ${after.toFixed(2)})`)
      }

      if (before > 0 && after < 0) {
        errors.push(`Ship ${member.shipId}: Surplus ship cannot go negative (${before.toFixed(2)} → ${after.toFixed(2)})`)
      }
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleCreatePool = async () => {
    if (members.length === 0) {
      alert('Please add at least one ship to the pool')
      return
    }

    if (!validatePool()) {
      return
    }

    try {
      const response = await api.post('/pools', {
        name: poolName || undefined,
        year,
        members,
      })

      alert('Pool created successfully!')
      console.log('Pool created:', response.data)
      
      // Reset form
      setPoolName('')
      setMembers([])
      setValidationErrors([])
      await fetchCompliances()
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.details?.join(', ') || 'Failed to create pool'
      alert(errorMsg)
    }
  }

  const availableShips = compliances.filter(c => !members.some(m => m.shipId === c.shipId))

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Pooling Management</h2>

      {/* Year Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Year
        </label>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(parseInt(e.target.value))}
          className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <>
          {/* Pool Creation Form */}
          <div className="mb-6 p-6 bg-white border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Create Pool
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pool Name (Optional)
              </label>
              <input
                type="text"
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                placeholder="e.g., Container Fleet Pool 2025"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Add Member */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-semibold mb-3">Add Ship to Pool</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ship ID</label>
                  <select
                    value={selectedShipId}
                    onChange={(e) => setSelectedShipId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select ship...</option>
                    {availableShips.map((c) => (
                      <option key={c.shipId} value={c.shipId}>
                        {c.shipId} (CB: {c.complianceBalance >= 0 ? '+' : ''}{c.complianceBalance.toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Adjusted CB</label>
                  <input
                    type="number"
                    value={adjustedCB}
                    onChange={(e) => setAdjustedCB(e.target.value)}
                    placeholder="Adjusted CB value"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={addMember}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Pool Members */}
            {members.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2">Pool Members</h4>
                <div className="space-y-2">
                  {members.map((member) => {
                    const compliance = compliances.find(c => c.shipId === member.shipId)
                    const cbBefore = compliance?.complianceBalance || 0
                    return (
                      <div key={member.shipId} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                        <div className="flex-1">
                          <p className="font-medium">{member.shipId}</p>
                          <p className="text-sm text-gray-600">
                            CB Before: {cbBefore >= 0 ? '+' : ''}{cbBefore.toFixed(2)} → 
                            CB After: {member.adjustedCB >= 0 ? '+' : ''}{member.adjustedCB.toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={() => removeMember(member.shipId)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-semibold text-red-800 mb-2">Validation Errors:</h4>
                <ul className="list-disc list-inside text-sm text-red-700">
                  {validationErrors.map((error, idx) => (
                    <li key={idx}>{error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Pool Summary */}
            {members.length > 0 && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="text-sm font-semibold mb-2">Pool Summary</h4>
                <p className="text-sm">
                  <span className="font-medium">Sum of Adjusted CB:</span>{' '}
                  <span className={members.reduce((sum, m) => sum + m.adjustedCB, 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {members.reduce((sum, m) => sum + m.adjustedCB, 0).toFixed(2)}
                  </span>
                </p>
              </div>
            )}

            <button
              onClick={handleCreatePool}
              disabled={members.length === 0}
              className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Create Pool
            </button>
          </div>

          {/* Available Ships */}
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Available Ships ({year})</h3>
            {compliances.length === 0 ? (
              <p className="text-gray-500">No compliance data available for this year.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ship ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actual Intensity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Energy in Scope</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Compliance Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {compliances.map((c) => (
                      <tr key={c.shipId}>
                        <td className="px-4 py-2 text-sm font-medium">{c.shipId}</td>
                        <td className="px-4 py-2 text-sm">{c.actualIntensity.toFixed(2)} gCO₂e/MJ</td>
                        <td className="px-4 py-2 text-sm">{c.energyInScope.toLocaleString()} MJ</td>
                        <td className={`px-4 py-2 text-sm font-semibold ${c.complianceBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {c.complianceBalance >= 0 ? '+' : ''}{c.complianceBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

