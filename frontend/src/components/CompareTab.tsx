import { useState, useEffect } from 'react'
import { ComparisonResponse } from '../types'
import api from '../api/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function CompareTab() {
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    vesselType: '',
    fuelType: '',
    year: '',
  })

  useEffect(() => {
    fetchComparison()
  }, [filters])

  const fetchComparison = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filters.vesselType) params.vesselType = filters.vesselType
      if (filters.fuelType) params.fuelType = filters.fuelType
      if (filters.year) params.year = parseInt(filters.year)

      const response = await api.get('/routes/comparison', { params })
      setComparison(response.data)
    } catch (error: any) {
      if (error.response?.status === 404) {
        alert('Please set a baseline route first')
      } else {
        console.error('Failed to fetch comparison:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  const chartData = comparison?.comparisons.map((comp) => ({
    routeId: comp.routeId,
    baseline: comp.baseline,
    comparison: comp.comparison,
  })) || []

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Route Comparison</h2>

      {comparison && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Baseline:</span> {comparison.baseline.routeId} 
            {' '}({comparison.baseline.ghgIntensity.toFixed(2)} gCO₂e/MJ)
          </p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : !comparison ? (
        <div className="text-center py-8 text-gray-500">
          No baseline route set. Please set a baseline in the Routes tab.
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="mb-8 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="routeId" />
                <YAxis label={{ value: 'GHG Intensity (gCO₂e/MJ)', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="baseline" fill="#3b82f6" name="Baseline" />
                <Bar dataKey="comparison" fill="#10b981" name="Comparison" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vessel Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fuel Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Baseline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comparison
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Difference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {comparison.comparisons.map((comp) => (
                  <tr key={comp.routeId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {comp.routeId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comp.vesselType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comp.fuelType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comp.baseline.toFixed(2)} gCO₂e/MJ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {comp.comparison.toFixed(2)} gCO₂e/MJ
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={comp.percentDiff > 0 ? 'text-red-600' : 'text-green-600'}>
                        {comp.percentDiff > 0 ? '+' : ''}{comp.percentDiff.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {comp.compliant ? (
                        <span className="inline-flex items-center text-green-600">
                          <CheckCircle2 className="w-5 h-5 mr-1" />
                          Compliant
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-red-600">
                          <XCircle className="w-5 h-5 mr-1" />
                          Non-compliant
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

