import SwiftUI
import UserNotifications

#if os(macOS)

    @main
    struct TinyArmsApp: App {
        @NSApplicationDelegateAdaptor(AppDelegate.self) var appDelegate

        var body: some Scene {
            MenuBarExtra("tinyArms", systemImage: "brain") {
                MenuBarView()
            }
            .menuBarExtraStyle(.window)
        }
    }

    // MARK: - AppDelegate

    class AppDelegate: NSObject, NSApplicationDelegate {
        func applicationDidFinishLaunching(_ notification: Notification) {
            // Hide from Dock (agent app)
            NSApp.setActivationPolicy(.accessory)

            // Request notification permissions
            Task {
                await requestNotificationPermissions()
            }

            // Start daemon
            Task { @MainActor in
                do {
                    try await DaemonController.shared.start()
                } catch {
                    print("Failed to start daemon: \(error)")
                }
            }
        }

        func applicationWillTerminate(_ notification: Notification) {
            DaemonController.shared.stop()
        }

        private func requestNotificationPermissions() async {
            do {
                let granted = try await UNUserNotificationCenter.current()
                    .requestAuthorization(options: [.alert, .sound])
                if granted {
                    print("Notification permissions granted")
                } else {
                    print("Notification permissions denied")
                }
            } catch {
                print("Failed to request notification permissions: \(error)")
            }
        }
    }

#endif
