import PatientList from '@/components/PatientList'

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Patient Directory
        </h2>
        <p className="text-gray-600">
          Search and manage patient records with advanced filtering capabilities.
        </p>
      </div>
      <PatientList />
    </div>
  )
}
