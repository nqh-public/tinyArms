import Foundation

/// Actor-based FSEvents file watcher with Swift 6 concurrency
public actor FSEventsWatcher {
    private var stream: FSEventStreamRef?
    private let callback: @Sendable (FileEvent) -> Void
    private let latency: CFTimeInterval
    private let flags: FSEventStreamCreateFlags

    public init(
        latency: CFTimeInterval = 0.5,
        callback: @escaping @Sendable (FileEvent) -> Void
    ) {
        self.latency = latency
        self.callback = callback
        self.flags = UInt32(
            kFSEventStreamCreateFlagFileEvents | kFSEventStreamCreateFlagUseCFTypes
        )
    }

    /// Start watching paths
    public func watch(paths: [String]) async throws {
        guard stream == nil else {
            throw FSEventsError.alreadyWatching
        }

        let expandedPaths = paths.map { ($0 as NSString).expandingTildeInPath } as CFArray

        var context = FSEventStreamContext(
            version: 0,
            info: Unmanaged.passUnretained(self).toOpaque(),
            retain: nil,
            release: nil,
            copyDescription: nil
        )

        stream = FSEventStreamCreate(
            nil,
            { streamRef, clientCallBackInfo, numEvents, eventPaths, eventFlags, eventIds in
                guard let info = clientCallBackInfo else { return }

                let watcher = Unmanaged<FSEventsWatcher>.fromOpaque(info)
                    .takeUnretainedValue()

                Task {
                    await watcher.handleEvents(
                        paths: eventPaths,
                        flags: eventFlags,
                        count: numEvents
                    )
                }
            },
            &context,
            expandedPaths,
            FSEventStreamEventId(kFSEventStreamEventIdSinceNow),
            latency,
            flags
        )

        guard let stream = stream else {
            throw FSEventsError.failedToCreate
        }

        FSEventStreamSetDispatchQueue(stream, DispatchQueue.global(qos: .userInitiated))
        FSEventStreamStart(stream)
    }

    /// Stop watching
    public func stop() {
        guard let stream = stream else { return }

        FSEventStreamStop(stream)
        FSEventStreamInvalidate(stream)
        FSEventStreamRelease(stream)
        self.stream = nil
    }

    // MARK: - Private

    private func handleEvents(
        paths: UnsafeMutableRawPointer?,
        flags: UnsafePointer<FSEventStreamEventFlags>?,
        count: Int
    ) async {
        guard let paths = paths, let flags = flags else { return }

        let pathArray = unsafeBitCast(paths, to: NSArray.self) as! [String]

        for i in 0..<count {
            let event = FileEvent(
                path: pathArray[i],
                flags: flags[i]
            )
            callback(event)
        }
    }

    deinit {
        if let stream = stream {
            FSEventStreamStop(stream)
            FSEventStreamInvalidate(stream)
            FSEventStreamRelease(stream)
        }
    }
}

// MARK: - FileEvent

public struct FileEvent: Sendable {
    public let path: String
    public let flags: FSEventStreamEventFlags

    public var isCreated: Bool {
        flags & UInt32(kFSEventStreamEventFlagItemCreated) != 0
    }

    public var isModified: Bool {
        flags & UInt32(kFSEventStreamEventFlagItemModified) != 0
    }

    public var isRemoved: Bool {
        flags & UInt32(kFSEventStreamEventFlagItemRemoved) != 0
    }

    public var isRenamed: Bool {
        flags & UInt32(kFSEventStreamEventFlagItemRenamed) != 0
    }

    public var isDirectory: Bool {
        flags & UInt32(kFSEventStreamEventFlagItemIsDir) != 0
    }

    public var isFile: Bool {
        flags & UInt32(kFSEventStreamEventFlagItemIsFile) != 0
    }
}

// MARK: - FSEventsError

public enum FSEventsError: Error {
    case alreadyWatching
    case failedToCreate
}

extension FSEventsError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .alreadyWatching:
            return "FSEvents stream is already watching"
        case .failedToCreate:
            return "Failed to create FSEvents stream"
        }
    }
}
