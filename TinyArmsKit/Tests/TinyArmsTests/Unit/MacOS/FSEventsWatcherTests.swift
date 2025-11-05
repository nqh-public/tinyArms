import XCTest
@testable import TinyArmsMacOS

final class FSEventsWatcherTests: XCTestCase {
    var watcher: FSEventsWatcher!
    var receivedEvents: [FileEvent] = []

    override func setUp() async throws {
        try await super.setUp()
        receivedEvents = []
    }

    override func tearDown() async throws {
        if watcher != nil {
            await watcher.stop()
        }
        try await super.tearDown()
    }

    // MARK: - Basic Functionality Tests

    func testWatchPathsCreation() async throws {
        let tempDir = createTempDirectory()

        watcher = FSEventsWatcher { event in
            self.receivedEvents.append(event)
        }

        // Start watching
        try await watcher.watch(paths: [tempDir])

        // Give FSEvents time to initialize
        try await Task.sleep(nanoseconds: 500_000_000) // 0.5s

        // Create a file
        let testFile = (tempDir as NSString).appendingPathComponent("test.swift")
        try "test content".write(toFile: testFile, atomically: true, encoding: .utf8)

        // Wait for event
        try await Task.sleep(nanoseconds: 1_000_000_000) // 1s

        // Should have received at least one event
        // Note: FSEvents may batch events, so we check for > 0
        XCTAssertGreaterThan(receivedEvents.count, 0)
    }

    func testFileEventFiltering() {
        // Test FileEvent flag checking
        let modifiedFlags: FSEventStreamEventFlags = UInt32(kFSEventStreamEventFlagItemModified)
            | UInt32(kFSEventStreamEventFlagItemIsFile)

        let event = FileEvent(path: "/tmp/test.swift", flags: modifiedFlags)

        XCTAssertTrue(event.isModified)
        XCTAssertTrue(event.isFile)
        XCTAssertFalse(event.isDirectory)
        XCTAssertFalse(event.isCreated)
        XCTAssertFalse(event.isRemoved)
    }

    func testCallbackInvocation() async throws {
        var callbackInvoked = false
        var eventPath: String?

        let tempDir = createTempDirectory()

        watcher = FSEventsWatcher { event in
            callbackInvoked = true
            eventPath = event.path
        }

        try await watcher.watch(paths: [tempDir])
        try await Task.sleep(nanoseconds: 500_000_000)

        // Modify a file
        let testFile = (tempDir as NSString).appendingPathComponent("callback-test.swift")
        try "initial".write(toFile: testFile, atomically: true, encoding: .utf8)

        // Wait for callback
        try await Task.sleep(nanoseconds: 1_000_000_000)

        XCTAssertTrue(callbackInvoked, "Callback should be invoked")
    }

    func testMultipleEvents() async throws {
        let tempDir = createTempDirectory()

        watcher = FSEventsWatcher(latency: 0.5) { event in
            self.receivedEvents.append(event)
        }

        try await watcher.watch(paths: [tempDir])
        try await Task.sleep(nanoseconds: 500_000_000)

        // Create multiple files rapidly
        for i in 0..<5 {
            let file = (tempDir as NSString).appendingPathComponent("test\(i).swift")
            try "content \(i)".write(toFile: file, atomically: true, encoding: .utf8)
        }

        // Wait for all events
        try await Task.sleep(nanoseconds: 2_000_000_000) // 2s

        // Should have received multiple events (may be batched)
        XCTAssertGreaterThan(receivedEvents.count, 0)
    }

    func testStopWatching() async throws {
        let tempDir = createTempDirectory()

        watcher = FSEventsWatcher { event in
            self.receivedEvents.append(event)
        }

        try await watcher.watch(paths: [tempDir])
        try await Task.sleep(nanoseconds: 500_000_000)

        // Stop watching
        await watcher.stop()

        // Clear events
        receivedEvents.removeAll()

        // Create file after stopping
        let testFile = (tempDir as NSString).appendingPathComponent("after-stop.swift")
        try "content".write(toFile: testFile, atomically: true, encoding: .utf8)

        // Wait
        try await Task.sleep(nanoseconds: 1_000_000_000)

        // Should not receive events after stop
        XCTAssertEqual(receivedEvents.count, 0)
    }

    func testInvalidPathHandling() async throws {
        watcher = FSEventsWatcher { _ in }

        // Try to watch non-existent path
        // FSEvents may still create stream, but won't receive events
        let nonExistentPath = "/tmp/this-path-does-not-exist-\(UUID().uuidString)"

        do {
            try await watcher.watch(paths: [nonExistentPath])
            // May or may not throw, depending on FSEvents behavior
        } catch {
            // Expected for invalid paths
            XCTAssertTrue(error is FSEventsError)
        }
    }

    // MARK: - Event Type Tests

    func testEventTypes() {
        // Test different event type flags
        let createdFlags = UInt32(kFSEventStreamEventFlagItemCreated)
            | UInt32(kFSEventStreamEventFlagItemIsFile)
        let created = FileEvent(path: "/tmp/test.swift", flags: createdFlags)
        XCTAssertTrue(created.isCreated)

        let removedFlags = UInt32(kFSEventStreamEventFlagItemRemoved)
        let removed = FileEvent(path: "/tmp/test.swift", flags: removedFlags)
        XCTAssertTrue(removed.isRemoved)

        let renamedFlags = UInt32(kFSEventStreamEventFlagItemRenamed)
        let renamed = FileEvent(path: "/tmp/test.swift", flags: renamedFlags)
        XCTAssertTrue(renamed.isRenamed)

        let dirFlags = UInt32(kFSEventStreamEventFlagItemIsDir)
        let directory = FileEvent(path: "/tmp", flags: dirFlags)
        XCTAssertTrue(directory.isDirectory)
    }
}
