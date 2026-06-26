# Deployment Guide

## Local Backend Setup
1. Create and activate a virtual environment:
```bash
cd backend
python -m venv venv
venv\Scripts\activate
```

2. Install backend dependencies:
```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers whitenoise
```

3. Apply database migrations:
```bash
python manage.py migrate
```

4. Run the development server:
```bash
python manage.py runserver
```

5. Visit `http://127.0.0.1:8000/api/` to verify the API.

## Local Frontend Setup
1. Install frontend dependencies:
```bash
cd frontend
npm install
```

2. Start the React application:
```bash
npm start
```

3. Visit `http://localhost:3000` to open the UI.

## PythonAnywhere Deployment
The backend is configured for PythonAnywhere hosting.

1. Create a PythonAnywhere account and open a new web app.
2. Upload the repository or clone it into your home directory.
3. Set the working directory to the `backend/` folder.
4. Configure the WSGI file to load the Django project from `backend/inventory`.
5. Ensure `ALLOWED_HOSTS` includes your PythonAnywhere domain.
6. Run `pip install` in the PythonAnywhere virtualenv for:
   - Django
   - djangorestframework
   - djangorestframework-simplejwt
   - django-cors-headers
   - whitenoise
7. Run migrations:
```bash
python manage.py migrate
```
8. Collect static files:
```bash
python manage.py collectstatic
```

## Frontend Deployment
For the React frontend, build the production bundle:
```bash
cd frontend
npm run build
```

Deploy the generated `build/` folder to a static hosting service such as Netlify, Vercel, or GitHub Pages.

## Configuration Notes
- `backend/inventory/settings.py` currently enables `CORS_ALLOW_ALL_ORIGINS = True` for development and cross-origin support.
- `STATICFILES_STORAGE` is configured for Whitenoise with compressed static delivery.
- `ALLOWED_HOSTS` includes `Mindfulnesssupplies.pythonanywhere.com`.

## Recommended Files
The project does not include a `requirements.txt` file by default.
Create one with:
```bash
pip freeze > requirements.txt
```

## Production Considerations
- Switch `DEBUG = False` in production.
- Use a stronger Django secret key from environment variables.
- Consider migrating from SQLite to PostgreSQL for production data reliability.
