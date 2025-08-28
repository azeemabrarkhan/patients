"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Search, Filter, User, Phone, Mail, MapPin, Calendar, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { FHIRService, FHIRUtils } from "@/services/fhirService";
import { Patient, FHIRBundle, PatientSearchParams } from "@/types/fhir";
import { Sort } from "../enums/Sort";
import { stat } from "fs";
import { getPatientAge, getPatientMRN, getPatientName } from "@/utils/patient";

interface PatientListState {
  patients: Patient[];
  loading: boolean;
  error: string | null;
  total: number;
  hasMore: boolean;
}

interface FilterState {
  search: string;
  gender: string;
  active: string;
}

const ITEMS_PER_PAGE = 10;

export default function PatientList() {
  const [state, setState] = useState<PatientListState>({
    patients: [],
    loading: true,
    error: null,
    total: 0,
    hasMore: true,
  });

  const [filters, setFilters] = useState<FilterState>({
    search: "",
    gender: "",
    active: "",
  });

  const [currentPage, setCurrentPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState<{ sortBy: string; order: "asc" | "desc" }>({
    sortBy: Sort.NAME,
    order: "asc",
  });

  const searchParams = useMemo(
    (): PatientSearchParams => ({
      _search: filters.search || undefined,
      gender: filters.gender || undefined,
      active: filters.active || undefined,
      _count: ITEMS_PER_PAGE,
      _offset: currentPage * ITEMS_PER_PAGE,
      _sort: sort.sortBy || undefined,
      _order: sort.order,
    }),
    [filters, currentPage, sort]
  );

  const fetchPatients = useCallback(
    async (reset = false) => {
      try {
        setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
          ...(reset && { patients: [], total: 0 }),
        }));

        const params = reset ? { ...searchParams, _offset: 0 } : searchParams;
        const bundle: FHIRBundle = await FHIRService.searchPatients(params);

        const newPatients = bundle.entry?.map((entry) => entry.resource) || [];
        const total = bundle.total || 0;

        setState((prev) => ({
          ...prev,
          patients: reset ? newPatients : [...prev.patients, ...newPatients],
          total,
          hasMore: (reset ? 0 : prev.patients.length) + newPatients.length < total,
          loading: false,
        }));

        if (reset) {
          setCurrentPage(0);
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "An unexpected error occurred",
        }));
      }
    },
    [searchParams]
  );

  // Initial load and filter changes
  useEffect(() => {
    fetchPatients(true);
  }, [filters, currentPage, sort]);

  // Load more patients
  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [state.loading, state.hasMore]);

  // Load more when page changes
  useEffect(() => {
    if (currentPage > 0) {
      fetchPatients(false);
    }
  }, [currentPage]);

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, search: value }));
  }, []);

  const handleFilterChange = useCallback((filterType: keyof Omit<FilterState, "search">, value: string) => {
    setFilters((prev) => ({ ...prev, [filterType]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ search: "", gender: "", active: "" });
  }, []);

  const retry = useCallback(() => {
    fetchPatients(true);
  }, [fetchPatients]);

  if (state.error && state.patients.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Patients</h3>
            <p className="text-gray-600 mb-4">{state.error}</p>
            <button onClick={retry} className="btn-primary inline-flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const onSort = (sortBy: string) => {
    setSort((prev) => {
      const order = prev.order === "asc" ? "desc" : "asc";
      return { sortBy: sortBy, order };
    });
    setCurrentPage(0);
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter Controls */}
      <div className="card">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or medical record number..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            {Object.values(Sort).map((sortBy) => (
              <button
                key={sortBy}
                onClick={() => onSort(sortBy as Sort)}
                className="px-3 py-1 border rounded hover:bg-gray-100"
              >
                {sortBy + (sort.sortBy === sortBy ? (sort.order === "asc" ? " ↑" : " ↓") : "")}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {(filters.gender || filters.active) && (
                <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2 py-1 rounded-full">
                  {[filters.gender, filters.active].filter(Boolean).length}
                </span>
              )}
            </button>

            <div className="text-sm text-gray-600">
              Showing {state.patients.length} of {state.total} patients
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => handleFilterChange("gender", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.active}
                    onChange={(e) => handleFilterChange("active", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button onClick={clearFilters} className="btn-secondary w-full">
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Patient List */}
      <div className="space-y-4">
        {state.patients.map((patient) => (
          <PatientCard key={patient.id} patient={patient} />
        ))}

        {/* Loading State */}
        {state.loading && (
          <div className="card">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
              <span className="ml-3 text-gray-600">Loading patients...</span>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {!state.loading && state.hasMore && (
          <div className="text-center">
            <button onClick={loadMore} className="btn-primary">
              Load More Patients
            </button>
          </div>
        )}

        {/* No Results */}
        {!state.loading && state.patients.length === 0 && !state.error && (
          <div className="card">
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No patients found</h3>
              <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
            </div>
          </div>
        )}

        {/* Error during load more */}
        {state.error && state.patients.length > 0 && (
          <div className="card border-red-200 bg-red-50">
            <div className="flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-sm">{state.error}</span>
              <button onClick={retry} className="ml-auto text-sm underline hover:no-underline">
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface PatientCardProps {
  patient: Patient;
}

function PatientCard({ patient }: PatientCardProps) {
  const fullName = FHIRUtils.getPatientFullName(patient);
  const mrn = FHIRUtils.getPatientMRN(patient);
  const phone = FHIRUtils.getPatientPhone(patient);
  const email = FHIRUtils.getPatientEmail(patient);
  const address = FHIRUtils.getPatientAddress(patient);
  const birthDate = FHIRUtils.formatBirthDate(patient.birthDate);
  const age = FHIRUtils.calculateAge(patient.birthDate);

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{fullName}</h3>
              <p className="text-sm text-gray-600">MRN: {mrn}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">
                {birthDate}
                {age !== null && ` (${age} years)`}
              </span>
            </div>

            {phone !== "N/A" && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{phone}</span>
              </div>
            )}

            {email !== "N/A" && (
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{email}</span>
              </div>
            )}

            {address !== "N/A" && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">{address}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-500 capitalize">{patient.gender || "Unknown"}</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                patient.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
              }`}
            >
              {patient.active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
