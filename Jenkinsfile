pipeline {
    agent any

    environment {
        APP_NAME = 'jenkins-todo-app'
        APP_PORT = '3001'
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

        stage('Test') {
            steps {
                echo '🧪 Ejecutando pruebas automatizadas...'
                sh 'npm test'
            }
        }

        stage('SAST - Seguridad') {
            steps {
                echo '🔒 Analizando vulnerabilidades en el código...'
                sh '''
                    pip install semgrep --quiet --break-system-packages
                    semgrep --config=p/nodejs-security \
                            --json \
                            --output=semgrep-report.json \
                            src/ || true
                    echo "=== VULNERABILIDADES ENCONTRADAS ==="
                    cat semgrep-report.json
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
    }

    post {
        success {
            echo '✅ Pipeline completado. App desplegada exitosamente.'
        }
        failure {
            echo '❌ Pipeline falló. Revisar el stage en rojo.'
        }
        always {
            echo '📋 Guardando reporte de seguridad...'
            archiveArtifacts artifacts: 'semgrep-report.json',
                             allowEmptyArchive: true
        }
    }
}