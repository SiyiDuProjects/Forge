// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "ForgeMac",
    platforms: [
        .macOS(.v14)
    ],
    products: [
        .executable(name: "ForgeMac", targets: ["ForgeMac"])
    ],
    targets: [
        .executableTarget(
            name: "ForgeMac",
            path: "Sources/ForgeMac"
        )
    ]
)
