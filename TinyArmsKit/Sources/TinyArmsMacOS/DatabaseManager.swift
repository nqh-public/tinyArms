import Foundation
import GRDB
import TinyArmsCore

/// Actor-based database manager for lint history
public actor DatabaseManager {
    private let dbQueue: DatabaseQueue

    public init() async throws {
        let fileManager = FileManager.default
        let appSupport = try fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )

        let dbDir = appSupport.appendingPathComponent("tinyArms")
        try fileManager.createDirectory(at: dbDir, withIntermediateDirectories: true)

        let dbPath = dbDir.appendingPathComponent("db.sqlite").path
        dbQueue = try DatabaseQueue(path: dbPath)

        try await setupSchema()
    }

    // MARK: - Schema

    private func setupSchema() async throws {
        try await dbQueue.write { db in
            try db.create(table: "lint_history", ifNotExists: true) { t in
                t.autoIncrementedPrimaryKey("id")
                t.column("timestamp", .datetime).notNull()
                t.column("file_path", .text).notNull()
                t.column("violations_count", .integer).notNull()
                t.column("violations_json", .text).notNull()
                t.column("confidence", .double).notNull()
                t.column("model", .text).notNull()
                t.column("latency_ms", .integer).notNull()
                t.column("exit_code", .integer).notNull()
            }

            // Index for recent queries
            try db.create(
                index: "idx_lint_history_timestamp",
                on: "lint_history",
                columns: ["timestamp"],
                ifNotExists: true
            )
        }
    }

    // MARK: - Insert

    public func save(_ result: LintResult, filePath: String) async throws {
        try await dbQueue.write { db in
            let encoder = JSONEncoder()
            let violationsData = try encoder.encode(result.violations)
            let violationsJSON = String(data: violationsData, encoding: .utf8) ?? "[]"

            let exitCode = result.violations.isEmpty ? 0 : 1

            try db.execute(
                sql: """
                    INSERT INTO lint_history (
                        timestamp, file_path, violations_count, violations_json,
                        confidence, model, latency_ms, exit_code
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                arguments: [
                    Date(),
                    filePath,
                    result.violations.count,
                    violationsJSON,
                    result.confidence,
                    result.model,
                    result.latencyMs,
                    exitCode,
                ]
            )
        }
    }

    // MARK: - Query

    public func fetchRecent(limit: Int = 10) async throws -> [LintHistoryRecord] {
        try await dbQueue.read { db in
            try LintHistoryRecord
                .order(Column("timestamp").desc)
                .limit(limit)
                .fetchAll(db)
        }
    }

    public func fetchByFilePath(_ path: String, limit: Int = 5) async throws
        -> [LintHistoryRecord]
    {
        try await dbQueue.read { db in
            try LintHistoryRecord
                .filter(Column("file_path") == path)
                .order(Column("timestamp").desc)
                .limit(limit)
                .fetchAll(db)
        }
    }

    public func fetchStats() async throws -> DatabaseStats {
        try await dbQueue.read { db in
            let totalLints = try Int.fetchOne(
                db,
                sql: "SELECT COUNT(*) FROM lint_history"
            ) ?? 0

            let totalViolations = try Int.fetchOne(
                db,
                sql: "SELECT SUM(violations_count) FROM lint_history"
            ) ?? 0

            let avgLatency = try Double.fetchOne(
                db,
                sql: "SELECT AVG(latency_ms) FROM lint_history"
            ) ?? 0

            return DatabaseStats(
                totalLints: totalLints,
                totalViolations: totalViolations,
                avgLatencyMs: Int(avgLatency)
            )
        }
    }
}

// MARK: - Models

public struct LintHistoryRecord: Codable, FetchableRecord, Sendable {
    public let id: Int64
    public let timestamp: Date
    public let filePath: String
    public let violationsCount: Int
    public let violationsJSON: String
    public let confidence: Double
    public let model: String
    public let latencyMs: Int
    public let exitCode: Int

    enum CodingKeys: String, CodingKey {
        case id
        case timestamp
        case filePath = "file_path"
        case violationsCount = "violations_count"
        case violationsJSON = "violations_json"
        case confidence
        case model
        case latencyMs = "latency_ms"
        case exitCode = "exit_code"
    }
}

public struct DatabaseStats: Sendable {
    public let totalLints: Int
    public let totalViolations: Int
    public let avgLatencyMs: Int
}
