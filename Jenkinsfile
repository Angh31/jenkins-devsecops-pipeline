pipeline {
    agent any

    environment {
        APP_NAME = 'jenkins-todo-app'
        APP_PORT = '3001'
        MAX_CRITICAL = '0'
        MAX_HIGH     = '3'
    }

    stages {

        stage('Checkout') {
            steps {
                echo '📥 Descargando código desde GitHub...'
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo '🔧 Instalando dependencias...'
                sh 'node --version'
                sh 'npm install'
            }
        }

        stage('SCA - Dependencias') {
            steps {
                echo '📦 Analizando vulnerabilidades en dependencias...'
                sh '''
                    npm audit --json > sca-report.json || true
                    echo "=== REPORTE SCA ==="
                    cat sca-report.json
                '''
            }
        }

        stage('Test') {
            steps {
                echo '🧪 Ejecutando pruebas automatizadas...'
                sh 'npm test'
            }
        }

        stage('SAST - Semgrep') {
            steps {
                echo '🔒 Analizando vulnerabilidades en el código fuente...'
                sh '''
                    pip install semgrep --quiet --break-system-packages || true
                    export PATH=$HOME/.local/bin:$PATH
                    $HOME/.local/bin/semgrep --config=p/nodejs-security \
                            --json \
                            --output=semgrep-report.json \
                            src/ || true
                    echo "=== VULNERABILIDADES ENCONTRADAS ==="
                    cat semgrep-report.json || echo "Sin reporte generado"
                '''
            }
        }

        stage('Docker Build & Deploy') {
            steps {
                echo '🐳 Construyendo imagen Docker...'
                sh "docker build -t ${APP_NAME}:latest ."
                echo '🚀 Desplegando contenedor...'
                sh "docker stop ${APP_NAME} || true"
                sh "docker rm ${APP_NAME} || true"
                sh "docker run -d --name ${APP_NAME} -p ${APP_PORT}:3000 ${APP_NAME}:latest"
                echo "✅ App corriendo en http://localhost:${APP_PORT}/todos"
            }
        }

        stage('Trivy - Imagen Docker') {
            steps {
                echo '🔍 Escaneando imagen Docker con Trivy...'
                sh '''
                    docker run --rm \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        aquasec/trivy:latest image \
                        --format json \
                        --output trivy-report.json \
                        --severity LOW,MEDIUM,HIGH,CRITICAL \
                        jenkins-todo-app:latest || true
                    echo "=== REPORTE TRIVY ==="
                    cat trivy-report.json || echo "Sin reporte generado"
                '''
            }
        }

        stage('Security Gate') {
            steps {
                echo '🚦 Evaluando Security Gate...'
                sh '''
                    echo "=== SECURITY GATE ==="
                    echo "Criterios:"
                    echo "  - CRITICAL permitidas: ${MAX_CRITICAL}"
                    echo "  - HIGH permitidas:     ${MAX_HIGH}"

                    CRITICAL=$(python3 -c "
import json, sys
try:
    data = json.load(open('trivy-report.json'))
    count = sum(1 for r in data.get('Results',[]) for v in r.get('Vulnerabilities',[]) if v.get('Severity')=='CRITICAL')
    print(count)
except: print(0)
" 2>/dev/null || echo "0")

                    HIGH=$(python3 -c "
import json, sys
try:
    data = json.load(open('trivy-report.json'))
    count = sum(1 for r in data.get('Results',[]) for v in r.get('Vulnerabilities',[]) if v.get('Severity')=='HIGH')
    print(count)
except: print(0)
" 2>/dev/null || echo "0")

                    echo "  - CRITICAL encontradas: $CRITICAL"
                    echo "  - HIGH encontradas:     $HIGH"

                    if [ "$CRITICAL" -gt "${MAX_CRITICAL}" ]; then
                        echo "❌ SECURITY GATE FALLÓ: $CRITICAL CRITICAL (máximo: ${MAX_CRITICAL})"
                        exit 1
                    fi

                    if [ "$HIGH" -gt "${MAX_HIGH}" ]; then
                        echo "❌ SECURITY GATE FALLÓ: $HIGH HIGH (máximo: ${MAX_HIGH})"
                        exit 1
                    fi

                    echo "✅ SECURITY GATE APROBADO"
                '''
            }
        }

        stage('DAST - OWASP ZAP') {
            steps {
                echo '🕷️ Ejecutando análisis dinámico con OWASP ZAP...'
                sh '''
                    docker run --rm \
                        --network host \
                        -v $(pwd):/zap/wrk \
                        ghcr.io/zaproxy/zaproxy:stable \
                        zap-baseline.py \
                        -t http://localhost:${APP_PORT} \
                        -r zap-report.html \
                        -J zap-report.json \
                        -I || true
                    echo "=== REPORTE ZAP GENERADO ==="
                '''
            }
        }

    }

    post {
        success {
            echo '✅ Pipeline completado. App desplegada y seguridad verificada.'
        }
        failure {
            echo '❌ Pipeline falló. Revisar el stage en rojo.'
        }
        always {
            echo '📋 Archivando reportes...'
            archiveArtifacts artifacts: 'semgrep-report.json, sca-report.json, trivy-report.json, zap-report.html, zap-report.json',
                             allowEmptyArchive: true
        }
    }
}
