import SwiftUI
import TinyArmsCore

#if os(macOS)

    struct MenuBarView: View {
        @ObservedObject private var daemon = DaemonController.shared

        var body: some View {
            VStack(alignment: .leading, spacing: 0) {
                // Header
                HeaderView(isRunning: daemon.isRunning)
                    .padding()

                Divider()

                // Recent Results
                if daemon.recentResults.isEmpty {
                    EmptyStateView()
                        .frame(height: 200)
                } else {
                    ScrollView {
                        VStack(spacing: 8) {
                            ForEach(daemon.recentResults, id: \.model) { result in
                                ResultRowView(result: result)
                            }
                        }
                        .padding()
                    }
                    .frame(height: 300)
                }

                Divider()

                // Actions
                ActionsView()
                    .padding()
            }
            .frame(width: 350)
        }
    }

    // MARK: - Header View

    struct HeaderView: View {
        let isRunning: Bool

        var body: some View {
            HStack {
                Image(systemName: "brain")
                    .font(.title2)
                    .foregroundColor(.blue)

                VStack(alignment: .leading) {
                    Text("tinyArms")
                        .font(.headline)
                    Text(isRunning ? "Running" : "Stopped")
                        .font(.caption)
                        .foregroundColor(isRunning ? .green : .secondary)
                }

                Spacer()
            }
        }
    }

    // MARK: - Empty State View

    struct EmptyStateView: View {
        var body: some View {
            VStack(spacing: 12) {
                Image(systemName: "doc.text.magnifyingglass")
                    .font(.system(size: 48))
                    .foregroundColor(.secondary)

                Text("No recent results")
                    .font(.headline)

                Text("Save a file to trigger linting")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity)
        }
    }

    // MARK: - Result Row View

    struct ResultRowView: View {
        let result: LintResult

        var body: some View {
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Image(systemName: result.violations.isEmpty ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
                        .foregroundColor(result.violations.isEmpty ? .green : .orange)

                    Text("\(result.violations.count) violation(s)")
                        .font(.subheadline)
                        .fontWeight(.medium)

                    Spacer()

                    Text("\(result.latencyMs)ms")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Text(result.summary)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
            }
            .padding(8)
            .background(Color(nsColor: .controlBackgroundColor))
            .cornerRadius(6)
        }
    }

    // MARK: - Actions View

    struct ActionsView: View {
        var body: some View {
            VStack(spacing: 8) {
                Button("Open Settings") {
                    // TODO: Open settings window
                    print("Open settings")
                }
                .buttonStyle(.plain)
                .frame(maxWidth: .infinity)

                Button("Quit tinyArms") {
                    NSApplication.shared.terminate(nil)
                }
                .buttonStyle(.plain)
                .frame(maxWidth: .infinity)
            }
        }
    }

#endif
