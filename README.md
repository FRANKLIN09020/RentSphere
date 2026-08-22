# RentSphere

RentSphere is maintained as one repository containing the Spring Boot API and React client.

## Repository layout

```text
RentalFamily/
├── backend/             # Spring Boot API
├── frontend/            # React + Vite client
├── docs/                # Project documentation
├── docker-compose.yml   # Full application stack
└── .env.example         # Local environment template
```

## Local development

Start the API:

```powershell
cd backend
mvn spring-boot:run
```

Start the client in another terminal:

```powershell
cd frontend
npm run dev
```

Copy `.env.example` to `.env` at the repository root and supply local credentials before starting the API.
