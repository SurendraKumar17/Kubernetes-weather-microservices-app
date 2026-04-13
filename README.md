⛅ Kubernetes Weather Microservices App


A production-grade weather dashboard built with microservices architecture, deployed on Kubernetes using Helm, ArgoCD GitOps, and GitHub Actions CI/CD pipeline.



<img width="672" height="898" alt="image" src="https://github.com/user-attachments/assets/63704afd-7347-4e6a-a566-68c863348d6d" />


<img width="691" height="868" alt="image" src="https://github.com/user-attachments/assets/627324fd-204e-4927-96c9-c9551445e74b" />


<img width="638" height="492" alt="image" src="https://github.com/user-attachments/assets/9238f9b5-83a5-46bc-9d84-67259e89e46e" />


## ⚙️ CI/CD Pipeline

The GitHub Actions pipeline has 4 jobs that run sequentially on every push to `main`:

| Job | Trigger | What it does |
|-----|---------|-------------|
| 🔍 PR Validation | Pull Requests | Lint Dockerfiles, scan for secrets |
| 🏗️ Build / Scan / Push | Push to main | Build API & UI images, Trivy vulnerability scan, push to DockerHub |
| 🔄 GitOps Tag Update | After build | Update image tags in `values.yaml`, commit back to repo |
| 📊 Pipeline Summary | Always | Summary report in GitHub Actions UI |

After the pipeline completes, ArgoCD detects the tag change in `values.yaml` and automatically rolls out new pods to Kubernetes.


📦 Helm Chart
The Helm chart deploys the following Kubernetes resources:
ResourceDescriptionDeployment (api)FastAPI backend — 2 replicasDeployment (ui)Nginx frontend — 2 replicasService (api)NodePort — port 30080Service (ui)ClusterIP — port 8080ConfigMapApp config (API URL, env, log level)SecretOpenWeatherMap API keyHPAAutoscale API pods (2–10) on CPU > 70%IngressRoute /api → API, / → UIPDBMinimum 1 pod available during disruptions

🔄 GitOps with ArgoCD
ArgoCD watches the k8s/helm/weather-app path in this repo and automatically syncs any changes to the Kubernetes cluster.

Auto-sync: Enabled — deploys on every Git push
Self-heal: Enabled — reverts manual cluster changes
Prune: Enabled — removes resources deleted from Git
Namespace: Auto-created if not exists


🛠️ Local Setup
Prerequisites

Docker Desktop
Minikube
kubectl
Helm 3
Git

Steps
1. Clone the repo
bashgit clone https://github.com/SurendraKumar17/Kubernetes-weather-microservices-app
cd Kubernetes-weather-microservices-app
2. Start Minikube
bashminikube start --driver=docker --cpus=4 --memory=4096
3. Install ArgoCD
bashkubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=available --timeout=180s deployment/argocd-server -n argocd
4. Apply ArgoCD Application
bashkubectl apply -f argocd/weather-app.yaml
5. Access ArgoCD UI
bashkubectl port-forward svc/argocd-server -n argocd 8080:443
# Open https://localhost:8080
# Username: admin
# Password: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
6. Access the App
bashminikube service weather-app-ui -n weather-app

🔐 GitHub Secrets Required
SecretDescriptionDOCKERHUB_USERNAMEDockerHub usernameDOCKERHUB_TOKENDockerHub access tokenGIT_TOKENGitHub personal access token (repo scope)

📊 Monitoring
Install Prometheus + Grafana:
bashhelm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
kubectl port-forward svc/prometheus-grafana -n monitoring 3000:80
Import monitoring/grafana/weather-dashboard.json in Grafana UI.

🌐 API Endpoints
EndpointDescriptionGET /healthLiveness checkGET /readyReadiness checkGET /weather/{city}Get weather for a cityGET /weather/multiple/{cities}Get weather for multiple cities (comma-separated, max 5)GET /metricsPrometheus metrics

👤 Author
Surendra Kumar — GitHub
