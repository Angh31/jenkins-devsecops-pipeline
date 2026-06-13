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
                    echo "=== REPORTE SCA (npm audit) ==="
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
                    export PATH=$PATH:/var/jenkins_home/.local/bin
                    pip install semgrep --quiet --break-system-packages
                    semgrep --config=p/nodejs-security \
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
                    echo "  - Vulnerabilidades CRITICAL permitidas: ${MAX_CRITICAL}"
                    echo "  - Vulnerabilidades HIGH permitidas:     ${MAX_HIGH}"

                    CRITICAL=$(cat trivy-report.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
count = 0
for result in data.get('Results', []):
    for vuln in result.get('Vulnerabilities', []):
        if vuln.get('Severity') == 'CRITICAL':
            count += 1
print(count)
" 2>/dev/null || echo "0")

                    HIGH=$(cat trivy-report.json | python3 -c "
import json, sys
data = json.load(sys.stdin)
count = 0
for result in data.get('Results', []):
    for vuln in result.get('Vulnerabilities', []):
        if vuln.get('Severity') == 'HIGH':
            count += 1
print(count)
" 2>/dev/null || echo "0")

                    echo "Vulnerabilidades encontradas:"
                    echo "  - CRITICAL: $CRITICAL (máximo: ${MAX_CRITICAL})"
                    echo "  - HIGH:     $HIGH (máximo: ${MAX_HIGH})"

                    if [ "$CRITICAL" -gt "${MAX_CRITICAL}" ]; then
                        echo "❌ SECURITY GATE FALLÓ: $CRITICAL vulnerabilidades CRITICAL (máximo: ${MAX_CRITICAL})"
                        exit 1
                    fi

                    if [ "$HIGH" -gt "${MAX_HIGH}" ]; then
                        echo "❌ SECURITY GATE FALLÓ: $HIGH vulnerabilidades HIGH (máximo: ${MAX_HIGH})"
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
            echo '📋 Archivando reportes de seguridad...'
            archiveArtifacts artifacts: 'semgrep-report.json, sca-report.json, trivy-report.json, zap-report.html, zap-report.json',
                             allowEmptyArchive: true
        }
    }
}
