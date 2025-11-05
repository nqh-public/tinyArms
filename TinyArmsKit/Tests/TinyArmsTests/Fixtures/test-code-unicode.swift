import Foundation

// Swift code with Unicode characters for testing
// Tests emoji, Chinese, Arabic, and other international characters

// Chinese comments and strings
// 这是一个测试文件，用于验证Unicode支持

func greetInChinese() -> String {
    let greeting = "你好世界! 🌍"
    return greeting
}

// Arabic comments and strings
// مرحبا بك في اختبار Unicode

func greetInArabic() -> String {
    let greeting = "مرحبا بالعالم! 🌍"
    return greeting
}

// Japanese
func greetInJapanese() -> String {
    let greeting = "こんにちは世界! 🌍"
    return greeting
}

// Emoji usage
struct EmojiConstants {
    static let success = "✅"
    static let error = "❌"
    static let warning = "⚠️"
    static let info = "ℹ️"
    static let robot = "🤖"
    static let dinosaur = "🦖"
    static let brain = "🧠"
}

// Mixed Unicode in code
func processInternationalData() {
    let names = [
        "Alice",
        "李明",
        "محمد",
        "田中",
        "José",
        "François",
        "Владимир",
    ]

    for name in names {
        print("\(EmojiConstants.success) Processing: \(name)")
    }
}

// Emoji in variable names (valid Swift)
let 🦖 = "dinosaur"
let 🤖 = "robot"

// Mathematical symbols
let π = Double.pi
let ∑ = "sum"
let ∆ = "delta"

// Currency symbols
let prices = [
    "USD": "$100",
    "EUR": "€85",
    "GBP": "£75",
    "JPY": "¥11000",
    "CNY": "¥650",
]

// Right-to-left text
let hebrewText = "שלום עולם"
let arabicText = "السلام عليكم"

// Combined characters
let combinedChars = "é" // e + combining acute accent
let singleChar = "é"    // precomposed character

print("Unicode test file compiled successfully! 🎉")
