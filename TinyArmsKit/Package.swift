// swift-tools-version: 6.0
// The swift-tools-version declares the minimum version of Swift required to build this package.

import PackageDescription

let package = Package(
    name: "TinyArmsKit",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .library(
            name: "TinyArmsCore",
            targets: ["TinyArmsCore"]
        ),
        .library(
            name: "TinyArmsMacOS",
            targets: ["TinyArmsMacOS"]
        ),
        .executable(
            name: "tinyarms-cli",
            targets: ["TinyArmsCLI"]
        ),
    ],
    dependencies: [
        .package(url: "https://github.com/apple/swift-argument-parser", from: "1.5.0"),
        .package(url: "https://github.com/apple/swift-log", from: "1.6.0"),
        .package(url: "https://github.com/groue/GRDB.swift", from: "7.8.0"),
        .package(url: "https://github.com/apple/swift-async-algorithms", from: "1.0.0"),
    ],
    targets: [
        // Core shared logic
        .target(
            name: "TinyArmsCore",
            dependencies: [
                .product(name: "Logging", package: "swift-log"),
            ],
            path: "Sources/TinyArmsCore"
        ),

        // macOS-specific (daemon, FSEvents, menu bar)
        .target(
            name: "TinyArmsMacOS",
            dependencies: [
                "TinyArmsCore",
                .product(name: "GRDB", package: "GRDB.swift"),
                .product(name: "AsyncAlgorithms", package: "swift-async-algorithms"),
            ],
            path: "Sources/TinyArmsMacOS"
        ),

        // CLI executable
        .executableTarget(
            name: "TinyArmsCLI",
            dependencies: [
                "TinyArmsCore",
                .product(name: "ArgumentParser", package: "swift-argument-parser"),
            ],
            path: "Sources/TinyArmsCLI"
        ),

        // Tests
        .testTarget(
            name: "TinyArmsTests",
            dependencies: [
                "TinyArmsCore",
                "TinyArmsMacOS",
            ],
            path: "Tests/TinyArmsTests"
        ),
    ]
)
