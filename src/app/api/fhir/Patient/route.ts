import { NextRequest, NextResponse } from "next/server";

// Mock FHIR Patient data following FHIR R4 specification
const mockPatients = [
  {
    resourceType: "Patient",
    id: "1",
    identifier: [
      {
        use: "usual",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "MR",
              display: "Medical record number",
            },
          ],
        },
        value: "MRN-001",
      },
    ],
    active: true,
    name: [
      {
        use: "official",
        family: "Smith",
        given: ["John", "David"],
      },
    ],
    telecom: [
      {
        system: "phone",
        value: "+1-555-0123",
        use: "home",
      },
      {
        system: "email",
        value: "john.smith@email.com",
        use: "home",
      },
    ],
    gender: "male",
    birthDate: "1985-03-15",
    address: [
      {
        use: "home",
        line: ["123 Main St"],
        city: "Springfield",
        state: "IL",
        postalCode: "62701",
        country: "US",
      },
    ],
    contact: [
      {
        relationship: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v2-0131",
                code: "C",
                display: "Emergency Contact",
              },
            ],
          },
        ],
        name: {
          family: "Smith",
          given: ["Jane"],
        },
        telecom: [
          {
            system: "phone",
            value: "+1-555-0124",
          },
        ],
      },
    ],
  },
  {
    resourceType: "Patient",
    id: "2",
    identifier: [
      {
        use: "usual",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "MR",
              display: "Medical record number",
            },
          ],
        },
        value: "MRN-002",
      },
    ],
    active: true,
    name: [
      {
        use: "official",
        family: "Johnson",
        given: ["Sarah", "Elizabeth"],
      },
    ],
    telecom: [
      {
        system: "phone",
        value: "+1-555-0456",
        use: "mobile",
      },
      {
        system: "email",
        value: "sarah.johnson@email.com",
        use: "home",
      },
    ],
    gender: "female",
    birthDate: "1992-07-22",
    address: [
      {
        use: "home",
        line: ["456 Oak Ave"],
        city: "Chicago",
        state: "IL",
        postalCode: "60601",
        country: "US",
      },
    ],
  },
  {
    resourceType: "Patient",
    id: "3",
    identifier: [
      {
        use: "usual",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "MR",
              display: "Medical record number",
            },
          ],
        },
        value: "MRN-003",
      },
    ],
    active: false,
    name: [
      {
        use: "official",
        family: "Brown",
        given: ["Michael", "Robert"],
      },
    ],
    telecom: [
      {
        system: "phone",
        value: "+1-555-0789",
        use: "home",
      },
    ],
    gender: "male",
    birthDate: "1978-11-08",
    address: [
      {
        use: "home",
        line: ["789 Pine St"],
        city: "Peoria",
        state: "IL",
        postalCode: "61601",
        country: "US",
      },
    ],
  },
  {
    resourceType: "Patient",
    id: "4",
    identifier: [
      {
        use: "usual",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "MR",
              display: "Medical record number",
            },
          ],
        },
        value: "MRN-004",
      },
    ],
    active: true,
    name: [
      {
        use: "official",
        family: "Davis",
        given: ["Emily", "Grace"],
      },
    ],
    telecom: [
      {
        system: "phone",
        value: "+1-555-0321",
        use: "mobile",
      },
      {
        system: "email",
        value: "emily.davis@email.com",
        use: "work",
      },
    ],
    gender: "female",
    birthDate: "1995-12-03",
    address: [
      {
        use: "home",
        line: ["321 Elm St"],
        city: "Rockford",
        state: "IL",
        postalCode: "61101",
        country: "US",
      },
    ],
  },
  {
    resourceType: "Patient",
    id: "5",
    identifier: [
      {
        use: "usual",
        type: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/v2-0203",
              code: "MR",
              display: "Medical record number",
            },
          ],
        },
        value: "MRN-005",
      },
    ],
    active: true,
    name: [
      {
        use: "official",
        family: "Wilson",
        given: ["Robert", "James"],
      },
    ],
    telecom: [
      {
        system: "phone",
        value: "+1-555-0654",
        use: "home",
      },
    ],
    gender: "male",
    birthDate: "1989-09-18",
    address: [
      {
        use: "home",
        line: ["654 Maple Dr"],
        city: "Naperville",
        state: "IL",
        postalCode: "60540",
        country: "US",
      },
    ],
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("_search") || "";
    const gender = searchParams.get("gender") || "";
    const active = searchParams.get("active") || "";
    const _count = parseInt(searchParams.get("_count") || "10");
    const _offset = parseInt(searchParams.get("_offset") || "0");
    const _sort = searchParams.get("_sort") || "";
    const _order = searchParams.get("_order") || "asc";

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 500 + 200));

    // Filter patients based on search parameters
    let filteredPatients = mockPatients;

    // Search by name or identifier
    if (search) {
      const searchLower = search.toLowerCase();
      filteredPatients = filteredPatients.filter((patient) => {
        const fullName = `${patient.name[0].given?.join(" ")} ${patient.name[0].family}`.toLowerCase();
        const mrn = patient.identifier[0].value.toLowerCase();
        return fullName.includes(searchLower) || mrn.includes(searchLower);
      });
    }

    // Filter by gender
    if (gender) {
      filteredPatients = filteredPatients.filter((patient) => patient.gender === gender.toLowerCase());
    }

    // Filter by active status
    if (active) {
      const isActive = active.toLowerCase() === "true";
      filteredPatients = filteredPatients.filter((patient) => patient.active === isActive);
    }
    // Sorting logic
    if (_sort) {
      filteredPatients = [...filteredPatients].sort((a, b) => {
        let aValue, bValue;
        switch (_sort) {
          case "Name":
            aValue = `${a.name?.[0]?.given?.join(" ") ?? ""} ${a.name?.[0]?.family ?? ""}`.toLowerCase();
            bValue = `${b.name?.[0]?.given?.join(" ") ?? ""} ${b.name?.[0]?.family ?? ""}`.toLowerCase();
            return _order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          case "MRN":
            aValue = a.identifier?.[0]?.value?.toLowerCase() ?? "";
            bValue = b.identifier?.[0]?.value?.toLowerCase() ?? "";
            return _order === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
          case "Age":
            const getAge = (birthDate: string) => {
              if (!birthDate) return 0;
              const dob = new Date(birthDate);
              if (isNaN(dob.getTime())) return 0;
              const today = new Date();
              let age = today.getFullYear() - dob.getFullYear();
              const m = today.getMonth() - dob.getMonth();
              if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
                age--;
              }
              return Math.max(0, age);
            };
            aValue = getAge(a.birthDate);
            bValue = getAge(b.birthDate);
            return _order === "asc" ? aValue - bValue : bValue - aValue;
          default:
            return 0;
        }
      });
    }

    // Apply pagination
    const total = filteredPatients.length;
    const paginatedPatients = filteredPatients.slice(_offset, _offset + _count);

    // Create FHIR Bundle response
    const bundle = {
      resourceType: "Bundle",
      id: "patient-search-results",
      type: "searchset",
      timestamp: new Date().toISOString(),
      total: total,
      entry: paginatedPatients.map((patient) => ({
        resource: patient,
        search: {
          mode: "match",
        },
      })),
    };

    return NextResponse.json(bundle, {
      status: 200,
      headers: {
        "Content-Type": "application/fhir+json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  } catch (error) {
    console.error("Error in Patient API:", error);
    return NextResponse.json(
      {
        resourceType: "OperationOutcome",
        issue: [
          {
            severity: "error",
            code: "processing",
            diagnostics: "Internal server error occurred while processing the request",
          },
        ],
      },
      {
        status: 500,
        headers: {
          "Content-Type": "application/fhir+json",
        },
      }
    );
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
