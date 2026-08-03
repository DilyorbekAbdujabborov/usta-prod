# OurID Passport Data Wrapper

FastAPI wrapper/proxy for the BSA passport data API.

## Format qoidalari

### 🪪 Eski biometrik pasport
- **Seriya:** 2 ta lotin harfi (masalan: `AA`, `AB`, `AC`)
- **Raqam:** 7 ta raqam (masalan: `1234567`)
- **To'liq pasport:** `AA1234567` (9 belgi)

### 🆔 ID karta
- **Hujjat raqami:** 2 ta lotin harfi + 7 ta raqam
- Masalan: `AC1234567`

### 🆔 JShShIR (PINFL)
- **Uzunligi:** 14 ta raqam
- Faqat raqamlardan iborat.
- Misol: `30201011234567`

## Endpoints

### POST /api/get-passport-data

Passport ma'lumotlarini olish.

**Request body:**
```json
{
  "user_pin": "30201011234567",
  "passport": "DD1071414"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "document": "DD1071414",
    "pin": "30201011234567",
    "surname_latin": "Palonchiyev",
    "name_latin": "Kimdur",
    ...
  }
}
```

### GET /health

Health check endpoint.

## Setup

```bash
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `TARGET_URL` | `https://demo-test.bsa.uz/api/get-passport-data` | Upstream API URL |
| `REQUEST_TIMEOUT` | `15.0` | Request timeout in seconds |
| `PORT` | `8000` | Server port |

## OpenAPI Spec

To'liq OpenAPI 3.0.3 spetsifikatsiya: [`openapi.json`](./openapi.json)

Interactive docs: `http://localhost:8000/docs`