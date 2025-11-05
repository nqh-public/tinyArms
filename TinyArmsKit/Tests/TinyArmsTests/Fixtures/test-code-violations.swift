// Test Swift code with intentional violations

import Foundation

// Violation: Hardcoded color (not universal)
let backgroundColor = "#ff0000"

// Violation: Magic number
func calculateDiscount(price: Double) -> Double {
    return price * 0.15  // What is 0.15?
}

// Violation: DRY - duplicated logic
func processUserA() {
    print("Processing user")
    // Complex logic here
}

func processUserB() {
    print("Processing user")
    // Same complex logic repeated
}

func processUserC() {
    print("Processing user")
    // Same complex logic repeated again
}
