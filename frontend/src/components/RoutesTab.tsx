import { useState, useEffect } from 'react'
import { Route } from '../types'
import api from '../api/client'
import { CheckCircle2, XCircle } from 'lucide-react'

export default function RoutesTab() {
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    vesselType: '',
    fuelType: '',
    year: '',
  })
  const [settingBaseline, setSettingBaseline] = useState<string | null>(null)

  useEffect(() => {
    fetchRoutes()
  }, [filters])

  const fetchRoutes = async () => {
    try {
      setLoading(true)
      const params: any = {}
      if (filters.vesselType) params.vesselType = filters.vesselType
      if (filters.fuelType) params.fuelType = filters.fuelType
      if (filters.year) params.year = parseInt(filters.year)

      const response = await api.get('/routes', { params })
      setRoutes(response.data)
      setError(null)
    } catch (error: any) {
      console.error('Failed to fetch routes:', error)
      if (error.response) {
        setError(`API Error: ${error.response.status} - ${error.response.data?.error || 'Unknown error'}`)
      } else if (error.request) {
        setError('Cannot connect to backend API. Make sure the backend server is running on port 3001.')
      } else {
        setError('Failed to fetch routes. Please check the console for details.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSetBaseline = async (routeId: string) => {
    try {
      setSettingBaseline(routeId)
      await api.post(`/routes/${routeId}/baseline`)
      await fetchRoutes()
    } catch (error) {
      console.error('Failed to set baseline:', error)
      alert('Failed to set baseline')
    } finally {
      setSettingBaseline(null)
    }
  }

  const uniqueVesselTypes = [...new Set(routes.map(r => r.vesselType))]
  const uniqueFuelTypes = [...new Set(routes.map(r => r.fuelType))]
  const uniqueYears = [...new Set(routes.map(r => r.year))]

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Routes Management</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vessel Type
          </label>
          <select
            value={filters.vesselType}
            onChange={(e) => setFilters({ ...filters, vesselType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {uniqueVesselTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Fuel Type
          </label>
          <select
            value={filters.fuelType}
            onChange={(e) => setFilters({ ...filters, fuelType: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {uniqueFuelTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year
          </label>
          <select
            value={filters.year}
            onChange={(e) => setFilters({ ...filters, year: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All</option>
            {uniqueYears.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Routes Table */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : routes.length === 0 && !error ? (
        <div className="text-center py-8 text-gray-500">
          No routes found. Make sure the database has been seeded.
          <br />
          <span className="text-sm">Run: <code className="bg-gray-100 px-2 py-1 rounded">cd backend && npm run prisma:seed</code></span>
        </div>
      ) : (
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
                  Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  GHG Intensity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Baseline
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routes.map((route) => (
                <tr key={route.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {route.routeId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.vesselType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.fuelType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.ghgIntensity.toFixed(2)} gCO₂e/MJ
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {route.isBaseline ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Baseline
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => handleSetBaseline(route.routeId)}
                      disabled={settingBaseline === route.routeId || route.isBaseline}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {settingBaseline === route.routeId ? 'Setting...' : 'Set Baseline'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

