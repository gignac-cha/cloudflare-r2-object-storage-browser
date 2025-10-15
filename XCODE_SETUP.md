# Xcode 프로젝트 설정 가이드

## 문제

현재 서브에이전트들이 생성한 Swift 파일들이 파일 시스템에는 존재하지만, Xcode 프로젝트 파일(.xcodeproj)에 참조가 추가되지 않아 빌드 에러가 발생합니다.

## 에러 메시지
```
error: cannot find type 'R2Object' in scope
error: cannot find type 'SortColumn' in scope
error: cannot find type 'DebugTab' in scope
error: cannot find type 'APIDebugResponse' in scope
```

## 해결 방법

### 방법 1: Xcode에서 수동으로 추가 (권장)

1. **Xcode 열기**
   ```bash
   open /Users/cha/projects/cloudflare-r2-object-storage-browser/applications/MacOS/CloudflareR2ObjectStorageBrowser.xcodeproj
   ```

2. **프로젝트 네비게이터에서 폴더 추가**
   - 좌측 프로젝트 네비게이터에서 `CloudflareR2ObjectStorageBrowser` 폴더 우클릭
   - "Add Files to CloudflareR2ObjectStorageBrowser..." 선택

3. **폴더들 선택**
   - 다음 폴더들을 선택:
     - `Models/`
     - `ViewModels/`
     - `Services/`
     - `Utilities/`
     - `Views/`
     - `DesignSystem/`
   - **옵션 설정**:
     - ✅ "Create groups" 선택 (Create folder references 아님)
     - ✅ "Copy items if needed" 체크 해제
     - ✅ Target: CloudflareR2ObjectStorageBrowser 체크
   - "Add" 클릭

4. **빌드 확인**
   - Cmd+B 또는 Product → Build
   - 에러가 없어야 함

### 방법 2: 커맨드라인으로 빌드 (빠른 확인)

```bash
cd /Users/cha/projects/cloudflare-r2-object-storage-browser
pnpm start:mac
```

## 추가된 파일 목록

### Models/ (4 files)
- `Bucket.swift`
- `R2Object.swift`
- `TransferTask.swift`
- `Account.swift`

### ViewModels/ (4 files)
- `BucketListViewModel.swift`
- `FileListViewModel.swift`
- `TransferManagerViewModel.swift`
- `SearchViewModel.swift`

### Services/ (2 files)
- `APIClient.swift`
- `FolderCache.swift`

### Utilities/ (1 file)
- `LoadingState.swift`

### Views/ (5 files)
- `BucketSidebarView.swift`
- `FileListView.swift`
- `BreadcrumbView.swift`
- `ToolbarView.swift`
- `DebugPanelView.swift`

### DesignSystem/ (9 files)
- `Colors.swift`
- `Typography.swift`
- `Spacing.swift`
- `Effects.swift`
- `Icons.swift`
- `DesignSystem.swift`
- `StyleGuide.swift`
- `README.md`
- `INTEGRATION.md`

## 주의사항

### 파일 추가 후 확인할 사항

1. **Target Membership 확인**
   - 각 Swift 파일 선택 → 우측 File Inspector
   - "Target Membership" 섹션에서 `CloudflareR2ObjectStorageBrowser` 체크 확인

2. **빌드 에러 확인**
   - S3Object vs R2Object 타입 불일치 있을 수 있음
   - FileListView.swift에서 S3Object → R2Object 수정 필요

3. **Import 문 확인**
   - 모든 파일이 같은 모듈 내에 있으므로 import 불필요
   - Foundation, SwiftUI만 import하면 됨

## 트러블슈팅

### 문제 1: "Ambiguous use of ..." 에러
- 같은 타입이 여러 파일에 정의됨
- 중복 정의 제거 필요

### 문제 2: S3Object vs R2Object 타입 불일치
- FileListView.swift에서 `S3Object` → `R2Object` 검색 후 모두 교체
- 또는 R2Object.swift에 `typealias S3Object = R2Object` 추가

### 문제 3: 파일이 Xcode에 나타나지 않음
- Finder에서 파일 존재 확인
- Xcode 재시작
- Product → Clean Build Folder (Cmd+Shift+K)
- 다시 파일 추가 시도

## 다음 단계

파일 추가 후:
1. ✅ 빌드 성공 확인
2. 🔄 API Integration Guide 따라 API 연결
3. 🎨 UI 테스트 및 디버깅
4. 🚀 실제 R2 계정으로 테스트

## 자동화 스크립트 (선택사항)

나중에 자동화하려면 `pbxproj` 파일을 직접 수정하는 스크립트 작성 가능:
```bash
# TODO: pbxproj 파일에 파일 참조 추가하는 스크립트
# 현재는 Xcode GUI로 추가하는 것이 더 안전함
```
