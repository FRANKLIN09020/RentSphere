# Supabase image storage

Create a **public** Storage bucket named `rentsphere-images`, then add these values to the repository `.env` file:

```properties
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_STORAGE_BUCKET=rentsphere-images
```

The service-role key is read only by the Spring Boot backend. Never add it to the Vite frontend or commit it.
