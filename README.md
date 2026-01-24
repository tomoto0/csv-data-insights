# Data Insights AI

**Professional Data Intelligence Platform powered by Manus AI**

A comprehensive, AI-driven data analysis platform that transforms raw CSV data into actionable insights through advanced statistical analysis, trend detection, anomaly identification, and intelligent data cleaning. Data Insights AI combines cutting-edge machine learning with intuitive data visualization to empower users to make data-driven decisions with confidence.

## Overview

Data Insights AI is designed for data analysts, business intelligence professionals, and organizations seeking to unlock the full potential of their datasets. The platform automates the tedious data preprocessing phase and provides deep, multi-faceted analysis across eight distinct categories, enabling users to focus on strategic decision-making rather than manual data manipulation.

## Key Features

### Comprehensive Data Analysis

The platform performs advanced statistical analysis on uploaded CSV datasets, calculating essential metrics including mean, median, standard deviation, quartiles, and variance. Beyond basic statistics, Data Insights AI identifies temporal patterns and trends within your data, automatically detects outliers and unusual patterns that may indicate data quality issues or business anomalies, and evaluates overall data completeness, consistency, and integrity through a data quality score.

### Intelligent AI-Powered Data Cleaning

One of the platform's standout capabilities is its AI-powered data cleaning module. The system automatically detects and fixes data quality issues such as inconsistent formatting, missing values, and structural problems. It normalizes data types and formats across columns, intelligently handles missing or null values using contextual analysis, enhances column names and structure for better readability, and generates cleaned CSV files ready for export and further analysis.

### Multi-Faceted AI Insights

The analysis engine generates insights across eight comprehensive categories: Overview & Structure provides dataset composition and key characteristics; Statistical Analysis delivers deep statistical metrics and distributions; Data Quality Assessment identifies completeness and consistency issues; Trends & Patterns reveals temporal and behavioral patterns; Anomalies & Outliers flags unusual data points; Key Insights extracts the most important findings; Recommendations provides actionable suggestions; and Risk Assessment identifies potential data-related risks.

Each insight includes a confidence score reflecting the AI's certainty level, enabling users to prioritize high-confidence findings. The category filtering system allows users to focus on specific analysis dimensions, while comprehensive reports provide detailed explanations with actionable recommendations.

### Flexible Data Management

Users can upload CSV files up to 10MB in size, store and manage multiple datasets within their account, access previously analyzed datasets through the Recent Datasets feature, and maintain complete data integrity throughout the analysis process. The platform preserves original data while creating separate cleaned versions, ensuring users can always reference the source data.

### Interactive Chart Customization

The platform features interactive data visualizations with customizable chart types including bar charts, line charts, pie charts, doughnut charts, and multi-series comparisons. Users can select from six color palettes (Default, Ocean, Sunset, Forest, Monochrome, and Vibrant), edit axis labels and chart titles, toggle legend and grid display, and export charts as PNG images for reports and presentations.

### Export and Sharing Capabilities

Users can download cleaned CSV datasets for use in other tools, export individual charts as PNG images, save cleaned datasets to Recent Datasets for quick access, and generate comprehensive analysis reports for sharing with stakeholders.

## Technology Stack

### Frontend Architecture

The frontend is built with **React 19**, providing modern UI capabilities with hooks and concurrent rendering features. **Tailwind CSS 4** delivers utility-first styling with responsive design patterns, while **shadcn/ui** provides high-quality, accessible React components. The application uses **tRPC** for end-to-end type-safe API communication, eliminating the need for manual REST endpoint management. **Wouter** provides lightweight client-side routing, and **Lucide Icons** supplies a consistent icon library throughout the interface.

### Backend Architecture

The backend runs on **Express 4**, a fast and minimalist web framework, with **tRPC 11** providing type-safe RPC procedures. **Drizzle ORM** serves as a lightweight, type-safe SQL query builder, while **MySQL/TiDB** handles relational data storage. The backend integrates with the **Manus LLM API** for advanced data analysis capabilities and uses **JSON Schema** for structured response generation.

### Data Processing and Analysis

The platform leverages the **Manus LLM API** for intelligent data analysis and cleaning operations. **simple-statistics** provides statistical computation capabilities, and **Chart.js** powers interactive data visualizations. The **Manus Platform** provides managed hosting, OAuth authentication, and S3 storage integration.

## System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      Frontend (React 19 + Tailwind)              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  • CSV Upload & File Management                           │  │
│  │  • Interactive Data Visualizations (Chart.js)            │  │
│  │  • Analysis Results Display                              │  │
│  │  • Data Cleaning Interface                               │  │
│  │  • Chart Customization (Type, Colors, Labels)            │  │
│  │  • Export Functionality (CSV, PNG)                       │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────┬──────────────────────────────────────┘
                              │ tRPC Calls (Type-Safe)
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Backend (Express 4 + tRPC 11)                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  tRPC Routers                                             │  │
│  │  ├─ csv.upload: Parse and store CSV files               │  │
│  │  ├─ csv.list: Retrieve user's datasets                  │  │
│  │  ├─ csv.getContent: Fetch dataset content               │  │
│  │  ├─ insights.generate: AI-powered analysis              │  │
│  │  ├─ insights.list: Retrieve cached insights             │  │
│  │  ├─ cleaning.clean: AI data cleaning                    │  │
│  │  ├─ cleaning.exportAsDataset: Save cleaned data         │  │
│  │  └─ auth: OAuth and session management                  │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────┬────────────────────────────────┬──────────────────┘
               │                                │
        ┌──────▼──────┐              ┌─────────▼────────┐
        │   Database  │              │  Manus LLM API   │
        │ (MySQL/TiDB)│              │  (Analysis &     │
        │             │              │   Cleaning)      │
        │ • Users     │              │                  │
        │ • Datasets  │              │ • JSON Schema    │
        │ • Insights  │              │ • Structured     │
        │ • Cleaning  │              │   Responses      │
        └─────────────┘              └──────────────────┘
                                              │
                                     ┌────────▼────────┐
                                     │  S3 Storage     │
                                     │  (File Storage) │
                                     └─────────────────┘
```

### Data Processing Flow

**Upload and Parsing Phase**: When users upload a CSV file, the system receives the file through the frontend upload dialog, validates the file format and size constraints, parses the CSV content to extract headers and data rows, stores the raw CSV in the database, and records metadata including row count and column count.

**Analysis Phase**: The system retrieves the stored CSV content, sends the data to the Manus LLM API with detailed prompts for multi-faceted analysis, receives structured JSON responses containing insights across eight categories, stores insights in the database with confidence scores, and caches results for quick retrieval on subsequent views.

**Visualization Phase**: The frontend retrieves analysis results and dataset metadata, generates interactive charts using Chart.js, displays insights organized by category, allows users to customize chart appearance (type, colors, labels), and enables chart export functionality.

**Cleaning Phase**: When users initiate data cleaning, the system sends the dataset to the Manus LLM API with specific cleaning instructions, receives cleaned data and a detailed cleaning report, generates a cleaned CSV file, stores the cleaned version as a new dataset, and makes it available for download and export.

## Database Schema

The application uses a relational database with the following core tables:

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `users` | User accounts and authentication | `id`, `openId`, `name`, `email`, `role`, `createdAt`, `updatedAt` |
| `csvDatasets` | Uploaded and cleaned datasets | `id`, `userId`, `fileName`, `rawCsv`, `headers`, `rowCount`, `columnCount`, `createdAt` |
| `dataInsights` | Generated analysis insights | `id`, `datasetId`, `category`, `insight`, `confidence`, `metadata`, `createdAt` |
| `dataCleaningResults` | Data cleaning operations | `id`, `datasetId`, `cleanedCsv`, `report`, `createdAt` |

The schema enforces referential integrity through foreign keys, ensuring data consistency across related tables. All timestamps use UTC for consistency, and metadata fields store JSON for flexible extensibility.

## API Reference

### CSV Management Procedures

**csv.upload** (Mutation)
- **Input**: `{ fileName: string, csvContent: string }`
- **Output**: `{ datasetId: number, rowCount: number, columnCount: number, headers: string[] }`
- **Description**: Parses and stores a CSV file, returning the dataset ID and metadata

**csv.list** (Query)
- **Output**: `Array<{ id: number, fileName: string, rowCount: number, columnCount: number, headers: string[] }>`
- **Description**: Returns all datasets belonging to the authenticated user

**csv.getContent** (Query)
- **Input**: `{ datasetId: number }`
- **Output**: `{ headers: string[], data: string[][], rowCount: number }`
- **Description**: Retrieves the full content of a specific dataset

### Analysis Procedures

**insights.generate** (Mutation)
- **Input**: `{ datasetId: number, csvContent: string, headers: string[] }`
- **Output**: `{ success: boolean, message: string }`
- **Description**: Triggers AI analysis and generates insights for the dataset

**insights.list** (Query)
- **Input**: `{ datasetId: number }`
- **Output**: `Array<{ id: number, category: string, insight: string, confidence: number, metadata: object }>`
- **Description**: Retrieves all insights for a specific dataset, organized by category

### Data Cleaning Procedures

**cleaning.clean** (Mutation)
- **Input**: `{ datasetId: number, csvContent: string, headers: string[] }`
- **Output**: `{ cleanedCsv: string, report: { totalChanges: number, headersRenamed: number, valuesFixed: number, missingValuesHandled: number, duplicatesRemoved: number, qualityScore: number } }`
- **Description**: Performs AI-powered data cleaning and returns cleaned data with a detailed report

**cleaning.exportAsDataset** (Mutation)
- **Input**: `{ datasetId: number, cleanedCsv: string, headers: string[] }`
- **Output**: `{ newDatasetId: number, fileName: string }`
- **Description**: Saves cleaned data as a new dataset in Recent Datasets

### Chart Customization Procedures

**charts.customize** (Mutation)
- **Input**: `{ chartIndex: number, chartType: string, colorPalette: string, xAxisLabel: string, yAxisLabel: string, title: string, showLegend: boolean, showGrid: boolean }`
- **Output**: `{ success: boolean, message: string }`
- **Description**: Updates chart customization settings and applies them to the visualization

## Getting Started

### Prerequisites

Before deploying Data Insights AI, ensure you have the following:

- A Manus account with API access enabled
- Node.js 18 or higher and pnpm package manager
- MySQL 8.0+ or TiDB database access
- Git for version control
- A code editor or IDE (VS Code recommended)

### Installation and Setup

**1. Clone the Repository**

```bash
git clone https://github.com/yourusername/data-insights-ai.git
cd data-insights-ai
```

**2. Install Dependencies**

```bash
pnpm install
```

**3. Configure Environment Variables**

Create a `.env` file in the project root with the following variables:

```bash
# Database Configuration
DATABASE_URL=mysql://username:password@localhost:3306/data_insights_ai

# Authentication
JWT_SECRET=your-secure-jwt-secret-key
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im/login

# Manus Platform
VITE_APP_ID=your-manus-app-id
VITE_APP_TITLE=Data Insights AI
VITE_APP_LOGO=https://your-domain.com/logo.png
OWNER_OPEN_ID=your-owner-open-id
OWNER_NAME=Your Name

# Manus APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-api-key

# Analytics (Optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=your-website-id
```

**4. Initialize the Database**

```bash
pnpm db:push
```

This command creates all necessary tables and migrations in your database.

**5. Start the Development Server**

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
pnpm build
```

This creates optimized production builds for both frontend and backend.

## Deployment

### Deploying on Manus Platform

**1. Connect GitHub Repository**

- Log in to your Manus account
- Navigate to the Projects section
- Click "New Project" and select "Connect GitHub Repository"
- Authorize Manus to access your GitHub account
- Select the `data-insights-ai` repository

**2. Configure Environment Variables**

In the Manus Management UI:
- Navigate to Settings → Secrets
- Add all required environment variables from the `.env` file
- Ensure `DATABASE_URL` points to your production database

**3. Deploy Application**

- Click the "Publish" button in the Management UI
- Manus will automatically build and deploy your application
- Your application will be available at the provided URL

### Custom Domain Configuration

To use a custom domain with your Manus deployment:

1. Navigate to Settings → Domains in the Management UI
2. Click "Add Custom Domain"
3. Enter your domain name
4. Follow the DNS configuration instructions
5. Verify domain ownership
6. Update your domain's DNS records as instructed

## Project Structure

```
data-insights-ai/
├── client/                              # Frontend application
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx                # Main application interface
│   │   │   └── NotFound.tsx             # 404 error page
│   │   ├── components/
│   │   │   ├── ui/                     # shadcn/ui component library
│   │   │   ├── DataCharts.tsx          # Interactive chart component
│   │   │   ├── ChartCustomizer.tsx     # Chart customization dialog
│   │   │   ├── DashboardLayout.tsx     # Layout wrapper
│   │   │   └── ErrorBoundary.tsx       # Error handling
│   │   ├── contexts/                   # React context providers
│   │   ├── hooks/                      # Custom React hooks
│   │   ├── lib/
│   │   │   └── trpc.ts                # tRPC client configuration
│   │   ├── App.tsx                    # Main application component
│   │   ├── main.tsx                   # Application entry point
│   │   └── index.css                  # Global styles and theme
│   ├── public/                         # Static assets
│   ├── index.html                     # HTML template
│   └── vite.config.ts                 # Vite build configuration
├── server/                             # Backend application
│   ├── routers.ts                     # tRPC procedure definitions
│   ├── db.ts                          # Database query helpers
│   ├── storage.ts                     # S3 storage utilities
│   ├── _core/
│   │   ├── index.ts                  # Express server initialization
│   │   ├── context.ts                # tRPC context setup
│   │   ├── llm.ts                    # LLM API integration
│   │   ├── imageGeneration.ts        # Image generation utilities
│   │   ├── voiceTranscription.ts     # Audio transcription
│   │   └── notification.ts           # Notification system
│   └── tests/
│       ├── chartCustomization.test.ts # Chart feature tests
│       └── exportFeature.test.ts      # Export functionality tests
├── drizzle/                            # Database schema and migrations
│   ├── schema.ts                      # Drizzle ORM schema definition
│   ├── migrations/                    # SQL migration files
│   └── relations.ts                   # Table relationships
├── shared/                             # Shared code between client and server
│   ├── const.ts                       # Application constants
│   ├── types.ts                       # Shared TypeScript types
│   └── _core/                         # Shared utilities
├── drizzle.config.ts                  # Drizzle configuration
├── vite.config.ts                     # Vite configuration
├── vitest.config.ts                   # Vitest testing configuration
├── tsconfig.json                      # TypeScript configuration
├── package.json                       # Project dependencies
└── README.md                          # This file
```

## Key Implementation Details

### Type Safety

The entire application leverages TypeScript for end-to-end type safety. tRPC ensures that frontend and backend share the same type definitions, eliminating runtime errors from type mismatches. The Drizzle ORM provides type-safe database queries, and the Manus LLM API integration uses JSON Schema for structured response validation.

### State Management

The frontend uses React hooks for state management, with tRPC queries and mutations handling server state. The `useQuery` hook automatically caches results and handles loading/error states, while `useMutation` provides optimistic updates for responsive user interactions.

### Error Handling

The application implements comprehensive error handling at multiple levels. Frontend components display user-friendly error messages, backend procedures validate inputs and return detailed error codes, and the LLM integration includes fallback mechanisms for API failures.

### Performance Optimization

The platform optimizes performance through several strategies: lazy loading of chart components, caching of analysis results in the database, pagination for large datasets, and optimistic updates in the UI for instant user feedback.

## Testing

The project includes comprehensive test coverage for critical features:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

Test files are located in the `server/tests/` directory and cover chart customization, export functionality, and data cleaning operations.

## Troubleshooting

### Common Issues

**Database Connection Error**: Verify that your `DATABASE_URL` is correct and the database server is running. Test the connection using a MySQL client.

**LLM API Failures**: Ensure your `BUILT_IN_FORGE_API_KEY` is valid and has sufficient quota. Check the Manus dashboard for API usage statistics.

**Chart Rendering Issues**: Clear browser cache and ensure JavaScript is enabled. Check browser console for specific error messages.

**File Upload Errors**: Verify that uploaded files are valid CSV format and under 10MB. Check that the `csvContent` is properly encoded.

### Getting Help

For additional support, consult the following resources:

- **Manus Documentation**: https://docs.manus.im
- **GitHub Issues**: Report bugs and request features on the project repository
- **Community Forum**: Engage with other users and developers

## Contributing

Contributions are welcome! To contribute to Data Insights AI:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure all tests pass and code follows the project's style guidelines.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

Data Insights AI was built with the following technologies and platforms:

- **Manus Platform** for managed hosting and AI API access
- **React** and **Tailwind CSS** communities for excellent documentation
- **shadcn/ui** for high-quality accessible components
- **tRPC** for type-safe API communication
- **Drizzle ORM** for elegant database interactions

## Roadmap

Future enhancements planned for Data Insights AI include:

- **Real-time Collaboration**: Multi-user dataset analysis and commenting
- **Advanced Visualizations**: Additional chart types including scatter plots and heatmaps
- **Data Connectors**: Direct integration with popular data sources (Google Sheets, SQL databases)
- **Scheduled Analysis**: Automated analysis runs on a user-defined schedule
- **Custom Models**: Support for user-defined analysis templates and custom metrics
- **Mobile Application**: Native iOS and Android apps for on-the-go analysis
- **API Access**: Public REST API for programmatic access to analysis capabilities

## Contact

For questions, feedback, or partnership inquiries, please contact the development team through the Manus platform or visit our website.

---

**Last Updated**: January 2026  
**Version**: 1.0.0  
**Maintained by**: Manus AI Team
