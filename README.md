# code-front


프론트엔드 프로젝트로, AWS ECR/ECS와 Docker를 활용한 클라우드 배포 구조를 지원합니다.

---

## 📋 목차

- [개요](#개요)
- [시스템 아키텍처](#시스템-아키텍처)
- [기술 스택](#기술-스택)
- [설치 및 실행](#설치-및-실행)
- [Docker 배포](#docker-배포)
- [AWS 연동](#aws-연동)
- [참고자료](#참고자료)

---

## 개요

`code-front`는 AWS Docker 환경과의 통합을 지원하는 현대적인 프론트엔드 애플리케이션입니다.

**주요 특징:**
- ✅ Docker 기반 컨테이너화
- ✅ AWS ECR 이미지 레지스트리 지원
- ✅ AWS ECS 오케스트레이션
- ✅ CI/CD 파이프라인 통합
- ✅ 환경별 설정 관리

---

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                     Local Development                        │
│                                                               │
│  ┌─────────────────┐        ┌──────────────────┐             │
│  │   Source Code   │───────→│  Docker Build    │             │
│  └─────────────────┘        └────────┬─────────┘             │
│                                      │                       │
└──────────────────────────────────────┼───────────────────────┘
                                       │
                ┌──────────────────────▼──────────────────────┐
                │      AWS Container Registry (ECR)           │
                │                                              │
                │  ┌────────────────────────────────────┐     │
                │  │   Docker Image Repository          │     │
                │  │   tag: latest, v1.0, v1.1, etc.    │     │
                │  └────────────────────────────────────┘     │
                └──────────────────────┬───────────────────────┘
                                       │
        ┌──────────────────────────────▼──────────────────────┐
        │      AWS Elastic Container Service (ECS)            │
        │                                                      │
        │  ┌────────────────┐      ┌────────────────┐         │
        │  │  Task (Dev)    │      │  Task (Prod)   │         │
        │  │  Cluster: dev  │      │  Cluster: prod │         │
        │  └────────────────┘      └────────────────┘         │
        │                                                      │
        └──────────────────────────────────────────────────────┘
                                       │
        ┌──────────────────────────────▼──────────────────────┐
        │    AWS Load Balancer / CloudFront                    │
        │                                                      │
        │    └─ https://your-domain.com                       │
        └──────────────────────────────────────────────────────┘
```

---

## 기술 스택

| 카테고리 | 기술 | 용도 |
|---------|------|------|
| **프론트엔드** | React / Vue / Next.js | UI 프레임워크 |
| **패키징** | Docker | 컨테이너화 |
| **클라우드 인프라** | AWS ECR | 이미지 레지스트리 |
| **오케스트레이션** | AWS ECS | 컨테이너 배포 관리 |
| **로드 밸런싱** | AWS ALB / NLB | 트래픽 분산 |
| **CI/CD** | GitHub Actions / AWS CodePipeline | 자동 배포 |
| **모니터링** | CloudWatch | 로그 및 메트릭 |

---

## 설치 및 실행

### 사전 요구사항

- Node.js 18+ 또는 npm 9+
- Docker 20.10+
- AWS CLI v2
- AWS 계정 및 IAM 권한

### 로컬 개발 환경 설정

```bash
# 1. 저장소 클론
git clone https://github.com/metaapple/code-front.git
cd code-front

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 브라우저에서 접속
# http://localhost:3000
```

### 프로덕션 빌드

```bash
# 빌드 실행
npm run build

# 빌드 결과 확인 (dist 또는 .next 디렉토리)
ls -la dist/
```

---

## Docker 배포

### Dockerfile 구조

```dockerfile
# Dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

### 로컬 Docker 빌드 및 실행

```bash
# 1. Docker 이미지 빌드
docker build -t code-front:latest .

# 2. 컨테이너 실행
docker run -d -p 3000:3000 \
  -e NODE_ENV=production \
  --name code-front \
  code-front:latest

# 3. 실행 상태 확인
docker ps
docker logs code-front
```

### Docker Compose (개발/테스트)

```yaml
# docker-compose.yml
version: '3.8'

services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - API_URL=${API_URL}
    restart: unless-stopped
```

```bash
# Docker Compose로 실행
docker-compose up -d
```

---

## AWS 연동

### 1. AWS ECR (Elastic Container Registry) 설정

#### ECR 리포지토리 생성

```bash
# AWS CLI를 사용한 ECR 리포지토리 생성
aws ecr create-repository \
  --repository-name code-front \
  --region us-east-1 \
  --image-scan-on-push \
  --image-tag-mutability MUTABLE
```

#### 로그인 토큰 획득

```bash
# ECR 로그인 (AWS CLI v2)
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
```

#### 이미지 빌드 및 푸시

```bash
# 변수 설정
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1
REPOSITORY_NAME=code-front
IMAGE_TAG=latest

# 1. 이미지 빌드
docker build -t $REPOSITORY_NAME:$IMAGE_TAG .

# 2. 이미지 태깅 (ECR 형식)
docker tag $REPOSITORY_NAME:$IMAGE_TAG \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:$IMAGE_TAG

# 3. ECR에 푸시
docker push \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:$IMAGE_TAG
```

### 2. AWS ECS 배포

#### ECS 클러스터 생성

```bash
# Fargate 클러스터 생성
aws ecs create-cluster --cluster-name code-front-cluster --region us-east-1
```

#### 태스크 정의 생성

```json
{
  "family": "code-front-task",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "containerDefinitions": [
    {
      "name": "code-front",
      "image": "<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com/code-front:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "hostPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/code-front",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 태스크 정의 등록

```bash
aws ecs register-task-definition \
  --cli-input-json file://task-definition.json \
  --region us-east-1
```

#### ECS 서비스 생성

```bash
aws ecs create-service \
  --cluster code-front-cluster \
  --service-name code-front-service \
  --task-definition code-front-task:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --region us-east-1
```

### 3. CI/CD 파이프라인 (GitHub Actions)

#### GitHub Actions 워크플로우 설정

```yaml
# .github/workflows/deploy-to-ecs.yml
name: Deploy to AWS ECS

on:
  push:
    branches:
      - main

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: code-front
  ECS_SERVICE: code-front-service
  ECS_CLUSTER: code-front-cluster
  ECS_TASK_DEFINITION: code-front-task

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, tag, and push Docker image to ECR
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Update ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: ${{ env.ECS_TASK_DEFINITION }}.json
          container-name: code-front
          image: ${{ steps.login-ecr.outputs.registry }}/${{ env.ECR_REPOSITORY }}:${{ github.sha }}

      - name: Deploy to ECS
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true
```

---

### 4. AWS CloudFront CDN 설정 (선택)

```bash
# CloudFront 배포 생성
aws cloudfront create-distribution \
  --origin-domain-name <ALB-DNS-NAME> \
  --default-root-object index.html \
  --region us-east-1
```

---

## 배포 프로세스 플로우

| 단계 | 설명 | 명령어 |
|------|------|--------|
| **1. 로컬 빌드** | 소스 코드 컴파일 | `npm run build` |
| **2. Docker 이미지** | 컨테이너 이미지 생성 | `docker build -t code-front:latest .` |
| **3. ECR 로그인** | AWS ECR 인증 | `aws ecr get-login-password \| docker login` |
| **4. 이미지 푸시** | ECR에 이미지 업로드 | `docker push <ECR_URL>` |
| **5. 태스크 정의** | ECS 배포 설정 | `aws ecs register-task-definition` |
| **6. 서비스 배포** | ECS에 컨테이너 배포 | `aws ecs update-service` |
| **7. 헬스 체크** | 배포 상태 확인 | CloudWatch 모니터링 |

---

## 환경 변수 설정

```bash
# .env.local (로컬 개발)
NODE_ENV=development
API_URL=http://localhost:8000
DEBUG=true

# .env.production (프로덕션)
NODE_ENV=production
API_URL=https://api.example.com
DEBUG=false
```

### AWS 환경 변수

```bash
# CI/CD 환경 변수 설정 (GitHub Secrets)
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
AWS_REGION=us-east-1
ECR_REGISTRY_URL=123456789012.dkr.ecr.us-east-1.amazonaws.com
```

---

## 모니터링 및 로깅

### CloudWatch 로그 조회

```bash
# 로그 그룹 확인
aws logs describe-log-groups --region us-east-1

# 특정 로그 스트림 조회
aws logs tail /ecs/code-front --follow --region us-east-1
```

### CloudWatch 메트릭

- CPU 사용률
- 메모리 사용률
- 네트워크 I/O
- 컨테이너 상태

---

## 트러블슈팅

### 일반적인 문제

| 문제 | 원인 | 해결책 |
|------|------|--------|
| Docker 이미지 빌드 실패 | 의존성 설치 오류 | `npm ci` 사용, `package-lock.json` 확인 |
| ECR 푸시 실패 | 인증 만료 | `aws ecr get-login-password` 재실행 |
| ECS 태스크 시작 안 됨 | 보안 그룹/서브넷 설정 | VPC, 보안 그룹 규칙 확인 |
| 503 에러 | 헬스 체크 실패 | 컨테이너 포트, 애플리케이션 로그 확인 |

---

## 참고자료

### 📚 공식 문서

- [AWS ECR Documentation](https://docs.aws.amazon.com/ecr/)
- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [Docker Official Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

### 🔗 유용한 링크

- [AWS Free Tier](https://aws.amazon.com/free/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [AWS ECS Best Practices Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/welcome.html)
- [GitHub Actions AWS Documentation](https://github.com/aws-actions)

### 📖 추천 자료

- AWS Well-Architected Framework - Container Lens
- ECS Task Placement Strategies Guide
- Docker Security Best Practices
- Kubernetes vs ECS Comparison

---

## 라이센스

MIT License

---

## 문의 및 지원

- 📧 이메일: support@example.com
- 🐛 버그 리포트: [GitHub Issues](https://github.com/metaapple/code-front/issues)
- 💬 토론: [GitHub Discussions](https://github.com/metaapple/code-front/discussions)

---

**Last Updated:** 2026-05-18
