import SwiftUI

@main
struct CloudflareR2ObjectStorageBrowserApp: App {
    @StateObject private var serverManager = ServerManager()
    @StateObject private var settingsManager = SettingsManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(serverManager)
                .environmentObject(settingsManager)
        }
        .commands {
            CommandGroup(replacing: .appTermination) {
                Button("Quit") {
                    serverManager.stopServer()
                    NSApplication.shared.terminate(nil)
                }
                .keyboardShortcut("q")
            }
        }
    }

    init() {
        let manager = ServerManager()
        let settings = SettingsManager()

        // Connect ServerManager to SettingsManager
        manager.settingsManager = settings

        _serverManager = StateObject(wrappedValue: manager)
        _settingsManager = StateObject(wrappedValue: settings)

        // 앱 시작 시 서버 실행
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            manager.startServer()
        }
    }
}
