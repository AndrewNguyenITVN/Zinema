# CT313H: WEB TECHNOLOGIES AND SERVICES

## Project Description

Cinema is a movie theater management system, including a backend API (Node.js/Express) and a frontend SPA (Vue.js). The project supports features such as ticket booking, showtime management, movie and food management, user roles (customer, staff, admin), with a modern interface and RESTful API.

---

## Demo

[Watch Demo on YouTube](https://youtu.be/WFCSNUXTSU0)


---

## Student Information

- **Instructor:** Bui Vo Quoc Bao
- **Student 1:** Nguyễn Minh Nhựt - B2205896
- **Student 2:** Huỳnh Tấn Đạt - B2203438
- **Class:** CT313H
- **Semester:** 2, Academic Year 2025-2026

---

## Project Structure

```
Zinema/
  backend-api/      # Backend Node.js/Express, RESTful API, data management
  frontend-spa/     # Frontend Vue.js, user interface
```

### Backend (backend-api)

- **src/controllers/**: Business logic for features (auth, booking, movie, showtime, food, cinema)
- **src/services/**: Service layer, data operations
- **src/routes/**: API route definitions
- **src/middlewares/**: Authentication, upload, validation middlewares
- **src/database/**: Database connection and configuration (Knex.js)
- **seeds/**: Sample data for the database
- **public/**: Poster images, food images, uploads
- **doc/openapiSpec.json**: OpenAPI/Swagger API documentation

### Frontend (frontend-spa)

- **src/components/**: UI components (AuthForm, MovieCard, SeatPicker, charts, etc.)
- **src/composables/**: Data fetching hooks using TanStack Vue Query
- **src/views/**: Main pages (Home, Booking, Admin Dashboard, Statistics, Profile, etc.)
- **src/services/**: API calls to backend
- **src/stores/**: Global state management (Pinia)
- **src/router/**: Page routing (Vue Router)
- **src/utils/**: Utility helpers and formatters
- **public/**: Images, favicon, logo

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/AndrewNguyenITVN/Zinema.git
cd Zinema
```

### 2. Setup backend

```bash
cd backend-api
cp env.example .env
npm install
# Initialize database (if needed)
# npx knex migrate:latest
# npx knex seed:run
npm start
```

### 3. Setup frontend

```bash
cd ../frontend-spa
npm install
npm run dev
```

### 4. Access

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Docs (Swagger): http://localhost:3000/api-docs

---

## Technologies Used

| Layer | Technologies |
|-------|-------------|
| **Backend** | Node.js, Express 5, Knex.js, PostgreSQL (`pg`), JWT (`jsonwebtoken`), bcrypt, Multer, Zod, Google Auth, Swagger UI, express-rate-limit |
| **Frontend** | Vue.js 3, Pinia, Vue Router, Vite, TanStack Vue Query, Bootstrap 5, Chart.js, vue-chartjs, vee-validate, Zod, Font Awesome |
| **Database** | PostgreSQL |
| **Other** | RESTful API, JWT Auth, Google OAuth, File Upload, OpenAPI/Swagger |

---

## Documentation

- [OpenAPI Spec](backend-api/doc/openapiSpec.json)
- [Demo Video](https://youtu.be/WFCSNUXTSU0)
- See each folder's `README.md` for more details (if available)

---
