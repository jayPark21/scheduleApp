---
description: how to deploy the application to Vercel
---

# Vercel 배포 가이드 (Vercel Deployment Guide)

대표님, 이 프로젝트를 Vercel에 완벽하게 배포하는 단계별 가이드입니다! 🚀

## 1. 사전 준비 (Local Check)
터미널에서 아래 명령어를 실행하여 빌드 결과물이 정상적으로 생성되는지 확인합니다.
```bash
npm run export
```
- 프로젝트 루트에 `dist` 폴더가 생기면 준비 완료!

## 2. GitHub에 프로젝트 올리기
Vercel은 GitHub 저장소와 연동할 때 가장 강력합니다.
1. [GitHub](https://github.com)에서 새 저장소를 만듭니다.
2. 프로젝트를 푸시합니다:
   ```bash
   git add .
   git commit -m "Deploy: Vercel configuration"
   git push origin main
   ```

## 3. Vercel 프로젝트 생성 및 설정
1. [Vercel Dashboard](https://vercel.com/dashboard)에 접속하여 **"Add New..."** -> **"Project"**를 클릭합니다.
2. 해당 GitHub 저장소를 **Import** 합니다.
3. **Configure Project** 화면에서 아래 설정을 **반드시** 확인하세요:
   - **Framework Preset**: `Other` (또는 자동으로 감지됨)
   - **Root Directory**: `./` (기본값)
   - **Build and Output Settings** (클릭해서 펼치기):
     - **Build Command**: `npm run export`
     - **Output Directory**: `dist`
4. **Deploy** 버튼을 누릅니다!

## 4. 확인 및 라우팅
- 배포가 완료되면 제공된 주소로 접속합니다.
- `vercel.json`이 이미 프로젝트에 포함되어 있으므로, 페이지 새로고침 시 발생하는 404 오류는 자동으로 방지됩니다. (SPA 라우팅 지원)

---
**주의사항**:
- 설정이 이미 되어 있음에도 소스 코드가 보인다면, Vercel 설정의 `Output Directory`가 `dist`로 되어 있는지 다시 한번 확인해 주세요! 😎
