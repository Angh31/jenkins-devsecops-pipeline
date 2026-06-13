# 🔐 Jenkins DevSecOps Pipeline

Pipeline CI/CD declarativo con 9 stages de seguridad integrada — SCA, SAST, Trivy y DAST — sobre una Todo API en Node.js con vulnerabilidad intencional para demo de detección.

---

## Pipeline Overview

```
Checkout → Build → SCA → Test → SAST → Docker Build & Deploy → Trivy → Security Gate → DAST (ZAP)
```

| Stage | Herramienta | Qué hace |
|---|---|---|
| Checkout | Jenkins SCM | Descarga el código desde GitHub |
| Build | Node.js / npm | Instala dependencias |
| SCA | npm audit | Detecta vulnerabilidades en dependencias |
| Test | Jest + Supertest | Ejecuta 3 pruebas automatizadas de la API REST |
| SAST | Semgrep `p/nodejs-security` | Escanea vulnerabilidades en el código fuente |
| Docker Build & Deploy | Docker | Construye imagen y despliega contenedor en puerto 3001 |
| Trivy | aquasec/trivy | Escanea vulnerabilidades en la imagen Docker |
| Security Gate | Python3 | Falla el pipeline si supera umbrales de CRITICAL/HIGH |
| DAST | OWASP ZAP | Análisis dinámico contra la app desplegada |

---

## Diagrama del Pipeline

```
┌──────────┐  ┌───────┐  ┌─────┐  ┌──────┐  ┌────────┐
│ Checkout │→ │ Build │→ │ SCA │→ │ Test │→ │  SAST  │
└──────────┘  └───────┘  └─────┘  └──────┘  └────────┘
                                                  │
                                                  ▼
┌─────────────────┐  ┌────────┐  ┌───────────────┐
│ Docker Build &  │← │        │  │  semgrep-     │
│ Deploy          │  │        │  │  report.json  │
└─────────────────┘  └────────┘  └───────────────┘
         │
         ▼
┌────────┐  ┌─────────────────┐  ┌──────────┐
│ Trivy  │→ │  Security Gate  │→ │ DAST ZAP │
│ Image  │  │ CRITICAL: 0 max │  │          │
│  Scan  │  │ HIGH:     3 max │  │          │
└────────┘  └─────────────────┘  └──────────┘
         │           │                  │
         ▼           ▼                  ▼
   trivy-report  ✅ PASS / ❌ FAIL   zap-report
   .json                              .html/.json
```

---

## Security Gate — Criterios

| Severidad | Umbral máximo | Acción si supera |
|---|---|---|
| CRITICAL | 0 | ❌ Pipeline falla |
| HIGH | 3 | ❌ Pipeline falla |
| MEDIUM / LOW | Sin límite | ⚠️ Solo reporta |

---

## Stack Técnico

![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=flat&logo=jenkins&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Semgrep](https://img.shields.io/badge/Semgrep-SAST-orange?style=flat)
![Trivy](https://img.shields.io/badge/Trivy-1904DA?style=flat)
![OWASP ZAP](https://img.shields.io/badge/OWASP%20ZAP-000000?style=flat&logo=owasp&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)

---

## SAST — Vulnerabilidad Detectada

La aplicación incluye un endpoint con `eval()` intencional para demo:

```javascript
// ⚠️ Vulnerabilidad intencional — detectada por Semgrep
app.get('/eval', (req, res) => {
  const result = eval(req.query.code);
  res.json({ result });
});
```

Semgrep detecta y reporta la vulnerabilidad en `semgrep-report.json`, archivado como artifact en cada ejecución.

---

## Estructura del Proyecto

```
jenkins-devsecops-pipeline/
├── src/
│   └── app.js              # API REST con vulnerabilidad intencional
├── tests/
│   └── app.test.js         # 3 pruebas con Jest + Supertest
├── Dockerfile              # Imagen Node.js 18 Alpine
├── Jenkinsfile             # Pipeline declarativo (9 stages)
└── package.json
```

---

## Cómo reproducir

```bash
git clone https://github.com/Angh31/jenkins-devsecops-pipeline.git
cd jenkins-devsecops-pipeline
# Configurar pipeline en Jenkins apuntando al Jenkinsfile
# Ejecutar — la app queda disponible en:
curl http://localhost:3001/todos
```

---

## API Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/todos` | Lista todas las tareas |
| POST | `/todos` | Crea una nueva tarea |
| DELETE | `/todos/:id` | Elimina una tarea |
| GET | `/eval` | ⚠️ Endpoint vulnerable — solo demo SAST |

---

## Pruebas Automatizadas

```
✓ GET /todos - retorna array vacío al inicio
✓ POST /todos - crea un todo correctamente
✓ POST /todos - falla si no hay title
```

---

> Este pipeline forma parte de un ecosistema DevSecOps.
> Los reportes generados: `semgrep-report.json`, `sca-report.json`, `trivy-report.json`, `zap-report.html`
