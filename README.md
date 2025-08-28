# Patient List Application

A modern, responsive Patient Management System built with Next.js 14, TypeScript, and Tailwind CSS. Features a comprehensive patient list with advanced search and filtering capabilities, integrated with mock FHIR R4 endpoints.

## 🚀 Features

### Core Functionality
- **Patient List Display**: Clean, responsive patient cards with comprehensive information
- **Advanced Search**: Search by patient name or medical record number (MRN)
- **Smart Filtering**: Filter by gender and active status
- **Pagination**: Efficient loading with "Load More" functionality
- **Real-time Updates**: Instant search and filter results

### Technical Features
- **FHIR R4 Compliance**: Full FHIR Patient resource support
- **Error Handling**: Comprehensive error states with retry functionality
- **Loading States**: Smooth loading indicators and skeleton states
- **Responsive Design**: Mobile-first design that works on all devices
- **TypeScript**: Full type safety throughout the application
- **Unit Testing**: Comprehensive test coverage for components and services

### User Experience
- **Intuitive Interface**: Clean, modern UI with clear visual hierarchy
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Performance**: Optimized for fast loading and smooth interactions
- **Mobile Responsive**: Fully functional on mobile devices

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Testing**: Jest + React Testing Library
- **API**: RESTful FHIR R4 endpoints

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/fhir/Patient/  # Mock FHIR API endpoint
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── PatientList.tsx    # Main patient list component
│   └── __tests__/         # Component tests
├── services/              # API services
│   ├── fhirService.ts     # FHIR API client
│   └── __tests__/         # Service tests
└── types/                 # TypeScript type definitions
    └── fhir.ts            # FHIR resource types
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## 🔌 API Documentation

### FHIR Patient Endpoint

**GET** `/api/fhir/Patient`

Search for patients with optional parameters:

| Parameter | Type | Description |
|-----------|------|-------------|
| `_search` | string | Search by name or MRN |
| `gender` | string | Filter by gender (male, female, other, unknown) |
| `active` | boolean | Filter by active status |
| `_count` | number | Number of results per page (default: 10) |
| `_offset` | number | Pagination offset (default: 0) |

**Example Requests:**

```bash
# Get all patients
GET /api/fhir/Patient

# Search by name
GET /api/fhir/Patient?_search=John

# Filter by gender
GET /api/fhir/Patient?gender=male

# Combine filters
GET /api/fhir/Patient?_search=Smith&gender=female&active=true

# Pagination
GET /api/fhir/Patient?_count=5&_offset=10
```

**Response Format:**

Returns a FHIR R4 Bundle resource:

```json
{
  "resourceType": "Bundle",
  "type": "searchset",
  "total": 25,
  "timestamp": "2024-01-15T10:30:00Z",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "1",
        "identifier": [...],
        "name": [...],
        "telecom": [...],
        "gender": "male",
        "birthDate": "1985-03-15",
        "address": [...],
        "active": true
      },
      "search": {
        "mode": "match"
      }
    }
  ]
}
```

## 🧪 Testing

The application includes comprehensive unit tests covering:

- **Component Testing**: All UI components with user interactions
- **Service Testing**: API client methods and utility functions
- **API Testing**: Backend endpoints with various scenarios

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm test -- --coverage
```

### Test Coverage

- Components: Patient list, search, filtering, pagination
- Services: FHIR API client, utility functions
- API Routes: FHIR Patient endpoint with all parameters
- Error Handling: Network errors, validation errors, retry logic

## 🎨 UI/UX Features

### Design System
- **Color Palette**: Professional healthcare-focused colors
- **Typography**: Clear, readable font hierarchy
- **Spacing**: Consistent spacing using Tailwind's scale
- **Components**: Reusable button and card styles

### Responsive Design
- **Mobile First**: Designed for mobile, enhanced for desktop
- **Breakpoints**: Optimized for all screen sizes
- **Touch Friendly**: Proper touch targets for mobile users
- **Progressive Enhancement**: Core functionality works without JavaScript

### Accessibility
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliant color combinations
- **Focus Management**: Clear focus indicators

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# FHIR API Configuration
NEXT_PUBLIC_FHIR_BASE_URL=/api/fhir

# Development Configuration  
NODE_ENV=development
```

### Customization

The application is designed to be easily customizable:

- **Colors**: Update `tailwind.config.js` for brand colors
- **API Endpoint**: Change `NEXT_PUBLIC_FHIR_BASE_URL` to use external FHIR server
- **Pagination**: Modify `ITEMS_PER_PAGE` in `PatientList.tsx`
- **Mock Data**: Update patient data in `/api/fhir/Patient/route.ts`

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Other Platforms

The application can be deployed to any platform that supports Next.js:

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions or support:

1. Check the documentation above
2. Review the test files for usage examples
3. Create an issue in the repository

## 🎯 Future Enhancements

Potential improvements for the application:

- **Real FHIR Integration**: Connect to actual FHIR servers
- **Advanced Filtering**: More filter options (age ranges, location)
- **Patient Details**: Detailed patient view with medical history
- **Data Export**: Export patient lists to CSV/PDF
- **Offline Support**: PWA capabilities for offline usage
- **Real-time Updates**: WebSocket integration for live updates
