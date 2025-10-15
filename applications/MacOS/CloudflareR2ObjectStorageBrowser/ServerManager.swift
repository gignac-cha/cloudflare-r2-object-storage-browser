import Foundation

class ServerManager: ObservableObject {
    private var serverProcess: Process?
    @Published var isRunning = false
    @Published var logs: [String] = []
    @Published var serverPort: Int?

    weak var settingsManager: SettingsManager?

    func startServer() {
        guard serverProcess == nil else {
            addLog("Server is already running")
            return
        }

        let task = Process()

        // Node.js 경로 자동 감지
        let nodePath = getNodePath()

        // 서버 스크립트 경로 (번들 내부 또는 개발 경로)
        let serverScriptPath = getServerScriptPath()

        addLog("Node path: \(nodePath)")
        addLog("Server script path: \(serverScriptPath)")

        task.executableURL = URL(fileURLWithPath: nodePath)

        // Build arguments with credentials from SettingsManager
        var arguments = [serverScriptPath]

        if let settings = settingsManager,
           let accountId = settings.accountId,
           let accessKeyId = settings.accessKeyId,
           let secretAccessKey = settings.secretAccessKey {

            let endpoint = "https://\(accountId).r2.cloudflarestorage.com"

            arguments.append(contentsOf: [
                "--account-id", accountId,
                "--access-key-id", accessKeyId,
                "--secret-access-key", secretAccessKey,
                "--endpoint", endpoint
            ])

            addLog("✓ Passing R2 credentials to server via command-line arguments")
        } else {
            addLog("⚠️ No credentials found in Keychain - server will try .env file")
        }

        task.arguments = arguments

        // 출력 파이프 설정
        let outputPipe = Pipe()
        let errorPipe = Pipe()

        task.standardOutput = outputPipe
        task.standardError = errorPipe

        // 서버 출력 로깅
        outputPipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            if let output = String(data: data, encoding: .utf8), !output.isEmpty {
                // 각 줄을 개별적으로 처리
                let lines = output.components(separatedBy: .newlines).filter { !$0.isEmpty }

                for line in lines {
                    self?.addLog("Server: \(line)")

                    // PORT= 출력에서 포트 번호 파싱
                    if line.contains("PORT=") {
                        if let range = line.range(of: "PORT=") {
                            let afterPort = String(line[range.upperBound...])
                            let portString = afterPort.trimmingCharacters(in: .whitespacesAndNewlines)
                            // 숫자만 추출
                            let digits = portString.components(separatedBy: CharacterSet.decimalDigits.inverted).joined()
                            if let port = Int(digits) {
                                DispatchQueue.main.async {
                                    self?.serverPort = port
                                    self?.addLog("✓ Detected server port: \(port)")
                                }
                            }
                        }
                    }
                }
            }
        }

        errorPipe.fileHandleForReading.readabilityHandler = { [weak self] handle in
            let data = handle.availableData
            if let errorOutput = String(data: data, encoding: .utf8), !errorOutput.isEmpty {
                self?.addLog("Server Error: \(errorOutput)")

                // Detect environment variable validation errors
                if errorOutput.contains("Missing required environment variable") {
                    DispatchQueue.main.async {
                        self?.addLog("⚠️ CONFIGURATION ERROR: Required R2 credentials are missing")
                        self?.addLog("Please ensure R2_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY are set in your .env file")
                    }
                }
            }
        }

        // 종료 핸들러
        task.terminationHandler = { [weak self] process in
            self?.addLog("Server terminated with status: \(process.terminationStatus)")
            DispatchQueue.main.async {
                self?.isRunning = false
            }
        }

        do {
            try task.run()
            serverProcess = task
            isRunning = true
            addLog("Server started successfully")
        } catch {
            addLog("Failed to start server: \(error.localizedDescription)")
        }
    }

    func stopServer() {
        guard let process = serverProcess, process.isRunning else {
            addLog("Server is not running")
            return
        }

        addLog("Stopping server...")

        // Try graceful shutdown via API first
        if let port = serverPort {
            addLog("Sending graceful shutdown request to server...")
            
            guard let url = URL(string: "http://127.0.0.1:\(port)/shutdown") else {
                addLog("Invalid shutdown URL")
                forceStopServer(process)
                return
            }
            
            var request = URLRequest(url: url)
            request.httpMethod = "POST"
            request.timeoutInterval = 2
            
            let task = URLSession.shared.dataTask(with: request) { [weak self] data, response, error in
                if let error = error {
                    self?.addLog("Graceful shutdown failed: \(error.localizedDescription)")
                    self?.forceStopServer(process)
                } else {
                    self?.addLog("Server shutdown initiated gracefully")
                    // Give it 3 seconds to shut down
                    DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                        if process.isRunning {
                            self?.addLog("Server still running, forcing shutdown...")
                            self?.forceStopServer(process)
                        } else {
                            self?.addLog("Server stopped successfully")
                        }
                    }
                }
            }
            task.resume()
        } else {
            // No port available, force stop
            forceStopServer(process)
        }

        serverProcess = nil
        isRunning = false
        serverPort = nil
    }
    
    private func forceStopServer(_ process: Process) {
        addLog("Force stopping server...")
        
        // Graceful shutdown (SIGTERM)
        process.terminate()
        
        // 2초 대기 후 강제 종료
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            if process.isRunning {
                self.addLog("Force killing server...")
                process.interrupt() // SIGINT
            }
        }
    }

    func restartServer() {
        addLog("Restarting server with new credentials...")
        stopServer()

        // Wait for server to fully stop before starting
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.5) {
            self.startServer()
        }
    }

    private func addLog(_ message: String) {
        let timestamp = DateFormatter.localizedString(from: Date(), dateStyle: .none, timeStyle: .medium)
        let logMessage = "[\(timestamp)] \(message)"
        print(logMessage)
        DispatchQueue.main.async {
            self.logs.append(logMessage)
            if self.logs.count > 100 {
                self.logs.removeFirst()
            }
        }
    }

    private func getNodePath() -> String {
        // nvm 경로 확인
        let homeDir = FileManager.default.homeDirectoryForCurrentUser.path
        let nvmPaths = [
            "\(homeDir)/.nvm/versions/node/v24.4.1/bin/node",
            "\(homeDir)/.nvm/versions/node/v22.0.0/bin/node",
            "\(homeDir)/.nvm/versions/node/v20.0.0/bin/node"
        ]

        for path in nvmPaths {
            if FileManager.default.fileExists(atPath: path) {
                addLog("Found node at nvm path: \(path)")
                return path
            }
        }

        // 기본 경로들 시도
        let defaultPaths = [
            "/opt/homebrew/bin/node",
            "/usr/local/bin/node",
            "/usr/bin/node"
        ]

        for path in defaultPaths {
            if FileManager.default.fileExists(atPath: path) {
                addLog("Found node at default path: \(path)")
                return path
            }
        }

        addLog("No node found, using fallback: /usr/local/bin/node")
        return "/usr/local/bin/node"
    }

    private func getServerScriptPath() -> String {
        // 1. 프로덕션: 앱 번들 내부
        if let bundlePath = Bundle.main.path(forResource: "server", ofType: "js") {
            addLog("Using bundled server script: \(bundlePath)")
            return bundlePath
        }

        // 2. 개발 환경: 여러 위치 시도
        let fm = FileManager.default
        var candidatePaths: [String] = []

        // 2-1. 앱 번들 기준 상대 경로 (Xcode에서 실행할 때)
        if let executablePath = Bundle.main.executablePath {
            // executablePath: .../DerivedData/.../Debug/App.app/Contents/MacOS/App
            // 목표: .../cloudflare-r2-object-storage-browser/packages/api/outputs/server.js
            let appPath = (executablePath as NSString).deletingLastPathComponent // MacOS
            let contentsPath = (appPath as NSString).deletingLastPathComponent // Contents
            let appBundlePath = (contentsPath as NSString).deletingLastPathComponent // App.app
            let debugPath = (appBundlePath as NSString).deletingLastPathComponent // Debug
            let derivedDataPath = (debugPath as NSString).deletingLastPathComponent // DerivedData/...

            // DerivedData에서 프로젝트 루트로 가는 경로 추측
            var projectRoot = derivedDataPath
            projectRoot = (projectRoot as NSString).deletingLastPathComponent
            projectRoot = (projectRoot as NSString).deletingLastPathComponent
            projectRoot = (projectRoot as NSString).deletingLastPathComponent

            candidatePaths.append("\(projectRoot)/packages/api/outputs/server.js")
        }

        // 2-2. 현재 작업 디렉토리 기준
        let currentDir = fm.currentDirectoryPath
        candidatePaths.append("\(currentDir)/../../packages/api/outputs/server.js")
        candidatePaths.append("\(currentDir)/../../../packages/api/outputs/server.js")
        candidatePaths.append("\(currentDir)/packages/api/outputs/server.js")

        // 2-3. 홈 디렉토리 기준 (마지막 수단)
        let homeDir = fm.homeDirectoryForCurrentUser.path
        candidatePaths.append("\(homeDir)/projects/cloudflare-r2-object-storage-browser/packages/api/outputs/server.js")

        // 존재하는 첫 번째 경로 사용
        for path in candidatePaths {
            let normalizedPath = (path as NSString).standardizingPath
            if fm.fileExists(atPath: normalizedPath) {
                addLog("Using dev server script: \(normalizedPath)")
                return normalizedPath
            }
        }

        // 모두 실패하면 첫 번째 경로 반환 (에러 메시지용)
        let fallbackPath = candidatePaths.first ?? "\(homeDir)/server.js"
        addLog("Server script not found in any location, using fallback: \(fallbackPath)")
        addLog("Tried paths: \(candidatePaths.joined(separator: ", "))")
        return fallbackPath
    }

    deinit {
        stopServer()
    }
}
