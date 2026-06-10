# 🔐 Jenkins DevSecOps Pipeline

Pipeline de CI/CD declarativo con integración de seguridad estática (SAST) y despliegue automatizado con Docker. Construido sobre una Todo API en Node.js con una vulnerabilidad intencional (`eval()`) para demostrar la detección real de Semgrep.

---

## Pipeline Overview

```
Checkout → Build → Test → SAST (Semgrep) → Docker Build & Deploy
```

| Stage | Herramienta | Qué hace |
|---|---|---|
| Checkout | Jenkins SCM | Descarga el código desde GitHub |
| Build | Node.js / npm | Instala dependencias de la aplicación |
| Test | Jest + Supertest | Ejecuta 3 pruebas automatizadas de la API REST |
| SAST | Semgrep `p/nodejs-security` | Escanea vulnerabilidades en el código fuente |
| Docker Build & Deploy | Docker | Construye imagen y despliega contenedor en puerto 3001 |

---

## Diagrama del Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌──────────────────┐    ┌──────────────────────┐
│  Checkout   │───▶│    Build    │───▶│    Test     │───▶│  SAST (Semgrep)  │───▶│  Docker Build Deploy │
│  git clone  │    │ npm install │    │  Jest x3    │    │ nodejs-security  │    │  imagen + contenedor │
└─────────────┘    └─────────────┘    └─────────────┘    └──────────────────┘    └──────────────────────┘
                                                                   │
                                                                   ▼
                                                       semgrep-report.json
                                                       (archivado como artifact)
```

---

## SAST — Vulnerabilidad Detectada

La aplicación incluye un endpoint con `eval()` intencional para demostrar la detección de Semgrep:

```javascript
// ⚠️ Vulnerabilidad intencional — detectada por SAST
app.get('/eval', (req, res) => {
  const result = eval(req.query.code);
  res.json({ result });
});
```

**Resultado:** Semgrep detecta y reporta la vulnerabilidad en `semgrep-report.json`, archivado como artifact en cada ejecución del pipeline.

---

## Stack Técnico

![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=flat&logo=jenkins&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Semgrep](https://img.shields.io/badge/Semgrep-SAST-orange?style=flat)
![Jest](https://img.shields.io/badge/Jest-C21325?style=flat&logo=jest&logoColor=white)

---

## Estructura del Proyecto

```
jenkins-devsecops-pipeline/
├── src/
│   └── app.js              # API REST con vulnerabilidad intencional
├── tests/
│   └── app.test.js         # 3 pruebas automatizadas con Jest + Supertest
├── Dockerfile              # Imagen Node.js 18 Alpine
├── Jenkinsfile             # Pipeline declarativo (5 stages)
├── package.json
└── semgrep-report.json     # Generado en cada ejecución del pipeline
```

---

## Cómo reproducir

**Requisitos:** Jenkins con agente Docker, Node.js 18, Docker instalado.

```bash
# 1. Clonar el repositorio
git clone https://github.com/Angh31/jenkins-devsecops-pipeline.git
cd jenkins-devsecops-pipeline

# 2. Crear pipeline en Jenkins apuntando al Jenkinsfile
# 3. Ejecutar el pipeline — la app queda disponible en:
curl http://localhost:3001/todos
```

---

## API Endpoints

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/todos` | Lista todas las tareas |
| POST | `/todos` | Crea una nueva tarea `{ "title": "..." }` |
| DELETE | `/todos/:id` | Elimina una tarea por ID |
| GET | `/eval` | ⚠️ Endpoint vulnerable — solo con fines de demo SAST |

---

## Pruebas Automatizadas

```bash
npm test
```

```
✓ GET /todos - retorna array vacío al inicio
✓ POST /todos - crea un todo correctamente
✓ POST /todos - falla si no hay title
```

---

> Este pipeline forma parte de un ecosistema DevSecOps.
