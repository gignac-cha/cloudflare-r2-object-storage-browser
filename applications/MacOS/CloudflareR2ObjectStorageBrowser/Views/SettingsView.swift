import SwiftUI

/// Settings view for configuring R2 credentials
struct SettingsView: View {
    @Environment(\.dismiss) private var dismiss
    @EnvironmentObject var settingsManager: SettingsManager
    @EnvironmentObject var serverManager: ServerManager

    @State private var accountId: String = ""
    @State private var accessKeyId: String = ""
    @State private var secretAccessKey: String = ""
    @State private var showSuccessAlert = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 0) {
            // Header
            HStack {
                Text("R2 Settings")
                    .font(.title2)
                    .fontWeight(.semibold)

                Spacer()

                Button("Done") {
                    dismiss()
                }
                .keyboardShortcut(.defaultAction)
            }
            .padding()

            Divider()

            // Settings Form
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Account ID")
                            .font(.headline)
                        TextField("Enter your Cloudflare account ID", text: $accountId)
                            .textFieldStyle(.roundedBorder)
                        Text("Found in Cloudflare dashboard → R2")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 8)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Access Key ID")
                            .font(.headline)
                        TextField("Enter your R2 access key ID", text: $accessKeyId)
                            .textFieldStyle(.roundedBorder)
                        Text("Create API token in R2 settings")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 8)

                    VStack(alignment: .leading, spacing: 4) {
                        Text("Secret Access Key")
                            .font(.headline)
                        SecureField("Enter your R2 secret access key", text: $secretAccessKey)
                            .textFieldStyle(.roundedBorder)
                        Text("Shown only once when creating the API token")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.vertical, 8)
                } header: {
                    Text("Cloudflare R2 Credentials")
                        .font(.title3)
                        .fontWeight(.semibold)
                }

                Section {
                    HStack {
                        Spacer()

                        Button("Clear All") {
                            clearCredentials()
                        }
                        .foregroundColor(.red)

                        Button("Save Credentials") {
                            saveCredentials()
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(accountId.isEmpty || accessKeyId.isEmpty || secretAccessKey.isEmpty)

                        Spacer()
                    }
                    .padding(.vertical, 8)
                }

                if let error = errorMessage {
                    Section {
                        HStack {
                            Image(systemName: "exclamationmark.triangle.fill")
                                .foregroundColor(.red)
                            Text(error)
                                .foregroundColor(.red)
                                .font(.caption)
                        }
                    }
                }
            }
            .formStyle(.grouped)
            .scrollContentBackground(.hidden)
            .background(Color(nsColor: .windowBackgroundColor))
        }
        .frame(width: 600, height: 500)
        .onAppear {
            loadCredentials()
        }
        .alert("Credentials Saved", isPresented: $showSuccessAlert) {
            Button("OK", role: .cancel) {
                dismiss()
            }
        } message: {
            Text("Your R2 credentials have been saved securely. The API server will restart to apply the new credentials.")
        }
    }

    private func loadCredentials() {
        accountId = settingsManager.accountId ?? ""
        accessKeyId = settingsManager.accessKeyId ?? ""
        secretAccessKey = settingsManager.secretAccessKey ?? ""
    }

    private func saveCredentials() {
        errorMessage = nil

        do {
            try settingsManager.saveCredentials(
                accountId: accountId,
                accessKeyId: accessKeyId,
                secretAccessKey: secretAccessKey
            )

            // Restart server with new credentials
            serverManager.restartServer()

            showSuccessAlert = true
        } catch {
            errorMessage = "Failed to save credentials: \(error.localizedDescription)"
        }
    }

    private func clearCredentials() {
        accountId = ""
        accessKeyId = ""
        secretAccessKey = ""
        settingsManager.clearCredentials()
        errorMessage = nil

        // Stop server when credentials are cleared
        serverManager.stopServer()
    }
}

#Preview {
    SettingsView()
        .environmentObject(SettingsManager())
        .environmentObject(ServerManager())
}
